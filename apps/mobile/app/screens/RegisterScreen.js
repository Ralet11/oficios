const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { AUTH_PROVIDERS } = require('../config/authProviders');
const { useAuth } = require('../contexts/AuthContext');
const { palette, shadows, spacing } = require('../theme');

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || 'Nuevo';
  const lastName = parts.join(' ') || 'Usuario';

  return { firstName, lastName };
}

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

function RegisterScreen({ navigation }) {
  const { signUp, signInWithProvider } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleRegister() {
    try {
      setLoading(true);
      const { firstName, lastName } = splitName(form.fullName);

      await signUp({
        firstName,
        lastName,
        phone: form.phone || undefined,
        email: form.email,
        password: form.password,
      });
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignUp(provider) {
    try {
      setLoading(true);
      const identity = deriveDemoIdentity(provider, form.email);

      await signInWithProvider({
        provider,
        providerUserId: identity.providerUserId,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      });
    } catch (error) {
      Alert.alert('No se pudo continuar', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} gradient>
      <View pointerEvents="none" style={styles.backgroundOrbTop} />
      <View pointerEvents="none" style={styles.backgroundOrbBottom} />

      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={18} color={palette.ink} />
        </Pressable>
      </View>

      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>Crear cuenta</Text>
        <Text style={styles.title}>Empeza rapido</Text>
        <Text style={styles.copy}>Elegi como queres entrar.</Text>
      </View>

      <View style={[styles.formCard, shadows.card]}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Continuar con telefono</Text>
          <Text style={styles.formCopy}>La opcion mas rapida.</Text>
        </View>

        <AppButton onPress={() => navigation.navigate('PhoneAuth', { mode: 'register' })}>
          Continuar con telefono
        </AppButton>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o continuar con</Text>
          <View style={styles.dividerLine} />
        </View>

        {AUTH_PROVIDERS.map((provider) => (
          <AppButton
            key={provider.key}
            onPress={() => handleSocialSignUp(provider.provider)}
            variant={provider.variant}
            loading={loading}
            icon={provider.icon}
          >
            {provider.label}
          </AppButton>
        ))}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o usar email</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable onPress={() => setShowEmailForm((current) => !current)} style={styles.emailToggle}>
          <Text style={styles.emailToggleText}>
            {showEmailForm ? 'Ocultar email' : 'Usar email y contrasena'}
          </Text>
          <Ionicons
            name={showEmailForm ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={palette.accentDark}
          />
        </Pressable>

        {showEmailForm ? (
          <View style={styles.formBlock}>
            <AppInput
              label="Nombre y apellido"
              value={form.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              leftIcon="person-outline"
              placeholder="Ana Perez"
            />
            <AppInput
              label="Email"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
              placeholder="ana@gmail.com"
            />
            <AppInput
              label="Contrasena"
              value={form.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              leftIcon="lock-closed-outline"
              rightIcon="eye-outline"
              helperText="Usa al menos 8 caracteres."
            />
            <AppInput
              label="Telefono (opcional)"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              prefix="+54"
              leftIcon="call-outline"
              placeholder="11 5555 5555"
            />

            <AppButton onPress={handleRegister} loading={loading}>
              Crear cuenta con email
            </AppButton>
          </View>
        ) : null}

        <Text style={styles.terms}>
          Al registrarte aceptas los Terminos y la Politica de privacidad.
        </Text>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Ya tenes cuenta? <Text style={styles.footerAccent}>Iniciar sesion</Text>
          </Text>
        </Pressable>
      </View>
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
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: 'rgba(87, 190, 180, 0.14)',
    top: -70,
    left: -90,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: 'rgba(57, 169, 255, 0.11)',
    bottom: 60,
    right: -70,
  },
  topRow: {
    flexDirection: 'row',
    zIndex: 2,
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
  headerBlock: {
    gap: 6,
    paddingTop: 6,
  },
  eyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: palette.ink,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    padding: 22,
    gap: 18,
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  formCopy: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 17,
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
  emailToggle: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailToggleText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  formBlock: {
    gap: 14,
  },
  terms: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footerLink: {
    alignItems: 'center',
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

module.exports = {
  RegisterScreen,
};
