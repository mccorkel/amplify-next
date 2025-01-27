import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";
import { Graduate } from 'next/font/google';

const graduate = Graduate({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: "Cooperstown Wisdom",
  description: "Connect with Baseball's Virtual Veterans"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`bg-white text-gray-900 dark:bg-gray-900 dark:text-white ${graduate.className}`}>
        {/* Simple navbar */}
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
        {/* The main content */}
        {children}
      </body>
    </html>
  );
}