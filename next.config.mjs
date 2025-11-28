/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Supabase and external image sources
  images: {
    remotePatterns: [],
  },
  // Ensure proper handling of server-side operations
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
