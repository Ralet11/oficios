const { StyleSheet } = require('react-native');

const palette = {
  canvas: '#F4EFE7',
  surface: '#FFFDFC',
  surfaceMuted: '#ECE3D4',
  accent: '#C56E33',
  accentDark: '#8D4521',
  ink: '#1F2933',
  muted: '#52606D',
  border: '#D6C7B2',
  success: '#2F855A',
  warning: '#B7791F',
  danger: '#C53030',
  sky: '#D7E7F5',
};

const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

const type = {
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.ink,
  },
  body: {
    fontSize: 15,
    color: palette.muted,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
};

const shadows = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
});

module.exports = {
  palette,
  shadows,
  spacing,
  type,
};
