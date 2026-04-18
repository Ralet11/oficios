const React = require('react');
const { Pressable, StyleSheet, Text, View } = require('react-native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { palette, spacing } = require('../theme');

function WelcomeScreen({ navigation }) {
  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>O</Text>
          </View>
          <Text style={styles.brandText}>Oficios</Text>
        </View>
      </View>

      <ServiceArtwork size="hero" icon="sparkles-outline" style={styles.heroArt} />

      <View style={styles.copyBlock}>
        <Text style={styles.title}>Let's make awesome changes to your home</Text>
        <Text style={styles.copy}>
          Encuentra profesionales, reserva servicios y sigue cada solicitud desde una experiencia clara y mobile-first.
        </Text>
      </View>

      <View style={styles.dotsRow}>
        <View style={styles.dotMuted} />
        <View style={styles.dotActive} />
        <View style={styles.dotMuted} />
      </View>

      <View style={styles.actions}>
        <AppButton onPress={() => navigation.navigate('Register')}>Get Started</AppButton>
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.signInLink}>
          <Text style={styles.signInText}>Already have an account? Sign In</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  logoText: {
    color: palette.accentDark,
    fontSize: 19,
    fontWeight: '800',
  },
  brandText: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  heroArt: {
    minHeight: 340,
  },
  copyBlock: {
    gap: 10,
  },
  title: {
    color: palette.ink,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    textAlign: 'center',
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dotActive: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  dotMuted: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: palette.border,
  },
  actions: {
    gap: 12,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

module.exports = {
  WelcomeScreen,
};
