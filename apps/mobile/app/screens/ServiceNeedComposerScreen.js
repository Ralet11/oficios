const React = require('react');
const {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} = require('react-native');
const { useRoute } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { StatusBadge } = require('../components/StatusBadge');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { pickImageAssets, uploadImageAssetWithScope } = require('../services/imagePickerUpload');
const { api } = require('../services/api');
const { palette, shadows, spacing, type } = require('../theme');

function buildPhotoItemFromUrl(url) {
  return {
    id: url,
    previewUrl: url,
    status: 'ready',
    url,
  };
}

function buildDefaultForm(user, existingNeed) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  return {
    addressLine: existingNeed?.addressLine || '',
    budgetAmount: existingNeed?.budgetAmount ? String(existingNeed.budgetAmount) : '',
    budgetCurrency: existingNeed?.budgetCurrency || 'ARS',
    categoryId: existingNeed?.category?.id ? String(existingNeed.category.id) : '',
    city: existingNeed?.city || '',
    contactEmail: existingNeed?.contact?.email || user?.email || '',
    contactName: existingNeed?.contact?.name || fullName || '',
    contactPhone: existingNeed?.contact?.phone || user?.phone || '',
    contactWhatsapp: existingNeed?.contact?.whatsapp || user?.phone || '',
    description: existingNeed?.description || '',
    photoItems: (existingNeed?.photoUrls || []).map((photoUrl) => buildPhotoItemFromUrl(photoUrl)),
    province: existingNeed?.province || '',
    title: existingNeed?.title || '',
  };
}

function normalizeEditableText(value) {
  return String(value || '').trim();
}

function validateDraft(form) {
  if (form.title.trim() && form.title.trim().length < 4) {
    return 'El titulo necesita al menos 4 caracteres.';
  }

  if (form.description.trim() && form.description.trim().length < 10) {
    return 'La descripcion necesita al menos 10 caracteres.';
  }

  if (form.city.trim() && form.city.trim().length < 2) {
    return 'La ciudad necesita al menos 2 caracteres.';
  }

  if (form.province.trim() && form.province.trim().length < 2) {
    return 'La provincia necesita al menos 2 caracteres.';
  }

  if (form.addressLine.trim() && form.addressLine.trim().length < 5) {
    return 'La direccion necesita al menos 5 caracteres.';
  }

  if (form.contactName.trim() && form.contactName.trim().length < 2) {
    return 'El nombre de contacto necesita al menos 2 caracteres.';
  }

  if (form.contactPhone.trim() && form.contactPhone.trim().length < 6) {
    return 'El telefono de contacto necesita al menos 6 caracteres.';
  }

  if (form.contactWhatsapp.trim() && form.contactWhatsapp.trim().length < 6) {
    return 'El WhatsApp necesita al menos 6 caracteres.';
  }

  if (form.budgetAmount.trim() && Number(form.budgetAmount) <= 0) {
    return 'El presupuesto debe ser mayor a 0.';
  }

  const uploadingPhotos = form.photoItems.some((photo) => photo.status === 'uploading');
  if (uploadingPhotos) {
    return 'Espera a que terminen de subir las fotos antes de guardar.';
  }

  return null;
}

function buildPayload(form) {
  const payload = {};

  if (form.categoryId) {
    payload.categoryId = Number(form.categoryId);
  }

  const title = normalizeEditableText(form.title);
  if (title) {
    payload.title = title;
  }

  const description = normalizeEditableText(form.description);
  if (description) {
    payload.description = description;
  }

  const city = normalizeEditableText(form.city);
  if (city) {
    payload.city = city;
  }

  const province = normalizeEditableText(form.province);
  if (province) {
    payload.province = province;
  }

  const addressLine = normalizeEditableText(form.addressLine);
  if (addressLine) {
    payload.addressLine = addressLine;
  }

  const contactName = normalizeEditableText(form.contactName);
  if (contactName) {
    payload.contactName = contactName;
  }

  const contactPhone = normalizeEditableText(form.contactPhone);
  if (contactPhone) {
    payload.contactPhone = contactPhone;
  }

  const contactWhatsapp = normalizeEditableText(form.contactWhatsapp);
  if (contactWhatsapp) {
    payload.contactWhatsapp = contactWhatsapp;
  }

  const contactEmail = normalizeEditableText(form.contactEmail);
  if (contactEmail) {
    payload.contactEmail = contactEmail;
  }

  if (form.budgetAmount.trim()) {
    payload.budgetAmount = Number(form.budgetAmount);
    payload.budgetCurrency = form.budgetCurrency || 'ARS';
  }

  payload.photoUrls = form.photoItems
    .filter((photo) => photo.status === 'ready' && photo.url)
    .map((photo) => photo.url)
    .slice(0, 10);

  return payload;
}

