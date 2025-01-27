import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section
        className="relative flex items-center justify-center px-4 py-24 text-white"
        style={{
          minHeight: "400px",
          backgroundImage: "url('https://tigerpanda.tv/assets/baseball-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative max-w-3xl text-center z-10">
          <h1 className="mb-4 text-4xl font-extrabold md:text-5xl">
            CONNECT WITH BASEBALL&apos;S VIRTUAL VETERANS
          </h1>
          <p className="mb-8 text-lg md:text-xl">
            Chat with AI old-timers who know every stat, every game, and every
            moment in your team&apos;s history.
          </p>
          <Link href="/protected/chat">
            <button className="rounded bg-white px-8 py-3 text-base font-medium text-gray-800 transition hover:bg-gray-50">
              STEP UP TO THE PLATE
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-wider md:text-4xl">
            BASEBALL KNOWLEDGE THROUGH THE AGES
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
              <div className="mb-4 text-red-600 dark:text-red-400">
                {/* Icon could go here */}
                <svg
                  className="mx-auto h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-1.172 1.951-1.172 2.252 0l1.718 6.718H19a1 1 0 01.697 1.717l-4.858 4.586 1.707 6.726a1 1 0 01-1.48 1.114L10 17.768l-5.066 3.02a1 1 0 01-1.48-1.114l1.706-6.726-4.858-4.586A1 1 0 011 9.645h6.232l1.817-6.718z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Baseball Veterans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
              Chat with AI old-timers who've memorized every stat and story
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
              <div className="mb-4 text-red-600 dark:text-red-400">
                {/* Icon */}
                <svg
                  className="mx-auto h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a1 1 0 000 2h12a1 1 0 100-2H4zm2 4a1 1 0 000 2h8a1 1 0 100-2H6zm-3 4a1 1 0 000 2h14a1 1 0 100-2H3zm3 4a1 1 0 000 2h8a1 1 0 100-2H6z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Complete History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
              Access detailed stats and stories from every era of baseball
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
              <div className="mb-4 text-red-600 dark:text-red-400">
                {/* Icon */}
                <svg
                  className="mx-auto h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 5a2 2 0 012-2h3.5a1.5 1.5 0 011.341.83L9.88 5H18a2 2 0 012 2v3a2 2 0 01-2 2h-3l2 5H5l-2-5H2a2 2 0 01-2-2V5zm2 2h1.28a1.5 1.5 0 011.34.83L7.88 9H18v3h-4l2 5H7l-2-5H2V7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Team Expertise</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
              Deep knowledge of your team's entire history, from inception to now
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
              <div className="mb-4 text-red-600 dark:text-red-400">
                {/* Icon */}
                <svg
                  className="mx-auto h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 7H7v6h6V7z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-11H7v6h6V7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Game Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
              Get expert insights on historical games and modern matchups
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Time Machine Section */}
      <section className="bg-white py-24 dark:bg-gray-800">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-wider">
            Your Personal Baseball Time Machine
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            Whether it&apos;s the 1927 Yankees or last night&apos;s game, our AI veterans have
            every detail ready to share.
          </p>
          <Link href="/protected/chat">
            <button className="rounded bg-red-500 px-8 py-3 text-base font-medium text-white transition hover:bg-red-600">
              Join the Conversation
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16 text-gray-300">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand Column */}
            <div>
              <h3 className="mb-4 text-xl font-semibold text-white">Cooperstown Wisdom</h3>
              <p className="text-sm">
                Where baseball fans connect with AI old-timers who share their encyclopedic
                knowledge of America&apos;s pastime.
              </p>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">About Us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">Contact</a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">Cookie Policy</a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Follow Us</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">Twitter</a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-16 text-center text-sm text-gray-500">
            © 2024 Cooperstown Wisdom. All rights reserved. Major League Baseball trademarks and copyrights are used with permission of Major League Baseball. Visit MLB.com.
          </div>
        </div>
      </footer>
    </>
  );
}