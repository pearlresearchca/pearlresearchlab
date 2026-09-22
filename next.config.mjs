/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Page-builder saves send the whole page document; form blocks may attach
    // a small file. Kept under Vercel's 4.5 MB function payload limit.
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig
