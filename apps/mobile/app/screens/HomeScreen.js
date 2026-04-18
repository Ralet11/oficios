const React = require('react');
const {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { getCategoryIcon, getCategoryTheme } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

function getRecommendationScore(professional, activeCategoryId) {
  const hasCategoryMatch = professional.categories?.some((category) => String(category.id) === String(activeCategoryId));

  return (
    (professional.availableNow ? 140 : 0) +
    (Number(professional.ratingAverage) || 0) * 24 +
    Math.min(Number(professional.reviewCount) || 0, 30) +
    (hasCategoryMatch ? 18 : 0)
  );
}

function sortProfessionals(professionals, activeCategoryId) {
  return [...professionals].sort(
    (left, right) => getRecommendationScore(right, activeCategoryId) - getRecommendationScore(left, activeCategoryId),
  );
}

function formatLocation(professional) {
  return [professional.city, professional.province].filter(Boolean).join(', ') || 'Argentina';
}

function formatRating(professional) {
  return (Number(professional.ratingAverage) || 0).toFixed(1);
}

function formatPriceHint(professional) {
  const base = Math.max(9000, (Number(professional.yearsExperience) || 1) * 3500 + 6500);
  return `ARS ${base.toLocaleString('es-AR')}`;
}

function toPairs(items) {
  const pairs = [];

  for (let index = 0; index < items.length; index += 2) {
    pairs.push(items.slice(index, index + 2));
  }

  return pairs;
}

function getUserInitials(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'CL';
}

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const spotlightAnim = React.useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [professionals, setProfessionals] = React.useState([]);
  const [filters, setFilters] = React.useState({
    text: '',
    categoryId: '',
    availableNow: false,
  });
  const [draftText, setDraftText] = React.useState('');
  const [rotationIndex, setRotationIndex] = React.useState(0);
  const [displayedSpotlight, setDisplayedSpotlight] = React.useState(null);

  async function requestProfessionals(nextFilters) {
    return api.professionals({
      page: 1,
      pageSize: 20,
      text: nextFilters.text,
      categoryId: nextFilters.categoryId || undefined,
      availableNow: nextFilters.availableNow,
    });
  }

  async function loadProfessionals(nextFilters, options = {}) {
    const initial = Boolean(options.initial);

    try {
      if (initial) {
        setLoading(true);
      } else {
        setFetching(true);
      }

      const response = await requestProfessionals(nextFilters);
      setProfessionals(response.data || []);
    } catch (error) {
      Alert.alert('No se pudo cargar el catalogo', error.message);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        const [categoriesResponse, professionalsResponse] = await Promise.all([
          api.categories(),
          requestProfessionals(filters),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(categoriesResponse.data || []);
        setProfessionals(professionalsResponse.data || []);
      } catch (error) {
        if (!cancelled) {
          Alert.alert('No se pudo cargar el catalogo', error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (filters.categoryId || categories.length < 2) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRotationIndex((current) => (current + 1) % categories.length);
    }, 3400);

    return () => clearInterval(timer);
  }, [categories, filters.categoryId]);

  function applyFilters(nextFilters) {
    setFilters(nextFilters);
    loadProfessionals(nextFilters);
  }

  function buildNextFilters(overrides = {}) {
    return {
      ...filters,
      text: draftText.trim(),
      ...overrides,
    };
  }

  function handleSearchSubmit() {
    applyFilters(buildNextFilters());
  }

  function handleCategoryPress(categoryId) {
    const nextCategoryId = String(filters.categoryId) === String(categoryId) ? '' : String(categoryId);
    applyFilters(buildNextFilters({ categoryId: nextCategoryId }));
  }

  function handleToggleAvailability() {
    applyFilters(buildNextFilters({ availableNow: !filters.availableNow }));
  }

  function handleClearFilters() {
    setDraftText('');
    applyFilters({
      text: '',
      categoryId: '',
      availableNow: false,
    });
  }

  const activeCategory = categories.find((category) => String(category.id) === String(filters.categoryId)) || null;
  const rankedProfessionals = sortProfessionals(professionals, filters.categoryId);
  const featuredProfessional = rankedProfessionals[0] || null;
  const gridProfessionals = rankedProfessionals.slice(1, 7);
  const categoryCards = categories.slice(0, 4);
  const homeChips = ['All Service', ...categories.slice(0, 4).map((category) => category.name)];
  const hasActiveFilters = Boolean(filters.text || filters.categoryId || filters.availableNow || draftText.trim());
  const spotlightCategory =
    activeCategory || (categories.length ? categories[rotationIndex % categories.length] : null);
  const spotlightTheme = getCategoryTheme(
    spotlightCategory,
    categories.findIndex((category) => String(category.id) === String(spotlightCategory?.id)),
  );
  const spotlightSignature = [
    spotlightTheme.key,
    spotlightTheme.badge,
    spotlightTheme.title,
    spotlightTheme.subtitle,
  ].join('|');

  React.useEffect(() => {
    if (!displayedSpotlight) {
      setDisplayedSpotlight(spotlightTheme);
      return;
    }

    if (displayedSpotlight.key === spotlightTheme.key) {
      return;
    }

    Animated.timing(spotlightAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayedSpotlight(spotlightTheme);
      spotlightAnim.setValue(0);
      Animated.timing(spotlightAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });
  }, [displayedSpotlight, spotlightAnim, spotlightSignature, spotlightTheme]);

  const spotlightCard = displayedSpotlight || spotlightTheme;
  const featuredCategoryName = activeCategory?.name || spotlightCard.categoryName;
  const featuredArtworkIcon =
    featuredProfessional?.categories?.[0]?.icon ||
    getCategoryTheme(featuredProfessional?.categories?.[0], 0).icon;

  if (loading) {
    return <LoadingView label="Buscando profesionales..." />;
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
          </View>
          <View style={styles.userCopy}>
            <Text style={styles.userName}>Hi, {user?.firstName || 'Cliente'}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color={palette.accentDark} />
              <Text style={styles.locationText}>{featuredCategoryName || 'Argentina'}</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={18} color={palette.ink} />
        </Pressable>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color={palette.muted} />
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          placeholder="How can I help you today?"
          placeholderTextColor={palette.mutedSoft}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          style={styles.searchInput}
        />
        <Pressable onPress={handleSearchSubmit} style={styles.searchAction}>
          {fetching ? (
            <ActivityIndicator size="small" color={palette.white} />
          ) : (
            <Ionicons name="options-outline" size={16} color={palette.white} />
          )}
        </Pressable>
      </View>

      <View style={styles.inlineFilterRow}>
        <Pressable onPress={handleToggleAvailability} style={[styles.liveChip, filters.availableNow && styles.liveChipActive]}>
          <Ionicons
            name={filters.availableNow ? 'flash' : 'time-outline'}
            size={14}
            color={filters.availableNow ? palette.white : palette.accentDark}
          />
          <Text style={[styles.liveChipText, filters.availableNow && styles.liveChipTextActive]}>
            {filters.availableNow ? 'Available now' : 'Any schedule'}
          </Text>
        </Pressable>
        {hasActiveFilters ? (
          <Pressable onPress={handleClearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{activeCategory ? 'Categoria Activa' : 'Inspiracion del Dia'}</Text>
        <Text style={styles.sectionLink}>{activeCategory ? activeCategory.name : 'Rotando oficios'}</Text>
      </View>

      <Animated.View
        style={[
          styles.spotlightShell,
          {
            opacity: spotlightAnim,
            transform: [
              {
                translateY: spotlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: spotlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() => {
            if (!spotlightCard.categoryId) {
              return;
            }

            applyFilters(buildNextFilters({ categoryId: String(spotlightCard.categoryId) }));
          }}
        >
          <ServiceArtwork
            size="banner"
            icon={spotlightCard.icon}
            colors={spotlightCard.colors}
            badge={spotlightCard.badge}
            style={styles.offerCard}
            title={spotlightCard.title}
            subtitle={spotlightCard.subtitle}
          >
            <View style={styles.offerButton}>
              <Text style={styles.offerButtonText}>
                {activeCategory ? 'Ver especialistas' : `Explorar ${spotlightCard.categoryName}`}
              </Text>
            </View>
          </ServiceArtwork>
        </Pressable>
      </Animated.View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Service Category</Text>
        <Text style={styles.sectionLink}>See All</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categoryCards.map((category, index) => {
          const active = String(filters.categoryId) === String(category.id);

          return (
            <Pressable key={category.id} onPress={() => handleCategoryPress(category.id)} style={styles.categoryItem}>
              <View style={[styles.categoryIconWrap, active && styles.categoryIconWrapActive]}>
                <Ionicons
                  name={getCategoryIcon(category, index)}
                  size={20}
                  color={active ? palette.white : palette.accentDark}
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Home Service</Text>
        <Text style={styles.sectionLink}>See All</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
        {homeChips.map((chip) => {
          const active = chip === 'All Service' ? !filters.categoryId : activeCategory?.name === chip;

          return (
            <Pressable
              key={chip}
              onPress={() => {
                if (chip === 'All Service') {
                  handleCategoryPress('');
                  return;
                }

                const selected = categories.find((category) => category.name === chip);
                if (selected) {
                  handleCategoryPress(selected.id);
                }
              }}
              style={[styles.segmentChip, active && styles.segmentChipActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{chip}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {featuredProfessional ? (
        <Pressable
          onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: featuredProfessional.id })}
          style={styles.featuredPressable}
        >
          <View style={[styles.featuredCard, shadows.card]}>
            <ServiceArtwork
              size="banner"
              icon={featuredArtworkIcon}
              colors={spotlightCard.colors}
              badge={featuredCategoryName ? `${featuredCategoryName} recomendado` : 'Recommended'}
              style={styles.featuredArtwork}
            />

            <View style={styles.featuredBody}>
              <Text numberOfLines={1} style={styles.featuredTitle}>
                {featuredProfessional.businessName}
              </Text>

              <View style={styles.featuredMetaRow}>
                <View style={styles.metaInline}>
                  <Ionicons name="location-outline" size={13} color={palette.muted} />
                  <Text style={styles.metaInlineText}>{formatLocation(featuredProfessional)}</Text>
                </View>
                <View style={styles.metaInline}>
                  <Ionicons name="star" size={13} color={palette.warning} />
                  <Text style={styles.metaInlineText}>
                    {formatRating(featuredProfessional)} ({featuredProfessional.reviewCount || 0})
                  </Text>
                </View>
              </View>

              <Text numberOfLines={2} style={styles.featuredDescription}>
                {featuredProfessional.headline || 'Reliable service with clear communication and fast response.'}
              </Text>

              <View style={styles.featuredFooter}>
                <Text style={styles.featuredPrice}>{formatPriceHint(featuredProfessional)}</Text>
                <Text style={styles.featuredAction}>View Detail</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ) : (
        <EmptyState title="No services found" message="Adjust your text or category filters to discover more professionals." />
      )}

      {gridProfessionals.length ? (
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Service Found ({rankedProfessionals.length})</Text>
          <Text style={styles.sectionLink}>See All</Text>
        </View>
      ) : null}

      {toPairs(gridProfessionals).map((pair, pairIndex) => (
        <View key={`pair-${pairIndex}`} style={styles.gridRow}>
          {pair.map((professional, index) => (
            <Pressable
              key={professional.id}
              onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: professional.id })}
              style={styles.gridCardPressable}
            >
              <View style={[styles.gridCard, shadows.card]}>
                <ServiceArtwork
                  size="thumb"
                  icon={getCategoryIcon(professional.categories?.[0], pairIndex + index + 1)}
                  style={styles.gridArtwork}
                />
                <Text numberOfLines={1} style={styles.gridTitle}>
                  {professional.businessName}
                </Text>
                <View style={styles.gridMetaRow}>
                  <Ionicons name="star" size={12} color={palette.warning} />
                  <Text style={styles.gridMetaText}>
                    {formatRating(professional)} ({professional.reviewCount || 0})
                  </Text>
                </View>
                <Text numberOfLines={2} style={styles.gridDescription}>
                  {professional.headline || 'Professional service with visible reputation signals.'}
                </Text>
              </View>
            </Pressable>
          ))}
          {pair.length === 1 ? <View style={styles.gridCardPlaceholder} /> : null}
        </View>
      ))}

      <AppButton
        variant="ghost"
        onPress={() => loadProfessionals(filters)}
        loading={fetching}
        icon="refresh-outline"
      >
        Refresh Catalog
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 144,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  avatarText: {
    color: palette.accentDark,
    fontSize: 18,
    fontWeight: '800',
  },
  userCopy: {
    gap: 3,
  },
  userName: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  searchShell: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 16,
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
  searchAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  inlineFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  liveChipActive: {
    backgroundColor: palette.accent,
  },
  liveChipText: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  liveChipTextActive: {
    color: palette.white,
  },
  clearText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 23,
    fontWeight: '800',
  },
  sectionLink: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  offerCard: {
    minHeight: 156,
  },
  spotlightShell: {
    borderRadius: 24,
  },
  offerButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  offerButtonText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  categoryIconWrapActive: {
    backgroundColor: palette.accent,
  },
  categoryName: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipRail: {
    gap: 10,
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
  },
  segmentChipActive: {
    backgroundColor: palette.accentSoft,
  },
  segmentText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  featuredPressable: {
    borderRadius: 24,
  },
  featuredCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    overflow: 'hidden',
  },
  featuredArtwork: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  featuredBody: {
    padding: 18,
    gap: 8,
  },
  featuredTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  featuredMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaInlineText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  featuredDescription: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  featuredAction: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCardPressable: {
    flex: 1,
  },
  gridCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 12,
    gap: 10,
  },
  gridCardPlaceholder: {
    flex: 1,
  },
  gridArtwork: {
    minHeight: 112,
  },
  gridTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gridMetaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  gridDescription: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});

module.exports = {
  HomeScreen,
};
