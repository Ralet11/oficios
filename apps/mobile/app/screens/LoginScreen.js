const React = require('react');
const { Alert, ImageBackground, Pressable, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { AUTH_PROVIDERS } = require('../config/authProviders');
const { useAuth } = require('../contexts/AuthContext');
const { palette, shadows, spacing } = require('../theme');

const LOGIN_HERO_IMAGE = null;

function LoginScreen({ navigation }) {
  const { signIn, signInWithProvider } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('cliente@oficios.app');
  const [password, setPassword] = React.useState('Cliente1234');

  async function handleLogin() {
    try {
      setLoading(true);
      await signIn({ email, password });
    } catch (error) {
      Alert.alert('No se pudo iniciar sesion', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoSocial(provider) {
    try {
      setLoading(true);
      const [firstName = 'Usuario', lastName = 'Demo'] = email.split('@')[0].split('.');
      await signInWithProvider({
        provider,
        providerUserId: `${provider.toLowerCase()}-${email.toLowerCase()}`,
        email,
        firstName,
        lastName,
      });
    } catch (error) {
      Alert.alert('No se pudo iniciar sesion social', error.message);
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

      {LOGIN_HERO_IMAGE ? (
        <ImageBackground source={LOGIN_HERO_IMAGE} imageStyle={styles.heroImage} style={styles.heroPanel}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Sign In</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Welcome back</Text>
              <Text style={styles.heroSubtitle}>
                Manage bookings, messages and trusted professionals from one place.
              </Text>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.heroPanel}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Image Slot</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>IMAGEN</Text>
              
            </View>
          </View>
        </View>
      )}

      <View style={[styles.formCard, shadows.card]}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formCopy}>Accede a tu cuenta y retoma tus pedidos, mensajes y profesionales favoritos.</Text>
        </View>

        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="mail-outline"
        />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock-closed-outline"
          rightIcon="eye-outline"
        />

        <AppButton onPress={handleLogin} loading={loading}>
          Sign In
        </AppButton>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
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

        <View style={styles.seedBox}>
          <Text style={styles.seedTitle}>Quick Access</Text>
          <Text style={styles.seedText}>Admin: admin@oficios.app / Admin1234</Text>
          <Text style={styles.seedText}>Customer: cliente@oficios.app / Cliente1234</Text>
          <Text style={styles.seedText}>Professional: pro@oficios.app / Profesional1234</Text>
        </View>
      </View>

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
        <Text style={styles.footerText}>Don't have an account? Sign Up</Text>
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
    backgroundColor: 'rgba(87, 190, 180, 0.16)',
    top: -70,
    right: -90,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(57, 169, 255, 0.12)',
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
    minHeight: 258,
    marginBottom: -72,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0C2A2C',
    justifyContent: 'flex-end',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 22,
    backgroundColor: 'rgba(8, 18, 24, 0.26)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
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
    maxWidth: '72%',
  },
  heroTitle: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  formCard: {
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
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
  },
  seedText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  footerLink: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

module.exports = {
  LoginScreen,
};
