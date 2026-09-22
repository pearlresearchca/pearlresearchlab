// CMS images are served from InsForge storage; let next/image resize and
// convert them instead of shipping the multi-megabyte originals.
const insforgeUrl = new URL(process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://376vyh7j.us-east.insforge.app')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: insforgeUrl.protocol.replace(':', ''),
        hostname: insforgeUrl.hostname,
        port: insforgeUrl.port,
        pathname: '/api/storage/buckets/**',
      },
    ],
    // Allows a local InsForge instance during development only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
  },
}

export default nextConfig
