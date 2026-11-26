import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { execSync } from 'child_process'

let gitCommitSha = '1.0.0'
try {
  gitCommitSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  gitCommitSha = '1.0.0'
}

function buildReelsManifest() {
  const reelsDir = path.resolve(__dirname, 'src/motiv-reels');
  if (!fs.existsSync(reelsDir)) return { hash: 'empty', items: [] as { number: number; filename: string; size: number; hash: string }[] };

  const files = fs
    .readdirSync(reelsDir)
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/(\d+)/)?.[1] || '0', 10);
      return na - nb || a.localeCompare(b);
    });

  const items = files.map((filename, idx) => {
    const fullPath = path.join(reelsDir, filename);
    const buf = fs.readFileSync(fullPath);
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
    const match = filename.match(/(\d+)/);
    const number = match ? parseInt(match[1], 10) : idx + 1;
    return {
      number,
      filename,
      size: buf.length,
      hash,
    };
  });

  const packHash = crypto
    .createHash('sha256')
    .update(items.map((i) => `${i.filename}:${i.hash}`).join('|'))
    .digest('hex')
    .slice(0, 12);

  return { hash: packHash, items };
}

const reelsManifest = buildReelsManifest();
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(gitCommitSha),
    'import.meta.env.VITE_REELS_MANIFEST': JSON.stringify(reelsManifest),
  },
  plugins: [
    react(),
    VitePWA({
      disable: isCapacitorBuild,
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
      ],
      manifest: {
        name: 'HabitSeen — Will Habit & Sobriety Tracker',
        short_name: 'HabitSeen',
        description:
          'Track your daily habits, streaks, and sobriety chronometers with gamified discipline scoring.',
        theme_color: '#ea2804',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/*.md', '**/dist/**', '**/.git/**'],
    },
  },
})
