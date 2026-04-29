const React = require('react');
const {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { hasRole } = require('@oficios/domain');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { StatusBadge } = require('../components/StatusBadge');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { APP_MODES } = require('../services/sessionMode');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

const REQUEST_FILTERS = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Activas', value: 'ACTIVE' },
  { label: 'Completadas', value: 'COMPLETED' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

const NEED_FILTERS = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'Activos', value: 'ACTIVE' },
  { label: 'Cerrados', value: 'CLOSED_GROUP' },
];

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

function formatBudget(item) {
  if (!item?.budgetAmount) {
    return 'A coordinar';
  }

  return `${item.budgetCurrency || 'ARS'} ${Number(item.budgetAmount).toLocaleString('es-AR')}`;
}

function matchesRequestFilter(request, filter) {
  if (filter === 'ALL') {
    return true;
  }

  if (filter === 'ACTIVE') {
    return ['PENDING', 'AWAITING_PRO_CONFIRMATION', 'ACCEPTED'].includes(request.status);
  }

  return request.status === filter;
}

function matchesNeedFilter(serviceNeed, filter) {
  if (filter === 'ALL') {
    return true;
  }

  if (filter === 'ACTIVE') {
    return ['OPEN', 'SELECTION_PENDING_CONFIRMATION', 'MATCHED'].includes(serviceNeed.status);
  }

  if (filter === 'CLOSED_GROUP') {
    return ['CLOSED', 'CANCELLED'].includes(serviceNeed.status);
  }

  return serviceNeed.status === filter;
}

function buildNeedCountsCopy(serviceNeed) {
  const total = serviceNeed.requestCounts?.total || 0;
  const pending = serviceNeed.requestCounts?.PENDING || 0;
  const awaiting = serviceNeed.requestCounts?.AWAITING_PRO_CONFIRMATION || 0;
  const accepted = serviceNeed.requestCounts?.ACCEPTED || 0;

  if (awaiting > 0) {
    return 'Esperando confirmacion del profesional';
  }

  if (accepted > 0) {
    return 'Profesional elegido y aceptado';
  }

  if (pending > 0) {
    return `${pending} conversaciones activas`;
  }

  if (total > 0) {
    return `${total} conversaciones historicas`;
  }

  return 'Sin conversaciones todavia';
}

