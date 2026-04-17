const React = require('react');
const { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { hasRole } = require('@oficios/domain');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function blankArea() {
  return {
    city: '',
    province: '',
    radiusKm: '10',
  };
}

function ProfessionalHubScreen() {
  const { token, user, activateProfessionalRole, refreshSession, setProfessionalProfile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [activationName, setActivationName] = React.useState('');
  const [profileStatus, setProfileStatus] = React.useState('DRAFT');
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [form, setForm] = React.useState({
    businessName: '',
    headline: '',
    bio: '',
    yearsExperience: '0',
    availableNow: false,
    city: '',
    province: '',
    contactPhone: '',
    contactWhatsApp: '',
    contactEmail: '',
    avatarUrl: '',
    coverUrl: '',
    photoUrls: '',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState([]);
  const [serviceAreas, setServiceAreas] = React.useState([blankArea()]);
  const isProfessional = hasRole(user, 'PROFESSIONAL');

  const hydrate = React.useCallback(async () => {
    try {
      const [categoriesResponse, profileResponse] = await Promise.all([
        api.categories(),
        isProfessional ? api.myProfessionalProfile(token) : Promise.resolve(null),
      ]);

      setCategories(categoriesResponse.data);

      if (profileResponse?.data) {
        const profile = profileResponse.data;
        setProfessionalProfile(profile);
        setProfileStatus(profile.status || 'DRAFT');
        setRejectionReason(profile.rejectionReason || '');
        setForm({
          businessName: profile.businessName || '',
          headline: profile.headline || '',
          bio: profile.bio || '',
          yearsExperience: String(profile.yearsExperience || 0),
          availableNow: Boolean(profile.availableNow),
          city: profile.city || '',
          province: profile.province || '',
          contactPhone: profile.contact?.phone || '',
          contactWhatsApp: profile.contact?.whatsapp || '',
          contactEmail: profile.contact?.email || '',
          avatarUrl: profile.avatarUrl || '',
          coverUrl: profile.coverUrl || '',
          photoUrls: (profile.photoUrls || []).join('\n'),
        });
        setSelectedCategoryIds(profile.categories?.map((category) => category.id) || []);
        setServiceAreas(
          profile.serviceAreas?.length
            ? profile.serviceAreas.map((area) => ({
                city: area.city,
                province: area.province,
                radiusKm: String(area.radiusKm),
              }))
            : [blankArea()],
        );
      }
    } catch (error) {
      Alert.alert('No se pudo cargar el hub profesional', error.message);
    } finally {
      setLoading(false);
    }
  }, [isProfessional, setProfessionalProfile, token]);

  useFocusEffect(
    React.useCallback(() => {
      hydrate();
    }, [hydrate]),
  );

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleCategory(categoryId) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  }

  function updateArea(index, key, value) {
    setServiceAreas((current) =>
      current.map((area, currentIndex) => (currentIndex === index ? { ...area, [key]: value } : area)),
    );
  }

  async function handleActivate() {
    try {
      setSaving(true);
      await activateProfessionalRole({ businessName: activationName });
      await refreshSession();
      await hydrate();
    } catch (error) {
      Alert.alert('No se pudo activar el rol profesional', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      await api.saveProfessionalProfile(
        {
          ...form,
          yearsExperience: Number(form.yearsExperience),
          photoUrls: form.photoUrls
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        },
        token,
      );
      await api.saveProfessionalCategories({ categoryIds: selectedCategoryIds }, token);
      await api.saveProfessionalServiceAreas(
        {
          serviceAreas: serviceAreas.map((area) => ({
            city: area.city,
            province: area.province,
            radiusKm: Number(area.radiusKm),
          })),
        },
        token,
      );
      await hydrate();
      Alert.alert('Perfil actualizado', 'Los cambios se guardaron correctamente.');
    } catch (error) {
      Alert.alert('No se pudo guardar el perfil', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitForApproval() {
    try {
      setSaving(true);
      await api.submitProfessionalProfile(token);
      await hydrate();
    } catch (error) {
      Alert.alert('No se pudo enviar a moderación', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando hub profesional..." />;
  }

  if (!isProfessional) {
    return (
      <Screen>
        <SectionCard title="Activar modo profesional" subtitle="Mantenés tu rol de cliente y sumás un perfil público editable.">
          <AppInput label="Nombre comercial" value={activationName} onChangeText={setActivationName} />
          <AppButton onPress={handleActivate} loading={saving}>
            Activar rol profesional
          </AppButton>
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Hub profesional</Text>
        <Text style={styles.copy}>Completá tu ficha, definí categorías y enviá el perfil a aprobación admin.</Text>
      </View>

      <SectionCard title="Estado del perfil">
        <StatusBadge status={profileStatus} />
        <Text style={styles.stateText}>Guardá los cambios y luego enviá el perfil a moderación.</Text>
        {rejectionReason ? <Text style={styles.rejection}>{rejectionReason}</Text> : null}
      </SectionCard>

      <SectionCard title="Ficha profesional">
        <AppInput label="Nombre comercial" value={form.businessName} onChangeText={(value) => updateField('businessName', value)} />
        <AppInput label="Titular" value={form.headline} onChangeText={(value) => updateField('headline', value)} />
        <AppInput label="Biografía" value={form.bio} onChangeText={(value) => updateField('bio', value)} multiline />
        <AppInput
          label="Años de experiencia"
          value={form.yearsExperience}
          onChangeText={(value) => updateField('yearsExperience', value)}
          keyboardType="numeric"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Disponible ahora</Text>
          <Switch value={form.availableNow} onValueChange={(value) => updateField('availableNow', value)} trackColor={{ true: palette.accent }} />
        </View>
        <AppInput label="Ciudad base" value={form.city} onChangeText={(value) => updateField('city', value)} />
        <AppInput label="Provincia base" value={form.province} onChangeText={(value) => updateField('province', value)} />
        <AppInput label="Teléfono" value={form.contactPhone} onChangeText={(value) => updateField('contactPhone', value)} />
        <AppInput label="WhatsApp" value={form.contactWhatsApp} onChangeText={(value) => updateField('contactWhatsApp', value)} />
        <AppInput label="Email de contacto" value={form.contactEmail} onChangeText={(value) => updateField('contactEmail', value)} autoCapitalize="none" />
        <AppInput label="Avatar URL" value={form.avatarUrl} onChangeText={(value) => updateField('avatarUrl', value)} autoCapitalize="none" />
        <AppInput label="Cover URL" value={form.coverUrl} onChangeText={(value) => updateField('coverUrl', value)} autoCapitalize="none" />
        <AppInput
          label="URLs de fotos"
          value={form.photoUrls}
          onChangeText={(value) => updateField('photoUrls', value)}
          multiline
          helperText="Una URL por línea."
        />
      </SectionCard>

      <SectionCard title="Categorías">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((category) => {
            const active = selectedCategoryIds.includes(category.id);
            return (
              <Pressable key={category.id} onPress={() => toggleCategory(category.id)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SectionCard>

      <SectionCard
        title="Zonas de servicio"
        footer={
          <AppButton variant="secondary" onPress={() => setServiceAreas((current) => [...current, blankArea()])}>
            Agregar zona
          </AppButton>
        }
      >
        {serviceAreas.map((area, index) => (
          <View key={`${index}-${area.city}`} style={styles.areaBlock}>
            <AppInput label="Ciudad" value={area.city} onChangeText={(value) => updateArea(index, 'city', value)} />
            <AppInput label="Provincia" value={area.province} onChangeText={(value) => updateArea(index, 'province', value)} />
            <AppInput label="Radio km" value={area.radiusKm} onChangeText={(value) => updateArea(index, 'radiusKm', value)} keyboardType="numeric" />
          </View>
        ))}
      </SectionCard>

      <AppButton onPress={saveProfile} loading={saving}>
        Guardar perfil profesional
      </AppButton>
      <AppButton onPress={submitForApproval} variant="ghost" loading={saving}>
        Enviar a aprobación
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    ...type.title,
  },
  copy: {
    ...type.body,
    color: palette.ink,
  },
  stateText: {
    ...type.body,
  },
  rejection: {
    color: palette.danger,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: palette.ink,
    fontWeight: '700',
  },
  chips: {
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
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
    color: palette.white,
  },
  areaBlock: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 12,
  },
});

module.exports = {
  ProfessionalHubScreen,
};
