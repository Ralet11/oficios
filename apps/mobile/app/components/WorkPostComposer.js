const React = require('react');
const {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} = require('react-native');
const { SafeAreaView } = require('react-native-safe-area-context');
const { Ionicons } = require('@expo/vector-icons');
const { LinearGradient } = require('expo-linear-gradient');
const ImagePicker = require('expo-image-picker');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { uploadImageWithIntent } = require('../services/mediaUpload');
const { AppButton } = require('./AppButton');
const { AppInput } = require('./AppInput');
const { palette, shadows, spacing, type } = require('../theme');

function buildPhotoItemFromUrl(url) {
  return {
    id: url,
    previewUrl: url,
    status: 'ready',
    url,
  };
}

function normalizeInitialPost(post) {
  const photoItems = post?.photoItems?.length
    ? post.photoItems
    : (post?.photoUrls || []).map((photoUrl) => buildPhotoItemFromUrl(photoUrl));

  return {
    body: post?.body || '',
    highlightLines: [...(post?.highlightLines || [])],
    photoItems,
    title: post?.title || '',
  };
}

function getPickerMediaTypes() {
  return ImagePicker.MediaTypeOptions?.Images || ['images'];
}

function WorkPostComposer({ visible, initialPost, mode = 'create', onClose, onSave }) {
  const { token } = useAuth();
  const [draft, setDraft] = React.useState(() => normalizeInitialPost(initialPost));
  const [highlightInput, setHighlightInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(normalizeInitialPost(initialPost));
    setHighlightInput('');
    setSaving(false);
  }, [initialPost, visible]);

  function updateField(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function removePhoto(photoId) {
    setDraft((current) => ({
      ...current,
      photoItems: current.photoItems.filter((photo) => photo.id !== photoId),
    }));
  }

  function removeHighlight(index) {
    setDraft((current) => ({
      ...current,
      highlightLines: current.highlightLines.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function addHighlight() {
    const value = highlightInput.trim();

    if (!value) {
      return;
    }

    setDraft((current) => ({
      ...current,
      highlightLines: [...current.highlightLines, value].slice(0, 6),
    }));
    setHighlightInput('');
  }

  async function requestPickerPermission(source) {
    const response =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!response.granted) {
      throw new Error(source === 'camera' ? 'Activa el permiso de camara para sacar fotos.' : 'Activa el permiso de galeria para elegir fotos.');
    }
  }

  async function uploadAsset(asset) {
    const tempId = `local-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const tempPhoto = {
      id: tempId,
      previewUrl: asset.uri,
      status: 'uploading',
      url: null,
    };

    setDraft((current) => ({
      ...current,
      photoItems: [...current.photoItems, tempPhoto],
    }));

    try {
      const intentResponse = await api.createImageUploadIntent(
        {
          scope: 'professional-work-post',
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        },
        token,
      );
      const uploaded = await uploadImageWithIntent(intentResponse.data, asset);

      setDraft((current) => ({
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
      setDraft((current) => ({
        ...current,
        photoItems: current.photoItems.filter((photo) => photo.id !== tempId),
      }));
      throw error;
    }
  }

  async function handlePick(source) {
    try {
      if (draft.photoItems.length >= 8) {
        Alert.alert('Limite alcanzado', 'Cada post puede tener hasta 8 fotos.');
        return;
      }

      await requestPickerPermission(source);

      const pickerOptions = {
        allowsEditing: false,
        mediaTypes: getPickerMediaTypes(),
        quality: 0.82,
        selectionLimit: 1,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const availableSlots = Math.max(0, 8 - draft.photoItems.length);
      const selectedAssets = result.assets.slice(0, availableSlots);

      for (const asset of selectedAssets) {
        await uploadAsset(asset);
      }
    } catch (error) {
      Alert.alert('No se pudo cargar la foto', error.message);
    }
  }

  async function handleSave() {
    try {
      const title = draft.title.trim();
      const body = draft.body.trim();
      const uploadingPhotos = draft.photoItems.some((photo) => photo.status === 'uploading');

      if (uploadingPhotos) {
        Alert.alert('Subidas en progreso', 'Espera a que terminen de subir las fotos antes de guardar el post.');
        return;
      }

      if (title.length < 2) {
        Alert.alert('Falta el titulo', 'Escribe un titulo corto para el trabajo.');
        return;
      }

      if (body.length < 10) {
        Alert.alert('Falta contar el trabajo', 'Agrega una historia breve con lo que resolviste.');
        return;
      }

      setSaving(true);

      await Promise.resolve(
        onSave({
          body,
          highlightLines: draft.highlightLines.map((line) => line.trim()).filter(Boolean).slice(0, 6),
          photoUrls: draft.photoItems.filter((photo) => photo.status === 'ready' && photo.url).map((photo) => photo.url),
          title,
        }),
      );
    } catch (error) {
      Alert.alert('No se pudo guardar el post', error.message);
    } finally {
      setSaving(false);
    }
  }

  const heroPhoto = draft.photoItems.find((photo) => photo.status === 'ready' && photo.url) || draft.photoItems[0] || null;

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={styles.shell}>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <LinearGradient colors={[palette.accentDeep, palette.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <View style={styles.heroTopRow}>
                  <Pressable onPress={onClose} style={styles.heroIconButton}>
                    <Ionicons color={palette.white} name="close" size={22} />
                  </Pressable>
                  <Pressable onPress={handleSave} style={styles.heroIconButton}>
                    <Ionicons color={palette.white} name="checkmark" size={22} />
                  </Pressable>
                </View>
                <Text style={styles.heroEyebrow}>{mode === 'edit' ? 'Editar post' : 'Nuevo post'}</Text>
                <Text style={styles.heroTitle}>Convierte un trabajo terminado en una historia visual.</Text>
                <Text style={styles.heroCopy}>
                  Sube fotos desde la camara o la galeria, cuenta que hiciste y deja mensajes cortos para que el cliente entienda el valor rapido.
                </Text>
                <View style={styles.heroPreviewCard}>
                  {heroPhoto ? (
                    <Image resizeMode="cover" source={{ uri: heroPhoto.previewUrl || heroPhoto.url }} style={styles.heroPreviewImage} />
                  ) : (
                    <View style={styles.heroPreviewEmpty}>
                      <Ionicons color={palette.white} name="images-outline" size={28} />
                      <Text style={styles.heroPreviewEmptyTitle}>Empieza por una foto fuerte</Text>
                      <Text style={styles.heroPreviewEmptyCopy}>La primera imagen sera la portada del post.</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              <View style={styles.section}>
                <View style={styles.photoActions}>
                  <Pressable onPress={() => handlePick('camera')} style={[styles.photoAction, shadows.card]}>
                    <View style={styles.photoActionIcon}>
                      <Ionicons color={palette.accentDark} name="camera-outline" size={20} />
                    </View>
                    <View style={styles.photoActionCopy}>
                      <Text style={styles.photoActionTitle}>Camara</Text>
                      <Text style={styles.photoActionText}>Haz una foto en el momento.</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => handlePick('library')} style={[styles.photoAction, shadows.card]}>
                    <View style={styles.photoActionIcon}>
                      <Ionicons color={palette.accentDark} name="images-outline" size={20} />
                    </View>
                    <View style={styles.photoActionCopy}>
                      <Text style={styles.photoActionTitle}>Galeria</Text>
                      <Text style={styles.photoActionText}>Elige fotos guardadas del trabajo.</Text>
                    </View>
                  </Pressable>
                </View>

                {draft.photoItems.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRail}>
                    {draft.photoItems.map((photo, index) => (
                      <View key={photo.id} style={styles.photoCard}>
                        <Image resizeMode="cover" source={{ uri: photo.previewUrl || photo.url }} style={styles.photoThumb} />
                        <View style={styles.photoOverlay}>
                          <View style={styles.photoPill}>
                            <Text style={styles.photoPillText}>{index === 0 ? 'Portada' : `Foto ${index + 1}`}</Text>
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
                  <View style={styles.emptyPhotoCard}>
                    <Ionicons color={palette.accentDark} name="camera-outline" size={24} />
                    <Text style={styles.emptyPhotoTitle}>Todavia no agregaste fotos</Text>
                    <Text style={styles.emptyPhotoText}>Sube una o varias imagenes para que este post se sienta real y confiable.</Text>
                  </View>
                )}
              </View>

              <View style={styles.formSection}>
                <AppInput
                  fieldStyle={styles.inputField}
                  helperText="Piensa en un titulo corto y concreto."
                  label="Titulo"
                  onChangeText={(value) => updateField('title', value)}
                  placeholder="Ej: Renovacion completa de bano en Banfield"
                  value={draft.title}
                />
                <AppInput
                  fieldStyle={styles.storyField}
                  helperText="Cuenta el problema, la solucion y el resultado."
                  label="Historia del trabajo"
                  multiline
                  onChangeText={(value) => updateField('body', value)}
                  placeholder="Llegamos con perdida de agua, cambiamos canerias ocultas y dejamos todo probado el mismo dia."
                  value={draft.body}
                />
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mensajes clave</Text>
                  <Text style={styles.sectionMeta}>{draft.highlightLines.length}/6</Text>
                </View>
                <Text style={styles.sectionCopy}>Agrega frases cortas estilo logro, material usado o resultado entregado.</Text>
                <AppInput
                  fieldStyle={styles.inputField}
                  label="Nuevo mensaje"
                  onChangeText={setHighlightInput}
                  onSubmitEditing={addHighlight}
                  placeholder="Ej: Cambio de griferia y prueba de presion"
                  returnKeyType="done"
                  value={highlightInput}
                />
                <AppButton icon="add" onPress={addHighlight} style={styles.addHighlightButton} variant="secondary">
                  Agregar mensaje
                </AppButton>
                {draft.highlightLines.length ? (
                  <View style={styles.highlightList}>
                    {draft.highlightLines.map((line, index) => (
                      <Pressable key={`${line}-${index}`} onPress={() => removeHighlight(index)} style={styles.highlightChip}>
                        <Text style={styles.highlightChipText}>{line}</Text>
                        <Ionicons color={palette.accentDark} name="close" size={14} />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.highlightEmpty}>
                    <Text style={styles.highlightEmptyText}>Puedes usar esta zona para poner mensajes cortos tipo “Sin romper revestimiento” o “Entrega en 24 hs”.</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <AppButton onPress={onClose} style={styles.footerButton} variant="ghost">
                Cancelar
              </AppButton>
              <AppButton loading={saving} onPress={handleSave} style={styles.footerButton}>
                Guardar post
              </AppButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  keyboard: {
    flex: 1,
  },
  shell: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteGlassStrong,
  },
  heroEyebrow: {
    color: palette.whiteSoft,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: palette.white,
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroCopy: {
    color: palette.whiteSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  heroPreviewCard: {
    minHeight: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: palette.whiteGlass,
  },
  heroPreviewImage: {
    width: '100%',
    height: 220,
  },
  heroPreviewEmpty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
  },
  heroPreviewEmptyTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '800',
  },
  heroPreviewEmptyCopy: {
    color: palette.whiteSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    gap: 14,
    paddingHorizontal: 20,
  },
  photoActions: {
    gap: 12,
  },
  photoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: palette.white,
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
  emptyPhotoCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
    backgroundColor: palette.white,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyPhotoTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyPhotoText: {
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    gap: 14,
    paddingHorizontal: 20,
  },
  inputField: {
    borderRadius: 18,
    backgroundColor: palette.white,
  },
  storyField: {
    borderRadius: 22,
    backgroundColor: palette.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...type.subtitle,
    fontSize: 19,
  },
  sectionMeta: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionCopy: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  addHighlightButton: {
    alignSelf: 'flex-start',
  },
  highlightList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.accentSoft,
  },
  highlightChipText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  highlightEmpty: {
    borderRadius: 18,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  highlightEmptyText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  footerButton: {
    flex: 1,
  },
});

module.exports = {
  WorkPostComposer,
};
