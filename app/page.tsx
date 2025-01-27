"use client";
import { Authenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useRef } from "react";
import { generateClient, CONNECTION_STATE_CHANGE, ConnectionState } from "aws-amplify/data";
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { uploadData, getUrl } from 'aws-amplify/storage';
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

interface UserInfo {
  username: string;
  userId: string;
  email?: string;
  profilePicture?: string;
  displayName?: string;
  groups: string[];
}

export default function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [channels, setChannels] = useState<Array<Schema["Channel"]["type"]>>([]);
  const [selectedChannel, setSelectedChannel] = useState<Schema["Channel"]["type"] | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [profilePicUrls, setProfilePicUrls] = useState<Record<string, string>>({});

  // Auth effect
  useEffect(() => {
    getUserInfo();
  }, []);

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

  // Check user group and add to 'user' group if needed
  useEffect(() => {
    async function checkAndAddToGroup() {
      if (!userInfo) {
        console.log("No user info available yet");
        return;
      }

      // Log current user info and groups
      console.log("Current user info:", {
        userId: userInfo.userId,
        groups: userInfo.groups,
      });

      // Skip if user is already in the 'user' group
      if (userInfo.groups.includes('user')) {
        console.log("User is already in 'user' group");
        return;
      }

      // Skip if user is an admin
      if (userInfo.groups.includes('ADMINS')) {
        console.log("User is an admin, skipping 'user' group addition");
        return;
      }

      console.log("Attempting to add user to 'user' group:", userInfo.userId);
      try {
        type AddUserToGroupResponse = {
          addUserToGroup: string;
        };

        // First check if the mutation is available
        const response = await client.graphql<AddUserToGroupResponse>({
          query: `
            mutation AddUserToGroup($userId: String!, $groupName: String!) {
              addUserToGroup(userId: $userId, groupName: $groupName)
            }
          `,
          variables: {
            userId: userInfo.userId,
            groupName: 'user'
          },
          authMode: 'userPool'
        });

        console.log("Add to group response:", JSON.stringify(response, null, 2));
        
        if (response.data?.addUserToGroup) {
          console.log("Successfully added to user group");
          // Refresh user info to get updated groups
          await getUserInfo();
        } else {
          console.error("Failed to add user to group. Response:", JSON.stringify(response.data, null, 2));
        }
      } catch (error) {
        // Log the full error object
        console.error("Error adding user to group. Full error:", JSON.stringify(error, null, 2));
        
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        
        // Check if it's a GraphQL error with more details
        const gqlError = error as any;
        if (gqlError.errors) {
          console.error("GraphQL errors:", JSON.stringify(gqlError.errors, null, 2));
        }
      }
    }

    checkAndAddToGroup();
  }, [userInfo?.userId, userInfo?.groups]);

  // Set up subscriptions
  useEffect(() => {
    if (!selectedChannel) return;

    // Subscribe to channel changes
    const channelSub = client.models.Channel.observeQuery().subscribe({
      next: ({ items }) => {
        setChannels(items);
      },
      error: (error) => console.error('Channel subscription error:', error)
    });

    // Subscribe to messages for the selected channel
    const messageSub = client.models.Message.observeQuery({
      filter: { channelId: { eq: selectedChannel.id } }
    }).subscribe({
      next: async ({ items }) => {
        const sortedMessages = items.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        const messagesWithUsers = await fetchMessageUsers(sortedMessages);
        setMessages(messagesWithUsers);
      },
      error: (error) => console.error('Message subscription error:', error)
    });

    return () => {
      channelSub.unsubscribe();
      messageSub.unsubscribe();
    };
  }, [selectedChannel?.id]);

  async function getUserInfo() {
    try {
      const { username, userId } = await getCurrentUser();
      const session = await fetchAuthSession();
      console.log("Auth session:", session.tokens?.accessToken?.payload);
      const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) || [];
      console.log("User groups after login:", groups);
      
      setUserInfo({ username, userId, groups });

      // Create or update user profile
      const { data: existingUsers } = await client.models.User.list({
        filter: { id: { eq: userId } }
      });

      if (existingUsers.length === 0) {
        console.log("Creating new user profile for:", username);
        await client.models.User.create({
          id: userId,
          email: username,
          displayName: username,
          profilePicture: "https://tigerpanda.tv/profile.png",
        });
      }

      // Reload channels
      await listChannels();
      
      // If there are channels, select the first one and load its messages
      const { data: channels } = await client.models.Channel.list();
      if (channels.length > 0) {
        setSelectedChannel(channels[0]);
        await listMessages(channels[0].id);
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
      // Select first channel if none selected
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
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
      
      // Sort messages by createdAt in descending order (newest first)
      const sortedMessages = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
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

  async function uploadProfilePicture(file: File) {
    if (!userInfo) {
      console.error("No user info available");
      return;
    }
    
    try {
      const result = await uploadData({
        path: `profile-pictures/${userInfo.userId}/${file.name}`,
        data: file,
        options: {
          contentType: file.type
        }
      }).result;

      const imageUrl = await getUrl({
        path: result.path
      });

      await client.models.User.update({
        id: userInfo.userId,
        profilePicture: imageUrl.url.toString()
      });

      return imageUrl.url.toString();
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChannel || !userInfo || !newMessage.trim()) return;

    try {
      const fileInput = document.querySelector<HTMLInputElement>('#file-upload');
      let attachmentPath = null;

      if (fileInput?.files?.length) {
        if (!userInfo.groups.includes('user')) {
          console.error("User not authorized to upload files");
          return;
        }
        
        const file = fileInput.files[0];
        const result = await uploadData({
          path: `messages/${Date.now()}-${file.name}`,
          data: file,
          options: {
            contentType: file.type
          }
        }).result;
        attachmentPath = result.path;
      }

      await client.models.Message.create({
        content: newMessage,
        channelId: selectedChannel.id,
        senderId: userInfo.userId,
        attachmentPath
      });

      setNewMessage("");
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userInfo) {
      console.error("No user info available");
      return;
    }

    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const imageUrl = await uploadProfilePicture(file);
      if (imageUrl) {
        await client.models.User.update({
          id: userInfo.userId,
          profilePicture: imageUrl
        });
        await getUserInfo();
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  async function updateDisplayName() {
    if (!userInfo) return;
    
    try {
      await client.models.User.update({
        id: userInfo.userId,
        displayName: displayName
      });
      await getUserInfo();
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error updating display name:", error);
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function getProfilePicUrl(path: string | null | undefined, userId: string) {
    if (!path) {
      return "https://tigerpanda.tv/profile.png";
    }
    try {
      const result = await getUrl({ path });
      const url = result.url.toString();
      setProfilePicUrls(prev => ({ ...prev, [userId]: url }));
      return url;
    } catch (error) {
      console.error("Error getting profile pic URL:", error);
      return "https://tigerpanda.tv/profile.png";
    }
  }

  // Refresh profile pic URLs every 10 minutes
  useEffect(() => {
    const refreshUrls = async () => {
      if (!messages.length) return;
      
      // Refresh URLs for all unique users in messages
      const uniqueUsers = Array.from(new Set(messages.map(msg => msg.user?.id).filter((id): id is string => id !== undefined)));
      for (const userId of uniqueUsers) {
        const user = messages.find(msg => msg.user?.id === userId)?.user;
        if (user?.profilePicture) {
          await getProfilePicUrl(user.profilePicture, userId);
        }
      }
      
      // Refresh current user's profile pic URL
      if (userInfo?.userId && userInfo?.profilePicture) {
        await getProfilePicUrl(userInfo.profilePicture, userInfo.userId);
      }
    };
    
    refreshUrls();
    const interval = setInterval(refreshUrls, 10 * 60 * 1000); // Refresh every 10 minutes
    
    return () => clearInterval(interval);
  }, [messages, userInfo]);

  return (
    <Authenticator>
      {({ signOut, user }) => {
        if (!user || !userInfo) {
          return <div>Loading...</div>;
        }

        return (
          <main className="chat-app">
            {/* Left Navigation Bar */}
            <nav className="left-nav">
              {/* Server/App Name */}
              <div className="nav-header px-4">
                <h1 className="text-white font-semibold">Chat App</h1>
              </div>

              {/* Channels Section */}
              <div className="p-3 mt-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <h2 className="text-xs channel-list-header">
                    Channels
                  </h2>
                  <button 
                    onClick={createChannel}
                    className="add-channel-button px-2 py-1 rounded"
                    title="Add Channel"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-[2px]">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 channel-name ${
                        selectedChannel?.id === channel.id ? "selected" : ""
                      }`}
                    >
                      <span className="channel-prefix">#</span>
                      {channel.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Section at Bottom */}
              <div className="mt-auto p-2 bg-[#232428]">
                <div className="flex items-center gap-3 p-2 rounded hover:bg-[#35373C] cursor-pointer"
                     onClick={() => {
                       setDisplayName(userInfo.displayName || "");
                       setIsProfileModalOpen(true);
                     }}>
                  <img 
                    src={profilePicUrls[userInfo.userId] || "https://tigerpanda.tv/profile.png"}
                    alt=""
                    width="32"
                    height="32"
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-100 truncate">
                      {userInfo.displayName || userInfo.userId}
                    </div>
                    <div className="text-xs status-text truncate flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Online
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Chat Area */}
            <div className="chat-area">
              {selectedChannel ? (
                <>
                  <header className="nav-header px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#</span>
                      <h2 className="font-medium text-gray-100">{selectedChannel.name}</h2>
                    </div>
                  </header>

                  <div className="messages-container">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="hover:bg-[#2E3035] -mx-4 px-4 py-2 rounded group">
                          <div className="flex items-start gap-3">
                            <img 
                              src={message.user?.id ? profilePicUrls[message.user.id] || "https://tigerpanda.tv/profile.png" : "https://tigerpanda.tv/profile.png"}
                              alt=""
                              width="40"
                              height="40"
                              className="rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="user-name group-hover:underline cursor-pointer">
                                  {message.user?.displayName || message.user?.email || 'Unknown User'}
                                </span>
                                <span className="text-xs message-timestamp">
                                  {message.createdAt && new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="message-content break-words">{message.content}</div>
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
                                      className="text-blue-400 hover:text-blue-300 underline"
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
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  <div className="message-input-container">
                    <form onSubmit={sendMessage} className="w-full">
                      <div className="flex gap-2 bg-[#383A40] rounded-lg p-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none px-2"
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
                          className="p-2 text-gray-400 hover:text-gray-300 hover:bg-[#2E3035] rounded"
                          disabled={isLoading}
                          title="Attach File"
                        >
                          📎
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1 rounded font-medium primary-button"
                          disabled={isLoading || !newMessage.trim()}>
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-2">👋 Welcome!</div>
                    <div>Select a channel to start chatting</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Navigation Bar */}
            <nav className="right-nav">
              {/* Sign Out Button */}
              <div className="nav-header px-6 justify-end">
                <button 
                  onClick={signOut}
                  className="text-sm action-button px-4 py-1.5 rounded"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </main>
        );
      }}
    </Authenticator>
  );
}
