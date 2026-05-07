import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.team16.wandr',
  appName: 'Wandr',
  webDir: 'frontend/dist',
  plugins: {
    Geolocation: {
      permissions: ['location'],
    },
  },
};

export default config;
