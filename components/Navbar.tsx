"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full py-4 bg-white dark:bg-sidebar-background shadow-sm dark:shadow-none">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <Link href="/">
          <span className="text-xl font-bold dark:text-sidebar-foreground">MyApp</span>
        </Link>
        <div className="space-x-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 dark:text-sidebar-foreground dark:hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="#features"
            className="text-gray-600 hover:text-gray-900 dark:text-sidebar-foreground dark:hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#contact"
            className="text-gray-600 hover:text-gray-900 dark:text-sidebar-foreground dark:hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}