import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/infinite-five/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png'
      ],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true
      },
      manifest: {
        name: 'Infinite Five',
        short_name: 'Infinite Five',
        description: 'Five in a row on an infinite board.',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'any',
        start_url: '/infinite-five/',
        scope: '/infinite-five/',
        categories: ['games'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
