"use client";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="w-full bg-white py-4 text-center dark:bg-sidebar-background"
    >
      <p className="text-sm text-gray-600 dark:text-muted-foreground">
        © {new Date().getFullYear()} MyApp. All rights reserved.
      </p>
    </footer>
  );
}