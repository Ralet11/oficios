const React = require('react');
const { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { api } = require('../services/api');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { LoadingView } = require('../components/LoadingView');
const { useAuth } = require('../contexts/AuthContext');
const { palette, spacing } = require('../theme');

function EditCustomerProfileScreen() {
  const navigation = useNavigation();
  const { user, token, setCustomerProfile } = useAuth();

  const [firstName, setFirstName] = React.useState(user?.firstName || '');
  const [lastName, setLastName] = React.useState(user?.lastName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [city, setCity] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  function validate() {
    const errs = {};
    if (!firstName.trim()) {
      errs.firstName = 'El nombre es requerido';
    }
    if (!phone.trim()) {
      errs.phone = 'El telefono es requerido';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Email invalido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const body = {
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
      };
      const updated = await api.saveCustomerProfile(body, token);
      setCustomerProfile(updated);

      Alert.alert('Listo', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <LoadingView label="Cargando..." />;
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <AppInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Tu nombre"
            error={errors.firstName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Apellido</Text>
          <AppInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Tu apellido"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Telefono</Text>
          <AppInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+54 11 5555-1234"
            keyboardType="phone-pad"
            error={errors.phone}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <AppInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ciudad</Text>
          <AppInput
            value={city}
            onChangeText={setCity}
            placeholder="Buenos Aires"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sobre vos (bio)</Text>
          <AppInput
            value={bio}
            onChangeText={setBio}
            placeholder="Conta un poco sobre vos y como preferis que te contacten..."
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />
        </View>

        <View style={styles.actions}>
          <AppButton
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          >
            Guardar cambios
          </AppButton>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 160,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: spacing.xs,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelText: {
    textAlign: 'center',
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});

module.exports = {
  EditCustomerProfileScreen,
};