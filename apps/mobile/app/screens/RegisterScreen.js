const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { SectionCard } = require('../components/SectionCard');
const { useAuth } = require('../contexts/AuthContext');
const { palette, type } = require('../theme');

function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleRegister() {
    try {
      setLoading(true);
      await signUp(form);
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>Creá una cuenta y arrancá a operar.</Text>
        <Text style={styles.copy}>La misma cuenta puede actuar como cliente, profesional y admin.</Text>
      </View>

      <SectionCard title="Datos de registro">
        <AppInput label="Nombre" value={form.firstName} onChangeText={(value) => updateField('firstName', value)} />
        <AppInput label="Apellido" value={form.lastName} onChangeText={(value) => updateField('lastName', value)} />
        <AppInput
          label="Email"
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppInput
          label="Contraseña"
          value={form.password}
          onChangeText={(value) => updateField('password', value)}
          secureTextEntry
          helperText="Mínimo 8 caracteres."
        />
        <AppInput label="Teléfono" value={form.phone} onChangeText={(value) => updateField('phone', value)} keyboardType="phone-pad" />
        <AppButton onPress={handleRegister} loading={loading}>
          Crear cuenta
        </AppButton>
      </SectionCard>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Ya tengo cuenta</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
    marginTop: 12,
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
});

module.exports = {
  RegisterScreen,
};
