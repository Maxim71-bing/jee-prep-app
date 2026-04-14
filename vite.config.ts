import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icon.svg'],
        devOptions: {
          enabled: true,
          type: 'module'
        },
        manifest: {
          name: 'JEE Prep App Builder',
          short_name: 'JEEPrep',
          description: 'Smart Study Planner for JEE Preparation',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          id: '/?source=pwa',
          start_url: '/',
          icons: [
            {
              src: 'icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'https://placehold.co/192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://placehold.co/512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          screenshots: [
            {
              src: 'https://placehold.co/1280x720.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide'
            },
            {
              src: 'https://placehold.co/750x1334.png',
              sizes: '750x1334',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
