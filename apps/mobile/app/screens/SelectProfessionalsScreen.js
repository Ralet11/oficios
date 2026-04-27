const React = require('react');
const {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} = require('react-native');
const { useFocusEffect, useRoute } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { StatusBadge } = require('../components/StatusBadge');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

function formatRating(professional) {
  return (Number(professional.ratingAverage) || 0).toFixed(1);
}

function formatLocation(professional) {
  return [professional.city, professional.province].filter(Boolean).join(', ') || 'Argentina';
}

function SelectProfessionalsScreen({ navigation }) {
  const route = useRoute();
  const { token } = useAuth();
  const serviceNeedId = route.params.serviceNeedId;
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [serviceNeed, setServiceNeed] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [professionals, setProfessionals] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [filters, setFilters] = React.useState({
    availableNow: false,
    categoryId: '',
    text: '',
  });
  const [customerMessage, setCustomerMessage] = React.useState('');

  async function loadProfessionals(nextFilters, options = {}) {
    try {
      if (options.initial) {
        setLoading(true);
      } else {
        setFetching(true);
      }

      const response = await api.professionals({
        page: 1,
        pageSize: 30,
        text: nextFilters.text || undefined,
        categoryId: nextFilters.categoryId || undefined,
        availableNow: nextFilters.availableNow,
      });
      setProfessionals(response.data || []);
    } catch (error) {
      Alert.alert('No se pudo cargar el catalogo', error.message);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  const bootstrap = React.useCallback(async () => {
    try {
      setLoading(true);
      const [serviceNeedResponse, categoriesResponse] = await Promise.all([
        api.serviceNeed(serviceNeedId, token),
        api.categories(),
      ]);

      const detail = serviceNeedResponse.data;
      const nextFilters = {
        availableNow: false,
        categoryId: detail.category?.id ? String(detail.category.id) : '',
        text: '',
      };

      setServiceNeed(detail);
      setCategories(categoriesResponse.data || []);
      setFilters(nextFilters);
      setCustomerMessage(detail.description || '');

      const professionalsResponse = await api.professionals({
        page: 1,
        pageSize: 30,
        categoryId: nextFilters.categoryId || undefined,
      });
      setProfessionals(professionalsResponse.data || []);
    } catch (error) {
      Alert.alert('No se pudo preparar la seleccion', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, serviceNeedId, token]);

  useFocusEffect(
    React.useCallback(() => {
      bootstrap();
    }, [bootstrap]),
  );

  React.useEffect(() => {
    if (!serviceNeed) {
      return;
    }

    const timeout = setTimeout(() => {
      loadProfessionals(filters);
    }, 220);

    return () => clearTimeout(timeout);
  }, [filters.availableNow, filters.categoryId, filters.text]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSelected(professionalId, disabled) {
    if (disabled) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(professionalId)
        ? current.filter((id) => id !== professionalId)
        : [...current, professionalId],
    );
  }

  async function handleDispatch() {
    try {
      if (!customerMessage.trim()) {
        Alert.alert('Falta el mensaje', 'Escribe el mensaje inicial que recibiran los profesionales.');
        return;
      }

      if (!selectedIds.length) {
        Alert.alert('Sin profesionales', 'Selecciona al menos un profesional antes de enviar.');
        return;
      }

      setSending(true);
      await api.dispatchServiceNeed(
        serviceNeedId,
        {
          customerMessage: customerMessage.trim(),
          professionalIds: selectedIds,
        },
        token,
      );
      navigation.replace('ServiceNeedDetail', { serviceNeedId });
    } catch (error) {
      Alert.alert('No se pudo enviar la consulta', error.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <LoadingView label="Preparando seleccion..." />;
  }

  if (!serviceNeed) {
    return (
      <Screen>
        <EmptyState title="Problema no disponible" message="No se encontro el problema desde el que querias invitar profesionales." />
      </Screen>
    );
  }

  const existingProfessionalIds = new Set(
    (serviceNeed.requests || []).map((request) => request.professional?.id).filter(Boolean),
  );

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <StatusBadge status={serviceNeed.status} />
          <Text style={styles.heroMeta}>{selectedIds.length} seleccionados</Text>
        </View>
        <Text style={styles.heroTitle}>{serviceNeed.title || 'Seleccionar profesionales'}</Text>
        <Text style={styles.heroCopy}>
          Marca varios profesionales y envia el mismo problema. Cada uno recibira su propio hilo.
        </Text>
      </View>

      <View style={styles.searchShell}>
        <Ionicons color={palette.muted} name="search-outline" size={18} />
        <TextInput
          value={filters.text}
          onChangeText={(value) => setFilters((current) => ({ ...current, text: value }))}
          placeholder="Buscar por oficio, nombre o zona"
          placeholderTextColor={palette.mutedSoft}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Solo disponibles ahora</Text>
        <Switch
          value={filters.availableNow}
          onValueChange={(value) => setFilters((current) => ({ ...current, availableNow: value }))}
          trackColor={{ true: palette.accent }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
        <Pressable
          onPress={() => setFilters((current) => ({ ...current, categoryId: '' }))}
          style={[styles.categoryChip, !filters.categoryId && styles.categoryChipActive]}
        >
          <Text style={[styles.categoryChipText, !filters.categoryId && styles.categoryChipTextActive]}>Todas</Text>
        </Pressable>
        {categories.map((category) => {
          const active = String(category.id) === String(filters.categoryId);

          return (
            <Pressable
              key={category.id}
              onPress={() => setFilters((current) => ({ ...current, categoryId: String(category.id) }))}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{category.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>Mensaje inicial</Text>
        <Text style={styles.messageCopy}>Este texto sera el primer mensaje dentro de cada conversacion que abras.</Text>
        <TextInput
          value={customerMessage}
          onChangeText={setCustomerMessage}
          multiline
          placeholder="Explica el problema, urgencia, horario y cualquier detalle clave."
          placeholderTextColor={palette.mutedSoft}
          style={styles.messageInput}
          textAlignVertical="top"
        />
      </View>

      {fetching ? <Text style={styles.fetchingText}>Actualizando resultados...</Text> : null}

      {professionals.length ? (
        professionals.map((professional, index) => {
          const alreadyInvited = existingProfessionalIds.has(professional.id);
          const selected = selectedIds.includes(professional.id);

          return (
            <Pressable
              key={professional.id}
              onPress={() => toggleSelected(professional.id, alreadyInvited)}
              style={[
                styles.card,
                shadows.card,
                selected && styles.cardSelected,
                alreadyInvited && styles.cardDisabled,
              ]}
            >
              <ServiceArtwork
                size="thumb"
                icon={getCategoryIcon(professional.categories?.[0], index)}
                style={styles.cardArtwork}
              />

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardHeader}>
                    <Text numberOfLines={1} style={styles.cardTitle}>
                      {professional.businessName}
                    </Text>
                    <Text numberOfLines={1} style={styles.cardSubtitle}>
                      {formatLocation(professional)}
                    </Text>
                  </View>
                  <View style={[styles.checkWrap, selected && styles.checkWrapSelected, alreadyInvited && styles.checkWrapDisabled]}>
                    <Ionicons
                      color={selected ? palette.white : palette.accentDark}
                      name={selected ? 'checkmark' : alreadyInvited ? 'remove' : 'add'}
                      size={18}
                    />
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons color={palette.warning} name="star" size={14} />
                    <Text style={styles.metaPillText}>{formatRating(professional)}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Ionicons color={palette.accentDark} name="time-outline" size={14} />
                    <Text style={styles.metaPillText}>{professional.availableNow ? 'Disponible' : 'Coordinar'}</Text>
                  </View>
                </View>

                <Text numberOfLines={2} style={styles.bioText}>
                  {professional.headline || professional.bio || 'Perfil profesional listo para recibir consultas.'}
                </Text>

                {alreadyInvited ? (
                  <Text style={styles.cardHint}>Ya existe una conversacion activa con este profesional para este problema.</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyState title="Sin resultados" message="No encontramos profesionales con esos filtros para este problema." />
      )}

      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Enviar a {selectedIds.length} profesionales</Text>
        <Text style={styles.footerCopy}>
          Se abriran conversaciones separadas y luego podras elegir un solo candidato desde el detalle del problema.
        </Text>
        <AppButton onPress={handleDispatch} loading={sending} disabled={!selectedIds.length || !customerMessage.trim()}>
          Enviar consulta
        </AppButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 148,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMeta: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  heroCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  searchShell: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
  },
  switchRow: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
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
  messageCard: {
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 18,
    gap: 10,
  },
  messageTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  messageCopy: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  messageInput: {
    minHeight: 132,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fetchingText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 22,
    backgroundColor: palette.white,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  cardSelected: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  cardDisabled: {
    opacity: 0.65,
  },
  cardArtwork: {
    width: 92,
    minHeight: 92,
  },
  cardBody: {
    flex: 1,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  cardHeader: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  checkWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  checkWrapSelected: {
    backgroundColor: palette.accent,
  },
  checkWrapDisabled: {
    backgroundColor: palette.surfaceElevated,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  metaPillText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  bioText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  cardHint: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  footerCard: {
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 18,
    gap: 10,
  },
  footerTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  footerCopy: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});

module.exports = {
  SelectProfessionalsScreen,
};
