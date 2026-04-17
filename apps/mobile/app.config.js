const { palette } = require('./app/theme/palette');

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
    },
    android: {},
    web: {
      bundler: 'metro',
    },
  },
};
