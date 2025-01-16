"use client";
import { Authenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from "react";
import { generateClient, CONNECTION_STATE_CHANGE, ConnectionState } from "aws-amplify/data";
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Message = Schema["Message"]["type"];
type User = Schema["User"]["type"];

interface MessageWithUser extends Message {
  user?: User;
  attachmentUrl?: string;
}

export default function App() {
  const [userInfo, setUserInfo] = useState<{ username: string; userId: string } | null>(null);
  const [channels, setChannels] = useState<Array<Schema["Channel"]["type"]>>([]);
  const [selectedChannel, setSelectedChannel] = useState<Schema["Channel"]["type"] | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);

  // Monitor subscription connection state
  useEffect(() => {
    const hubListener = Hub.listen('api', (data) => {
      const { payload } = data;
      if (payload.event === CONNECTION_STATE_CHANGE) {
        const connectionData = payload.data as { connectionState: ConnectionState };
        const state = connectionData.connectionState;
        setConnectionState(state);
        
        // Refresh data when reconnecting
        if (state === ConnectionState.Connected) {
          listChannels();
          if (selectedChannel) {
            listMessages(selectedChannel.id);
          }
        }
      }
    });

    return () => {
      hubListener();
    };
  }, [selectedChannel]);

  async function getUserInfo() {
    try {
      const { username, userId } = await getCurrentUser();
      const session = await fetchAuthSession();
      setUserInfo({ username, userId });

      // Create or update user profile
      const { data: existingUsers } = await client.models.User.list({
        filter: { id: { eq: userId } }
      });

      if (existingUsers.length === 0) {
        await client.models.User.create({
          id: userId,
          email: username,
          displayName: username,
          profilePicture: `https://api.dicebear.com/7.x/avatars/svg?seed=${username}`,
        });
      }
    } catch (error) {
      console.error("Error getting user info:", error);
      setUserInfo(null);
    }
  }

  async function fetchMessageUsers(messages: Message[]) {
    const userIds = Array.from(new Set(messages.map(msg => msg.senderId)));
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const { data } = await client.models.User.list({
          filter: { id: { eq: userId } }
        });
        return data[0];
      })
    );

    // Get signed URLs for attachments
    const messagesWithUsers = await Promise.all(messages.map(async msg => {
      let attachmentUrl;
      if (msg.attachmentPath) {
        const result = await getUrl({ path: msg.attachmentPath });
        attachmentUrl = result.url.toString();
      }
      return {
        ...msg,
        user: users.find(u => u?.id === msg.senderId),
        attachmentUrl
      };
    }));

    return messagesWithUsers;
  }

  async function listChannels() {
    setIsLoading(true);
    try {
      const { data } = await client.models.Channel.list();
      setChannels(data);
    } catch (error) {
      console.error("Error listing channels:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createChannel() {
    const name = window.prompt("Enter channel name:");
    if (!name) return;

    setIsLoading(true);
    try {
      const { data: channel } = await client.models.Channel.create({
        name,
        description: "",
      });
      
      // Add creator as channel member
      if (userInfo && channel) {
        await client.models.ChannelMember.create({
          channelId: channel.id,
          userId: userInfo.userId,
        });
      }
      
      listChannels();
    } catch (error) {
      console.error("Error creating channel:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function listMessages(channelId: string) {
    setIsLoading(true);
    try {
      const { data } = await client.models.Message.list({
        filter: {
          channelId: { eq: channelId }
        }
      });
      
      // Sort messages by createdAt client-side
      const sortedMessages = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

      // Fetch user information for each message
      const messagesWithUsers = await fetchMessageUsers(sortedMessages);
      setMessages(messagesWithUsers);
    } catch (error) {
      console.error("Error listing messages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChannel || !userInfo || !newMessage.trim()) return;

    try {
      const fileInput = document.querySelector<HTMLInputElement>('#file-upload');
      let attachmentPath = null;

      if (fileInput?.files?.length) {
        const file = fileInput.files[0];
        const result = await uploadData({
          path: `messages/${selectedChannel.id}/${Date.now()}-${file.name}`,
          data: file,
        }).result;
        attachmentPath = result.path;
      }

      await client.models.Message.create({
        content: newMessage,
        channelId: selectedChannel.id,
        senderId: userInfo.userId,
        attachmentPath,
      });

      setNewMessage("");
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // Set up subscriptions
  useEffect(() => {
    getUserInfo();

    // Subscribe to channel changes
    const channelSub = client.models.Channel.observeQuery().subscribe({
      next: ({ items }) => {
        setChannels(items);
      },
      error: (error) => console.error('Channel subscription error:', error)
    });

    // Subscribe to messages for the selected channel
    const messageSub = client.models.Message.observeQuery().subscribe({
      next: async ({ items }) => {
        if (selectedChannel) {
          const channelMessages = items.filter(msg => msg.channelId === selectedChannel.id);
          const messagesWithUsers = await fetchMessageUsers(channelMessages);
          setMessages(messagesWithUsers);
        }
      },
      error: (error) => console.error('Message subscription error:', error)
    });

    return () => {
      channelSub.unsubscribe();
      messageSub.unsubscribe();
    };
  }, [selectedChannel?.id]);

  return (
    <Authenticator>
      {({ signOut }) => (
        <main className="h-screen flex flex-col">
          <div className="flex justify-between items-center p-4 bg-purple-700 text-white">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Chat App</h1>
              {/* Connection status indicator */}
              <div className="text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionState === ConnectionState.Connected ? 'bg-green-400' :
                  connectionState === ConnectionState.Connecting ? 'bg-yellow-400' :
                  'bg-red-400'
                }`} />
                <span>{connectionState}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userInfo && <span>Welcome, {userInfo.username}!</span>}
              <button 
                onClick={signOut}
                className="bg-purple-800 px-4 py-2 rounded hover:bg-purple-900"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Channel List */}
            <div className="w-64 bg-gray-100 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Channels</h2>
                <button 
                  onClick={createChannel}
                  className="bg-purple-600 text-white px-2 py-1 rounded text-sm hover:bg-purple-700"
                  disabled={isLoading}
                >
                  + New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannel(channel);
                      listMessages(channel.id);
                    }}
                    className={`p-2 rounded cursor-pointer mb-1 ${
                      selectedChannel?.id === channel.id
                        ? "bg-purple-100 text-purple-800"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    # {channel.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col">
              {selectedChannel ? (
                <>
                  <div className="p-4 border-b">
                    <h2 className="font-bold">#{selectedChannel.name}</h2>
                    {selectedChannel.description && (
                      <p className="text-gray-600 text-sm">{selectedChannel.description}</p>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((message) => (
                      <div key={message.id} className="mb-4">
                        <div className="flex items-start gap-3">
                          {message.user?.profilePicture && (
                            <img 
                              src={message.user.profilePicture} 
                              alt={message.user.displayName} 
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold">{message.user?.displayName || 'Unknown User'}</span>
                              <span className="text-xs text-gray-500">
                                {message.createdAt && new Date(message.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <div>{message.content}</div>
                            {message.attachmentUrl && (
                              <div className="mt-2">
                                {message.attachmentPath?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                                  <img 
                                    src={message.attachmentUrl} 
                                    alt="Attachment" 
                                    className="max-w-sm rounded shadow-sm"
                                  />
                                ) : (
                                  <a 
                                    href={message.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 underline"
                                  >
                                    Download Attachment
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={sendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded"
                        disabled={isLoading}
                      />
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                          const fileName = e.target.files?.[0]?.name;
                          if (fileName) {
                            setNewMessage(prev => prev ? `${prev} [Attachment: ${fileName}]` : `[Attachment: ${fileName}]`);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        disabled={isLoading}
                      >
                        📎
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        disabled={isLoading}
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a channel to start chatting
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </Authenticator>
  );
}
