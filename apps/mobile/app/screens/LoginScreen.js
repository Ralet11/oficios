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
  const [showEmailForm, setShowEmailForm] = React.useState(false);

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

  function handleQuickLogin(roleEmail, rolePassword) {
    setEmail(roleEmail);
    setPassword(rolePassword);
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
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.navigate('Welcome')} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={18} color={palette.ink} />
        </Pressable>
      </View>

      <View style={styles.headerSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>O</Text>
        </View>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Entrá con teléfono, proveedor o email</Text>
      </View>

      <View style={styles.formCard}>
        <AppButton onPress={() => navigation.navigate('PhoneAuth', { mode: 'login' })} style={styles.phoneButton}>
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
            style={styles.socialButton}
          >
            {provider.label}
          </AppButton>
        ))}

        <AppButton onPress={() => setShowEmailForm(!showEmailForm)} variant="ghost" style={styles.toggleButton}>
          <View style={styles.toggleButtonContent}>
            <Ionicons name={showEmailForm ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={palette.accentDark} />
            <Text style={styles.toggleButtonText}>Email y contraseña</Text>
          </View>
        </AppButton>

        {showEmailForm ? (
          <>
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
              placeholder="cliente1@oficios.app"
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

            <AppButton onPress={handleLogin} loading={loading} style={styles.loginButton}>
              Entrar
            </AppButton>

            <View style={styles.seedBox}>
              <Text style={styles.seedTitle}>Acceso rápido</Text>
              <View style={styles.quickButtonRow}>
                <AppButton
                  onPress={() => handleQuickLogin('admin@oficios.app', 'Admin1234')}
                  loading={loading}
                  variant="ghost"
                  style={styles.quickButton}
                >
                  Admin
                </AppButton>
                <AppButton
                  onPress={() => handleQuickLogin('cliente1@oficios.app', 'Cliente1234')}
                  loading={loading}
                  variant="ghost"
                  style={styles.quickButton}
                >
                  Cliente
                </AppButton>
                <AppButton
                  onPress={() => handleQuickLogin('pro1@oficios.app', 'Profesional1234')}
                  loading={loading}
                  variant="ghost"
                  style={styles.quickButton}
                >
                  Profesional
                </AppButton>
              </View>
            </View>
          </>
        ) : null}
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
    paddingTop: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  headerSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: palette.white,
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    gap: 14,
  },
  phoneButton: {
    backgroundColor: palette.accent,
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
  socialButton: {
    borderWidth: 1,
    borderColor: palette.border,
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleButtonText: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: 4,
  },
  loginButton: {
    marginTop: 4,
  },
  seedBox: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated,
    gap: 10,
  },
  seedTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  quickButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
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
