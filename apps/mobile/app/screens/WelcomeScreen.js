const React = require('react');
const { Animated, Easing, Pressable, StyleSheet, Text, View } = require('react-native');
const { LinearGradient } = require('expo-linear-gradient');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { palette, shadows, spacing } = require('../theme');

const HERO_CARDS = [
  {
    icon: 'pipe-wrench',
    label: 'Plomería',
    sub: 'Urgente',
    colors: ['#0F7CFF', '#35C2FF'],
    rotate: '-4deg',
    style: { top: 20, left: 16, width: 140 },
  },
  {
    icon: 'lightning-bolt',
    label: 'Electricidad',
    sub: 'Segura',
    colors: ['#FF9A3C', '#FFD166'],
    rotate: '3deg',
    style: { top: 24, right: 16, width: 140 },
  },
  {
    icon: 'paint-roller',
    label: 'Pintura',
    sub: 'Interior',
    colors: ['#E05C6E', '#FF8E72'],
    rotate: '5deg',
    style: { bottom: 52, left: 16, width: 136 },
  },
  {
    icons: ['hammer-wrench', 'lightning-bolt', 'paint-roller', 'broom'],
    label: 'Mucho más',
    sub: 'Más oficios',
    colors: ['#1E9E69', '#57D18C'],
    rotate: '-3deg',
    style: { bottom: 48, right: 16, width: 136 },
  },
];

function HeroCard({ card, animOffset }) {
  const translateY = animOffset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, card.style.top !== undefined ? -7 : 7],
  });
  const hasManyIcons = Array.isArray(card.icons) && card.icons.length > 0;

  return (
    <Animated.View
      style={[
        styles.heroCardOuter,
        card.style,
        { transform: [{ rotate: card.rotate }, { translateY }] },
      ]}
    >
      <LinearGradient
        colors={card.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCardGradient}
      >
        <View style={styles.heroCardOrb} />
        <View style={[styles.heroCardIconWrap, hasManyIcons && styles.heroCardIconWrapMulti]}>
          {hasManyIcons ? (
            <View style={styles.heroCardIconGrid}>
              {card.icons.map((iconName) => (
                <View key={iconName} style={styles.heroCardIconMini}>
                  <MaterialCommunityIcons name={iconName} size={12} color={palette.white} />
                </View>
              ))}
            </View>
          ) : (
            <MaterialCommunityIcons name={card.icon} size={26} color={palette.white} />
          )}
        </View>
        <Text style={styles.heroCardLabel}>{card.label}</Text>
        <Text style={styles.heroCardSub}>{card.sub}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function WelcomeScreen({ navigation }) {
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <LinearGradient
        colors={['rgba(57, 169, 255, 0.09)', 'rgba(255, 255, 255, 0)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.65 }}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <LinearGradient
          colors={[palette.accentDark, palette.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Text style={styles.logoText}>O</Text>
        </LinearGradient>
        <Text style={styles.brandText}>Oficios</Text>
      </View>

      <View style={styles.heroContainer}>
        {HERO_CARDS.map((card, index) => (
          <HeroCard key={index} card={card} animOffset={floatAnim} />
        ))}
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.title}>Tu profesional ideal,{'\n'}a un tap</Text>
        <Text style={styles.copy}>
          Plomeros, electricistas, pintores y más, confiables y disponibles ahora.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton onPress={() => navigation.navigate('Register')}>
          Empezar ahora
        </AppButton>
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.signInLink}>
          <Text style={styles.signInText}>
            ¿Ya tenés cuenta? <Text style={styles.signInAccent}>Iniciar sesión</Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 44,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '800',
  },
  brandText: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  heroContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    maxWidth: 332,
    minHeight: 236,
    alignSelf: 'center',
  },
  heroCardOuter: {
    position: 'absolute',
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroCardGradient: {
    padding: 16,
    borderRadius: 22,
    gap: 8,
    overflow: 'hidden',
  },
  heroCardOrb: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -30,
    right: -22,
  },
  heroCardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardIconWrapMulti: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  heroCardIconGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardIconMini: {
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardLabel: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
  heroCardSub: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBlock: {
    gap: 10,
  },
  title: {
    color: palette.ink,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  copy: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  actions: {
    gap: 12,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  signInAccent: {
    color: palette.accentDark,
    fontWeight: '800',
  },
});

module.exports = { WelcomeScreen };
