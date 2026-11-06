import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/Timesheet/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Timesheet',
        short_name: 'Timesheet',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#f6f7f9',
        background_color: '#f6f7f9',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      includeAssets: [
        'apple-touch-icon-180x180.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
      ],
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
