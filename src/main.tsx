import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Disable/clean up any PWA Service Workers on native WebView so OTA reloads never serve stale cache.
// Note: CapacitorUpdater.notifyAppReady() is called inside App.tsx's mount useEffect (never before React renders)
// so Capgo's automatic rollback stays armed if React ever fails to mount.
if (Capacitor.isNativePlatform()) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      })
      .catch(() => {});
  }

  if ('caches' in window) {
    caches
      .keys()
      .then((cacheNames) => {
        cacheNames
          .filter((name) => !name.startsWith('habitseen-reels-'))
          .forEach((name) => {
            caches.delete(name).catch(() => {});
          });
      })
      .catch(() => {});
  }
} else {
  // Register PWA service worker only on web browsers
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateSW(true);
        },
        onRegistered(registration) {
          if (registration) {
            registration.update();
            setInterval(() => {
              registration.update();
            }, 60 * 1000);
          }
        },
      });
    })
    .catch(() => {});

  // Globally capture beforeinstallprompt event so it is never missed before components mount
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__pwaInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="HabitSeen failed to load">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
