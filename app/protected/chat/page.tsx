"use client";

import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {getCurrentUser} from 'aws-amplify/auth';

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

export default function ChatPage() {
  const client = generateClient<Schema>();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userId, setUserId] = useState<string>("");

  // On mount, fetch user info from Amplify Auth
  useEffect(() => {
    async function fetchAuthUser() {
      try {
        const user = await getCurrentUser();
        // By default, user.username or user.attributes.email might be used
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
        const result = await client.models.Channel.list();
        if (result.data) {
          setChannels(result.data as Channel[]);
          if (result.data.length > 0) {
            setSelectedChannel(result.data[0] as Channel);
          }
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    }
    fetchChannels();
  }, [client.models.Channel]);

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

  // Switch channels
  function handleSelectChannel(channel: Channel) {
    setSelectedChannel(channel);
    setMessages([]);
  }

  // Check if the user addresses the Old Timer
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

  return (
    <main className="chat-app flex-1 flex">
      {/* Left Sidebar */}
      <aside className="left-nav">
        <div className="nav-header px-4">Channels</div>
        <div className="flex-1 overflow-y-auto px-2">
          {channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => handleSelectChannel(ch)}
              className={`channel-name px-2 py-1 cursor-pointer ${
                selectedChannel && ch.id === selectedChannel.id ? "selected" : ""
              }`}
            >
              {ch.name}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <section className="chat-area">
        <header className="nav-header px-4">
          {selectedChannel ? <h2>{selectedChannel.name}</h2> : <h2>Select a channel</h2>}
        </header>

        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id || Math.random()} className="mb-2">
              <span className="user-name mr-2">
                {msg.senderId === "OldTimer" ? "Old Timer" : msg.senderId}:
              </span>
              <span className="message-content">{msg.content}</span>
            </div>
          ))}
        </div>

        {selectedChannel && (
          <div className="message-input-container">
            <input
              className="message-input flex-1 px-4 py-2"
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              onClick={sendMessage}
              className="ml-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        )}
      </section>

      {/* Right Sidebar */}
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
    </main>
  );
}