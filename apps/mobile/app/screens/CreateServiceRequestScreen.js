const React = require('react');
const { Alert, ScrollView, StyleSheet, Text, View } = require('react-native');
const { useRoute } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

function formatMoney(value) {
  if (!value) {
    return 'A coordinar';
  }

  return `ARS ${Number(value).toLocaleString('es-AR')}`;
}

function CreateServiceRequestScreen({ navigation }) {
  const route = useRoute();
  const { token } = useAuth();
  const professional = route.params.professional;
  const packageOption = route.params.packageOption || null;
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    professionalId: professional.id,
    categoryId: professional.categories?.[0]?.id || '',
    title: packageOption ? `${packageOption.label} - ${professional.businessName}` : '',
    customerMessage: '',
    city: professional.city || '',
    province: professional.province || '',
    addressLine: '',
    budgetAmount: packageOption?.price ? String(packageOption.price) : '',
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
    <Screen contentStyle={styles.content}>
      <ServiceArtwork
        size="banner"
        icon="clipboard-outline"
        badge="Checkout"
        title={professional.businessName}
        subtitle={packageOption ? `${packageOption.label} package selected` : 'Create your service request'}
      />

      <View style={[styles.summaryCard, shadows.card]}>
        <Text style={styles.summaryTitle}>Selected Service</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service</Text>
          <Text style={styles.summaryValue}>{professional.categories?.[0]?.name || 'General service'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Package</Text>
          <Text style={styles.summaryValue}>{packageOption?.label || 'Custom'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price</Text>
          <Text style={styles.summaryValue}>{formatMoney(packageOption?.price || form.budgetAmount)}</Text>
        </View>
      </View>

      <View style={styles.formBlock}>
        <AppInput
          label="Title"
          value={form.title}
          onChangeText={(value) => updateField('title', value)}
          placeholder="House cleaning service"
          leftIcon="create-outline"
        />
        <AppInput
          label="Message"
          value={form.customerMessage}
          onChangeText={(value) => updateField('customerMessage', value)}
          multiline
          placeholder="Describe the issue, urgency, preferred date and any relevant details."
          leftIcon="chatbubble-ellipses-outline"
        />
        <AppInput
          label="Address"
          value={form.addressLine}
          onChangeText={(value) => updateField('addressLine', value)}
          leftIcon="home-outline"
        />
        <AppInput
          label="City"
          value={form.city}
          onChangeText={(value) => updateField('city', value)}
          leftIcon="business-outline"
        />
        <AppInput
          label="Province"
          value={form.province}
          onChangeText={(value) => updateField('province', value)}
          leftIcon="map-outline"
        />
        <AppInput
          label="Budget"
          value={String(form.budgetAmount)}
          onChangeText={(value) => updateField('budgetAmount', value)}
          keyboardType="numeric"
          prefix="ARS"
          leftIcon="cash-outline"
        />
      </View>

      <AppButton onPress={handleSubmit} loading={loading}>
        Confirm Request
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 140,
  },
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  summaryTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  formBlock: {
    gap: 14,
  },
});

module.exports = {
  CreateServiceRequestScreen,
};
