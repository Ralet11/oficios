const React = require('react');
const { useState, useEffect, useCallback } = React;
const {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
  TextInput,
} = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { useAuth } = require('../contexts/AuthContext');
const { API_URL, api } = require('../services/api');
const { EmptyState } = require('../components/EmptyState');
const { palette, spacing, shadows } = require('../theme');

function CategoryPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.categoryPill, active && styles.categoryPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function OpportunityCard({ item, onPress }) {
  const hasPhotos = item.photoUrls && item.photoUrls.length > 0;
  const budgetLabel = item.budgetAmount
    ? `$${item.budgetAmount.toLocaleString('es-AR')}`
    : null;

  const timeAgo = item.publishedAt
    ? getTimeAgo(new Date(item.publishedAt))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        {hasPhotos ? (
          <Image source={{ uri: item.photoUrls[0] }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="construct-outline" size={28} color={palette.mutedSoft} />
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.badgePrimary}>
              <Text style={styles.badgePrimaryText}>
                {item.category?.name || 'Sin categoría'}
              </Text>
            </View>
            {timeAgo && (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={12} color={palette.muted} />
                <Text style={styles.timeText}>{timeAgo}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || 'Sin título'}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || 'Sin descripción'}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={palette.accent} />
              <Text style={styles.locationText}>
                {item.city || 'Ubicación no especificada'}
              </Text>
            </View>
            {budgetLabel && (
              <Text style={styles.budgetText}>{budgetLabel}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${diffDays}d`;
}

function FilterChip({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={14} color={active ? palette.white : palette.muted} />
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function OpportunitiesBoardScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = ['Electricidad', 'Plomería', 'Carpintería', 'Pintura', 'Jardinería', 'Limpieza'];

  const fetchOpportunities = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (searchText) params.append('text', searchText);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const url = `${API_URL}/service-needs/opportunities${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Error al cargar oportunidades');
      }
      setOpportunities(payload.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar oportunidades');
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, searchText, selectedCategory]);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOpportunities();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
  };

  const onSearchChange = (text) => {
    setSearchText(text);
  };

  const renderItem = ({ item }) => (
    <OpportunityCard
      item={item}
      onPress={() => navigation.navigate('OpportunityDetail', { needId: item.id })}
    />
  );

  const renderHeader = () => (
    <View style={styles.filtersSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <FilterChip
          icon="search"
          label="Todas"
          active={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            icon="briefcase-outline"
            label={cat}
            active={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Oportunidades</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{opportunities.length}</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={palette.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título o descripción..."
            placeholderTextColor={palette.mutedSoft}
            value={searchText}
            onChangeText={onSearchChange}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={palette.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {renderHeader()}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={opportunities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={opportunities.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No hay oportunidades"
              message="No hay necesidades publicadas en el tablero todavía."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: palette.surface,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.5,
  },
  badgeCount: {
    backgroundColor: palette.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.ink,
  },
  filtersSection: {
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderMuted,
  },
  filtersScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: palette.surfaceMuted,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: palette.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.muted,
  },
  filterChipTextActive: {
    color: palette.white,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows.card,
  },
  cardRow: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 130,
    backgroundColor: palette.surfaceMuted,
  },
  cardImagePlaceholder: {
    width: 100,
    minHeight: 130,
    backgroundColor: palette.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgePrimary: {
    backgroundColor: palette.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePrimaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.accent,
    textTransform: 'uppercase',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: palette.muted,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: palette.muted,
  },
  budgetText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: palette.danger,
    fontSize: 16,
  },
});

module.exports = { OpportunitiesBoardScreen };