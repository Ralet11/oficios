const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { useAuth } = require('../contexts/AuthContext');
const { palette, shadows, spacing } = require('../theme');

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
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.navigate('Welcome')} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={18} color={palette.ink} />
        </Pressable>
      </View>

      <ServiceArtwork
        size="banner"
        icon="person-outline"
        badge="Sign In"
        title="Welcome back"
        subtitle="Manage bookings, messages and trusted professionals from one place."
      />

      <View style={[styles.formCard, shadows.card]}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formCopy}>Use a seeded demo account or continue with a social provider.</Text>
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

        <AppButton onPress={() => handleDemoSocial('GOOGLE')} variant="secondary" loading={loading} icon="logo-google">
          Continue with Google
        </AppButton>
        <AppButton onPress={() => handleDemoSocial('APPLE')} variant="ghost" loading={loading} icon="logo-apple">
          Continue with Apple
        </AppButton>

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
  },
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 20,
    gap: 14,
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    color: palette.ink,
    fontSize: 29,
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
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
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
