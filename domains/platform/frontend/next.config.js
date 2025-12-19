// Configuración del bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  
  // Optimizaciones de rendimiento
  reactStrictMode: true,
  
  // Habilitar Web Vitals en producción
  // Next.js automáticamente recopila métricas de Web Vitals
  // que pueden ser enviadas a servicios de analytics
  productionBrowserSourceMaps: false, // Desactivar source maps en producción para mejor rendimiento
  
  // Configuración de compilación optimizada
  compiler: {
    // Eliminar console.log en producción
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Configuración de imágenes optimizadas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.dummyjson.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Configurar calidades de imagen para evitar advertencias
    qualities: [75, 90, 100],
    // Formatos modernos para mejor compresión
    formats: ['image/avif', 'image/webp'],
    // Tamaños de dispositivo para responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimizar tamaño de imágenes
    minimumCacheTTL: 60,
  },
  
  // Configuración experimental para optimizaciones
  experimental: {
    // Optimizar paquetes externos (tree-shaking mejorado)
    // Incluye todas las librerías grandes para mejor tree-shaking
    optimizePackageImports: [
      'lucide-react',
      'framer-motion', 
      '@tanstack/react-query',
      'recharts',
      'date-fns',
      'zod',
      'react-hook-form',
      'axios',
      'clsx',
      'tailwind-merge',
      'socket.io-client',
      'zustand',
      'jspdf',
      'html2canvas',
    ],
    // Optimizar CSS (requiere critters instalado)
    // Desactivado temporalmente para evitar errores de build
    // optimizeCss: true,
  },
  
  // Configuración de módulos externos para mejor tree-shaking
  // Nota: lucide-react ya tiene tree-shaking nativo, no necesita modularizeImports
  modularizeImports: {
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
  
  // Transpilar módulos específicos para mejor compatibilidad
  transpilePackages: ['recharts', 'lucide-react'],
  
  // Headers de seguridad y caché
  async headers() {
    // Configuración de Content Security Policy
    // CSP diferente según entorno
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const cspHeader = isDevelopment 
      ? `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https: http:;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' http://localhost:* http://192.168.1.137:* ws://localhost:* ws://192.168.1.137:* wss://localhost:* https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://github.com;
        frame-src 'self' https://accounts.google.com https://github.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
      `.replace(/\s{2,}/g, ' ').trim()
      : `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https:;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' https: wss: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://github.com;
        frame-src 'self' https://accounts.google.com https://github.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
        upgrade-insecure-requests;
      `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
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
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          },
        ],
      },
      {
        // Caché agresivo para assets estáticos
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Caché para chunks de JavaScript
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

// Exportar con bundle analyzer wrapper
module.exports = withBundleAnalyzer(nextConfig);
