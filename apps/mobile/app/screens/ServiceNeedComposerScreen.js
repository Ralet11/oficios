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
const { LocationPickerField } = require('../components/LocationPickerField');
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

function formatLocation(professional) {
  return [professional?.city, professional?.province].filter(Boolean).join(', ') || 'Argentina';
}

function formatRating(professional) {
  const reviewCount = Number(professional?.reviewCount) || 0;
  if (!reviewCount) {
    return 'Nuevo perfil';
  }

  return `${(Number(professional?.ratingAverage) || 0).toFixed(1)} (${reviewCount})`;
}

function buildDefaultForm(user, existingNeed, targetProfessional = null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  return {
    addressLine: existingNeed?.addressLine || '',
    budgetAmount: existingNeed?.budgetAmount ? String(existingNeed.budgetAmount) : '',
    budgetCurrency: existingNeed?.budgetCurrency || 'ARS',
    categoryId:
      existingNeed?.category?.id
        ? String(existingNeed.category.id)
        : targetProfessional?.categories?.[0]?.id
          ? String(targetProfessional.categories[0].id)
          : '',
    city: existingNeed?.city || '',
    contactEmail: existingNeed?.contact?.email || user?.email || '',
    contactName: existingNeed?.contact?.name || fullName || '',
    contactPhone: existingNeed?.contact?.phone || user?.phone || '',
    contactWhatsapp: existingNeed?.contact?.whatsapp || user?.phone || '',
    description: existingNeed?.description || '',
    lat: typeof existingNeed?.lat === 'number' ? existingNeed.lat : null,
    lng: typeof existingNeed?.lng === 'number' ? existingNeed.lng : null,
    locationQuery:
      existingNeed?.addressLine ||
      [existingNeed?.city, existingNeed?.province].filter(Boolean).join(', '),
    photoItems: (existingNeed?.photoUrls || []).map((photoUrl) => buildPhotoItemFromUrl(photoUrl)),
    placeId: existingNeed?.placeId || '',
    province: existingNeed?.province || '',
    title: existingNeed?.title || '',
  };
}

function normalizeEditableText(value) {
  return String(value || '').trim();
}

