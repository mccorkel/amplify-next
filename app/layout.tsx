import "./globals.css";
import { ReactNode } from "react";
import { Graduate } from 'next/font/google';
import { StaticNavBar } from './navbar';

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
        <StaticNavBar />
        {/* The main content */}
        {children}
      </body>
    </html>
  );
}