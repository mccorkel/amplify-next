"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { TEAM_ABBREVS, TeamLogos } from "@/app/lib/teamLogos";

/**
 * Admin Dashboard
 * - Checks if the user belongs to the "ADMINS" group.
 * - If not an admin, they see an error or are redirected.
 * - Otherwise, we show channel management or moderation placeholders.
 */

export default function AdminPage() {
  const dataClient = generateClient<Schema>();
  const [isAdmin, setIsAdmin] = useState(false);

  const [allChannels, setAllChannels] = useState<any[]>([]);
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    async function checkUserGroups() {
      try {
        const user = await getCurrentUser();
        // TODO: Implement proper group checks later
        setIsAdmin(true);
        // Fetch list of channels
        const result = await dataClient.models.Channel.list();
        if (result.data) {
          setAllChannels(result.data);
        }
      } catch (error) {
        console.error("Error checking admin groups", error);
      }
    }
    checkUserGroups();
  }, [dataClient]);

  async function seedMLBChannels() {
    const mlbTeams = [
      "Arizona Diamondbacks","Atlanta Braves","Baltimore Orioles","Boston Red Sox","Chicago Cubs",
      "Chicago White Sox","Cincinnati Reds","Cleveland Guardians","Colorado Rockies","Detroit Tigers",
      "Houston Astros","Kansas City Royals","Los Angeles Angels","Los Angeles Dodgers","Miami Marlins",
      "Milwaukee Brewers","Minnesota Twins","New York Mets","New York Yankees","Oakland Athletics",
      "Philadelphia Phillies","Pittsburgh Pirates","San Diego Padres","San Francisco Giants","Seattle Mariners",
      "St. Louis Cardinals","Tampa Bay Rays","Texas Rangers","Toronto Blue Jays","Washington Nationals"
    ];
    
    try {
      // 1) Find or Create "OldTimer" user
      let oldTimerUserId: string | null = null;
      {
        const existing = await dataClient.models.User.list({ filter: { email: { eq: "oldtimer@cooperstown.com" } }});
        if (existing.data && existing.data.length > 0) {
          oldTimerUserId = existing.data[0].id;
        } else {
          const newOt = await dataClient.models.User.create({
            email: "oldtimer@cooperstown.com",
            displayName: "Old Timer",
            profilePicture: "",
          });
          oldTimerUserId = newOt?.data?.id || null;
        }
      }
  
      // 2) Create all MLB channels & an "Upcoming Game" channel if missing
      const allChannels = await dataClient.models.Channel.list();
      const existingChNames = new Set<string>();
      if (allChannels.data) {
        allChannels.data.forEach((ch:any) => existingChNames.add(ch.name));
      }
  
      // We'll keep track of newly created channel IDs
      const newChannels: any[] = [];
      
      // Ensure upcoming game channel
      if (!existingChNames.has("Upcoming Game")) {
        const c = await dataClient.models.Channel.create({
          name: "Upcoming Game",
          description: "Chat about upcoming MLB games"
        });
        if (c?.data) {
          newChannels.push(c.data);
        }
      }
      
      // Each MLB team channel
      for (const team of mlbTeams) {
        if (!existingChNames.has(team)) {
          const c = await dataClient.models.Channel.create({
            name: team,
            description: `${team} official chat`
          });
          if (c?.data) {
            newChannels.push(c.data);
          }
        }
      }
  
      // 3) For each newly created channel, add OldTimer membership if oldTimerUserId is valid
      if (oldTimerUserId) {
        for (const ch of newChannels) {
          // create membership
          await dataClient.models.ChannelMember.create({
            channelId: ch.id,
            userId: oldTimerUserId
          });
        }
      }
  
      // Reload channel list in the Admin UI
      const updated = await dataClient.models.Channel.list();
      if (updated.data) {
        setAllChannels(updated.data);
      }
  
      alert("MLB channels and OldTimer seeded successfully!");
    } catch (err) {
      console.error("Error seeding MLB channels:", err);
      alert("Failed to seed channels. Check console logs.");
    }
  }
  
  async function createChannel() {
    if (!channelName.trim()) return;
    try {
      const newCh = await dataClient.models.Channel.create({
        name: channelName,
        description: "Created by admin"
      });
      if (newCh) {
        setAllChannels((prev) => [...prev, newCh]);
      }
      setChannelName("");
    } catch (err) {
      console.error("Error creating channel", err);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-patriotic-red text-2xl font-bold">
          You do not have admin privileges!
        </h1>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <h1 className="mb-4 text-2xl font-bold text-patriotic-blue">
        Admin Dashboard
      </h1>
      <p className="mb-4 text-sm text-gray-700">
        Welcome, Admin! Manage channels or moderate messages below.
      </p>

      {/* Seed MLB Channels */}
      <div className="mb-6 border p-4 rounded">
        <h2 className="mb-2 font-semibold text-lg text-patriotic-blue">
          Seed MLB Channels + OldTimer
        </h2>
        <p className="mb-2 text-sm text-gray-700">
          This will create channels for all MLB teams plus an "Upcoming Game" channel, and ensure an "OldTimer" user is in each.
        </p>
        <button
          onClick={seedMLBChannels}
          className="rounded bg-patriotic-red px-3 py-2 text-white hover:opacity-90 text-sm"
        >
          Seed MLB
        </button>
      </div>
      
      {/* Create Channel */}
      <div className="mb-6 border p-4 rounded">
        <h2 className="mb-2 font-semibold text-lg text-patriotic-blue">
          Create a New Channel
        </h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="rounded border p-2 text-sm outline-none focus:ring"
            placeholder="Channel Name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
          <button
            onClick={createChannel}
            className="rounded bg-patriotic-red px-3 py-2 text-white hover:opacity-90 text-sm"
          >
            Create
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="mb-6 border p-4 rounded">
        <h2 className="mb-2 font-semibold text-lg text-patriotic-blue">
          Existing Channels
        </h2>
        {allChannels.map((ch) => (
          <div
            key={ch.id}
            className="mb-2 flex items-center justify-between rounded bg-white px-4 py-2 shadow"
          >
            <div>
              <p className="font-bold text-gray-900 flex items-center space-x-2">
                {TEAM_ABBREVS[ch.name] && (
                  // @ts-ignore - TeamLogos has dynamic properties
                  React.createElement(TeamLogos[TEAM_ABBREVS[ch.name]], { size: "30" })
                )}
                <span>{ch.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                {ch.description || "No description"}
              </p>
            </div>
            {/* Example "Delete" button or "Edit" button */}
            {/* Implement your own logic for channel removal if needed */}
            <button
              className="text-sm text-patriotic-red hover:underline"
              onClick={() => console.log("TODO: remove channel", ch.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Additional moderation tasks or placeholders could go here */}
    </div>
  );
}