function buildDispatchValidationMessage(source, options = {}) {
  const missingFields = [];
  const categoryId = source?.categoryId || source?.category?.id;
  const title = normalizeEditableText(source?.title);
  const description = normalizeEditableText(source?.description);
  const city = normalizeEditableText(source?.city);
  const province = normalizeEditableText(source?.province);
  const addressLine = normalizeEditableText(source?.addressLine);

  if (!categoryId) {
    missingFields.push('categoria');
  }
  if (!title) {
    missingFields.push('titulo');
  }
  if (!description) {
    missingFields.push('descripcion');
  }
  if (!city) {
    missingFields.push('ciudad');
  }
  if (!province) {
    missingFields.push('provincia');
  }
  if (!addressLine) {
    missingFields.push('direccion');
  }

  if (!missingFields.length) {
    return null;
  }

  const prefix = options.savedDraft
    ? 'Tu borrador quedo guardado, pero antes de enviarlo completa:'
    : 'Completa estos datos antes de enviarlo:';

  return `${prefix} ${missingFields.join(', ')}.`;
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

  if (normalizeEditableText(form.placeId)) {
    payload.placeId = normalizeEditableText(form.placeId);
  }

  if (typeof form.lat === 'number' && typeof form.lng === 'number') {
    payload.lat = form.lat;
    payload.lng = form.lng;
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
  const targetProfessional = route.params?.targetProfessional || null;
  const [serviceNeedId, setServiceNeedId] = React.useState(initialServiceNeedId);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [serviceNeed, setServiceNeed] = React.useState(null);
  const [form, setForm] = React.useState(() => buildDefaultForm(user, null, targetProfessional));

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
        setForm(buildDefaultForm(user, serviceNeedResponse.data, targetProfessional));
      } else {
        setServiceNeed(null);
        setForm(buildDefaultForm(user, null, targetProfessional));
      }
    } catch (error) {
      Alert.alert('No se pudo cargar el borrador', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, serviceNeedId, targetProfessional, token, user]);

  React.useEffect(() => {
    load();
  }, [load]);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateNeedLocationQuery(value) {
    setForm((current) => ({
      ...current,
      lat: null,
      lng: null,
      locationQuery: value,
      placeId: '',
    }));
  }

  function updateLocationTextField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      lat: null,
      lng: null,
      placeId: '',
    }));
  }

  function handleNeedLocationSelected(location) {
    setForm((current) => ({
      ...current,
      addressLine: location.addressLine || current.addressLine,
      city: location.city || current.city,
      lat: typeof location.lat === 'number' ? location.lat : null,
      lng: typeof location.lng === 'number' ? location.lng : null,
      locationQuery: location.label || current.locationQuery,
      placeId: location.placeId || '',
      province: location.province || current.province,
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
      setForm(buildDefaultForm(user, nextNeed, targetProfessional));

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

    const readinessMessage = buildDispatchValidationMessage(nextNeed, { savedDraft: true });
    if (readinessMessage) {
      Alert.alert('Completa el problema', readinessMessage);
      return;
    }

    navigation.navigate('SelectProfessionals', { serviceNeedId: nextNeed.id });
  }

  async function handleDirectDispatch() {
    if (!targetProfessional?.id) {
      return;
    }

    const nextNeed = await persistDraft({ showSuccess: false });
    if (!nextNeed?.id) {
      return;
    }

    const readinessMessage = buildDispatchValidationMessage(nextNeed, { savedDraft: true });
    if (readinessMessage) {
      Alert.alert('Completa el problema', readinessMessage);
      return;
    }

    const existingThread = (nextNeed.requests || []).some((request) => request.professional?.id === targetProfessional.id);
    if (existingThread) {
      Alert.alert(
        'Ya existe una conversacion activa',
        'Este profesional ya tiene un hilo activo para este problema. Puedes ver el detalle o invitar a otros.',
      );
      navigation.replace('ServiceNeedDetail', { serviceNeedId: nextNeed.id });
      return;
    }

    try {
      setSaving(true);
      await api.dispatchServiceNeed(
        nextNeed.id,
        {
          professionalIds: [targetProfessional.id],
          customerMessage: normalizeEditableText(nextNeed.description),
        },
        token,
      );
      navigation.replace('ServiceNeedDetail', { serviceNeedId: nextNeed.id });
    } catch (error) {
      Alert.alert('No se pudo enviar la consulta', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando borrador..." />;
  }

  const selectedCategory =
    categories.find((category) => String(category.id) === String(form.categoryId)) ||
    serviceNeed?.category ||
    targetProfessional?.categories?.[0] ||
    null;
  const heroIcon = getCategoryIcon(selectedCategory, 0);
  const targetProfessionalImage =
    targetProfessional?.avatarUrl || targetProfessional?.photoUrls?.[0] || targetProfessional?.coverUrl || null;
  const targetAlreadyInvited = Boolean(
    targetProfessional?.id &&
      serviceNeed?.requests?.some((request) => request.professional?.id === targetProfessional.id),
  );

  return (
    <Screen contentStyle={styles.content}>
      <ServiceArtwork
        size="banner"
        icon={heroIcon}
        badge={targetProfessional ? 'Consulta directa' : serviceNeed ? 'Editar problema' : 'Nuevo problema'}
        title={form.title.trim() || 'Describe tu necesidad'}
        subtitle={
          targetProfessional
            ? `Se enviara primero a ${targetProfessional.businessName} y luego podras sumar otros profesionales.`
            : form.city.trim() || 'Guarda un borrador y luego elige a quien enviarlo'
        }
      />

      {serviceNeed ? (
        <View style={styles.statusRow}>
          <StatusBadge status={serviceNeed.status} />
          <Text style={styles.statusCopy}>El borrador se guarda como espacio padre del problema y luego genera varias conversaciones.</Text>
        </View>
      ) : null}

      {targetProfessional ? (
        <View style={[styles.targetCard, shadows.card]}>
          {targetProfessionalImage ? (
            <Image source={{ uri: targetProfessionalImage }} style={styles.targetImage} resizeMode="cover" />
          ) : (
            <ServiceArtwork size="thumb" icon={heroIcon} style={styles.targetArtworkFallback} />
          )}

          <View style={styles.targetBody}>
            <View style={styles.targetTopRow}>
              <View style={styles.targetCopy}>
                <Text numberOfLines={1} style={styles.targetTitle}>
                  {targetProfessional.businessName}
                </Text>
                <Text numberOfLines={2} style={styles.targetSubtitle}>
                  {targetProfessional.headline || 'Profesional aprobado para recibir consultas.'}
                </Text>
              </View>
              <View style={styles.targetRatingPill}>
                <Ionicons color={palette.warning} name="star" size={14} />
                <Text style={styles.targetRatingText}>{formatRating(targetProfessional)}</Text>
              </View>
            </View>

            <View style={styles.targetMetaRow}>
              <View style={styles.targetMetaPill}>
                <Ionicons color={palette.accentDark} name="location-outline" size={14} />
                <Text style={styles.targetMetaText}>{formatLocation(targetProfessional)}</Text>
              </View>
              <View style={styles.targetMetaPill}>
                <Ionicons color={palette.accentDark} name="flash-outline" size={14} />
                <Text style={styles.targetMetaText}>{targetProfessional.availableNow ? 'Disponible ahora' : 'Coordinar horario'}</Text>
              </View>
            </View>

            <Text style={styles.targetHint}>
              {targetAlreadyInvited
                ? 'Este profesional ya tiene un hilo activo para este problema. Puedes guardar cambios o invitar a otros.'
                : 'Al enviarlo desde aqui se abrira el primer hilo con este profesional y luego podras sumar otros o publicarlo.'}
            </Text>
          </View>
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

        <LocationPickerField
          helperText="Busca la direccion o zona del trabajo para guardar ubicacion real y mejorar la seleccion de profesionales."
          label="Ubicacion en mapa"
          latitude={form.lat}
          longitude={form.lng}
          onChangeQuery={updateNeedLocationQuery}
          onSelectLocation={handleNeedLocationSelected}
          placeholder="Buscar direccion, barrio o ciudad"
          query={form.locationQuery}
        />
        <AppInput
          label="Direccion"
          value={form.addressLine}
          onChangeText={(value) => updateLocationTextField('addressLine', value)}
          placeholder="Calle, altura y referencia"
          leftIcon="home-outline"
        />
        <AppInput
          label="Ciudad"
          value={form.city}
          onChangeText={(value) => updateLocationTextField('city', value)}
          placeholder="Ciudad"
          leftIcon="business-outline"
        />
        <AppInput
          label="Provincia"
          value={form.province}
          onChangeText={(value) => updateLocationTextField('province', value)}
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
        {targetProfessional ? (
          <AppButton onPress={handleDirectDispatch} loading={saving} disabled={targetAlreadyInvited}>
            {targetAlreadyInvited
              ? 'Este profesional ya fue invitado'
              : `${serviceNeedId ? 'Guardar y enviar a' : 'Crear y enviar a'} ${targetProfessional.businessName}`}
          </AppButton>
        ) : (
          <AppButton onPress={handleSave} loading={saving}>
            {serviceNeedId ? 'Guardar cambios' : 'Guardar borrador'}
          </AppButton>
        )}
        {targetProfessional ? (
          <>
            <AppButton onPress={handleSave} loading={saving} variant="secondary">
              Guardar borrador
            </AppButton>
            <AppButton onPress={handleSelectProfessionals} loading={saving} variant="ghost">
              {serviceNeed?.requests?.length ? 'Enviar a otros profesionales' : 'Seleccionar profesionales'}
            </AppButton>
          </>
        ) : (
          <AppButton onPress={handleSelectProfessionals} loading={saving} variant="secondary">
            {serviceNeed?.requests?.length ? 'Enviar a otros profesionales' : 'Seleccionar profesionales'}
          </AppButton>
        )}
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
  targetCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  targetImage: {
    width: 104,
    height: 132,
    borderRadius: 20,
    backgroundColor: palette.surfaceMuted,
  },
  targetArtworkFallback: {
    width: 104,
    minHeight: 132,
  },
  targetBody: {
    flex: 1,
    gap: 10,
  },
  targetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  targetCopy: {
    flex: 1,
    gap: 4,
  },
  targetTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  targetSubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  targetRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.warningSoft,
  },
  targetRatingText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  targetMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
  },
  targetMetaText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  targetHint: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
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
