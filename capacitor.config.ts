import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifeos.app',
  appName: 'LifeOS',
  webDir: 'out',
  server: {
    // Load from your deployed Vercel URL
    url: 'https://lifeosm.vercel.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#f59e0b'
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a0a0a'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
