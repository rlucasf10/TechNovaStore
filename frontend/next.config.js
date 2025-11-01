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
    
    // Fix for browser extension listener errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
  // Optimize for faster development
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Reduce bundle size
  experimental: {
    optimizeCss: false, // Disable CSS optimization in dev
    optimizePackageImports: ['@/components', '@/lib', '@/services', '@/hooks'],
  },
  // Optimización de imágenes
  images: {
    domains: ['localhost', 'api.technovastore.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true, // Cloudflare Pages requiere imágenes sin optimizar
  },
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_CHATBOT_URL: process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:3009',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3009',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3011',
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
  // Configuración de producción
  poweredByHeader: false,
  reactStrictMode: true,
  // Ignorar errores de ESLint y TypeScript durante el build
  // Los errores se deben corregir gradualmente en desarrollo
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Mantener verificación de TypeScript
  },
  // Configuración para Cloudflare Pages - Export estático
  output: 'export',
  // Configurar generación de páginas
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig