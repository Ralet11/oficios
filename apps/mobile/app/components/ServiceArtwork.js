const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { LinearGradient } = require('expo-linear-gradient');
const { palette } = require('../theme');

const SIZE_MAP = {
  hero: {
    minHeight: 260,
    figure: 106,
    icon: 44,
    contentPadding: 22,
    contentWidth: '60%',
  },
  banner: {
    minHeight: 148,
    figure: 84,
    icon: 34,
    contentPadding: 18,
    contentWidth: '58%',
  },
  thumb: {
    minHeight: 112,
    figure: 60,
    icon: 24,
    contentPadding: 14,
    contentWidth: '100%',
  },
};

function ServiceArtwork({
  size = 'hero',
  icon = 'construct-outline',
  colors,
  badge,
  title,
  subtitle,
  children,
  style,
}) {
  const metrics = SIZE_MAP[size] || SIZE_MAP.hero;
  const gradientColors = colors || [palette.accentDark, palette.accent];

  return (
    <LinearGradient colors={gradientColors} style={[styles.base, { minHeight: metrics.minHeight }, style]}>
      <View style={styles.orbLarge} />
      <View style={styles.orbSmall} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <View style={[styles.content, { padding: metrics.contentPadding, maxWidth: metrics.contentWidth }]}>
        {title ? <Text style={[styles.title, size === 'thumb' && styles.titleSmall]}>{title}</Text> : null}
        {subtitle ? <Text style={[styles.subtitle, size === 'thumb' && styles.subtitleSmall]}>{subtitle}</Text> : null}
        {children}
      </View>

      <View style={[styles.figureShell, { width: metrics.figure, height: metrics.figure }]}>
        <View style={styles.figureBubble} />
        <View style={styles.figureAccent} />
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={metrics.icon} color={palette.warning} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  orbLarge: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: palette.whiteGlass,
    top: -70,
    left: -30,
  },
  orbSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: palette.whiteGlassStrong,
    bottom: -26,
    right: -18,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.whiteGlass,
  },
  badgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    zIndex: 1,
    gap: 8,
  },
  title: {
    color: palette.white,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    color: palette.whiteSoft,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  subtitleSmall: {
    fontSize: 12,
    lineHeight: 17,
  },
  figureShell: {
    position: 'absolute',
    right: 18,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figureBubble: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  figureAccent: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 208, 91, 0.24)',
  },
  iconWrap: {
    width: '62%',
    height: '62%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.ink,
  },
});

module.exports = {
  ServiceArtwork,
};
