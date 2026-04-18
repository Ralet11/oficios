const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { useAuth } = require('../contexts/AuthContext');
const { palette, spacing } = require('../theme');

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || 'Nuevo';
  const lastName = parts.join(' ') || 'Usuario';

  return { firstName, lastName };
}

function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [loading, setLoading] = React.useState(false);
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
        phone: form.phone,
        email: form.email,
        password: form.password,
      });
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', error.message);
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

      <View style={styles.heroBlock}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>New Account</Text>
        </View>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.copy}>
            Empezas como cliente y despues podes activar tu perfil profesional sin perder este rol.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formBlock}>
          <AppInput
            label="Full Name"
            value={form.fullName}
            onChangeText={(value) => updateField('fullName', value)}
            leftIcon="person-outline"
            placeholder="Aaron Ramsdale"
          />
          <AppInput
            label="Phone Number"
            value={form.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            prefix="+54"
            leftIcon="call-outline"
            placeholder="11 5555 5555"
          />
          <AppInput
            label="Email"
            value={form.email}
            onChangeText={(value) => updateField('email', value)}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon="mail-outline"
            placeholder="aaronramsdale@gmail.com"
          />
          <AppInput
            label="Password"
            value={form.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            leftIcon="lock-closed-outline"
            rightIcon="eye-outline"
            helperText="Use at least 8 characters."
          />
        </View>

        <AppButton onPress={handleRegister} loading={loading}>
          Sign Up
        </AppButton>

        <Text style={styles.terms}>
          By registering you agree to the Terms & Conditions and Privacy Policy.
        </Text>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
          <Text style={styles.footerText}>Already have an account? Sign In</Text>
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
  heroBlock: {
    gap: 14,
    padding: 22,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E3F4EF',
  },
  heroBadgeText: {
    color: '#167664',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  copyBlock: {
    gap: 8,
  },
  title: {
    color: palette.ink,
    fontSize: 35,
    lineHeight: 40,
    fontWeight: '800',
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    padding: 22,
    gap: 18,
  },
  formBlock: {
    gap: 14,
  },
  terms: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  footerLink: {
    alignItems: 'center',
  },
  footerText: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
});

module.exports = {
  RegisterScreen,
};
