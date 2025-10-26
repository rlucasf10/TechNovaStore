/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable hot-reload in Docker with optimized webpack configuration
  webpack: (config, { isServer, dev }) => {
    if (!isServer && dev) {
      config.watchOptions = {
        poll: 2000, // Check every 2 seconds (less CPU usage)
        aggregateTimeout: 500, // Wait 500ms before rebuilding
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      }
    }
    // Optimize build performance
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    }
    return config
  },
  // Optimize for faster development
  compiler: {
    removeConsole: false,
  },
  // Reduce bundle size
  experimental: {
    optimizeCss: false, // Disable CSS optimization in dev
    optimizePackageImports: ['@/components', '@/lib'],
  },
  images: {
    domains: ['localhost', 'api.technovastore.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
}

module.exports = nextConfig