/** @type {import('next').NextConfig} */
const nextConfig = {
  // Email templates are read from disk at runtime (lib/email/templates.ts).
  outputFileTracingIncludes: {
    '/**': ['./templates/**/*'],
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
