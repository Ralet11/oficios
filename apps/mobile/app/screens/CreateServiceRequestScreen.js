const React = require('react');
const { Alert, Pressable, ScrollView, StyleSheet, Text, View } = require('react-native');
const { useRoute } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { SectionCard } = require('../components/SectionCard');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function CreateServiceRequestScreen({ navigation }) {
  const route = useRoute();
  const { token } = useAuth();
  const professional = route.params.professional;
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    professionalId: professional.id,
    categoryId: professional.categories?.[0]?.id || '',
    title: '',
    customerMessage: '',
    city: professional.city || '',
    province: professional.province || '',
    addressLine: '',
    budgetAmount: '',
    budgetCurrency: 'ARS',
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      const response = await api.createServiceRequest(
        {
          ...form,
          budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
        },
        token,
      );
      navigation.replace('RequestDetail', { requestId: response.data.id });
    } catch (error) {
      Alert.alert('No se pudo crear la solicitud', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <SectionCard title={`Solicitar a ${professional.businessName}`} subtitle="El mensaje inicial abre la conversación.">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {professional.categories?.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => updateField('categoryId', category.id)}
              style={[styles.chip, Number(form.categoryId) === category.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, Number(form.categoryId) === category.id && styles.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <AppInput label="Título" value={form.title} onChangeText={(value) => updateField('title', value)} placeholder="Ej. Reparar pérdida en cocina" />
        <AppInput
          label="Mensaje inicial"
          value={form.customerMessage}
          onChangeText={(value) => updateField('customerMessage', value)}
          multiline
          placeholder="Contá el problema, urgencia y contexto."
        />
        <AppInput label="Dirección" value={form.addressLine} onChangeText={(value) => updateField('addressLine', value)} />
        <AppInput label="Ciudad" value={form.city} onChangeText={(value) => updateField('city', value)} />
        <AppInput label="Provincia" value={form.province} onChangeText={(value) => updateField('province', value)} />
        <AppInput
          label="Presupuesto estimado"
          value={String(form.budgetAmount)}
          onChangeText={(value) => updateField('budgetAmount', value)}
          keyboardType="numeric"
        />
        <AppButton onPress={handleSubmit} loading={loading}>
          Enviar solicitud
        </AppButton>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: '#E7D8C5',
  },
  chipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipText: {
    color: palette.ink,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

module.exports = {
  CreateServiceRequestScreen,
};
