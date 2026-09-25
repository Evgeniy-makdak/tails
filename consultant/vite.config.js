import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Tailio Консультант',
        short_name: 'Tailio Desk',
        description: 'Кабинет консультанта Tailio',
        theme_color: '#8B7FFF',
        background_color: '#F6F5F2',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // Fallback proxy if VITE_API_URL / VITE_WS_URL are unset.
    // Prefer consultant/.env.development → Render (same backend as Pages/phone).
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://tailio-chat.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: (process.env.VITE_WS_URL || 'wss://tailio-chat.onrender.com/ws').replace(/\/ws$/, ''),
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
});
