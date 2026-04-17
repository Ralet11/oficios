const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { SectionCard } = require('../components/SectionCard');
const { useAuth } = require('../contexts/AuthContext');
const { palette, type } = require('../theme');

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
      Alert.alert('No se pudo iniciar sesión', error.message);
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
      Alert.alert('No se pudo iniciar sesión social', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Marketplace de oficios</Text>
        <Text style={styles.title}>Encontrá profesionales confiables en minutos.</Text>
        <Text style={styles.copy}>
          Buscá por rubro, enviá una solicitud, chateá dentro de la app y desbloqueá el contacto cuando acepten.
        </Text>
      </View>

      <SectionCard title="Ingresá a tu cuenta" subtitle="Usá las credenciales del seed o registrá una nueva cuenta.">
        <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <AppButton onPress={handleLogin} loading={loading}>
          Iniciar sesión
        </AppButton>
        <AppButton onPress={() => handleDemoSocial('GOOGLE')} variant="secondary" loading={loading}>
          Continuar con Google
        </AppButton>
        <AppButton onPress={() => handleDemoSocial('APPLE')} variant="ghost" loading={loading}>
          Continuar con Apple
        </AppButton>
      </SectionCard>

      <SectionCard title="Accesos del seed">
        <Text style={styles.seed}>Admin: `admin@oficios.app / Admin1234`</Text>
        <Text style={styles.seed}>Cliente: `cliente@oficios.app / Cliente1234`</Text>
        <Text style={styles.seed}>Profesional: `pro@oficios.app / Profesional1234`</Text>
      </SectionCard>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Crear cuenta nueva</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
    marginTop: 12,
  },
  kicker: {
    ...type.label,
    color: palette.accentDark,
  },
  title: {
    ...type.title,
  },
  copy: {
    ...type.body,
    color: palette.ink,
  },
  link: {
    color: palette.accentDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  seed: {
    fontSize: 14,
    color: palette.ink,
  },
});

module.exports = {
  LoginScreen,
};
