const React = require('react');
const { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { LinearGradient } = require('expo-linear-gradient');
const { Ionicons } = require('@expo/vector-icons');
const { hasRole } = require('@oficios/domain');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { WorkPostComposer } = require('../components/WorkPostComposer');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing, type } = require('../theme');

function blankArea() {
  return {
    city: '',
    province: '',
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

function summarize(text, maxLength = 120) {
  const normalized = String(text || '').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
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

function ProfessionalHubScreen() {
  const { token, user, activateProfessionalRole, refreshSession, setProfessionalProfile } = useAuth();
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
    photoUrls: '',
    province: '',
    yearsExperience: '0',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState([]);
  const [serviceAreas, setServiceAreas] = React.useState([blankArea()]);
  const [workPosts, setWorkPosts] = React.useState([]);
  const [composerVisible, setComposerVisible] = React.useState(false);
  const [composerIndex, setComposerIndex] = React.useState(null);
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
          photoUrls: (profile.photoUrls || []).join('\n'),
          province: profile.province || '',
          yearsExperience: String(profile.yearsExperience || 0),
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
      const normalizedWorkPosts = normalizeWorkPosts(workPosts);
      const invalidWorkPostIndex = normalizedWorkPosts.findIndex((post) => post.title.length < 2 || post.body.length < 10);

      if (invalidWorkPostIndex >= 0) {
        Alert.alert(
          'Completa el post',
          `El post ${invalidWorkPostIndex + 1} necesita un titulo y una historia del trabajo antes de guardarse.`,
        );
        return;
      }

      await api.saveProfessionalProfile(
        {
          ...form,
          photoUrls: form.photoUrls
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          yearsExperience: Number(form.yearsExperience),
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
      await api.saveProfessionalWorkPosts(
        {
          workPosts: normalizedWorkPosts,
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
      Alert.alert('No se pudo enviar a moderacion', error.message);
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
        <SectionCard title="Activar modo profesional" subtitle="Mantienes tu rol de cliente y sumas un perfil publico editable.">
          <AppInput label="Nombre comercial" onChangeText={setActivationName} value={activationName} />
          <AppButton loading={saving} onPress={handleActivate}>
            Activar rol profesional
          </AppButton>
        </SectionCard>
      </Screen>
    );
  }

  const composerPost = composerIndex === null ? blankWorkPost() : workPosts[composerIndex] || blankWorkPost();

  return (
    <>
      <Screen gradient>
        <View style={styles.header}>
          <Text style={styles.title}>Hub profesional</Text>
          <Text style={styles.copy}>Completa tu ficha, publica trabajos reales y deja el perfil listo para moderacion.</Text>
        </View>

        <SectionCard title="Estado del perfil">
          <StatusBadge status={profileStatus} />
          <Text style={styles.stateText}>Guarda los cambios y luego envia el perfil a moderacion.</Text>
          {rejectionReason ? <Text style={styles.rejection}>{rejectionReason}</Text> : null}
        </SectionCard>

        <SectionCard title="Ficha profesional">
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
          <AppInput label="Ciudad base" onChangeText={(value) => updateField('city', value)} value={form.city} />
          <AppInput label="Provincia base" onChangeText={(value) => updateField('province', value)} value={form.province} />
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
        </SectionCard>

        <SectionCard title="Categorias">
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
            <AppButton onPress={() => setServiceAreas((current) => [...current, blankArea()])} variant="secondary">
              Agregar zona
            </AppButton>
          }
        >
          {serviceAreas.map((area, index) => (
            <View key={`${index}-${area.city}-${area.province}`} style={styles.areaBlock}>
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
        </SectionCard>

        <SectionCard title="Trabajos previos" subtitle="Crea posts visuales para mostrar obras terminadas como una mini historia.">
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
            workPosts.map((post, index) => {
              const cover = post.photoUrls?.[0] || null;

              return (
                <View key={`work-post-${index}`} style={[styles.workPostCard, shadows.card]}>
                  <Pressable onPress={() => openEditPostComposer(index)} style={styles.workPostMain}>
                    <View style={styles.workPostMedia}>
                      {cover ? (
                        <Image resizeMode="cover" source={{ uri: cover }} style={styles.workPostImage} />
                      ) : (
                        <View style={styles.workPostPlaceholder}>
                          <Ionicons color={palette.accentDark} name="image-outline" size={24} />
                          <Text style={styles.workPostPlaceholderText}>Sin portada</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.workPostContent}>
                      <View style={styles.workPostHeader}>
                        <Text numberOfLines={2} style={styles.workPostTitle}>
                          {post.title}
                        </Text>
                        <Ionicons color={palette.mutedSoft} name="chevron-forward" size={18} />
                      </View>
                      <Text numberOfLines={3} style={styles.workPostBody}>
                        {summarize(post.body, 128)}
                      </Text>
                      <View style={styles.workPostMetaRow}>
                        <View style={styles.metaPill}>
                          <Ionicons color={palette.accentDark} name="images-outline" size={14} />
                          <Text style={styles.metaPillText}>{post.photoUrls.length} fotos</Text>
                        </View>
                        <View style={styles.metaPill}>
                          <Ionicons color={palette.accentDark} name="chatbubble-ellipses-outline" size={14} />
                          <Text style={styles.metaPillText}>{post.highlightLines.length} mensajes</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <View style={styles.workPostFooter}>
                    <AppButton onPress={() => openEditPostComposer(index)} style={styles.workPostFooterButton} variant="secondary">
                      Editar
                    </AppButton>
                    <AppButton onPress={() => removeWorkPost(index)} style={styles.workPostFooterButton} variant="ghost">
                      Eliminar
                    </AppButton>
                  </View>
                </View>
              );
            })
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
        </SectionCard>

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
    backgroundColor: palette.surfaceElevated,
    gap: 12,
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
});

module.exports = {
  ProfessionalHubScreen,
};
