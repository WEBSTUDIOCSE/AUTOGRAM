import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16 - empty config to acknowledge
  turbopack: {},
  typescript: {
    // Optionally ignore TypeScript errors during builds (not recommended for production)
    // ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default withPWA({
  dest: "public",
})(nextConfig);
