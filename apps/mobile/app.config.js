const { palette } = require('./app/theme/palette');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    name: 'Oficios Marketplace',
    slug: 'oficios-marketplace',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: palette.canvas,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      ...(googleMapsApiKey
        ? {
            config: {
              googleMapsApiKey,
            },
          }
        : {}),
    },
    android: googleMapsApiKey
      ? {
          config: {
            googleMaps: {
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {},
    web: {
      bundler: 'metro',
    },
  },
};
