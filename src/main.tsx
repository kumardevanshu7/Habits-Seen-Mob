import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Inform CapacitorUpdater that the app loaded successfully so live OTA bundles are committed,
// and disable/clean up PWA Service Workers on native WebView so OTA reloads never serve stale cache.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch((e) => {
    console.warn('CapacitorUpdater notifyAppReady error:', e);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {});
      });
    }).catch(() => {});
  }

  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((name) => {
        if (name.includes('workbox') || name.includes('precache') || name.includes('sw')) {
          caches.delete(name).catch(() => {});
        }
      });
    }).catch(() => {});
  }
} else {
  // Register PWA service worker only on web browsers
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

  // Globally capture beforeinstallprompt event so it is never missed before components mount
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__pwaInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
