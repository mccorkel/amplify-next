"use client";

import { ReactNode } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import config from '../../amplify_outputs.json';

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
        <div className="min-h-screen flex flex-col bg-subtle-stripes">
          {/* NAVBAR */}
          <nav className="flex items-center justify-between bg-patriotic-blue px-6 py-4 shadow">
            <div className="font-semibold text-patriotic-white">
              Cooperstown Wisdom
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-patriotic-white/80">
                Hi, {user?.username || "Guest"}!
              </span>
              <button
                onClick={signOut}
                className="rounded bg-patriotic-red px-3 py-1 text-white hover:opacity-90"
              >
                Sign Out
              </button>
            </div>
          </nav>

          {/* WRAPPED CONTENT */}
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      )}
    </Authenticator>
  );
}