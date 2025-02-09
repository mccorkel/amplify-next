"use client";

import { ReactNode, useState, useEffect } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import config from '../../amplify_outputs.json';
import type { Schema } from "@/amplify/data/resource";
import Link from "next/link";
import { CyclingQuestions } from "@/app/components/CyclingQuestions";

Amplify.configure(config);
console.log("Amplify.getConfig():",Amplify.getConfig());


/**
 * The ProtectedLayout uses <Authenticator> to guard /protected routes.
 * If not signed in, the user sees Amplify's sign-in UI automatically.
 * No manual configuration needed for Gen 2 - the client is auto-generated.
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AuthenticatedLayout signOut={signOut} user={user}>
          {children}
        </AuthenticatedLayout>
      )}
    </Authenticator>
  );
}

function AuthenticatedLayout({ 
  children, 
  signOut, 
  user 
}: { 
  children: ReactNode;
  signOut: ((data?: any) => void) | undefined;
  user: any;
}) {
  const [displayName, setDisplayName] = useState("");
  const client = generateClient<Schema>();

  useEffect(() => {
    async function fetchUser(retryCount = 0) {
      if (!user?.userId) return;
      
      try {
        const result = await client.models.User.get({ id: user.userId });
        if (result?.data?.displayName) {
          setDisplayName(result.data.displayName);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        // Retry up to 3 times with increasing delay
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => fetchUser(retryCount + 1), delay);
        }
      }
    }
    
    // Initial delay to allow auth token setup
    setTimeout(() => fetchUser(), 500);
  }, [user, client]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Small accent bar with diagonal stripes */}
      <div className="h-2 w-full bg-subtle-stripes"></div>
      
      {/* Authenticated Navbar */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/">
            <span className="text-xl font-bold tracking-wide">
              COOPERSTOWN WISDOM
            </span>
          </Link>

          {/* Add CyclingQuestions in the middle */}
          <div className="flex-1 flex justify-center">
            <CyclingQuestions />
          </div>

          <nav className="flex items-center space-x-4">
            <Link href="/protected/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Hi, {displayName || "Guest"}!
            </Link>
            <button
              onClick={signOut}
              className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              SIGN OUT
            </button>
          </nav>
        </div>
      </header>

      {/* WRAPPED CONTENT */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}