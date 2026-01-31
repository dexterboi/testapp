import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pitchperfect.app',
  appName: 'Larena',
  webDir: 'dist',
  // Server URL commented out for native build - uncomment for live reload during development
  // server: {
  //   url: 'https://pitchperfect-wassef.netlify.app',
  //   cleartext: true
  // }
};

export default config;
