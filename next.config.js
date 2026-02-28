/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
      },
    ],
    unoptimized: process.env.NODE_ENV !== 'production'
  },
  typescript: {
    tsconfigPath: './tsconfig.json'
  },
  eslint: {
    // ESLint flat config (eslint.config.mjs) is incompatible with Next.js's
    // built-in ESLint runner. Run `npx eslint .` separately instead.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
};

module.exports = nextConfig;