function RequestsScreen({ navigation }) {
  const { token, user, activeMode } = useAuth();
  const isCustomerMode = activeMode === APP_MODES.CUSTOMER;
  const isProfessionalMode = activeMode === APP_MODES.PROFESSIONAL;
  const canSeeNeeds = isCustomerMode && hasRole(user, 'CUSTOMER');
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');
  const [requestStatusFilter, setRequestStatusFilter] = React.useState('ALL');
  const [needStatusFilter, setNeedStatusFilter] = React.useState('ALL');
  const [requests, setRequests] = React.useState([]);
  const [serviceNeeds, setServiceNeeds] = React.useState([]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const responses = await Promise.all([
        isProfessionalMode ? api.serviceRequests({ page: 1, pageSize: 30, scope: 'all' }, token) : Promise.resolve({ data: [] }),
        canSeeNeeds ? api.serviceNeeds({ page: 1, pageSize: 30 }, token) : Promise.resolve({ data: [] }),
      ]);

      setRequests(responses[0].data || []);
      setServiceNeeds(responses[1].data || []);
    } catch (error) {
      Alert.alert('No se pudo cargar la bandeja', error.message);
    } finally {
      setLoading(false);
    }
  }, [canSeeNeeds, isProfessionalMode, token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return <LoadingView label="Cargando solicitudes..." />;
  }

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => {
    const counterpart =
      request.customer?.id === user.id
        ? request.professional?.businessName || ''
        : `${request.customer?.firstName || ''} ${request.customer?.lastName || ''}`.trim();
    const haystack = [
      request.title,
      request.serviceNeed?.title,
      counterpart,
      request.city,
      request.province,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesRequestFilter(request, requestStatusFilter) && haystack.includes(normalizedSearch);
  });

  const filteredNeeds = serviceNeeds.filter((serviceNeed) => {
    const haystack = [
      serviceNeed.title,
      serviceNeed.description,
      serviceNeed.city,
      serviceNeed.province,
      serviceNeed.category?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesNeedFilter(serviceNeed, needStatusFilter) && haystack.includes(normalizedSearch);
  });

  const showingNeeds = canSeeNeeds;
  const activeFilters = showingNeeds ? NEED_FILTERS : REQUEST_FILTERS;
  const selectedFilter = showingNeeds ? needStatusFilter : requestStatusFilter;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>{showingNeeds ? 'Mis problemas' : 'Conversaciones'}</Text>
        <View style={styles.headerIcon}>
          <Ionicons name={showingNeeds ? 'construct-outline' : 'chatbubble-ellipses-outline'} size={18} color={palette.ink} />
        </View>
      </View>

      {showingNeeds ? (
        <AppButton icon="add-circle-outline" onPress={() => navigation.navigate('ServiceNeedComposer')}>
          Crear problema
        </AppButton>
      ) : null}

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color={palette.muted} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder={showingNeeds ? 'Buscar problema o categoria' : 'Buscar conversacion o profesional'}
          placeholderTextColor={palette.mutedSoft}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
        {activeFilters.map((filter) => {
          const active = selectedFilter === filter.value;

          return (
            <Pressable
              key={filter.value}
              onPress={() => (showingNeeds ? setNeedStatusFilter(filter.value) : setRequestStatusFilter(filter.value))}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showingNeeds ? (
        filteredNeeds.length ? (
          filteredNeeds.map((serviceNeed, index) => (
            <Pressable
              key={serviceNeed.id}
              onPress={() => navigation.navigate('ServiceNeedDetail', { serviceNeedId: serviceNeed.id })}
            >
              <View style={[styles.needCard, shadows.card]}>
                <ServiceArtwork
                  size="thumb"
                  icon={getCategoryIcon(serviceNeed.category, index)}
                  style={styles.needArtwork}
                />

                <View style={styles.needBody}>
                  <View style={styles.needTopRow}>
                    <View style={styles.needHeaderCopy}>
                      <Text numberOfLines={1} style={styles.needTitle}>
                        {serviceNeed.title || 'Problema sin titulo'}
                      </Text>
                      <Text numberOfLines={2} style={styles.needSubtitle}>
                        {serviceNeed.description || 'Guarda el borrador y agrega mas contexto antes de enviarlo.'}
                      </Text>
                    </View>
                    <StatusBadge status={serviceNeed.status} />
                  </View>

                  <View style={styles.needMetaRow}>
                    <View style={styles.needMetaPill}>
                      <Ionicons color={palette.accentDark} name="location-outline" size={14} />
                      <Text style={styles.needMetaPillText}>
                        {[serviceNeed.city, serviceNeed.province].filter(Boolean).join(', ') || 'Sin zona'}
                      </Text>
                    </View>
                    <View style={styles.needMetaPill}>
                      <Ionicons color={palette.accentDark} name="chatbubble-outline" size={14} />
                      <Text style={styles.needMetaPillText}>{serviceNeed.requestCounts?.total || 0} hilos</Text>
                    </View>
                  </View>

                  <View style={styles.needFooterRow}>
                    <Text style={styles.needFooterCopy}>{buildNeedCountsCopy(serviceNeed)}</Text>
                    <Text style={styles.needPrice}>{formatBudget(serviceNeed)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Todavia no tienes problemas cargados"
            message="Crea un borrador, agregale fotos y luego envialo a uno o varios profesionales."
          />
        )
      ) : filteredRequests.length ? (
        filteredRequests.map((request, index) => {
          const counterpart =
            request.customer?.id === user.id
              ? request.professional?.businessName || 'Profesional'
              : `${request.customer?.firstName || ''} ${request.customer?.lastName || ''}`.trim() || 'Cliente';
          const parentTitle = request.serviceNeed?.title || null;

          return (
            <Pressable key={request.id} onPress={() => navigation.navigate('RequestDetail', { requestId: request.id })}>
              <View style={[styles.requestCard, shadows.card]}>
                <ServiceArtwork
                  size="thumb"
                  icon={getCategoryIcon(request.category, index)}
                  style={styles.requestArtwork}
                />

                <View style={styles.requestBody}>
                  <View style={styles.requestTopRow}>
                    <Text numberOfLines={1} style={styles.requestTitle}>
                      {request.title}
                    </Text>
                    <StatusBadge status={request.status} />
                  </View>

                  {parentTitle ? (
                    <Text numberOfLines={1} style={styles.parentNeedText}>
                      Problema: {parentTitle}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={palette.muted} />
                    <Text style={styles.metaText}>{request.city || 'Argentina'}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{counterpart}</Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View>
                      <Text style={styles.infoLabel}>Servicio</Text>
                      <Text style={styles.infoValue}>{request.category?.name || 'General'}</Text>
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Actualizado</Text>
                      <Text style={styles.infoValue}>{formatDate(request.updatedAt || request.createdAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <Text style={styles.requestFooterCopy}>
                      {request.status === 'AWAITING_PRO_CONFIRMATION'
                        ? 'El cliente ya eligio este hilo'
                        : request.serviceNeed?.status === 'SELECTION_PENDING_CONFIRMATION' && request.serviceNeed?.selectedServiceRequestId === request.id
                          ? 'Esperando confirmacion'
                          : 'Conversacion activa'}
                    </Text>
                    <Text style={styles.priceText}>{formatBudget(request)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyState title="No hay conversaciones para ese filtro" message="Ajusta los filtros o abre un nuevo problema para empezar." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 144,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    color: palette.ink,
    fontSize: 31,
    fontWeight: '800',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  searchShell: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
  },
  filterRail: {
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
  },
  filterChipActive: {
    backgroundColor: palette.accentSoft,
  },
  filterText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  needCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 12,
    gap: 12,
    flexDirection: 'row',
  },
  needArtwork: {
    width: 98,
    minHeight: 98,
  },
  needBody: {
    flex: 1,
    gap: 8,
  },
  needTopRow: {
    gap: 8,
  },
  needHeaderCopy: {
    gap: 4,
  },
  needTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  needSubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  needMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  needMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  needMetaPillText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  needFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  needFooterCopy: {
    flex: 1,
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  needPrice: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  requestCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 12,
    gap: 12,
    flexDirection: 'row',
  },
  requestArtwork: {
    width: 98,
    minHeight: 98,
  },
  requestBody: {
    flex: 1,
    gap: 8,
  },
  requestTopRow: {
    gap: 8,
  },
  requestTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  parentNeedText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: palette.border,
    fontSize: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  infoLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  requestFooterCopy: {
    flex: 1,
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  priceText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
});

module.exports = {
  RequestsScreen,
};
