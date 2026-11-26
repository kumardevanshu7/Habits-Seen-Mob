import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arigatolabs.habitsseen',
  appName: 'HabitSeen',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '408400447866-eo3fhd2eefmbbmonkv1vl89c5c1nhg9a.apps.googleusercontent.com',
      clientId: '408400447866-eo3fhd2eefmbbmonkv1vl89c5c1nhg9a.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    CapacitorUpdater: {
      autoUpdate: false,
      resetWhenUpdate: true,
      responseTimeout: 120,
      appReadyTimeout: 30000,
    },
  },
};

export default config;

