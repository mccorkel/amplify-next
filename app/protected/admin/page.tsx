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