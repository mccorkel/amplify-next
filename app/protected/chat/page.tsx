"use client";

import React, { useEffect, useState, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {getCurrentUser} from 'aws-amplify/auth';
import { TEAM_ABBREVS, MLBLogos } from "@/app/lib/teamLogos";

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
  // Remove client initialization from here
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [myChannelIds, setMyChannelIds] = useState<Set<string>>(new Set());
  const [favoriteChannels, setFavoriteChannels] = useState<Set<string>>(new Set());

  // On mount, fetch user info from Amplify Auth
  useEffect(() => {
    async function fetchAuthUser() {
      try {
        const user = await getCurrentUser();
        // By default, user.username or user.attributes.email might be used
        if (user) {
          setUserId(user.username);
          await loadMemberships(user.username);
        }
      } catch (err) {
        console.error("Failed to retrieve user from Auth:", err);
      }
    }
    fetchAuthUser();
    
    async function loadMemberships(uid: string) {
      try {
        const res = await client.models.ChannelMember.list({
          filter: { userId: { eq: uid } }
        });
        if (res.data) {
          const setOfIds = new Set<string>();
          res.data.forEach((cm: any) => {
            setOfIds.add(cm.channelId);
          });
          setMyChannelIds(setOfIds);
        }
      } catch (error) {
        console.error("Error loading memberships:", error);
      }
    }
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

  // Check if the user addresses the Old Timer
  async function toggleMembership(ch: Channel) {
    if (!userId) return;
    try {
      if (myChannelIds.has(ch.id)) {
        // Remove membership
        // We'll find the record, then delete
        const listRes = await client.models.ChannelMember.list({
          filter: { channelId: { eq: ch.id }, userId: { eq: userId } }
        });
        if (listRes.data && listRes.data.length > 0) {
          const cm = listRes.data[0];
          await client.models.ChannelMember.delete({ id: cm.id });
          setMyChannelIds(prev => {
            const copy = new Set(prev);
            copy.delete(ch.id);
            return copy;
          });
        }
      } else {
        // Create membership
        const newMem = await client.models.ChannelMember.create({
          channelId: ch.id,
          userId
        });
        if (newMem && newMem.data) {
          setMyChannelIds(prev => new Set(prev).add(ch.id));
        }
      }
    } catch (err) {
      console.error("Error toggling membership:", err);
    }
  }
  
  function isAddressingOldTimer(input: string) {
    const lowered = input.toLowerCase();
    return lowered.includes("old timer") || lowered.includes("@oldtimer");
  }

  // Post a message
  async function sendMessage() {
    if (!inputValue.trim() || !selectedChannel || !userId) return;
    const content = inputValue.trim();
    setInputValue("");

    // Create user message
    if (!myChannelIds.has(selectedChannel.id)) {
      alert("You must join this channel before posting!");
      return;
    }
    
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

  // Update toggleFavorite to persist to database
  const toggleFavorite = async (channelId: string) => {
    try {
      if (!userId) return;
      
      // Check if favorite already exists
      const existing = await client.models.UserFavorite.list({
        filter: { userId: { eq: userId }, channelId: { eq: channelId } }
      });

      if (existing.data && existing.data.length > 0) {
        // Remove favorite
        await client.models.UserFavorite.delete({ id: existing.data[0].id });
        const newFavorites = new Set<string>();
        favoriteChannels.forEach(id => {
          if (id) newFavorites.add(id);
        });

        if (channelId) {
          if (newFavorites.has(channelId)) {
            newFavorites.delete(channelId);
          } else {
            newFavorites.add(channelId);
          }
          setFavoriteChannels(newFavorites);
        }
      } else {
        // Add favorite
        await client.models.UserFavorite.create({
          userId,
          channelId
        });
        const newFavorites = new Set<string>();
        favoriteChannels.forEach(id => {
          if (id) newFavorites.add(id);
        });
        newFavorites.add(channelId);
        setFavoriteChannels(newFavorites);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Update loadFavorites useEffect
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

  // Separate channels into joined and available
  const { joinedChannels, availableChannels } = useMemo(() => {
    if (!channels) return { joinedChannels: [], availableChannels: [] };
    
    const joined = channels.filter(ch => myChannelIds.has(ch.id))
      .sort((a, b) => {
        // Upcoming Game first
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
      
    const available = channels.filter(ch => !myChannelIds.has(ch.id))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    return { joinedChannels: joined, availableChannels: available };
  }, [channels, myChannelIds, favoriteChannels]);

  return (
    <div className="flex-1 flex">
      {/* Left sidebar - Channels */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Channels</h2>
        
        {/* Joined Channels */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">JOINED CHANNELS</h3>
          <div className="space-y-2">
            {joinedChannels.map((channel) => {
              const { city, team } = splitTeamName(channel.name);
              const abbrev = TEAM_ABBREVS[channel.name];
              
              return (
                <div
                  key={channel.id}
                  className={`flex items-center p-2 rounded cursor-pointer
                    ${selectedChannel?.id === channel.id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <div className="flex items-start space-x-2 flex-1">
                    {channel.name === "Upcoming Game" ? (
                      <span className="text-yellow-500 mt-1">📅</span>
                    ) : (
                      <div className="flex flex-col items-center">
                        {abbrev && MLBLogos[abbrev as keyof typeof MLBLogos] && React.createElement(MLBLogos[abbrev as keyof typeof MLBLogos], { size: 24 })}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(channel.id);
                          }}
                          className="text-gray-400 hover:text-yellow-500 focus:outline-none mt-1"
                        >
                          {favoriteChannels.has(channel.id) ? '★' : '☆'}
                        </button>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{city}</div>
                      <div className="text-sm">{team}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Available Channels */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">AVAILABLE CHANNELS</h3>
          <div className="space-y-2">
            {availableChannels.map((channel) => {
              const { city, team } = splitTeamName(channel.name);
              const abbrev = TEAM_ABBREVS[channel.name];
              
              return (
                <div
                  key={channel.id}
                  className="flex items-center p-2 rounded hover:bg-gray-700"
                >
                  <div className="flex items-start space-x-2 flex-1">
                    {channel.name === "Upcoming Game" ? (
                      <span className="text-yellow-500 mt-1">📅</span>
                    ) : (
                      <div className="flex items-center">
                        {abbrev && MLBLogos[abbrev as keyof typeof MLBLogos] && React.createElement(MLBLogos[abbrev as keyof typeof MLBLogos], { size: 24 })}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{city}</div>
                      <div className="text-sm">{team}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMembership(channel)}
                    className="text-xs bg-patriotic-blue text-white px-2 py-1 rounded ml-2 hover:bg-patriotic-red"
                  >
                    Join
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              {selectedChannel ? selectedChannel.name : "Select a channel"}
            </h2>
          </div>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="p-2 rounded bg-gray-100">
                <div className="font-bold">{message.senderId === "OldTimer" ? "Old Timer" : message.senderId}:</div>
                <div>{message.content}</div>
              </div>
            ))}
          </div>
        </div>
        {selectedChannel && (
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message here..."
                className="flex-1 p-2 border rounded"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Right sidebar */}
      <aside className="right-nav">
        <div className="nav-header px-4">Info</div>
        <div className="flex-1 overflow-y-auto px-2 text-sm">
          {selectedChannel ? (
            <>
              <p className="font-bold mb-2">Description</p>
              <p>{selectedChannel.description || "No description"}</p>
              <p className="mt-4">Channel ID: {selectedChannel.id}</p>
            </>
          ) : (
            <p>Please select a channel to see details.</p>
          )}
        </div>
      </aside>
    </div>
  );
}