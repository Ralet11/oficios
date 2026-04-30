const { palette } = require('./app/theme/palette');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const iosConfig = {
  supportsTablet: true,
  bundleIdentifier: 'com.oficios.marketplace',
  buildNumber: '1',
  ...(googleMapsApiKey
    ? {
        config: {
          googleMapsApiKey,
        },
      }
    : {}),
};

const androidConfig = {
  package: 'com.oficios.marketplace',
  versionCode: 1,
  ...(googleMapsApiKey
    ? {
        config: {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        },
      }
    : {}),
};

module.exports = {
  expo: {
    name: 'Oficios',
    owner: 'ramiroalet',
    slug: 'oficios',
    scheme: 'oficios',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/branding/icon.png',
    splash: {
      backgroundColor: palette.canvas,
      image: './assets/branding/splash-icon.png',
      resizeMode: 'contain',
    },
    assetBundlePatterns: ['**/*'],
    ios: iosConfig,
    android: androidConfig,
    web: {
      bundler: 'metro',
    },
    extra: {
      eas: {
        projectId: '7cfb9b38-9102-4d8c-afcd-bf38302f6b4d',
      },
    },
  },
};
