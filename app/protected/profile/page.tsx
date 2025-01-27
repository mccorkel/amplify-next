"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

/**
 * Example Profile Page
 * - Retrieves user attributes (e.g. email, name) on mount.
 * - Optionally, user can update displayName or profile picture in your Data model.
 */

// Move client initialization outside component
const dataClient = generateClient<Schema>();

export default function ProfilePage() {
  const [userAttributes, setUserAttributes] = useState<any>({});
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string>("");

  // Load user data on mount only
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
        setUserAttributes({ email: user.signInDetails?.loginId });
        
        // Fetch user profile from Amplify Data
        const result = await dataClient.models.User.get({ id: user.userId });
        if (result?.data) {
          setDisplayName(result.data.displayName || "");
          setProfilePicture(result.data.profilePicture || "");
        }
      } catch (err) {
        console.error("Error fetching current user", err);
      }
    }
    fetchUser();
  }, []); // Empty dependency array since we only want to run this once

  async function handleSave() {
    setMessage("");
    try {
      if (!userId || !userAttributes?.email) return;
      
      // First check if user exists
      const existingUser = await dataClient.models.User.get({ id: userId });
      
      if (!existingUser?.data) {
        // Create new user if doesn't exist
        const result = await dataClient.models.User.create({
          id: userId,
          email: userAttributes.email,
          displayName,
          profilePicture
        });
        if (result?.data) {
          setMessage("Profile created successfully!");
        }
      } else {
        // Update existing user
        const result = await dataClient.models.User.update({
          id: userId,
          email: userAttributes.email,
          displayName,
          profilePicture
        });
        if (result?.data) {
          setMessage("Profile updated successfully!");
        }
      }
    } catch (err) {
      console.error("Error saving user profile:", err);
      setMessage("Failed to save profile. " + (err as Error).message);
    }
  }

  return (
    <div className="flex-1 p-4">
      <h1 className="mb-4 text-2xl font-bold text-patriotic-blue">My Profile</h1>

      <div className="mb-2">
        <p className="text-sm text-gray-700">Email: {userAttributes?.email}</p>
        <p className="text-sm text-gray-700">
          Username (Cognito): {userAttributes?.preferred_username || "N/A"}
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold">Display Name</label>
        <input
          type="text"
          className="w-full rounded border p-2 text-sm outline-none focus:ring mt-1"
          placeholder="e.g. John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold">Profile Picture URL</label>
        <input
          type="text"
          className="w-full rounded border p-2 text-sm outline-none focus:ring mt-1"
          placeholder="https://example.com/myphoto.jpg"
          value={profilePicture}
          onChange={(e) => setProfilePicture(e.target.value)}
        />
      </div>

      <button
        onClick={handleSave}
        className="rounded bg-patriotic-red px-4 py-2 text-white hover:opacity-90"
      >
        Save Changes
      </button>

      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
    </div>
  );
}