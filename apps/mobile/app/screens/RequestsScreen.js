const React = require('react');
const { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

const FILTERS = [
  { label: 'All Service', value: 'ALL' },
  { label: 'Upcoming', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
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

function formatBudget(request) {
  if (!request.budgetAmount) {
    return 'A coordinar';
  }

  return `${request.budgetCurrency || 'ARS'} ${Number(request.budgetAmount).toLocaleString('es-AR')}`;
}

function matchesFilter(request, filter) {
  if (filter === 'ALL') {
    return true;
  }

  if (filter === 'ACTIVE') {
    return ['PENDING', 'ACCEPTED'].includes(request.status);
  }

  return request.status === filter;
}

function RequestsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [requests, setRequests] = React.useState([]);

  const load = React.useCallback(async () => {
    try {
      const response = await api.serviceRequests({ page: 1, pageSize: 30, scope: 'all' }, token);
      setRequests(response.data || []);
    } catch (error) {
      Alert.alert('No se pudieron cargar las solicitudes', error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return <LoadingView label="Cargando solicitudes..." />;
  }

  const filteredRequests = requests.filter((request) => {
    const counterpart =
      request.customer?.id === user.id
        ? request.professional?.businessName || ''
        : `${request.customer?.firstName || ''} ${request.customer?.lastName || ''}`.trim();
    const haystack = `${request.title} ${counterpart} ${request.city || ''} ${request.province || ''}`.toLowerCase();

    return matchesFilter(request, statusFilter) && haystack.includes(searchText.trim().toLowerCase());
  });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>My Booking</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar-outline" size={18} color={palette.ink} />
        </View>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color={palette.muted} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search"
          placeholderTextColor={palette.mutedSoft}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
        {FILTERS.map((filter) => {
          const active = statusFilter === filter.value;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setStatusFilter(filter.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filteredRequests.length ? (
        filteredRequests.map((request, index) => {
          const counterpart =
            request.customer?.id === user.id
              ? request.professional?.businessName || 'Professional'
              : `${request.customer?.firstName || ''} ${request.customer?.lastName || ''}`.trim() || 'Customer';
          const accentLabel =
            request.status === 'COMPLETED' ? 'Completed' : ['PENDING', 'ACCEPTED'].includes(request.status) ? 'Upcoming' : request.status;

          return (
            <Pressable key={request.id} onPress={() => navigation.navigate('RequestDetail', { requestId: request.id })}>
              <View style={[styles.bookingCard, shadows.card]}>
                <ServiceArtwork
                  size="thumb"
                  icon={getCategoryIcon(request.category, index)}
                  style={styles.bookingArt}
                />

                <View style={styles.bookingBody}>
                  <Text numberOfLines={1} style={styles.bookingTitle}>
                    {request.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={palette.muted} />
                    <Text style={styles.metaText}>{request.city || 'Argentina'}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{counterpart}</Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View>
                      <Text style={styles.infoLabel}>Service</Text>
                      <Text style={styles.infoValue}>{request.category?.name || 'Basic Package'}</Text>
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{formatDate(request.updatedAt || request.createdAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{accentLabel}</Text>
                    </View>
                    <Text style={styles.priceText}>{formatBudget(request)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyState title="No bookings yet" message="No encontramos solicitudes para ese filtro o texto de busqueda." />
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
  bookingCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 12,
    gap: 12,
    flexDirection: 'row',
  },
  bookingArt: {
    width: 98,
    minHeight: 98,
  },
  bookingBody: {
    flex: 1,
    gap: 8,
  },
  bookingTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
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
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  statusPillText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
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
