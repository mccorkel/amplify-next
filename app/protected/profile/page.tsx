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
export default function ProfilePage() {
  const dataClient = generateClient<Schema>();
  const [userAttributes, setUserAttributes] = useState<any>({});
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        // Get user info from signInDetails
        setUserAttributes({ email: user.signInDetails?.loginId });
        // Optionally, you could fetch a "User" record from Amplify Data if you store user info there
        // e.g. const result = await dataClient.models.User.get(user.userId);
      } catch (err) {
        console.error("Error fetching current user", err);
      }
    }
    fetchUser();
  }, [dataClient]);

  async function handleSave() {
    setMessage("");
    try {
      // Here, we might do dataClient.models.User.update(...) if we track user fields
      // For demonstration:
      // const user = await dataClient.models.User.get(userAttributes.sub);
      // if (user) {
      //   const updated = await dataClient.models.User.update({
      //     ...user,
      //     displayName,
      //     profilePicture
      //   });
      //   setMessage("Profile updated successfully!");
      // }

      // Placeholder success
      setMessage("Profile updated successfully! (Placeholder)");
    } catch (err) {
      console.error("Error updating user", err);
      setMessage("Failed to update profile.");
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