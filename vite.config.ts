import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: '/pulijoodam/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        name: 'Pulijoodam - Tiger vs Goat',
        short_name: 'Pulijoodam',
        description: 'Classic South Indian board game of strategy',
        theme_color: '#f3ead8',
        background_color: '#f3ead8',
        display: 'standalone',
        start_url: '/pulijoodam/',
        scope: '/pulijoodam/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ open: true, gzipSize: true })]
      : []),
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      reporter: ['text', 'lcov'],
    },
  },
});
