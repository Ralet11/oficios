const React = require('react');
const { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } = require('react-native');
const { useFocusEffect, useNavigation } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { ProfessionalStatus, hasRole } = require('@oficios/domain');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LocationPickerField } = require('../components/LocationPickerField');
const { LoadingView } = require('../components/LoadingView');
const { getProfileCompletion } = require('../components/ProfileProgressBar');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { WorkPostCardLinkedIn } = require('../components/WorkPostCardLinkedIn');
const { WorkPostComposer } = require('../components/WorkPostComposer');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, spacing, type } = require('../theme');

function blankArea() {
  return {
    city: '',
    lat: null,
    lng: null,
    placeId: '',
    province: '',
    query: '',
    radiusKm: '10',
  };
}

function blankWorkPost() {
  return {
    body: '',
    highlightLines: [],
    photoUrls: [],
    title: '',
  };
}

function blankCertification() {
  return {
    credentialId: '',
    evidenceUrl: '',
    issuer: '',
    title: '',
    year: '',
  };
}

function blankReference() {
  return {
    location: '',
    name: '',
    relationship: '',
    summary: '',
  };
}

function normalizeOptionalText(value) {
  const normalized = String(value || '').trim();
  return normalized || undefined;
}

function parseOptionalYear(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizePersonalDetails(form) {
  const personalDetails = {
    languages: String(form.personalLanguages || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6),
  };

  const ageText = String(form.personalAge || '').trim();

  if (ageText) {
    const ageValue = Number(ageText);
    personalDetails.age = Number.isInteger(ageValue) ? ageValue : null;
  }

  const nationality = normalizeOptionalText(form.personalNationality);

  if (nationality) {
    personalDetails.nationality = nationality;
  }

  return personalDetails;
}

function normalizeWorkPosts(posts) {
  return (posts || [])
    .map((post) => ({
      body: String(post.body || '').trim(),
      highlightLines: (post.highlightLines || []).map((line) => String(line).trim()).filter(Boolean).slice(0, 6),
      photoUrls: (post.photoUrls || []).filter(Boolean).slice(0, 8),
      title: String(post.title || '').trim(),
    }))
    .filter((post) => post.title || post.body || post.photoUrls.length || post.highlightLines.length);
}

function normalizeCertifications(certifications) {
  return (certifications || [])
    .map((certification) => ({
      credentialId: normalizeOptionalText(certification.credentialId),
      evidenceUrl: normalizeOptionalText(certification.evidenceUrl),
      issuer: String(certification.issuer || '').trim(),
      title: String(certification.title || '').trim(),
      year: parseOptionalYear(certification.year),
    }))
    .filter(
      (certification) =>
        certification.title ||
        certification.issuer ||
        certification.credentialId ||
        certification.evidenceUrl ||
        certification.year !== undefined,
    );
}

function normalizeReferences(references) {
  return (references || [])
    .map((reference) => ({
      location: normalizeOptionalText(reference.location),
      name: String(reference.name || '').trim(),
      relationship: String(reference.relationship || '').trim(),
      summary: String(reference.summary || '').trim(),
    }))
    .filter((reference) => reference.name || reference.relationship || reference.summary || reference.location);
}

function countValidServiceAreas(serviceAreas) {
  return (serviceAreas || []).filter((area) => area.city?.trim() && area.province?.trim()).length;
}

function countValidWorkPosts(workPosts) {
  return (workPosts || []).filter((post) => post.title?.trim() && post.body?.trim()).length;
}

function buildSummaryLabel(count, singular, plural) {
  if (!count) {
    return `Sin ${plural}`;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

function createValidationError(title, message) {
  const error = new Error(message);
  error.alertTitle = title;
  return error;
}

function HubStat({ label, value }) {
  return (
    <View style={styles.hubStat}>
      <Text style={styles.hubStatValue}>{value}</Text>
      <Text style={styles.hubStatLabel}>{label}</Text>
    </View>
  );
}

function HubModuleCard({
  active,
  children,
  description,
  icon,
  metaItems = [],
  onToggle,
  title,
}) {
  return (
    <View style={styles.moduleCard}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.moduleHeader, pressed && styles.moduleHeaderPressed]}>
        <View style={styles.moduleHeaderMain}>
          <View style={styles.moduleIconWrap}>
            <Ionicons color={palette.accentDark} name={icon} size={18} />
          </View>

          <View style={styles.moduleCopy}>
            <Text style={styles.moduleTitle}>{title}</Text>
            <Text style={styles.moduleDescription}>{description}</Text>

            {metaItems.length ? (
              <View style={styles.moduleMetaRow}>
                {metaItems.map((item) => (
                  <View key={`${title}-${item}`} style={styles.moduleMetaPill}>
                    <Text style={styles.moduleMetaText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.moduleAction}>
          <Text style={styles.moduleActionText}>{active ? 'Cerrar' : 'Editar'}</Text>
          <Ionicons color={palette.muted} name={active ? 'chevron-up' : 'chevron-down'} size={18} />
        </View>
      </Pressable>

      {active ? <View style={styles.moduleBody}>{children}</View> : null}
    </View>
  );
}

function ProfessionalHubScreen() {
  const { token, user, professionalProfile, activateProfessionalRole, setProfessionalProfile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [activationName, setActivationName] = React.useState('');
  const [profileStatus, setProfileStatus] = React.useState('DRAFT');
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [form, setForm] = React.useState({
    availableNow: false,
    avatarUrl: '',
    bio: '',
    businessName: '',
    city: '',
    contactEmail: '',
    contactPhone: '',
    contactWhatsApp: '',
    coverUrl: '',
    headline: '',
    lat: null,
    lng: null,
    locationQuery: '',
    personalAge: '',
    personalLanguages: '',
    personalNationality: '',
    photoUrls: '',
    placeId: '',
    province: '',
    yearsExperience: '0',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState([]);
  const [serviceAreas, setServiceAreas] = React.useState([blankArea()]);
  const [workPosts, setWorkPosts] = React.useState([]);
  const [certifications, setCertifications] = React.useState([]);
  const [references, setReferences] = React.useState([]);
  const [composerVisible, setComposerVisible] = React.useState(false);
  const [composerIndex, setComposerIndex] = React.useState(null);
  const [activeModule, setActiveModule] = React.useState('public');
  const isProfessional = hasRole(user, 'PROFESSIONAL');
  const navigation = useNavigation();

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
          availableNow: Boolean(profile.availableNow),
          avatarUrl: profile.avatarUrl || '',
          bio: profile.bio || '',
          businessName: profile.businessName || '',
          city: profile.city || '',
          contactEmail: profile.contact?.email || '',
          contactPhone: profile.contact?.phone || '',
          contactWhatsApp: profile.contact?.whatsapp || '',
          coverUrl: profile.coverUrl || '',
          headline: profile.headline || '',
          lat: typeof profile.lat === 'number' ? profile.lat : null,
          lng: typeof profile.lng === 'number' ? profile.lng : null,
          locationQuery: [profile.city, profile.province].filter(Boolean).join(', '),
          personalAge: profile.personalDetails?.age ? String(profile.personalDetails.age) : '',
          personalLanguages: (profile.personalDetails?.languages || []).join(', '),
          personalNationality: profile.personalDetails?.nationality || '',
          photoUrls: (profile.photoUrls || []).join('\n'),
          placeId: profile.placeId || '',
          province: profile.province || '',
          yearsExperience: String(profile.yearsExperience || 0),
        });
        setSelectedCategoryIds(profile.categories?.map((category) => category.id) || []);
        setServiceAreas(
          profile.serviceAreas?.length
            ? profile.serviceAreas.map((area) => ({
                city: area.city,
                lat: typeof area.lat === 'number' ? area.lat : null,
                lng: typeof area.lng === 'number' ? area.lng : null,
                placeId: area.placeId || '',
                province: area.province,
                query: [area.city, area.province].filter(Boolean).join(', '),
                radiusKm: String(area.radiusKm),
              }))
            : [blankArea()],
        );
        setWorkPosts(
          profile.workPosts?.length
            ? profile.workPosts.map((post) => ({
                body: post.body || '',
                highlightLines: [...(post.highlightLines || [])],
                photoUrls: [...(post.photoUrls || [])],
                title: post.title || '',
              }))
            : [],
        );
        setCertifications(
          profile.certifications?.length
            ? profile.certifications.map((certification) => ({
                credentialId: certification.credentialId || '',
                evidenceUrl: certification.evidenceUrl || '',
                issuer: certification.issuer || '',
                title: certification.title || '',
                year: certification.year ? String(certification.year) : '',
              }))
            : [],
        );
        setReferences(
          profile.references?.length
            ? profile.references.map((reference) => ({
                location: reference.location || '',
                name: reference.name || '',
                relationship: reference.relationship || '',
                summary: reference.summary || '',
              }))
            : [],
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

  function toggleModule(moduleId) {
    setActiveModule((current) => (current === moduleId ? null : moduleId));
  }

  function updateBaseLocationTextField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      lat: null,
      lng: null,
      placeId: '',
    }));
  }

  function updateBaseLocationQuery(value) {
    setForm((current) => ({
      ...current,
      lat: null,
      lng: null,
      locationQuery: value,
      placeId: '',
    }));
  }

  function handleBaseLocationSelected(location) {
    setForm((current) => ({
      ...current,
      city: location.city || current.city,
      lat: typeof location.lat === 'number' ? location.lat : null,
      lng: typeof location.lng === 'number' ? location.lng : null,
      locationQuery: location.label || current.locationQuery,
      placeId: location.placeId || '',
      province: location.province || current.province,
    }));
  }

  function toggleCategory(categoryId) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  }

  function updateArea(index, key, value) {
    setServiceAreas((current) =>
      current.map((area, currentIndex) =>
        currentIndex === index
          ? {
              ...area,
              [key]: value,
              ...(key === 'city' || key === 'province'
                ? {
                    lat: null,
                    lng: null,
                    placeId: '',
                  }
                : {}),
            }
          : area,
      ),
    );
  }

  function updateAreaQuery(index, value) {
    setServiceAreas((current) =>
      current.map((area, currentIndex) =>
        currentIndex === index
          ? {
              ...area,
              lat: null,
              lng: null,
              placeId: '',
              query: value,
            }
          : area,
      ),
    );
  }

  function handleAreaLocationSelected(index, location) {
    setServiceAreas((current) =>
      current.map((area, currentIndex) =>
        currentIndex === index
          ? {
              ...area,
              city: location.city || area.city,
              lat: typeof location.lat === 'number' ? location.lat : null,
              lng: typeof location.lng === 'number' ? location.lng : null,
              placeId: location.placeId || '',
              province: location.province || area.province,
              query: location.label || area.query,
            }
          : area,
      ),
    );
  }

  function updateCertification(index, key, value) {
    setCertifications((current) =>
      current.map((certification, currentIndex) =>
        currentIndex === index ? { ...certification, [key]: value } : certification,
      ),
    );
  }

  function addCertification() {
    setCertifications((current) => [...current, blankCertification()]);
  }

  function removeCertification(index) {
    setCertifications((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function updateReference(index, key, value) {
    setReferences((current) =>
      current.map((reference, currentIndex) => (currentIndex === index ? { ...reference, [key]: value } : reference)),
    );
  }

  function addReference() {
    setReferences((current) => [...current, blankReference()]);
  }

  function removeReference(index) {
    setReferences((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function openNewPostComposer() {
    setComposerIndex(null);
    setComposerVisible(true);
  }

  function openEditPostComposer(index) {
    setComposerIndex(index);
    setComposerVisible(true);
  }

  function closeComposer() {
    setComposerVisible(false);
    setComposerIndex(null);
  }

  async function persistWorkPosts(nextWorkPosts, options = {}) {
    const normalizedWorkPosts = normalizeWorkPosts(nextWorkPosts);
    const invalidWorkPostIndex = normalizedWorkPosts.findIndex((post) => post.title.length < 2 || post.body.length < 10);

    if (invalidWorkPostIndex >= 0) {
      throw new Error(`El post ${invalidWorkPostIndex + 1} necesita un titulo y una historia del trabajo antes de guardarse.`);
    }

    setSaving(true);

    try {
      await api.saveProfessionalWorkPosts(
        {
          workPosts: normalizedWorkPosts,
        },
        token,
      );
      setWorkPosts(normalizedWorkPosts);

      if (options.refreshProfile) {
        await hydrate();
      }
    } finally {
      setSaving(false);
    }
  }

  function removeWorkPost(index) {
    Alert.alert('Eliminar post', 'Este post dejara de verse en tu perfil profesional.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        style: 'destructive',
        text: 'Eliminar',
        async onPress() {
          try {
            const nextWorkPosts = workPosts.filter((_, currentIndex) => currentIndex !== index);
            await persistWorkPosts(nextWorkPosts);
          } catch (error) {
            Alert.alert('No se pudo eliminar el post', error.message);
          }
        },
      },
    ]);
  }

  async function saveComposerPost(post) {
    const nextWorkPosts =
      composerIndex === null
        ? [...workPosts, post]
        : workPosts.map((currentPost, index) => (index === composerIndex ? post : currentPost));

    await persistWorkPosts(nextWorkPosts);
    closeComposer();
  }

  async function handleActivate() {
    try {
      setSaving(true);
      await activateProfessionalRole({ businessName: activationName });
    } catch (error) {
      Alert.alert('No se pudo activar el rol profesional', error.message);
    } finally {
      setSaving(false);
    }
  }

  function buildProfileSavePayloads() {
    const normalizedWorkPosts = normalizeWorkPosts(workPosts);
    const normalizedPersonalDetails = normalizePersonalDetails(form);
    const normalizedCertifications = normalizeCertifications(certifications);
    const normalizedReferences = normalizeReferences(references);
    const normalizedServiceAreas = serviceAreas
      .map((area) => ({
        city: String(area.city || '').trim(),
        ...(typeof area.lat === 'number' && typeof area.lng === 'number' ? { lat: area.lat, lng: area.lng } : {}),
        ...(normalizeOptionalText(area.placeId) ? { placeId: normalizeOptionalText(area.placeId) } : {}),
        province: String(area.province || '').trim(),
        radiusKm: Number(area.radiusKm || 0),
      }))
      .filter(
        (area) =>
          area.city ||
          area.province ||
          area.placeId ||
          typeof area.lat === 'number' ||
          typeof area.lng === 'number',
      );
    const invalidWorkPostIndex = normalizedWorkPosts.findIndex((post) => post.title.length < 2 || post.body.length < 10);
    const invalidCertificationIndex = normalizedCertifications.findIndex(
      (certification) => certification.title.length < 2 || certification.issuer.length < 2 || certification.year === null,
    );
    const invalidReferenceIndex = normalizedReferences.findIndex(
      (reference) => reference.name.length < 2 || reference.relationship.length < 2 || reference.summary.length < 10,
    );
    const invalidServiceAreaIndex = normalizedServiceAreas.findIndex(
      (area) => area.city.length < 2 || area.province.length < 2 || area.radiusKm <= 0 || area.radiusKm > 100,
    );

    if (invalidWorkPostIndex >= 0) {
      throw createValidationError(
        'Completa el post',
        `El post ${invalidWorkPostIndex + 1} necesita un titulo y una historia del trabajo antes de guardarse.`,
      );
    }

    if (normalizedPersonalDetails.age === null) {
      throw createValidationError('Edad invalida', 'Si completas la edad, usa un numero entero.');
    }

    if (invalidCertificationIndex >= 0) {
      throw createValidationError(
        'Completa la certificacion',
        `La certificacion ${invalidCertificationIndex + 1} necesita titulo, emisor y un ano valido si decides mostrarlo.`,
      );
    }

    if (invalidReferenceIndex >= 0) {
      throw createValidationError(
        'Completa la referencia',
        `La referencia ${invalidReferenceIndex + 1} necesita nombre, relacion y una descripcion clara.`,
      );
    }

    if (String(form.businessName || '').trim().length < 2) {
      throw createValidationError('Completa el nombre comercial', 'Ingresa un nombre comercial de al menos 2 caracteres.');
    }

    if (String(form.headline || '').trim().length < 2) {
      throw createValidationError('Completa la propuesta breve', 'Agrega una propuesta breve para mostrar tu servicio.');
    }

    if (String(form.bio || '').trim().length < 20) {
      throw createValidationError('Completa la biografia', 'La biografia necesita al menos 20 caracteres.');
    }

    if (String(form.city || '').trim().length < 2 || String(form.province || '').trim().length < 2) {
      throw createValidationError('Completa tu ubicacion base', 'Define una ciudad y provincia base para tu perfil.');
    }

    if (String(form.contactPhone || '').trim().length < 6) {
      throw createValidationError('Completa el telefono', 'Ingresa un telefono de contacto valido.');
    }

    if (!selectedCategoryIds.length) {
      throw createValidationError('Falta una categoria', 'Selecciona al menos una categoria para tu perfil profesional.');
    }

    if (!normalizedServiceAreas.length) {
      throw createValidationError('Agrega una zona', 'Configura al menos una zona de servicio antes de continuar.');
    }

    if (invalidServiceAreaIndex >= 0) {
      throw createValidationError(
        'Completa la zona',
        `La zona ${invalidServiceAreaIndex + 1} necesita ciudad, provincia y un radio valido.`,
      );
    }

    const normalizedProfilePayload = {
      availableNow: Boolean(form.availableNow),
      bio: String(form.bio || '').trim(),
      businessName: String(form.businessName || '').trim(),
      city: String(form.city || '').trim(),
      contactPhone: String(form.contactPhone || '').trim(),
      headline: String(form.headline || '').trim(),
      ...(typeof form.lat === 'number' && typeof form.lng === 'number' ? { lat: form.lat, lng: form.lng } : {}),
      personalDetails: normalizedPersonalDetails,
      photoUrls: form.photoUrls
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      ...(normalizeOptionalText(form.placeId) ? { placeId: normalizeOptionalText(form.placeId) } : {}),
      province: String(form.province || '').trim(),
      yearsExperience: Number(form.yearsExperience || 0),
      certifications: normalizedCertifications.map(({ year, ...certification }) => ({
        ...certification,
        ...(typeof year === 'number' ? { year } : {}),
      })),
      references: normalizedReferences,
    };

    const optionalFields = {
      avatarUrl: normalizeOptionalText(form.avatarUrl),
      contactEmail: normalizeOptionalText(form.contactEmail),
      contactWhatsApp: normalizeOptionalText(form.contactWhatsApp),
      coverUrl: normalizeOptionalText(form.coverUrl),
    };

    return {
      profilePayload: {
        ...normalizedProfilePayload,
        ...Object.fromEntries(Object.entries(optionalFields).filter(([, value]) => value !== undefined)),
      },
      categoriesPayload: { categoryIds: selectedCategoryIds },
      serviceAreasPayload: { serviceAreas: normalizedServiceAreas },
      workPostsPayload: { workPosts: normalizedWorkPosts },
    };
  }

  async function persistProfile(options = {}) {
    const { refreshProfile = true, showSuccessAlert = false } = options;
    const { profilePayload, categoriesPayload, serviceAreasPayload, workPostsPayload } = buildProfileSavePayloads();

    await api.saveProfessionalProfile(profilePayload, token);
    await api.saveProfessionalCategories(categoriesPayload, token);
    await api.saveProfessionalServiceAreas(serviceAreasPayload, token);
    await api.saveProfessionalWorkPosts(workPostsPayload, token);

    if (refreshProfile) {
      await hydrate();
    }

    if (showSuccessAlert) {
      Alert.alert('Perfil actualizado', 'Los cambios se guardaron correctamente.');
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      await persistProfile({ showSuccessAlert: true });
    } catch (error) {
      Alert.alert(error.alertTitle || 'No se pudo guardar el perfil', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitForApproval() {
    try {
      if (profileStatus === ProfessionalStatus.APPROVED) {
        Alert.alert('Perfil aprobado', 'Tu perfil ya esta aprobado. Guarda cambios si necesitas actualizarlo.');
        return;
      }

      if (profileStatus === ProfessionalStatus.PENDING_APPROVAL) {
        Alert.alert('Perfil en moderacion', 'Tu perfil ya fue enviado y sigue pendiente de revision.');
        return;
      }

      setSaving(true);
      await persistProfile({ refreshProfile: false });
      await api.submitProfessionalProfile(token);
      await hydrate();
      Alert.alert('Perfil enviado', 'Tu perfil se guardo y ya quedo enviado a moderacion.');
    } catch (error) {
      Alert.alert(error.alertTitle || 'No se pudo enviar a moderacion', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando hub profesional..." />;
  }

  if (!isProfessional) {
    return (
      <Screen gradient contentStyle={styles.onboardingScreen}>
        <View style={styles.onboardingHero}>
          <Text style={styles.onboardingEyebrow}>Onboarding profesional</Text>
          <Text style={styles.onboardingTitle}>Conviertete en profesional</Text>
          <Text style={styles.onboardingText}>
            Activa tu perfil profesional y entra a un recorrido separado para completar tu hub, tus zonas y tus trabajos previos.
          </Text>

          <View style={styles.onboardingSteps}>
            {[
              'Activa tu perfil',
              'Completa tu informacion publica',
              'Envia tu perfil a aprobacion',
            ].map((step, index) => (
              <View key={step} style={styles.onboardingStep}>
                <View style={styles.onboardingStepIndex}>
                  <Text style={styles.onboardingStepIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.onboardingStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionCard
          title="Empezar onboarding"
          subtitle="Usa un nombre comercial o la forma en que quieres aparecer cuando los clientes te busquen."
        >
          <AppInput
            autoFocus
            label="Nombre comercial"
            onChangeText={setActivationName}
            placeholder="Ej: Ramirez Plomeria"
            value={activationName}
          />
          <AppButton loading={saving} onPress={handleActivate}>
            Empezar como profesional
          </AppButton>
        </SectionCard>
      </Screen>
    );
  }

  const composerPost = composerIndex === null ? blankWorkPost() : workPosts[composerIndex] || blankWorkPost();
  const profilePhotoUrls = form.photoUrls
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  const profileCompletion = getProfileCompletion(
    {
      ...form,
      photoUrls: profilePhotoUrls,
    },
    selectedCategoryIds,
    serviceAreas,
    workPosts,
  );
  const validServiceAreasCount = countValidServiceAreas(serviceAreas);
  const validWorkPostsCount = countValidWorkPosts(workPosts);
  const publicProfileId = professionalProfile?.id || null;
  const publicProfileMeta = [
    form.headline?.trim() ? 'Headline listo' : 'Falta headline',
    buildSummaryLabel(selectedCategoryIds.length, 'categoria', 'categorias'),
    buildSummaryLabel(profilePhotoUrls.length, 'foto', 'fotos'),
  ];
  const coverageMeta = [
    form.city?.trim() ? form.city.trim() : 'Sin base',
    buildSummaryLabel(validServiceAreasCount, 'zona', 'zonas'),
    form.availableNow ? 'Disponible ahora' : 'Coordinable',
  ];
  const credentialsMeta = [
    buildSummaryLabel(certifications.length, 'certificacion', 'certificaciones'),
    buildSummaryLabel(references.length, 'referencia', 'referencias'),
  ];
  const workPostsMeta = [
    buildSummaryLabel(validWorkPostsCount, 'post publicado', 'posts publicados'),
    `${workPosts.reduce((total, post) => total + (post.photoUrls?.length || 0), 0)} fotos`,
  ];
  const canSubmitForApproval =
    profileStatus !== ProfessionalStatus.APPROVED && profileStatus !== ProfessionalStatus.PENDING_APPROVAL;
  const footerActionsCopy =
    profileStatus === ProfessionalStatus.APPROVED
      ? 'Tu perfil ya esta aprobado. Guarda cambios cuando actualices informacion publica.'
      : profileStatus === ProfessionalStatus.PENDING_APPROVAL
        ? 'Tu perfil ya esta en moderacion. Puedes guardar cambios si necesitas ajustar algun detalle.'
        : 'Guarda avances cuando quieras. Cuando sientas que el perfil ya representa bien tu trabajo, envialo a moderacion.';

  return (
    <>
      <Screen gradient>
        <View style={styles.overviewCard}>
          <View style={styles.overviewTopRow}>
            <View style={styles.overviewCopy}>
              <Text style={styles.overviewEyebrow}>Mi hub profesional</Text>
              <Text style={styles.overviewTitle}>{form.businessName?.trim() || 'Completa tu perfil profesional'}</Text>
              <Text style={styles.overviewText}>
                Gestiona lo que vera el cliente y lo que te falta para quedar listo para moderacion.
              </Text>
            </View>

            <StatusBadge status={profileStatus} />
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Perfil publico listo</Text>
            <Text style={styles.progressValue}>{profileCompletion}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${profileCompletion}%` }]} />
          </View>

          {rejectionReason ? <Text style={styles.rejection}>{rejectionReason}</Text> : null}

          <View style={styles.statsGrid}>
            <HubStat label="Categorias" value={selectedCategoryIds.length} />
            <HubStat label="Zonas" value={validServiceAreasCount} />
            <HubStat label="Posts" value={validWorkPostsCount} />
            <HubStat label="Credenciales" value={certifications.length + references.length} />
          </View>

          <View style={styles.quickActionsRow}>
            {publicProfileId ? (
              <Pressable
                onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: publicProfileId })}
                style={({ pressed }) => [styles.quickActionPill, pressed && styles.quickActionPillPressed]}
              >
                <Ionicons color={palette.accentDark} name="eye-outline" size={16} />
                <Text style={styles.quickActionText}>Ver perfil publico</Text>
              </Pressable>
            ) : null}

            {profileStatus === 'APPROVED' ? (
              <Pressable
                onPress={() => navigation.navigate('OpportunitiesBoard')}
                style={({ pressed }) => [styles.quickActionPill, pressed && styles.quickActionPillPressed]}
              >
                <Ionicons color={palette.accentDark} name="briefcase-outline" size={16} />
                <Text style={styles.quickActionText}>Ver oportunidades</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <HubModuleCard
          active={activeModule === 'public'}
          description="Nombre, propuesta, fotos, categorias y datos opcionales que forman tu identidad publica."
          icon="person-circle-outline"
          metaItems={publicProfileMeta}
          onToggle={() => toggleModule('public')}
          title="Perfil publico"
        >
          <AppInput label="Nombre comercial" onChangeText={(value) => updateField('businessName', value)} value={form.businessName} />
          <AppInput label="Propuesta breve" onChangeText={(value) => updateField('headline', value)} value={form.headline} />
          <AppInput label="Biografia" multiline onChangeText={(value) => updateField('bio', value)} value={form.bio} />
          <AppInput
            keyboardType="numeric"
            label="Anos de experiencia"
            onChangeText={(value) => updateField('yearsExperience', value)}
            value={form.yearsExperience}
          />
          <AppInput autoCapitalize="none" label="Avatar URL" onChangeText={(value) => updateField('avatarUrl', value)} value={form.avatarUrl} />
          <AppInput autoCapitalize="none" label="Cover URL" onChangeText={(value) => updateField('coverUrl', value)} value={form.coverUrl} />
          <AppInput
            helperText="Una URL por linea."
            label="URLs de fotos"
            multiline
            onChangeText={(value) => updateField('photoUrls', value)}
            value={form.photoUrls}
          />

          <Text style={styles.moduleSubheading}>Datos personales opcionales</Text>
          <Text style={styles.sectionHelperText}>
            Suman contexto a tu perfil publico, pero no son obligatorios para activarte como profesional.
          </Text>
          <AppInput
            keyboardType="number-pad"
            label="Edad"
            onChangeText={(value) => updateField('personalAge', value)}
            value={form.personalAge}
          />
          <AppInput
            label="Nacionalidad"
            onChangeText={(value) => updateField('personalNationality', value)}
            value={form.personalNationality}
          />
          <AppInput
            helperText="Separalos por coma. Ej: Espanol, Ingles."
            label="Idiomas"
            onChangeText={(value) => updateField('personalLanguages', value)}
            value={form.personalLanguages}
          />

          <Text style={styles.moduleSubheading}>Categorias visibles</Text>
          <Text style={styles.sectionHelperText}>
            Elige solo las categorias donde realmente quieres aparecer en el catalogo y recibir solicitudes.
          </Text>
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
        </HubModuleCard>

        <HubModuleCard
          active={activeModule === 'coverage'}
          description="Cobertura, disponibilidad y datos de contacto para coordinar cuando una solicitud avance."
          icon="locate-outline"
          metaItems={coverageMeta}
          onToggle={() => toggleModule('coverage')}
          title="Cobertura y contacto"
        >
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Disponible ahora</Text>
            <Switch onValueChange={(value) => updateField('availableNow', value)} trackColor={{ true: palette.accent }} value={form.availableNow} />
          </View>
          <LocationPickerField
            helperText="Marca tu punto base para que la cobertura y la busqueda por cercania queden mejor definidas."
            label="Ubicacion base en mapa"
            latitude={form.lat}
            longitude={form.lng}
            onChangeQuery={updateBaseLocationQuery}
            onSelectLocation={handleBaseLocationSelected}
            placeholder="Buscar ciudad, barrio o direccion base"
            query={form.locationQuery}
          />
          <AppInput label="Ciudad base" onChangeText={(value) => updateBaseLocationTextField('city', value)} value={form.city} />
          <AppInput label="Provincia base" onChangeText={(value) => updateBaseLocationTextField('province', value)} value={form.province} />
          <AppInput label="Telefono" onChangeText={(value) => updateField('contactPhone', value)} value={form.contactPhone} />
          <AppInput label="WhatsApp" onChangeText={(value) => updateField('contactWhatsApp', value)} value={form.contactWhatsApp} />
          <AppInput autoCapitalize="none" label="Email de contacto" onChangeText={(value) => updateField('contactEmail', value)} value={form.contactEmail} />

          <Text style={styles.moduleSubheading}>Zonas donde trabajas</Text>
          <Text style={styles.sectionHelperText}>
            Configura una o varias zonas para que el matching por distancia sea mas preciso.
          </Text>
          {serviceAreas.map((area, index) => (
            <View key={`${index}-${area.city}-${area.province}`} style={styles.areaBlock}>
              <LocationPickerField
                helperText="Busca la zona donde sueles trabajar y ajusta luego el radio de cobertura."
                label={`Zona ${index + 1}`}
                latitude={area.lat}
                longitude={area.lng}
                onChangeQuery={(value) => updateAreaQuery(index, value)}
                onSelectLocation={(location) => handleAreaLocationSelected(index, location)}
                placeholder="Buscar ciudad, barrio o punto de referencia"
                query={area.query}
                radiusKm={area.radiusKm}
              />
              <AppInput label="Ciudad" onChangeText={(value) => updateArea(index, 'city', value)} value={area.city} />
              <AppInput label="Provincia" onChangeText={(value) => updateArea(index, 'province', value)} value={area.province} />
              <AppInput
                keyboardType="numeric"
                label="Radio km"
                onChangeText={(value) => updateArea(index, 'radiusKm', value)}
                value={area.radiusKm}
              />
            </View>
          ))}
          <AppButton onPress={() => setServiceAreas((current) => [...current, blankArea()])} variant="secondary">
            Agregar zona
          </AppButton>
        </HubModuleCard>

        <HubModuleCard
          active={activeModule === 'credentials'}
          description="Cursos, matriculas, credenciales y referencias que suman contexto a tu perfil."
          icon="ribbon-outline"
          metaItems={credentialsMeta}
          onToggle={() => toggleModule('credentials')}
          title="Credenciales y referencias"
        >
          <Text style={styles.sectionHelperText}>
            Agrega cursos, matriculas o credenciales que quieras mostrar en tu perfil publico.
          </Text>

          {certifications.length ? (
            certifications.map((certification, index) => (
              <View key={`certification-${index}`} style={styles.detailBlock}>
                <View style={styles.detailBlockHeader}>
                  <Text style={styles.detailBlockTitle}>Certificacion {index + 1}</Text>
                  <Pressable hitSlop={8} onPress={() => removeCertification(index)}>
                    <Text style={styles.detailBlockAction}>Quitar</Text>
                  </Pressable>
                </View>

                <AppInput
                  label="Titulo"
                  onChangeText={(value) => updateCertification(index, 'title', value)}
                  value={certification.title}
                />
                <AppInput
                  label="Institucion o emisor"
                  onChangeText={(value) => updateCertification(index, 'issuer', value)}
                  value={certification.issuer}
                />
                <AppInput
                  keyboardType="number-pad"
                  label="Ano"
                  onChangeText={(value) => updateCertification(index, 'year', value)}
                  value={certification.year}
                />
                <AppInput
                  label="Codigo o matricula"
                  onChangeText={(value) => updateCertification(index, 'credentialId', value)}
                  value={certification.credentialId}
                />
                <AppInput
                  autoCapitalize="none"
                  helperText="Si tienes un respaldo publico, pega la URL."
                  label="URL de respaldo"
                  onChangeText={(value) => updateCertification(index, 'evidenceUrl', value)}
                  value={certification.evidenceUrl}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyInlineCard}>
              <Text style={styles.emptyInlineTitle}>Aun no cargaste certificaciones.</Text>
              <Text style={styles.emptyInlineText}>Puedes sumar cursos, matriculas o credenciales cuando quieras.</Text>
            </View>
          )}

          <AppButton icon="add-circle-outline" onPress={addCertification} variant="secondary">
            Agregar certificacion
          </AppButton>

          <Text style={styles.moduleSubheading}>Referencias declaradas</Text>
          <Text style={styles.sectionHelperText}>
            Estas referencias se muestran como compartidas por ti. En el MVP no se marcan como verificadas por la plataforma.
          </Text>

          {references.length ? (
            references.map((reference, index) => (
              <View key={`reference-${index}`} style={styles.detailBlock}>
                <View style={styles.detailBlockHeader}>
                  <Text style={styles.detailBlockTitle}>Referencia {index + 1}</Text>
                  <Pressable hitSlop={8} onPress={() => removeReference(index)}>
                    <Text style={styles.detailBlockAction}>Quitar</Text>
                  </Pressable>
                </View>

                <AppInput
                  label="Nombre"
                  onChangeText={(value) => updateReference(index, 'name', value)}
                  value={reference.name}
                />
                <AppInput
                  label="Relacion"
                  onChangeText={(value) => updateReference(index, 'relationship', value)}
                  value={reference.relationship}
                />
                <AppInput
                  label="Ubicacion o contexto"
                  onChangeText={(value) => updateReference(index, 'location', value)}
                  value={reference.location}
                />
                <AppInput
                  label="Comentario"
                  multiline
                  onChangeText={(value) => updateReference(index, 'summary', value)}
                  value={reference.summary}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyInlineCard}>
              <Text style={styles.emptyInlineTitle}>Aun no agregaste referencias.</Text>
              <Text style={styles.emptyInlineText}>Sirven para mostrar historial y contexto extra del profesional.</Text>
            </View>
          )}

          <AppButton icon="add-circle-outline" onPress={addReference} variant="secondary">
            Agregar referencia
          </AppButton>
        </HubModuleCard>

        <HubModuleCard
          active={activeModule === 'workPosts'}
          description="Historias reales de trabajos terminados para reforzar tu perfil publico."
          icon="images-outline"
          metaItems={workPostsMeta}
          onToggle={() => toggleModule('workPosts')}
          title="Trabajos previos"
        >
          <View style={styles.postsToolbar}>
            <View style={styles.postsToolbarCopy}>
              <Text style={styles.moduleSubheading}>Postea trabajos reales</Text>
              <Text style={styles.sectionHelperText}>
                Cada post debe contar rapido que hiciste, mostrar fotos y dejar claro el resultado.
              </Text>
            </View>
            <AppButton icon="add-circle-outline" onPress={openNewPostComposer} style={styles.postsToolbarButton}>
              Crear post
            </AppButton>
          </View>

          {workPosts.length ? (
            workPosts.map((post, index) => (
              <WorkPostCardLinkedIn
                key={`work-post-${index}`}
                onPress={() => openEditPostComposer(index)}
                post={post}
                style={styles.workPostLinkedIn}
              />
            ))
          ) : (
            <View style={styles.emptyStudio}>
              <EmptyState
                message="Crea el primer post con fotos desde el telefono para que tu perfil se sienta mucho mas real."
                title="Todavia no publicaste trabajos"
              />
              <AppButton icon="add-circle-outline" onPress={openNewPostComposer} style={styles.emptyStudioButton}>
                Empezar mi primer post
              </AppButton>
            </View>
          )}
        </HubModuleCard>

        <View style={styles.footerActionsCard}>
          <Text style={styles.footerActionsTitle}>Guardar y enviar</Text>
          <Text style={styles.footerActionsCopy}>{footerActionsCopy}</Text>
          <AppButton loading={saving} onPress={saveProfile}>
            Guardar perfil profesional
          </AppButton>
          {canSubmitForApproval ? (
            <AppButton loading={saving} onPress={submitForApproval} variant="ghost">
              Enviar a aprobacion
            </AppButton>
          ) : null}
        </View>
      </Screen>

      <WorkPostComposer
        initialPost={composerPost}
        mode={composerIndex === null ? 'create' : 'edit'}
        onClose={closeComposer}
        onSave={saveComposerPost}
        visible={composerVisible}
      />
    </>
  );

  return (
    <>
      <Screen gradient>
        <View style={styles.header}>
          <Text style={styles.title}>Hub profesional</Text>
          <Text style={styles.copy}>Completa tu ficha, publica trabajos reales y deja el perfil listo para moderacion.</Text>
        </View>

        {/* Barra de progreso de completitud */}
        <ProfileProgressBar
          profile={{
            ...form,
            photoUrls: form.photoUrls.split('\n').map((item) => item.trim()).filter(Boolean),
          }}
          categories={selectedCategoryIds}
          serviceAreas={serviceAreas}
          workPosts={workPosts}
        />

        <CollapsibleSection
          defaultExpanded
          icon="clipboard-check"
          title="Estado del perfil"
        >
          <StatusBadge status={profileStatus} />
          <Text style={styles.stateText}>Guarda los cambios y luego envia el perfil a moderacion.</Text>
          {rejectionReason ? <Text style={styles.rejection}>{rejectionReason}</Text> : null}
        </CollapsibleSection>

        {profileStatus === 'APPROVED' ? (
          <CollapsibleSection icon="briefcase" title="Oportunidades de trabajo">
            <View style={styles.opportunitiesCard}>
              <Ionicons name="briefcase-outline" size={32} color={palette.accent} />
              <Text style={styles.opportunitiesText}>
                Explora necesidades publicadas por clientes y expresá tu interés para conseguir nuevos trabajos.
              </Text>
              <AppButton onPress={() => navigation.navigate('OpportunitiesBoard')}>
                Ver Tablero de Oportunidades
              </AppButton>
            </View>
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection icon="account-edit" title="Ficha profesional">
          <AppInput label="Nombre comercial" onChangeText={(value) => updateField('businessName', value)} value={form.businessName} />
          <AppInput label="Titular" onChangeText={(value) => updateField('headline', value)} value={form.headline} />
          <AppInput label="Biografia" multiline onChangeText={(value) => updateField('bio', value)} value={form.bio} />
          <AppInput
            keyboardType="numeric"
            label="Anos de experiencia"
            onChangeText={(value) => updateField('yearsExperience', value)}
            value={form.yearsExperience}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Disponible ahora</Text>
            <Switch onValueChange={(value) => updateField('availableNow', value)} trackColor={{ true: palette.accent }} value={form.availableNow} />
          </View>
          <LocationPickerField
            helperText="Marca tu punto base para que la cobertura y la busqueda por cercania queden mejor definidas."
            label="Ubicacion base en mapa"
            latitude={form.lat}
            longitude={form.lng}
            onChangeQuery={updateBaseLocationQuery}
            onSelectLocation={handleBaseLocationSelected}
            placeholder="Buscar ciudad, barrio o direccion base"
            query={form.locationQuery}
          />
          <AppInput label="Ciudad base" onChangeText={(value) => updateBaseLocationTextField('city', value)} value={form.city} />
          <AppInput label="Provincia base" onChangeText={(value) => updateBaseLocationTextField('province', value)} value={form.province} />
          <AppInput label="Telefono" onChangeText={(value) => updateField('contactPhone', value)} value={form.contactPhone} />
          <AppInput label="WhatsApp" onChangeText={(value) => updateField('contactWhatsApp', value)} value={form.contactWhatsApp} />
          <AppInput autoCapitalize="none" label="Email de contacto" onChangeText={(value) => updateField('contactEmail', value)} value={form.contactEmail} />
          <AppInput autoCapitalize="none" label="Avatar URL" onChangeText={(value) => updateField('avatarUrl', value)} value={form.avatarUrl} />
          <AppInput autoCapitalize="none" label="Cover URL" onChangeText={(value) => updateField('coverUrl', value)} value={form.coverUrl} />
          <AppInput
            helperText="Una URL por linea."
            label="URLs de fotos"
            multiline
            onChangeText={(value) => updateField('photoUrls', value)}
            value={form.photoUrls}
          />
        </CollapsibleSection>

        <CollapsibleSection icon="card-account-details-outline" title="Datos personales opcionales">
          <Text style={styles.sectionHelperText}>
            Suman contexto a tu perfil publico, pero no son obligatorios para activarte como profesional.
          </Text>
          <AppInput
            keyboardType="number-pad"
            label="Edad"
            onChangeText={(value) => updateField('personalAge', value)}
            value={form.personalAge}
          />
          <AppInput
            label="Nacionalidad"
            onChangeText={(value) => updateField('personalNationality', value)}
            value={form.personalNationality}
          />
          <AppInput
            helperText="Separalos por coma. Ej: Espanol, Ingles."
            label="Idiomas"
            onChangeText={(value) => updateField('personalLanguages', value)}
            value={form.personalLanguages}
          />
        </CollapsibleSection>

        <CollapsibleSection icon="certificate-outline" title="Certificaciones">
          <Text style={styles.sectionHelperText}>
            Agrega cursos, matriculas o credenciales que quieras mostrar en tu perfil publico.
          </Text>

          {certifications.length ? (
            certifications.map((certification, index) => (
              <View key={`certification-${index}`} style={styles.detailBlock}>
                <View style={styles.detailBlockHeader}>
                  <Text style={styles.detailBlockTitle}>Certificacion {index + 1}</Text>
                  <Pressable hitSlop={8} onPress={() => removeCertification(index)}>
                    <Text style={styles.detailBlockAction}>Quitar</Text>
                  </Pressable>
                </View>

                <AppInput
                  label="Titulo"
                  onChangeText={(value) => updateCertification(index, 'title', value)}
                  value={certification.title}
                />
                <AppInput
                  label="Institucion o emisor"
                  onChangeText={(value) => updateCertification(index, 'issuer', value)}
                  value={certification.issuer}
                />
                <AppInput
                  keyboardType="number-pad"
                  label="Ano"
                  onChangeText={(value) => updateCertification(index, 'year', value)}
                  value={certification.year}
                />
                <AppInput
                  label="Codigo o matricula"
                  onChangeText={(value) => updateCertification(index, 'credentialId', value)}
                  value={certification.credentialId}
                />
                <AppInput
                  autoCapitalize="none"
                  helperText="Si tienes un respaldo publico, pega la URL."
                  label="URL de respaldo"
                  onChangeText={(value) => updateCertification(index, 'evidenceUrl', value)}
                  value={certification.evidenceUrl}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyInlineCard}>
              <Text style={styles.emptyInlineTitle}>Aun no cargaste certificaciones.</Text>
              <Text style={styles.emptyInlineText}>Puedes sumar cursos, matriculas o credenciales cuando quieras.</Text>
            </View>
          )}

          <AppButton icon="add-circle-outline" onPress={addCertification} variant="secondary">
            Agregar certificacion
          </AppButton>
        </CollapsibleSection>

        <CollapsibleSection icon="account-star-outline" title="Referencias declaradas">
          <Text style={styles.sectionHelperText}>
            Estas referencias se muestran como compartidas por ti. En el MVP no se marcan como verificadas por la plataforma.
          </Text>

          {references.length ? (
            references.map((reference, index) => (
              <View key={`reference-${index}`} style={styles.detailBlock}>
                <View style={styles.detailBlockHeader}>
                  <Text style={styles.detailBlockTitle}>Referencia {index + 1}</Text>
                  <Pressable hitSlop={8} onPress={() => removeReference(index)}>
                    <Text style={styles.detailBlockAction}>Quitar</Text>
                  </Pressable>
                </View>

                <AppInput
                  label="Nombre"
                  onChangeText={(value) => updateReference(index, 'name', value)}
                  value={reference.name}
                />
                <AppInput
                  label="Relacion"
                  onChangeText={(value) => updateReference(index, 'relationship', value)}
                  value={reference.relationship}
                />
                <AppInput
                  label="Ubicacion o contexto"
                  onChangeText={(value) => updateReference(index, 'location', value)}
                  value={reference.location}
                />
                <AppInput
                  label="Comentario"
                  multiline
                  onChangeText={(value) => updateReference(index, 'summary', value)}
                  value={reference.summary}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyInlineCard}>
              <Text style={styles.emptyInlineTitle}>Aun no agregaste referencias.</Text>
              <Text style={styles.emptyInlineText}>Sirven para mostrar historial y contexto extra del profesional.</Text>
            </View>
          )}

          <AppButton icon="add-circle-outline" onPress={addReference} variant="secondary">
            Agregar referencia
          </AppButton>
        </CollapsibleSection>

        <CollapsibleSection icon="tag-multiple" title="Categorias">
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
        </CollapsibleSection>

        <CollapsibleSection
          icon="map-marker-radius"
          title="Zonas de servicio"
          footer={
            <AppButton onPress={() => setServiceAreas((current) => [...current, blankArea()])} variant="secondary">
              Agregar zona
            </AppButton>
          }
        >
          {serviceAreas.map((area, index) => (
            <View key={`${index}-${area.city}-${area.province}`} style={styles.areaBlock}>
              <LocationPickerField
                helperText="Busca la zona donde sueles trabajar y ajusta luego el radio de cobertura."
                label={`Zona ${index + 1}`}
                latitude={area.lat}
                longitude={area.lng}
                onChangeQuery={(value) => updateAreaQuery(index, value)}
                onSelectLocation={(location) => handleAreaLocationSelected(index, location)}
                placeholder="Buscar ciudad, barrio o punto de referencia"
                query={area.query}
                radiusKm={area.radiusKm}
              />
              <AppInput label="Ciudad" onChangeText={(value) => updateArea(index, 'city', value)} value={area.city} />
              <AppInput label="Provincia" onChangeText={(value) => updateArea(index, 'province', value)} value={area.province} />
              <AppInput
                keyboardType="numeric"
                label="Radio km"
                onChangeText={(value) => updateArea(index, 'radiusKm', value)}
                value={area.radiusKm}
              />
            </View>
          ))}
        </CollapsibleSection>

        <CollapsibleSection
          icon="hammer-screwdriver"
          title="Trabajos previos"
          subtitle="Crea posts visuales para mostrar obras terminadas como una mini historia."
        >
          <LinearGradient colors={[palette.ink, '#2B7BD8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.postStudioHero}>
            <View style={styles.postStudioTopRow}>
              <View style={styles.postStudioBadge}>
                <Ionicons color={palette.white} name="sparkles-outline" size={14} />
                <Text style={styles.postStudioBadgeText}>Post studio</Text>
              </View>
              <Text style={styles.postStudioCount}>{workPosts.length} posts</Text>
            </View>
            <Text style={styles.postStudioTitle}>Publica un trabajo como si fuera una pieza editorial.</Text>
            <Text style={styles.postStudioCopy}>
              Foto de portada, relato corto, mensajes clave y una experiencia de carga mas natural desde camara o galeria.
            </Text>
            <View style={styles.postStudioStats}>
              <View style={styles.postStudioStatCard}>
                <Text style={styles.postStudioStatNumber}>8</Text>
                <Text style={styles.postStudioStatLabel}>fotos por post</Text>
              </View>
              <View style={styles.postStudioStatCard}>
                <Text style={styles.postStudioStatNumber}>6</Text>
                <Text style={styles.postStudioStatLabel}>mensajes cortos</Text>
              </View>
            </View>
            <AppButton icon="add-circle-outline" onPress={openNewPostComposer} style={styles.postStudioButton}>
              Crear nuevo post
            </AppButton>
          </LinearGradient>

          {workPosts.length ? (
            workPosts.map((post, index) => (
              <WorkPostCardLinkedIn
                key={`work-post-${index}`}
                onPress={() => openEditPostComposer(index)}
                post={post}
                style={styles.workPostLinkedIn}
              />
            ))
          ) : (
            <View style={styles.emptyStudio}>
              <EmptyState
                message="Crea el primer post con fotos desde el telefono para que tu perfil se sienta mucho mas real."
                title="Todavia no publicaste trabajos"
              />
              <AppButton icon="add-circle-outline" onPress={openNewPostComposer} style={styles.emptyStudioButton}>
                Empezar mi primer post
              </AppButton>
            </View>
          )}
        </CollapsibleSection>

        <AppButton loading={saving} onPress={saveProfile}>
          Guardar perfil profesional
        </AppButton>
        <AppButton loading={saving} onPress={submitForApproval} variant="ghost">
          Enviar a aprobacion
        </AppButton>
      </Screen>

      <WorkPostComposer
        initialPost={composerPost}
        mode={composerIndex === null ? 'create' : 'edit'}
        onClose={closeComposer}
        onSave={saveComposerPost}
        visible={composerVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  onboardingScreen: {
    gap: 18,
    paddingBottom: 120,
  },
  onboardingHero: {
    gap: 14,
    padding: 22,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  onboardingEyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  onboardingTitle: {
    color: palette.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  onboardingText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  onboardingSteps: {
    gap: 10,
    marginTop: 2,
  },
  onboardingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: palette.surfaceElevated,
  },
  onboardingStepIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  onboardingStepIndexText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  onboardingStepText: {
    flex: 1,
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  overviewCard: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    gap: 16,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  overviewCopy: {
    flex: 1,
    gap: 6,
  },
  overviewEyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  overviewTitle: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  overviewText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    color: palette.accentDark,
    fontSize: 18,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accentDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hubStat: {
    flexGrow: 1,
    minWidth: 132,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
    gap: 4,
  },
  hubStatValue: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  hubStatLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  quickActionPillPressed: {
    opacity: 0.85,
  },
  quickActionText: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },
  moduleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.white,
    overflow: 'hidden',
  },
  moduleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  moduleHeaderPressed: {
    backgroundColor: palette.surfaceElevated,
  },
  moduleHeaderMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  moduleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  moduleCopy: {
    flex: 1,
    gap: 8,
  },
  moduleTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  moduleDescription: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  moduleMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleMetaPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
  },
  moduleMetaText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  moduleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  moduleActionText: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },
  moduleBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  moduleSubheading: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  postsToolbar: {
    gap: 12,
  },
  postsToolbarCopy: {
    gap: 4,
  },
  postsToolbarButton: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  footerActionsCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.surface,
    gap: 12,
  },
  footerActionsTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  footerActionsCopy: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
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
  sectionHelperText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
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
    backgroundColor: palette.surfaceElevated,
    gap: 12,
  },
  detailBlock: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.surfaceElevated,
    gap: 12,
  },
  detailBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailBlockTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  detailBlockAction: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyInlineCard: {
    gap: 6,
    padding: 16,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  emptyInlineTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyInlineText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  postStudioHero: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  postStudioTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.whiteGlassStrong,
  },
  postStudioBadgeText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postStudioCount: {
    color: palette.whiteSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  postStudioTitle: {
    color: palette.white,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  postStudioCopy: {
    color: palette.whiteSoft,
    lineHeight: 21,
  },
  postStudioStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStudioStatCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.whiteGlass,
    gap: 4,
  },
  postStudioStatNumber: {
    color: palette.white,
    fontSize: 21,
    fontWeight: '900',
  },
  postStudioStatLabel: {
    color: palette.whiteSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  postStudioButton: {
    alignSelf: 'flex-start',
    minWidth: 190,
  },
  workPostCard: {
    borderRadius: 24,
    backgroundColor: palette.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  workPostMain: {
    flexDirection: 'row',
  },
  workPostMedia: {
    width: 118,
    backgroundColor: palette.surfaceMuted,
  },
  workPostImage: {
    width: '100%',
    height: '100%',
    minHeight: 148,
  },
  workPostPlaceholder: {
    flex: 1,
    minHeight: 148,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  workPostPlaceholderText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  workPostContent: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  workPostHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  workPostTitle: {
    flex: 1,
    color: palette.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  workPostBody: {
    color: palette.muted,
    lineHeight: 20,
    fontSize: 13,
  },
  workPostMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  metaPillText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  workPostFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  workPostFooterButton: {
    flex: 1,
  },
  emptyStudio: {
    gap: 14,
    borderRadius: 24,
    backgroundColor: palette.surfaceElevated,
    padding: 18,
  },
  emptyStudioButton: {
    alignSelf: 'flex-start',
  },
  workPostLinkedIn: {
    marginBottom: spacing.md,
  },
  opportunitiesCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  opportunitiesText: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

module.exports = {
  ProfessionalHubScreen,
};
