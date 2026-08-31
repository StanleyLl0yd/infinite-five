import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const tauriPlatform = process.env.TAURI_ENV_PLATFORM;
const tauriDevHost = process.env.TAURI_DEV_HOST;
const isTauriBuild = Boolean(tauriPlatform);

export default defineConfig({
  base: isTauriBuild ? './' : '/infinite-five/',
  clearScreen: false,
  plugins: [
    VitePWA({
      disable: isTauriBuild,
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
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: tauriDevHost || false,
    hmr: tauriDevHost
      ? {
          protocol: 'ws',
          host: tauriDevHost,
          port: 1421
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: isTauriBuild
    ? {
        target: 'es2020',
        minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
        sourcemap: Boolean(process.env.TAURI_ENV_DEBUG)
      }
    : undefined
});
