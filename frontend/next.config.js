/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type errors during production builds
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
