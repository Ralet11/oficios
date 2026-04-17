const React = require('react');
const { ActivityIndicator, StyleSheet, Text, View } = require('react-native');
const { LinearGradient } = require('expo-linear-gradient');
const { gradients, palette } = require('../theme');

function LoadingView({ label = 'Cargando...' }) {
  return (
    <LinearGradient colors={gradients.screen} style={styles.container}>
      <View style={styles.card}>
        <LinearGradient colors={[palette.accentDark, palette.accent]} style={styles.markWrap}>
          <View style={styles.markInner}>
            <Text style={styles.markText}>O</Text>
          </View>
        </LinearGradient>
        <Text style={styles.title}>Oficios</Text>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.loaderRow}>
          <ActivityIndicator color={palette.accentDark} size="small" />
          <Text style={styles.loaderText}>Preparando experiencia</Text>
        </View>
        <Text style={styles.version}>Version mobile preview</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 280,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  markWrap: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  markInner: {
    transform: [{ rotate: '-45deg' }],
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.whiteGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  label: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    color: palette.muted,
    fontSize: 13,
  },
  version: {
    marginTop: 6,
    color: palette.mutedSoft,
    fontSize: 12,
  },
});

module.exports = {
  LoadingView,
};
