import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.henryeveritt.ktcompanion',
  appName: 'KT Companion',
  webDir: '.',
  bundledWebRuntime: false,

  android: {
    allowMixedContent: true
  }
};

export default config;
