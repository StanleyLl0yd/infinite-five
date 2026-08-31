import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/infinite-five/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
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
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
