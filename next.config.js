/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tigerpanda.tv',
        pathname: '/assets/**',
      },
    ],
  },
}

module.exports = nextConfig
