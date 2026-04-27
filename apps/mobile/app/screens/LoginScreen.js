const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { LinearGradient } = require('expo-linear-gradient');
const { Ionicons, MaterialCommunityIcons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { AUTH_PROVIDERS } = require('../config/authProviders');
const { useAuth } = require('../contexts/AuthContext');
const { palette, shadows, spacing } = require('../theme');

const FLOATING_ICONS = [
  { icon: 'pipe-wrench', top: 18, left: 22, size: 20, opacity: 0.55 },
  { icon: 'lightning-bolt', top: 44, right: 28, size: 18, opacity: 0.45 },
  { icon: 'paint-roller', bottom: 32, left: 44, size: 16, opacity: 0.4 },
  { icon: 'leaf', bottom: 18, right: 18, size: 22, opacity: 0.5 },
  { icon: 'hammer', top: 72, left: 100, size: 15, opacity: 0.35 },
];

function deriveDemoIdentity(provider, email) {
  const fallbackEmail = `${provider.toLowerCase()}.demo@oficios.app`;
  const resolvedEmail = (email || fallbackEmail).trim().toLowerCase();
  const [firstName = 'Usuario', lastName = 'Demo'] = resolvedEmail.split('@')[0].split(/[._-]+/);

  return {
    providerUserId: `${provider.toLowerCase()}-${resolvedEmail}`,
    email: resolvedEmail,
    firstName,
    lastName,
  };
}

function LoginScreen({ navigation }) {
  const { signIn, signInWithProvider } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function handleLogin() {
    try {
      setLoading(true);
      await signIn({ email, password });
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoSocial(provider) {
    try {
      setLoading(true);
      const identity = deriveDemoIdentity(provider, email);

      await signInWithProvider({
        provider,
        providerUserId: identity.providerUserId,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      });
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión social', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} gradient>
      <View pointerEvents="none" style={styles.backgroundOrbTop} />
      <View pointerEvents="none" style={styles.backgroundOrbBottom} />

      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.navigate('Welcome')} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={18} color={palette.ink} />
        </Pressable>
      </View>

      <LinearGradient
        colors={[palette.accentDeep, '#1258B0', palette.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroPanel}
      >
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />

        {FLOATING_ICONS.map((item, index) => (
          <View
            key={index}
            pointerEvents="none"
            style={[
              styles.floatingIconWrap,
              {
                top: item.top,
                left: item.left,
                right: item.right,
                bottom: item.bottom,
                opacity: item.opacity,
              },
            ]}
          >
            <MaterialCommunityIcons name={item.icon} size={item.size} color={palette.white} />
          </View>
        ))}

        <View style={styles.heroBadge}>
          <Ionicons name="flash-outline" size={14} color={palette.white} style={{ opacity: 0.9 }} />
          <Text style={styles.heroBadgeText}>Ingreso rápido</Text>
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.heroLogoRow}>
            <View style={styles.heroLogo}>
              <Text style={styles.heroLogoText}>O</Text>
            </View>
            <Text style={styles.heroLogoName}>Oficios</Text>
          </View>
          <Text style={styles.heroTitle}>Volvé cuando quieras</Text>
          <Text style={styles.heroSubtitle}>
            Entrá con teléfono, con tu proveedor o con email si ya venías usando contraseña.
          </Text>
        </View>
      </LinearGradient>

      <View style={[styles.formCard, shadows.card]}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Iniciar sesión</Text>
          <Text style={styles.formCopy}>
            Priorizamos métodos rápidos y dejamos email con contraseña como respaldo.
          </Text>
        </View>

        <AppButton onPress={() => navigation.navigate('PhoneAuth', { mode: 'login' })}>
          Continuar con teléfono
        </AppButton>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o continuar con</Text>
          <View style={styles.dividerLine} />
        </View>

        {AUTH_PROVIDERS.map((provider) => (
          <AppButton
            key={provider.key}
            onPress={() => handleDemoSocial(provider.provider)}
            variant={provider.variant}
            loading={loading}
            icon={provider.icon}
          >
            {provider.label}
          </AppButton>
        ))}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o usar email y contraseña</Text>
          <View style={styles.dividerLine} />
        </View>

        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="mail-outline"
          placeholder="cliente@oficios.app"
        />
        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock-closed-outline"
          rightIcon="eye-outline"
          placeholder="Tu contraseña"
        />

        <AppButton onPress={handleLogin} loading={loading} variant="secondary">
          Entrar con email
        </AppButton>

        <View style={styles.seedBox}>
          <Text style={styles.seedTitle}>Acceso rápido demo</Text>
          <Text style={styles.seedText}>Admin: admin@oficios.app / Admin1234</Text>
          <Text style={styles.seedText}>Cliente: cliente@oficios.app / Cliente1234</Text>
          <Text style={styles.seedText}>Pro: pro@oficios.app / Profesional1234</Text>
        </View>
      </View>

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
        <Text style={styles.footerText}>
          ¿No tenés cuenta? <Text style={styles.footerAccent}>Crear cuenta</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 56,
  },
  backgroundOrbTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(87, 190, 180, 0.1)',
    top: -70,
    right: -90,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(57, 169, 255, 0.08)',
    bottom: 100,
    left: -80,
  },
  topRow: {
    flexDirection: 'row',
    zIndex: 3,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  heroPanel: {
    minHeight: 252,
    marginBottom: -68,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 22,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -80,
    right: -60,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -40,
    left: -30,
  },
  floatingIconWrap: {
    position: 'absolute',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroBadgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroCopy: {
    gap: 8,
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroLogo: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
  heroLogoName: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
    opacity: 0.9,
  },
  heroTitle: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  formCard: {
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    padding: 22,
    gap: 14,
  },
  formHeader: {
    gap: 6,
  },
  formTitle: {
    color: palette.ink,
    fontSize: 31,
    fontWeight: '800',
  },
  formCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  dividerText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  seedBox: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#EFF7F4',
    gap: 4,
  },
  seedTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  seedText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  footerLink: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  footerAccent: {
    color: palette.accentDark,
    fontWeight: '800',
  },
});

module.exports = { LoginScreen };
