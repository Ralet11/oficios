const { DefaultTheme } = require('@react-navigation/native');
const { StyleSheet } = require('react-native');
const { palette } = require('./palette');

const spacing = {
  xs: 4,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

const type = {
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.9,
  },
  subtitle: {
    fontSize: 23,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 21,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
};

const shadows = StyleSheet.create({
  card: {
    shadowColor: palette.black,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
});

const gradients = {
  screen: [palette.white, palette.canvas],
  accent: [palette.accentDark, palette.accent],
};

const statusStyles = {
  APPROVED: { backgroundColor: palette.successSoft, color: palette.success },
  PENDING_APPROVAL: { backgroundColor: palette.warningSoft, color: palette.warning },
  REJECTED: { backgroundColor: palette.dangerSoft, color: palette.danger },
  PAUSED: { backgroundColor: palette.infoSoft, color: palette.muted },
  DRAFT: { backgroundColor: palette.infoSoft, color: palette.muted },
  PENDING: { backgroundColor: palette.warningSoft, color: palette.warning },
  ACCEPTED: { backgroundColor: palette.successSoft, color: palette.success },
  CANCELLED: { backgroundColor: palette.dangerSoft, color: palette.danger },
  REJECTED_REQUEST: { backgroundColor: palette.dangerSoft, color: palette.danger },
  COMPLETED: { backgroundColor: palette.sky, color: palette.info },
  EXPIRED: { backgroundColor: palette.infoSoft, color: palette.muted },
  VISIBLE: { backgroundColor: palette.successSoft, color: palette.success },
  HIDDEN: { backgroundColor: palette.dangerSoft, color: palette.danger },
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.white,
    card: palette.surface,
    text: palette.ink,
    primary: palette.accent,
    border: palette.border,
    notification: palette.accent,
  },
};

const navigation = {
  headerTintColor: palette.ink,
  headerBackground: palette.white,
  contentBackground: palette.white,
  tabBarActiveTint: palette.accent,
  tabBarInactiveTint: palette.mutedSoft,
  tabBarBackground: palette.surface,
  tabBarBorder: palette.borderMuted,
};

module.exports = {
  gradients,
  navigation,
  navigationTheme,
  palette,
  shadows,
  spacing,
  statusStyles,
  type,
};
