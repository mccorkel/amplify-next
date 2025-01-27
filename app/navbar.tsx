"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';

export function StaticNavBar() {
  const pathname = usePathname();
  const isProtectedRoute = pathname?.startsWith('/protected');

  if (isProtectedRoute) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/">
          <span className="text-xl font-bold tracking-wide">
            COOPERSTOWN WISDOM
          </span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/protected/chat">
            <button className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              GET STARTED
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
} 