"use client";

import React, { useEffect, useState, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from 'aws-amplify/auth';
import { TEAM_ABBREVS } from "@/app/lib/teamLogos";
import { TeamLogo } from "@/app/components/TeamLogo";

/**
 * Placeholder function to simulate calling a vector DB for baseball info
 */
async function fetchBaseballData(query: string): Promise<string> {
  console.log("[DEBUG] fetchBaseballData called with:", query);
  await new Promise((r) => setTimeout(r, 500)); // simulate network delay
  return "Placeholder stats for: " + query;
}

/**
 * Placeholder function to simulate an LLM generating a response
 */
async function callOldTimerLLM(userMessage: string, retrievedStats: string): Promise<string> {
  console.log("[DEBUG] callOldTimerLLM with:", { userMessage, retrievedStats });
  await new Promise((r) => setTimeout(r, 800)); // simulate network delay
  return `Old Timer says: Here's info about "${userMessage}" from my knowledge of ${retrievedStats}.`;
}

interface ChannelUser {
  id: string;
  email: string;
  displayName: string;
  isOldTimer: boolean;
}

interface Channel {
  id: string;
  name: string;
  description?: string | null;
}

interface Message {
  id?: string;
  content: string;
  channelId: string;
  senderId: string;
  createdAt?: string;
}

interface ChannelMember {
  id?: string;
  channelId: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

const TEAM_ABBREVIATIONS = TEAM_ABBREVS;

// Move client initialization outside of component
const client = generateClient<Schema>();

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Remove client initialization from here
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelUsers, setChannelUsers] = useState<ChannelUser[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [favoriteChannels, setFavoriteChannels] = useState<Set<string>>(new Set());
  
  // On mount, fetch user info from Amplify Auth
  useEffect(() => {
    async function fetchAuthUser() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.username);
        }
      } catch (err) {
        console.error("Failed to retrieve user from Auth:", err);
      }
    }
    fetchAuthUser();
  }, []);

  // 1) Fetch channels from Amplify Data
  useEffect(() => {
    async function fetchChannels() {
      try {
        // Ensure user is authenticated before making requests
        const user = await getCurrentUser();
        if (!user) return;
        
        const result = await client.models.Channel.list();
        if (result.data) {
          const channelList = result.data as Channel[];
          setChannels(channelList);
          
          // Sort channels to find the top team channel
          const sortedList = channelList.sort((a, b) => {
            // Upcoming Game always first
            if (a.name === "Upcoming Game") return -1;
            if (b.name === "Upcoming Game") return 1;
            
            // Favorites second
            const aIsFavorite = favoriteChannels.has(a.id);
            const bIsFavorite = favoriteChannels.has(b.id);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // Alphabetical for the rest
            return a.name.localeCompare(b.name);
          });

          // Select the first non-"Upcoming Game" channel
          const defaultChannel = sortedList.find(ch => ch.name !== "Upcoming Game") || sortedList[0];
          if (defaultChannel) {
            setSelectedChannel(defaultChannel);
            if (defaultChannel) {
              await loadChannelUsers(defaultChannel.id);
            }
          }
        }
      } catch (err: any) {
        if (err.message === "No current user") {
          console.log("Waiting for user to be authenticated...");
          return;
        }
        console.error("Error fetching channels:", err);
      }
    }
    fetchChannels();
  }, [client, favoriteChannels]);

  // 2) Fetch messages for the selected channel
  useEffect(() => {
    if (!selectedChannel) return;
    async function fetchChannelMessages() {
      if (!selectedChannel) return;
      try {
        const result = await client.models.Message.list({
          filter: { channelId: { eq: selectedChannel.id } },
        });
        if (result.data) {
          setMessages(result.data as Message[]);
        }
      } catch (error) {
        console.error("Error fetching channel messages:", error);
      }
    }
    fetchChannelMessages();
  }, [selectedChannel, client.models.Message]);

  async function loadChannelUsers(channelId: string) {
    try {
      // Get all ChannelMember records for that channel
      const cmRes = await client.models.ChannelMember.list({
        filter: { channelId: { eq: channelId } }
      });
      if (!cmRes.data) {
        setChannelUsers([]);
        return;
      }
      // For each membership, fetch the user record
      const userPromises = cmRes.data.map(async (cm: any) => {
        if (!cm.userId) return null;
        const userRes = await client.models.User.get({ id: cm.userId });
        if (!userRes?.data) return null;
        // Mark if it's the old timer by email (or any other logic)
        const isOldTimer = (userRes.data.email === "oldtimer@cooperstown.com");
        return {
          id: userRes.data.id,
          email: userRes.data.email,
          displayName: userRes.data.displayName,
          isOldTimer
        } as ChannelUser;
      });
      const userArr = await Promise.all(userPromises);
      // Filter out any null returns
      const validUsers = userArr.filter((u) => u !== null) as ChannelUser[];
      
      // Put old timer at top, then the rest sorted by displayName or other
      const oldTimer = validUsers.find(u => u.isOldTimer);
      const others = validUsers.filter(u => !u.isOldTimer);
      others.sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      let finalList: ChannelUser[] = [];
      if (oldTimer) {
        finalList = [oldTimer, ...others];
      } else {
        finalList = others;
      }
      setChannelUsers(finalList);
    } catch (err) {
      console.error("Error loading channel users:", err);
      setChannelUsers([]);
    }
  }

  // Post a message
  async function sendMessage() {
    if (!inputValue.trim() || !selectedChannel || !userId) return;
    const content = inputValue.trim();
    setInputValue("");

    // Create user message
    const newMessage: Message = {
      content,
      channelId: selectedChannel.id,
      senderId: userId
    };

    // Save user's message to Amplify
    let createdMessage: Message | null = null;
    try {
      const result = await client.models.Message.create(newMessage);
      if (result) {
        if (result.data) {
          createdMessage = {
            id: result.data.id,
            content: result.data.content,
            channelId: result.data.channelId,
            senderId: result.data.senderId,
            createdAt: result.data.createdAt || undefined,
          } as Message;
        }
      }
    } catch (error) {
      console.error("Error creating message:", error);
      return;
    }

    // Update local state
    if (createdMessage) {
      setMessages((prev) => [...prev, createdMessage]);
    }

    // RAG flow if user addresses Old Timer
    if (isAddressingOldTimer(content)) {
      try {
        // a) Retrieve relevant baseball stats
        const stats = await fetchBaseballData(content);

        // b) Generate AI reply
        const aiReply = await callOldTimerLLM(content, stats);

        // c) Save AI reply to Amplify
        const oldTimerMessage: Message = {
          content: aiReply,
          channelId: selectedChannel.id,
          senderId: "OldTimer"
        };
        const savedOldTimer = await client.models.Message.create(oldTimerMessage);
        if (savedOldTimer) {
          if (savedOldTimer.data) {
            const oldTimerMessage: Message = {
              id: savedOldTimer.data.id,
              content: savedOldTimer.data.content,
              channelId: savedOldTimer.data.channelId,
              senderId: savedOldTimer.data.senderId,
              createdAt: savedOldTimer.data.createdAt || undefined,
            };
            setMessages((prev) => [...prev, oldTimerMessage]);
          }
        }
      } catch (error) {
        console.error("Error with Old Timer flow:", error);
      }
    }
  }

  // Add function to split team name into city and team
  const splitTeamName = (name: string) => {
    if (name === "Upcoming Game") return { city: "", team: name };
    const lastSpace = name.lastIndexOf(" ");
    if (lastSpace === -1) return { city: "", team: name };
    return {
      city: name.substring(0, lastSpace),
      team: name.substring(lastSpace + 1)
    };
  };

  // Update URL when channel is selected
  const updateUrlWithChannel = (channel: Channel | null) => {
    if (!channel) return;
    
    // Find the abbreviation for the team
    const abbrev = TEAM_ABBREVS[channel.name]?.toLowerCase() || '';
    
    // Create new URLSearchParams
    const params = new URLSearchParams(searchParams.toString());
    params.set('team', abbrev);
    
    // Update URL without reload
    router.push(`/protected/chat?${params.toString()}`, { scroll: false });
  };

  // Initial channel selection from URL
  useEffect(() => {
    const teamAbbrev = searchParams.get('team');
    if (!teamAbbrev || !channels.length) return;

    // Find channel by team abbreviation
    const teamName = Object.entries(TEAM_ABBREVS).find(
      ([_, abbrev]) => abbrev.toLowerCase() === teamAbbrev.toLowerCase()
    )?.[0];

    if (teamName) {
      const channel = channels.find(ch => ch.name === teamName);
      if (channel) {
        setSelectedChannel(channel);
        loadChannelUsers(channel.id);
      }
    }
  }, [channels, searchParams]);

  // Modify channel selection to update URL
  const handleChannelSelect = async (channel: Channel) => {
    setSelectedChannel(channel);
    await loadChannelUsers(channel.id);
    updateUrlWithChannel(channel);
  };

  // Update toggleFavorite to preserve URL state
  const toggleFavorite = async (channelId: string) => {
    try {
      if (!userId) return;
      
      // Check if favorite already exists
      const existing = await client.models.UserFavorite.list({
        filter: { userId: { eq: userId }, channelId: { eq: channelId } }
      });

      if (existing.data && existing.data.length > 0) {
        await client.models.UserFavorite.delete({ id: existing.data[0].id });
        setFavoriteChannels(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(channelId);
          return newFavorites;
        });
      } else {
        await client.models.UserFavorite.create({
          userId,
          channelId
        });
        setFavoriteChannels(prev => {
          const newFavorites = new Set(prev);
          newFavorites.add(channelId);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Separate channels into upcoming, favorites and all others
  const { upcomingChannels, favoriteTeamChannels, otherChannels } = useMemo(() => {
    if (!channels) return { upcomingChannels: [], favoriteTeamChannels: [], otherChannels: [] };
    
    // First separate upcoming game channels
    const upcoming = channels.filter(ch => ch.name === "Upcoming Game");
    
    // Then handle regular team channels
    const favorites = channels.filter(ch => 
      favoriteChannels.has(ch.id) && ch.name !== "Upcoming Game"
    ).sort((a, b) => a.name.localeCompare(b.name));
      
    const others = channels.filter(ch => 
      !favoriteChannels.has(ch.id) && ch.name !== "Upcoming Game"
    ).sort((a, b) => a.name.localeCompare(b.name));
      
    return { upcomingChannels: upcoming, favoriteTeamChannels: favorites, otherChannels: others };
  }, [channels, favoriteChannels]);

  function isAddressingOldTimer(input: string) {
    const lowered = input.toLowerCase();
    return lowered.includes("old timer") || lowered.includes("@oldtimer");
  }

  // Load favorites on mount
  useEffect(() => {
    async function loadFavorites() {
      if (!userId || !client?.models?.UserFavorite) return;
      try {
        const result = await client.models.UserFavorite.list({
          filter: { userId: { eq: userId } }
        });
        if (result?.data) {
          const validChannelIds = result.data
            .map(f => f.channelId)
            .filter((id): id is string => id !== null && id !== undefined);
          
          const favorites = new Set<string>(validChannelIds);
          setFavoriteChannels(favorites);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }
    loadFavorites();
  }, [userId]);

  return (
    <div className="flex-1 flex h-[calc(100vh-100px)]">
      {/* Left sidebar - Channels */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col h-[calc(100vh-100px)]">
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold">Channels</h2>
        </div>
        
        {/* Make the channels section scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="p-4 space-y-6">
            {/* Upcoming Games */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 sticky top-0 bg-gray-800 py-2">UPCOMING GAMES</h3>
              <div className="space-y-2">
                {upcomingChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center p-2 rounded cursor-pointer
                      ${selectedChannel?.id === channel.id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <div className="flex items-start space-x-2 flex-1">
                      <span className="text-yellow-500 mt-1">📅</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">Upcoming</div>
                        <div className="text-sm">Game</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Favorite Channels */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 sticky top-0 bg-gray-800 py-2">FAVORITES</h3>
              <div className="space-y-2">
                {favoriteTeamChannels.map((channel) => {
                  const { city, team } = splitTeamName(channel.name);
                  const abbrev = TEAM_ABBREVS[channel.name];
                  
                  return (
                    <div
                      key={channel.id}
                      className={`flex items-center p-2 rounded cursor-pointer
                        ${selectedChannel?.id === channel.id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                      onClick={() => handleChannelSelect(channel)}
                    >
                      <div className="flex items-start space-x-2 flex-1">
                        <div className="flex items-center">
                          {abbrev && <TeamLogo abbrev={abbrev} size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{city}</div>
                          <div className="text-sm">{team}</div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await toggleFavorite(channel.id);
                          }}
                          className="text-xl text-gray-400 hover:text-yellow-500 focus:outline-none"
                        >
                          {favoriteChannels.has(channel.id) ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* All Other Channels */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 sticky top-0 bg-gray-800 py-2">ALL CHANNELS</h3>
              <div className="space-y-2">
                {otherChannels.map((channel) => {
                  const { city, team } = splitTeamName(channel.name);
                  const abbrev = TEAM_ABBREVS[channel.name];
                  
                  return (
                    <div
                      key={channel.id}
                      className={`flex items-center p-2 rounded cursor-pointer
                        ${selectedChannel?.id === channel.id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                      onClick={() => handleChannelSelect(channel)}
                    >
                      <div className="flex items-start space-x-2 flex-1">
                        <div className="flex items-center">
                          {abbrev && <TeamLogo abbrev={abbrev} size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{city}</div>
                          <div className="text-sm">{team}</div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await toggleFavorite(channel.id);
                          }}
                          className="text-xl text-gray-400 hover:text-yellow-500 focus:outline-none"
                        >
                          {favoriteChannels.has(channel.id) ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
        {/* Chat header */}
        <div className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            {selectedChannel?.name !== "Upcoming Game" ? (
              <div className="flex-shrink-0">
                <TeamLogo abbrev={TEAM_ABBREVS[selectedChannel?.name || '']} size={48} />
              </div>
            ) : selectedChannel ? (
              <div className="flex-shrink-0 text-3xl">
                📅
              </div>
            ) : null}
            <h2 className="text-xl font-bold">
              {selectedChannel ? selectedChannel.name : "Select a channel"}
            </h2>
          </div>
        </div>

        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="p-3 rounded bg-gray-50">
                <div className="font-bold text-gray-900">
                  {message.senderId === "OldTimer" ? "Old Timer" : message.senderId}:
                </div>
                <div className="text-gray-700 mt-1">{message.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat input - fixed at bottom */}
        {selectedChannel && (
          <div className="px-6 py-4 border-t bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message here..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Right sidebar - User list */}
      <aside className="w-64 border-l bg-white flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Channel Info</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {selectedChannel ? (
              <>
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h4>
                  <p className="text-sm text-gray-600">{selectedChannel.description || "No description"}</p>
                </div>

                {channelUsers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Members ({channelUsers.length})
                    </h4>
                    <ul className="space-y-3">
                      {channelUsers.map((user) => (
                        <li key={user.id} className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 rounded-full bg-patriotic-blue text-white flex items-center justify-center mr-3">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            {user.isOldTimer && (
                              <span className="text-xs bg-patriotic-red text-white px-2 py-0.5 rounded-full">
                                AI Veteran
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm">Select a channel to see details</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}