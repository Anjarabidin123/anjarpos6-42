import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2e18c95d191f4517aba9ef9096017fc0',
  appName: 'anjarpos5-22',
  webDir: 'dist',
  server: {
    url: 'https://2e18c95d-191f-4517-aba9-ef9096017fc0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;