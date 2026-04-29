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
const { useRoute, useFocusEffect } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { StatusBadge } = require('../components/StatusBadge');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing, type } = require('../theme');

function formatBudget(detail) {
  if (!detail?.budgetAmount) {
    return 'A coordinar';
  }

  return `${detail.budgetCurrency || 'ARS'} ${Number(detail.budgetAmount).toLocaleString('es-AR')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Date(value).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function countActiveThreads(detail) {
  return ['PENDING', 'AWAITING_PRO_CONFIRMATION', 'ACCEPTED']
    .map((status) => detail?.requestCounts?.[status] || 0)
    .reduce((total, value) => total + value, 0);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function buildDispatchValidationMessage(detail) {
  const missingFields = [];

  if (!detail?.category?.id) {
    missingFields.push('categoria');
  }
  if (!normalizeText(detail?.title)) {
    missingFields.push('titulo');
  }
  if (!normalizeText(detail?.description)) {
    missingFields.push('descripcion');
  }
  if (!normalizeText(detail?.city)) {
    missingFields.push('ciudad');
  }
  if (!normalizeText(detail?.province)) {
    missingFields.push('provincia');
  }
  if (!normalizeText(detail?.addressLine)) {
    missingFields.push('direccion');
  }

  if (!missingFields.length) {
    return null;
  }

  return `Antes de enviarlo o publicarlo completa: ${missingFields.join(', ')}.`;
}

function ServiceNeedDetailScreen({ navigation }) {
  const route = useRoute();
  const { token } = useAuth();
  const serviceNeedId = route.params.serviceNeedId;
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [detail, setDetail] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      const response = await api.serviceNeed(serviceNeedId, token);
      setDetail(response.data);
    } catch (error) {
      Alert.alert('No se pudo cargar el problema', error.message);
    } finally {
      setLoading(false);
    }
  }, [serviceNeedId, token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSelectRequest(requestId) {
    Alert.alert(
      'Elegir profesional',
      'Los demas hilos activos se cerraran y este profesional tendra que confirmar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Elegir',
          async onPress() {
            try {
              setSubmitting(true);
              await api.selectServiceNeedRequest(serviceNeedId, { serviceRequestId: requestId }, token);
              await load();
            } catch (error) {
              Alert.alert('No se pudo elegir el profesional', error.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  async function handlePublishToBoard() {
    const validationMessage = buildDispatchValidationMessage(detail);
    if (validationMessage) {
      Alert.alert('Completa el problema', validationMessage);
      return;
    }

    Alert.alert(
      'Publicar en tablero general',
      'Tu problema sera visible para todos los profesionales en el tablero de oportunidades.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Publicar',
          async onPress() {
            try {
              setSubmitting(true);
              await api.publishServiceNeed(serviceNeedId, token);
              await load();
            } catch (error) {
              Alert.alert('No se pudo publicar el problema', error.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  async function handleCancelNeed() {
    Alert.alert('Cancelar problema', 'Se cerraran las conversaciones activas de este problema.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar problema',
        style: 'destructive',
        async onPress() {
          try {
            setSubmitting(true);
            await api.cancelServiceNeed(serviceNeedId, token);
            await load();
          } catch (error) {
            Alert.alert('No se pudo cancelar el problema', error.message);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  function handleOpenSelectProfessionals() {
    const validationMessage = buildDispatchValidationMessage(detail);
    if (validationMessage) {
      Alert.alert('Completa el problema', validationMessage);
      return;
    }

    navigation.navigate('SelectProfessionals', { serviceNeedId: detail.id });
  }

  if (loading) {
    return <LoadingView label="Cargando problema..." />;
  }

  if (!detail) {
    return (
      <Screen>
        <EmptyState title="Problema no disponible" message="No se pudo encontrar este borrador o consulta." />
      </Screen>
    );
  }

  const activeThreads = countActiveThreads(detail);
  const canEdit = detail.status === 'DRAFT' || (detail.status === 'OPEN' && activeThreads === 0);
  const canInvite = ['DRAFT', 'OPEN'].includes(detail.status);
  const canPublish = ['DRAFT', 'OPEN'].includes(detail.status) && detail.visibility === 'DIRECT_ONLY';
  const waitingForPro = detail.status === 'SELECTION_PENDING_CONFIRMATION';
  const heroIcon = getCategoryIcon(detail.category, 0);

  return (
    <Screen contentStyle={styles.content}>
      <ServiceArtwork
        size="banner"
        icon={heroIcon}
        badge={detail.category?.name || 'Problema'}
        title={detail.title || 'Problema sin titulo'}
        subtitle={[detail.city, detail.province].filter(Boolean).join(', ') || 'Completa ubicacion para seguir'}
      />

      <View style={styles.headerBlock}>
        <StatusBadge status={detail.status} />
        <Text style={styles.headerCopy}>
          {detail.description || 'Todavia no agregaste una descripcion completa del problema.'}
        </Text>
      </View>

      {waitingForPro ? (
        <View style={[styles.waitingCard, shadows.card]}>
          <Ionicons color={palette.accentDark} name="time-outline" size={20} />
          <View style={styles.waitingCopy}>
            <Text style={styles.waitingTitle}>Esperando confirmacion del profesional</Text>
            <Text style={styles.waitingText}>
              Ya elegiste un hilo. Ahora el profesional seleccionado tiene que confirmar para desbloquear el contacto.
            </Text>
          </View>
        </View>
      ) : null}

      <SectionCard title="Resumen del problema">
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Categoria</Text>
            <Text style={styles.metaValue}>{detail.category?.name || 'Sin categoria'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Presupuesto</Text>
            <Text style={styles.metaValue}>{formatBudget(detail)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Estado</Text>
            <Text style={styles.metaValue}>{detail.requestCounts?.total || 0} conversaciones</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Actualizado</Text>
            <Text style={styles.metaValue}>{formatDate(detail.updatedAt)}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Ionicons color={palette.accentDark} name="location-outline" size={16} />
          <Text style={styles.summaryText}>{detail.addressLine || 'Direccion no informada'}</Text>
        </View>

        {detail.contact ? (
          <View style={styles.contactSummary}>
            <Text style={styles.contactSummaryTitle}>Contacto guardado</Text>
            <Text style={styles.contactSummaryText}>{detail.contact.name || 'Sin nombre'}</Text>
            <Text style={styles.contactSummaryText}>{detail.contact.phone || 'Sin telefono'}</Text>
            <Text style={styles.contactSummaryText}>{detail.contact.email || 'Sin email'}</Text>
          </View>
        ) : null}

        {detail.photoUrls?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRail}>
            {detail.photoUrls.map((photoUrl, index) => (
              <Image
                key={`${photoUrl}-${index}`}
                source={{ uri: photoUrl }}
                style={styles.photoThumb}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : null}
      </SectionCard>

      <SectionCard title="Acciones del problema">
        {canEdit ? (
          <AppButton onPress={() => navigation.navigate('ServiceNeedComposer', { serviceNeedId: detail.id })} variant="secondary">
            Editar borrador
          </AppButton>
        ) : null}
        {canInvite ? (
          <AppButton onPress={handleOpenSelectProfessionals}>
            {detail.requests?.length ? 'Enviar a otros profesionales' : 'Seleccionar profesionales'}
          </AppButton>
        ) : null}
        {canPublish ? (
          <AppButton onPress={handlePublishToBoard} loading={submitting} variant="secondary">
            {detail.requests?.length ? 'Publicar tambien en tablero general' : 'Publicar en tablero general'}
          </AppButton>
        ) : null}
        {!['CANCELLED', 'CLOSED'].includes(detail.status) ? (
          <AppButton onPress={handleCancelNeed} loading={submitting} variant="ghost">
            Cancelar problema
          </AppButton>
        ) : null}
      </SectionCard>

      <SectionCard title="Conversaciones" subtitle="Cada tarjeta representa un hilo independiente con un profesional.">
        {detail.requests?.length ? (
          detail.requests.map((request, index) => {
            const isSelected = detail.selectedServiceRequestId === request.id;
            const canSelectThisRequest = detail.status === 'OPEN' && request.status === 'PENDING';

            return (
              <Pressable
                key={request.id}
                onPress={() => navigation.navigate('RequestDetail', { requestId: request.id })}
                style={[styles.requestCard, shadows.card, isSelected && styles.requestCardSelected]}
              >
                <ServiceArtwork
                  size="thumb"
                  icon={getCategoryIcon(request.category, index)}
                  style={styles.requestArtwork}
                />

                <View style={styles.requestBody}>
                  <View style={styles.requestTopRow}>
                    <View style={styles.requestHeaderCopy}>
                      <Text numberOfLines={1} style={styles.requestTitle}>
                        {request.professional?.businessName || 'Profesional'}
                      </Text>
                      <Text numberOfLines={2} style={styles.requestSubtitle}>
                        {request.title}
                      </Text>
                    </View>
                    <StatusBadge status={request.status} />
                  </View>

                  <View style={styles.requestMetaRow}>
                    <View style={styles.requestMetaPill}>
                      <Ionicons color={palette.accentDark} name="chatbubble-ellipses-outline" size={14} />
                      <Text style={styles.requestMetaPillText}>{request.messages?.length || 0} mensajes</Text>
                    </View>
                    <View style={styles.requestMetaPill}>
                      <Ionicons color={palette.accentDark} name="briefcase-outline" size={14} />
                      <Text style={styles.requestMetaPillText}>{request.origin === 'DIRECT_INVITE' ? 'Invitacion directa' : 'Tablero'}</Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <Text style={styles.selectedCopy}>Este hilo es el candidato elegido para cerrar el trabajo.</Text>
                  ) : null}

                  {canSelectThisRequest ? (
                    <AppButton onPress={() => handleSelectRequest(request.id)} loading={submitting} style={styles.selectButton}>
                      Elegir este profesional
                    </AppButton>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            title="Todavia no enviaste este problema"
            message="Guarda el borrador y luego elige uno o varios profesionales para abrir conversaciones."
          />
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 140,
  },
  headerBlock: {
    gap: 10,
  },
  headerCopy: {
    ...type.body,
  },
  waitingCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 22,
    backgroundColor: palette.accentSoft,
    padding: 16,
  },
  waitingCopy: {
    flex: 1,
    gap: 4,
  },
  waitingTitle: {
    color: palette.accentDark,
    fontSize: 15,
    fontWeight: '800',
  },
  waitingText: {
    color: palette.ink,
    fontSize: 13,
    lineHeight: 19,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaItem: {
    width: '47%',
    gap: 3,
  },
  metaLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  contactSummary: {
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
    padding: 14,
    gap: 4,
  },
  contactSummaryTitle: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },
  contactSummaryText: {
    color: palette.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  photoRail: {
    gap: 12,
    paddingRight: 20,
  },
  photoThumb: {
    width: 146,
    height: 112,
    borderRadius: 18,
    backgroundColor: palette.surfaceMuted,
  },
  requestCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 22,
    backgroundColor: palette.white,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  requestCardSelected: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  requestArtwork: {
    width: 92,
    minHeight: 92,
  },
  requestBody: {
    flex: 1,
    gap: 10,
  },
  requestTopRow: {
    gap: 8,
  },
  requestHeaderCopy: {
    gap: 3,
  },
  requestTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  requestSubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  requestMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requestMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  requestMetaPillText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  selectedCopy: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  selectButton: {
    marginTop: 2,
  },
});

module.exports = {
  ServiceNeedDetailScreen,
};