function ServiceNeedComposerScreen({ navigation }) {
  const route = useRoute();
  const { token, user } = useAuth();
  const initialServiceNeedId = route.params?.serviceNeedId || null;
  const [serviceNeedId, setServiceNeedId] = React.useState(initialServiceNeedId);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [serviceNeed, setServiceNeed] = React.useState(null);
  const [form, setForm] = React.useState(() => buildDefaultForm(user, null));

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesResponse, serviceNeedResponse] = await Promise.all([
        api.categories(),
        serviceNeedId ? api.serviceNeed(serviceNeedId, token) : Promise.resolve(null),
      ]);

      setCategories(categoriesResponse.data || []);

      if (serviceNeedResponse?.data) {
        setServiceNeed(serviceNeedResponse.data);
        setForm(buildDefaultForm(user, serviceNeedResponse.data));
      } else {
        setServiceNeed(null);
        setForm(buildDefaultForm(user, null));
      }
    } catch (error) {
      Alert.alert('No se pudo cargar el borrador', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, serviceNeedId, token, user]);

  React.useEffect(() => {
    load();
  }, [load]);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function removePhoto(photoId) {
    setForm((current) => ({
      ...current,
      photoItems: current.photoItems.filter((photo) => photo.id !== photoId),
    }));
  }

  async function uploadAsset(asset) {
    const tempId = `local-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const tempPhoto = {
      id: tempId,
      previewUrl: asset.uri,
      status: 'uploading',
      url: null,
    };

    setForm((current) => ({
      ...current,
      photoItems: [...current.photoItems, tempPhoto],
    }));

    try {
      const uploaded = await uploadImageAssetWithScope(asset, 'service-need', token);

      setForm((current) => ({
        ...current,
        photoItems: current.photoItems.map((photo) =>
          photo.id === tempId
            ? {
                id: uploaded.id || uploaded.url,
                previewUrl: uploaded.url,
                status: 'ready',
                url: uploaded.url,
              }
            : photo,
        ),
      }));
    } catch (error) {
      setForm((current) => ({
        ...current,
        photoItems: current.photoItems.filter((photo) => photo.id !== tempId),
      }));
      throw error;
    }
  }

  async function handlePick(source) {
    try {
      if (form.photoItems.length >= 10) {
        Alert.alert('Limite alcanzado', 'Cada problema puede tener hasta 10 fotos.');
        return;
      }

      const availableSlots = Math.max(0, 10 - form.photoItems.length);
      const assets = await pickImageAssets(source, {
        quality: 0.82,
        selectionLimit: source === 'library' ? availableSlots : 1,
      });

      for (const asset of assets.slice(0, availableSlots)) {
        await uploadAsset(asset);
      }
    } catch (error) {
      Alert.alert('No se pudo cargar la foto', error.message);
    }
  }

  async function persistDraft(options = {}) {
    try {
      const validationMessage = validateDraft(form);
      if (validationMessage) {
        Alert.alert('Revisa el borrador', validationMessage);
        return null;
      }

      setSaving(true);
      const payload = buildPayload(form);
      const response = serviceNeedId
        ? await api.updateServiceNeed(serviceNeedId, payload, token)
        : await api.createServiceNeed(payload, token);
      const nextNeed = response.data;

      setServiceNeedId(nextNeed.id);
      setServiceNeed(nextNeed);
      setForm(buildDefaultForm(user, nextNeed));

      if (options.showSuccess !== false) {
        Alert.alert('Borrador guardado', 'Tu problema quedo guardado para seguir despues.');
      }

      return nextNeed;
    } catch (error) {
      Alert.alert('No se pudo guardar el borrador', error.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await persistDraft({ showSuccess: true });
  }

  async function handleOpenDetail() {
    const nextNeed = await persistDraft({ showSuccess: false });
    if (!nextNeed?.id) {
      return;
    }

    navigation.replace('ServiceNeedDetail', { serviceNeedId: nextNeed.id });
  }

  async function handleSelectProfessionals() {
    const nextNeed = await persistDraft({ showSuccess: false });
    if (!nextNeed?.id) {
      return;
    }

    navigation.navigate('SelectProfessionals', { serviceNeedId: nextNeed.id });
  }

  if (loading) {
    return <LoadingView label="Cargando borrador..." />;
  }

  const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId)) || serviceNeed?.category || null;
  const heroIcon = getCategoryIcon(selectedCategory, 0);

  return (
    <Screen contentStyle={styles.content}>
      <ServiceArtwork
        size="banner"
        icon={heroIcon}
        badge={serviceNeed ? 'Editar problema' : 'Nuevo problema'}
        title={form.title.trim() || 'Describe tu necesidad'}
        subtitle={form.city.trim() || 'Guarda un borrador y luego elige a quien enviarlo'}
      />

      {serviceNeed ? (
        <View style={styles.statusRow}>
          <StatusBadge status={serviceNeed.status} />
          <Text style={styles.statusCopy}>El borrador se guarda como espacio padre del problema y luego genera varias conversaciones.</Text>
        </View>
      ) : null}

      <View style={styles.photoActions}>
        <Pressable onPress={() => handlePick('camera')} style={[styles.photoAction, shadows.card]}>
          <View style={styles.photoActionIcon}>
            <Ionicons color={palette.accentDark} name="camera-outline" size={20} />
          </View>
          <View style={styles.photoActionCopy}>
            <Text style={styles.photoActionTitle}>Camara</Text>
            <Text style={styles.photoActionText}>Toma fotos del problema en el momento.</Text>
          </View>
        </Pressable>

        <Pressable onPress={() => handlePick('library')} style={[styles.photoAction, shadows.card]}>
          <View style={styles.photoActionIcon}>
            <Ionicons color={palette.accentDark} name="images-outline" size={20} />
          </View>
          <View style={styles.photoActionCopy}>
            <Text style={styles.photoActionTitle}>Galeria</Text>
            <Text style={styles.photoActionText}>Sube referencias o fotos del trabajo a resolver.</Text>
          </View>
        </Pressable>
      </View>

      {form.photoItems.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRail}>
          {form.photoItems.map((photo, index) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image resizeMode="cover" source={{ uri: photo.previewUrl || photo.url }} style={styles.photoThumb} />
              <View style={styles.photoOverlay}>
                <View style={styles.photoPill}>
                  <Text style={styles.photoPillText}>{index === 0 ? 'Principal' : `Foto ${index + 1}`}</Text>
                </View>
                <Pressable onPress={() => removePhoto(photo.id)} style={styles.photoRemove}>
                  <Ionicons color={palette.white} name="trash-outline" size={16} />
                </Pressable>
              </View>
              {photo.status === 'uploading' ? (
                <View style={styles.photoUploading}>
                  <Ionicons color={palette.white} name="cloud-upload-outline" size={18} />
                  <Text style={styles.photoUploadingText}>Subiendo...</Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          title="Todavia no cargaste fotos"
          message="Las fotos ayudan a que el profesional entienda mejor el problema antes de presupuestar."
        />
      )}

      <View style={styles.formBlock}>
        <AppInput
          label="Titulo"
          value={form.title}
          onChangeText={(value) => updateField('title', value)}
          placeholder="Ej: Se rompio el termotanque"
          leftIcon="create-outline"
        />
        <AppInput
          label="Descripcion"
          value={form.description}
          onChangeText={(value) => updateField('description', value)}
          multiline
          placeholder="Cuenta que paso, desde cuando, que intentaste y si hay urgencia."
          leftIcon="chatbubble-ellipses-outline"
        />

        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            {categories.map((category) => {
              const active = String(category.id) === String(form.categoryId);

              return (
                <Pressable
                  key={category.id}
                  onPress={() => updateField('categoryId', String(category.id))}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{category.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <AppInput
          label="Direccion"
          value={form.addressLine}
          onChangeText={(value) => updateField('addressLine', value)}
          placeholder="Calle, altura y referencia"
          leftIcon="home-outline"
        />
        <AppInput
          label="Ciudad"
          value={form.city}
          onChangeText={(value) => updateField('city', value)}
          placeholder="Ciudad"
          leftIcon="business-outline"
        />
        <AppInput
          label="Provincia"
          value={form.province}
          onChangeText={(value) => updateField('province', value)}
          placeholder="Provincia"
          leftIcon="map-outline"
        />
        <AppInput
          label="Presupuesto estimado"
          value={form.budgetAmount}
          onChangeText={(value) => updateField('budgetAmount', value)}
          placeholder="120000"
          keyboardType="numeric"
          prefix="ARS"
          leftIcon="cash-outline"
        />
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Snapshot de contacto</Text>
        <Text style={styles.contactCopy}>Se guarda junto al problema para que quede claro quien consulta y como responder cuando se desbloquee el contacto.</Text>
        <AppInput
          label="Nombre"
          value={form.contactName}
          onChangeText={(value) => updateField('contactName', value)}
          leftIcon="person-outline"
        />
        <AppInput
          label="Telefono"
          value={form.contactPhone}
          onChangeText={(value) => updateField('contactPhone', value)}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <AppInput
          label="WhatsApp"
          value={form.contactWhatsapp}
          onChangeText={(value) => updateField('contactWhatsapp', value)}
          keyboardType="phone-pad"
          leftIcon="logo-whatsapp"
        />
        <AppInput
          label="Email"
          value={form.contactEmail}
          onChangeText={(value) => updateField('contactEmail', value)}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="mail-outline"
        />
      </View>

      <View style={styles.footerActions}>
        <AppButton onPress={handleSave} loading={saving}>
          {serviceNeedId ? 'Guardar cambios' : 'Guardar borrador'}
        </AppButton>
        <AppButton onPress={handleSelectProfessionals} loading={saving} variant="secondary">
          Seleccionar profesionales
        </AppButton>
        {serviceNeedId ? (
          <AppButton onPress={handleOpenDetail} loading={saving} variant="ghost">
            Ver problema
          </AppButton>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 144,
  },
  statusRow: {
    gap: 10,
  },
  statusCopy: {
    ...type.body,
  },
  photoActions: {
    gap: 12,
  },
  photoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  photoActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  photoActionCopy: {
    flex: 1,
    gap: 2,
  },
  photoActionTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  photoActionText: {
    color: palette.muted,
    fontSize: 13,
  },
  photoRail: {
    gap: 12,
    paddingRight: 20,
  },
  photoCard: {
    width: 148,
    height: 188,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: palette.surfaceElevated,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.whiteGlassStrong,
  },
  photoPillText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '800',
  },
  photoRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  photoUploading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(8, 19, 37, 0.72)',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoUploadingText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  formBlock: {
    gap: 14,
  },
  categoryBlock: {
    gap: 10,
  },
  categoryTitle: {
    ...type.label,
    color: palette.ink,
  },
  categoryRail: {
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  categoryChipActive: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
  categoryChipText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: palette.accentDark,
  },
  contactCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  contactTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  contactCopy: {
    ...type.body,
  },
  footerActions: {
    gap: 12,
  },
});

module.exports = {
  ServiceNeedComposerScreen,
};
