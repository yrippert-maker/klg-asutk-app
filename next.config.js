/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  output: "standalone",

  // Проксирование API (план консолидации KLG_TZ)
  async rewrites() {
    return [
      { source: "/api/inbox/:path*", destination: "http://localhost:3001/api/inbox/:path*" },
      { source: "/api/tmc/:path*", destination: "http://localhost:3001/api/tmc/:path*" },
      { source: "/api/v1/:path*", destination: "http://localhost:8000/api/v1/:path*" },
    ];
  },

  // Компрессия ответов (gzip/brotli)
  compress: true,
  
  // Минификация и оптимизация
  swcMinify: true,
  
  // Оптимизация production сборки
  productionBrowserSourceMaps: false,
  
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // CDN для изображений (если используется внешний CDN)
    domains: process.env.NEXT_PUBLIC_IMAGE_DOMAINS?.split(',') || [],
    // Минимализация качества для оптимизации
    minimumCacheTTL: 60,
    // Отключение статической оптимизации для динамических изображений
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers для безопасности и производительности
  async headers() {
    return [
      {
        // Применяем заголовки только к HTML страницам, не к статическим файлам
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
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
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
        // Исключаем статические файлы Next.js
        missing: [
          { type: 'header', key: 'x-nextjs-data' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  
  // Экспериментальные функции для оптимизации
  experimental: {
    // Оптимизация сборки (отключено из-за проблем с critters)
    // optimizeCss: true,
  },
  
  // Временно отключаем ESLint во время сборки для исправления критических ошибок
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Исключаем папку frontend из сборки Next.js
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/frontend/**', '**/node_modules/**'],
    };
    
    // Исключаем winston и kafkajs из клиентской сборки
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
      
      // Игнорируем серверные модули на клиенте
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kafkajs|duckdb|mysql2)$/,
        })
      );
    }
    
    return config;
  },
}

// Обертка для Sentry (только если настроен DSN)
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  module.exports = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  });
} else {
  module.exports = nextConfig;
}
