import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // AVIF first (smallest at the same visual quality), WebP fallback.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
