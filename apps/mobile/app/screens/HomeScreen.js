const React = require('react');
const {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { LinearGradient } = require('expo-linear-gradient');
const { SafeAreaView } = require('react-native-safe-area-context');
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

const SEARCH_PROMPTS = [
  'Plomero urgente',
  'Electricista en Palermo',
  'Pintura interior',
  'Se me rompio la canilla',
];

function getProfessionalPreviewImage(professional) {
  return professional?.avatarUrl || professional?.coverUrl || professional?.photoUrls?.[0] || null;
}

function normalizeSearchValue(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function withAlpha(color, alpha) {
  if (typeof color !== 'string' || !color.startsWith('#')) {
    return `rgba(57, 169, 255, ${alpha})`;
  }

  let hex = color.slice(1);

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((character) => character + character)
      .join('');
  }

  if (hex.length !== 6) {
    return `rgba(57, 169, 255, ${alpha})`;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildProfessionalSearchText(professional) {
  return normalizeSearchValue(
    [
      professional?.businessName,
      professional?.headline,
      professional?.city,
      professional?.province,
      professional?.categories?.map((category) => category.name).join(' '),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function buildCategorySearchText(category) {
  return normalizeSearchValue([category?.name, category?.slug, category?.description].filter(Boolean).join(' '));
}

function buildAiSearchDraft(query, context = {}) {
  return {
    query,
    createdAt: new Date().toISOString(),
    source: 'mobile-home-overlay',
    filters: {
      categoryId: context.filters?.categoryId || '',
      availableNow: Boolean(context.filters?.availableNow),
    },
    candidateCategoryIds: context.categories?.map((category) => category.id) || [],
    candidateProfessionalIds: context.professionals?.map((professional) => professional.id) || [],
  };
}

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState(false);
  const [searchOverlayVisible, setSearchOverlayVisible] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [professionals, setProfessionals] = React.useState([]);
  const [filters, setFilters] = React.useState({
    text: '',
    categoryId: '',
    availableNow: false,
  });
  const [draftText, setDraftText] = React.useState('');
  const searchOverlayProgress = React.useRef(new Animated.Value(0)).current;
  const searchComposerGrowth = React.useRef(new Animated.Value(0)).current;
  const searchInputRef = React.useRef(null);
  const aiSearchDraftRef = React.useRef(null);

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

  function openSearchOverlay() {
    setSearchOverlayVisible(true);
  }

  function closeSearchOverlay() {
    setSearchOverlayVisible(false);
  }

  function handleSearchSubmit() {
    const query = draftText.trim();

    aiSearchDraftRef.current = buildAiSearchDraft(query, {
      filters,
      categories: matchedCategories,
      professionals: matchedProfessionals,
    });
    applyFilters(buildNextFilters());
    closeSearchOverlay();
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

  function handleOverlayCategorySelect(category) {
    setDraftText(category.name || '');
    applyFilters({
      ...filters,
      text: '',
      categoryId: String(category.id),
    });
    closeSearchOverlay();
  }

  function handleOverlayProfessionalSelect(professionalId) {
    closeSearchOverlay();
    navigation.navigate('ProfessionalDetail', { professionalId });
  }

  function handlePromptPress(prompt) {
    setDraftText(prompt);
  }

  const activeCategory = categories.find((category) => String(category.id) === String(filters.categoryId)) || null;
  const rankedProfessionals = sortProfessionals(professionals, filters.categoryId);
  const featuredProfessional = rankedProfessionals[0] || null;
  const gridProfessionals = rankedProfessionals.slice(1, 7);
  const hasActiveFilters = Boolean(filters.text || filters.categoryId || filters.availableNow || draftText.trim());
  const normalizedSearchQuery = normalizeSearchValue(draftText);
  const shouldGrowSearchComposer = normalizedSearchQuery.length > 34;
  const matchedCategories = normalizedSearchQuery
    ? categories.filter((category) => buildCategorySearchText(category).includes(normalizedSearchQuery)).slice(0, 5)
    : categories.slice(0, 5);
  const matchedProfessionals = normalizedSearchQuery
    ? rankedProfessionals.filter((professional) => buildProfessionalSearchText(professional).includes(normalizedSearchQuery)).slice(0, 5)
    : rankedProfessionals.slice(0, 4);
  const matchedPrompts = normalizedSearchQuery
    ? SEARCH_PROMPTS.filter((prompt) => normalizeSearchValue(prompt).includes(normalizedSearchQuery)).slice(0, 3)
    : SEARCH_PROMPTS;
  const hasOverlayResults = Boolean(matchedCategories.length || matchedProfessionals.length || matchedPrompts.length);
  const searchPreviewText = draftText.trim() || filters.text || 'Busca profesionales o cuentanos que te pasa';
  const activeCategoryIndex = activeCategory
    ? categories.findIndex((category) => String(category.id) === String(activeCategory.id))
    : -1;
  const spotlightTheme = activeCategory ? getCategoryTheme(activeCategory, activeCategoryIndex) : null;
  const spotlightCard = spotlightTheme
    ? {
        ...spotlightTheme,
        badge: 'Categoria elegida',
        title: activeCategory.name,
        subtitle: activeCategory.description || 'Explora especialistas disponibles en esta categoria.',
      }
    : {
        key: 'category-all',
        categoryId: '',
        categoryName: 'Todos los servicios',
        icon: 'apps-outline',
        badge: 'Categoria elegida',
        title: 'Todos los servicios',
        subtitle: 'Elegi una categoria para enfocar los resultados del catalogo.',
        colors: [palette.accentDeep, palette.accent],
      };
  const featuredCategoryName = activeCategory?.name || 'Todos los servicios';
  const featuredArtworkTheme = getCategoryTheme(featuredProfessional?.categories?.[0], 0);
  const featuredArtworkIcon =
    featuredProfessional?.categories?.[0]?.icon ||
    featuredArtworkTheme.icon;
  const featuredArtworkColors = activeCategory ? spotlightCard.colors : featuredArtworkTheme.colors;
  const availabilityIcon = filters.availableNow ? 'flash' : 'time-outline';
  const availabilityLabel = filters.availableNow ? 'Ahora' : 'Cualquier horario';
  const screenScale = searchOverlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });
  const screenTranslateY = searchOverlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const screenOpacity = searchOverlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.68],
  });
  const overlayOpacity = searchOverlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const overlayTranslateY = searchOverlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const overlayScale = searchOverlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });
  const composerMinHeight = searchComposerGrowth.interpolate({
    inputRange: [0, 1],
    outputRange: [62, 88],
  });

  React.useEffect(() => {
    Animated.timing(searchOverlayProgress, {
      toValue: searchOverlayVisible ? 1 : 0,
      duration: searchOverlayVisible ? 280 : 220,
      easing: searchOverlayVisible ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();

    if (!searchOverlayVisible) {
      Keyboard.dismiss();
    }
  }, [searchOverlayProgress, searchOverlayVisible]);

  React.useEffect(() => {
    Animated.timing(searchComposerGrowth, {
      toValue: shouldGrowSearchComposer ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchComposerGrowth, shouldGrowSearchComposer]);

  React.useEffect(() => {
    let focusTimeout;

    if (searchOverlayVisible) {
      focusTimeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 160);
    }

    return () => {
      clearTimeout(focusTimeout);
    };
  }, [searchOverlayVisible]);

  if (loading) {
    return <LoadingView label="Buscando profesionales..." />;
  }

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.screenLayer,
          {
            opacity: screenOpacity,
            transform: [{ scale: screenScale }, { translateY: screenTranslateY }],
          },
        ]}
      >
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

          <Pressable onPress={openSearchOverlay} style={styles.searchShell}>
            <Ionicons name="search-outline" size={18} color={palette.muted} />
            <Text numberOfLines={1} style={[styles.searchPreviewText, draftText.trim() && styles.searchPreviewTextFilled]}>
              {searchPreviewText}
            </Text>
            <View style={styles.searchAction}>
              {fetching ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color={palette.white} />
              )}
            </View>
          </Pressable>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Categorías</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            <Pressable onPress={() => handleCategoryPress('')} style={styles.categoryItem}>
              <View style={[styles.categoryIconWrap, !filters.categoryId && styles.categoryIconWrapActive]}>
                <Ionicons name="apps-outline" size={20} color={!filters.categoryId ? palette.white : palette.accentDark} />
              </View>
              <Text style={styles.categoryName}>Todos</Text>
            </Pressable>

            {categories.map((category, index) => {
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
          </ScrollView>

          <LinearGradient colors={spotlightCard.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.categoryBanner}>
            <View pointerEvents="none" style={styles.categoryBannerOrbPrimary} />
            <View pointerEvents="none" style={styles.categoryBannerOrbSecondary} />

            <View style={styles.categoryBannerTopRow}>
              <Text style={styles.categoryBannerEyebrow}>{spotlightCard.badge}</Text>
              <Pressable
                onPress={handleToggleAvailability}
                style={[styles.categoryBannerToggle, filters.availableNow && styles.categoryBannerToggleActive]}
              >
                <Ionicons
                  name={availabilityIcon}
                  size={13}
                  color={filters.availableNow ? palette.accentDark : palette.white}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.categoryBannerToggleText,
                    filters.availableNow && styles.categoryBannerToggleTextActive,
                  ]}
                >
                  {availabilityLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.categoryBannerBottomRow}>
              <View style={styles.categoryBannerCopy}>
                <Text numberOfLines={1} style={styles.categoryBannerTitle}>
                  {spotlightCard.title}
                </Text>
                <Text numberOfLines={1} style={styles.categoryBannerSubtitle}>
                  {spotlightCard.subtitle}
                </Text>
              </View>

              {hasActiveFilters ? (
                <Pressable hitSlop={8} onPress={handleClearFilters} style={styles.categoryBannerClear}>
                  <Text style={styles.categoryBannerClearText}>Limpiar</Text>
                </Pressable>
              ) : null}
            </View>
          </LinearGradient>

          {featuredProfessional ? (
            <Pressable
              onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: featuredProfessional.id })}
              style={styles.featuredPressable}
            >
              <View style={[styles.featuredCard, shadows.card]}>
                <ServiceArtwork
                  size="banner"
                  icon={featuredArtworkIcon}
                  colors={featuredArtworkColors}
                  badge={featuredCategoryName ? `${featuredCategoryName} recomendado` : 'Recomendado'}
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
                    {featuredProfessional.headline || 'Servicio confiable con comunicación clara y respuesta rápida.'}
                  </Text>

                  <View style={styles.featuredFooter}>
                    <Text style={styles.featuredPrice}>{formatPriceHint(featuredProfessional)}</Text>
                    <Text style={styles.featuredAction}>Ver perfil</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ) : (
            <EmptyState title="No services found" message="Adjust your text or category filters to discover more professionals." />
          )}

          {gridProfessionals.length ? (
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Profesionales ({rankedProfessionals.length})</Text>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </View>
          ) : null}

          {toPairs(gridProfessionals).map((pair, pairIndex) => (
            <View key={`pair-${pairIndex}`} style={styles.gridRow}>
              {pair.map((professional, index) => {
                const categoryTheme = getCategoryTheme(professional.categories?.[0], pairIndex + index + 1);
                const gridIcon = getCategoryIcon(professional.categories?.[0], pairIndex + index + 1);
                const previewImage = getProfessionalPreviewImage(professional);

                return (
                  <Pressable
                    key={professional.id}
                    onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: professional.id })}
                    style={styles.gridCardPressable}
                  >
                    <View style={[styles.gridCard, shadows.card]}>
                      <View style={styles.gridMediaShell}>
                        {previewImage ? (
                          <Image source={{ uri: previewImage }} style={styles.gridPhoto} resizeMode="cover" />
                        ) : (
                          <ServiceArtwork
                            size="thumb"
                            icon={gridIcon}
                            colors={categoryTheme.colors}
                            style={styles.gridArtwork}
                          />
                        )}
                      </View>

                      <View style={styles.gridBody}>
                        <View
                          style={[
                            styles.gridBodyAccentLarge,
                            { backgroundColor: withAlpha(categoryTheme.colors[0], 0.16) },
                          ]}
                        />
                        <View
                          style={[
                            styles.gridBodyAccentSmall,
                            { backgroundColor: withAlpha(categoryTheme.colors[1], 0.11) },
                          ]}
                        />

                        <View
                          style={[
                            styles.gridIconBadge,
                            {
                              backgroundColor: withAlpha(categoryTheme.colors[0], 0.14),
                              borderColor: withAlpha(categoryTheme.colors[0], 0.2),
                            },
                          ]}
                        >
                          <Ionicons name={gridIcon} size={14} color={categoryTheme.colors[0]} />
                        </View>

                        <Text numberOfLines={2} style={styles.gridTitle}>
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

                        <Text numberOfLines={1} style={styles.gridLocation}>
                          {formatLocation(professional)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
              {pair.length === 1 ? <View style={styles.gridCardPlaceholder} /> : null}
            </View>
          ))}

          <AppButton
            variant="ghost"
            onPress={() => loadProfessionals(filters)}
            loading={fetching}
            icon="refresh-outline"
          >
            Actualizar catálogo
          </AppButton>
        </Screen>
      </Animated.View>

      <Animated.View
        pointerEvents={searchOverlayVisible ? 'auto' : 'none'}
        style={[styles.searchOverlayRoot, { opacity: overlayOpacity }]}
      >
        <Pressable onPress={closeSearchOverlay} style={styles.searchOverlayBackdrop} />

        <SafeAreaView edges={['top', 'left', 'right']} style={styles.searchOverlaySafeArea}>
          <Animated.View
            style={[
              styles.searchOverlayPanel,
              shadows.card,
              {
                transform: [{ translateY: overlayTranslateY }, { scale: overlayScale }],
              },
            ]}
          >
            <View pointerEvents="none" style={styles.searchOverlayOrbTop} />
            <View pointerEvents="none" style={styles.searchOverlayOrbBottom} />

            <View style={styles.searchOverlayHeader}>
              <View style={styles.searchOverlayEyebrow}>
                <Ionicons name="sparkles-outline" size={13} color={palette.accentDark} />
                <Text style={styles.searchOverlayEyebrowText}>Busqueda guiada</Text>
              </View>

              <Pressable onPress={closeSearchOverlay} style={styles.searchOverlayClose}>
                <Ionicons name="close-outline" size={18} color={palette.ink} />
              </Pressable>
            </View>

            <Text style={styles.searchOverlayTitle}>
              Busca por profesional, secciones o cuentanos que es lo que te esta pasando y te ayudamos a resolverlo.
            </Text>

            <Animated.View style={[styles.searchComposer, { minHeight: composerMinHeight }]}>
              <Ionicons name="search-outline" size={18} color={palette.muted} style={styles.searchComposerIcon} />
              <TextInput
                ref={searchInputRef}
                value={draftText}
                onChangeText={setDraftText}
                placeholder="Ej: plomero urgente en Palermo"
                placeholderTextColor={palette.mutedSoft}
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
                style={styles.searchComposerInput}
              />
              <Pressable onPress={handleSearchSubmit} style={styles.searchComposerAction}>
                {fetching ? (
                  <ActivityIndicator size="small" color={palette.white} />
                ) : (
                  <Ionicons name="arrow-forward" size={16} color={palette.white} />
                )}
              </Pressable>
            </Animated.View>

            <Text style={styles.searchOverlayHint}>
              {normalizedSearchQuery
                ? 'Vamos cruzando coincidencias entre profesionales y categorias mientras escribes.'
                : 'Empieza con un oficio, un barrio o describe el problema de tu casa.'}
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.searchOverlayScrollContent}
            >
              {normalizedSearchQuery ? (
                <Pressable onPress={handleSearchSubmit} style={[styles.searchIntentCard, shadows.card]}>
                  <View style={styles.searchIntentIcon}>
                    <Ionicons name="sparkles-outline" size={18} color={palette.accentDark} />
                  </View>
                  <View style={styles.searchIntentCopy}>
                    <Text numberOfLines={1} style={styles.searchIntentTitle}>
                      Buscar "{draftText.trim()}"
                    </Text>
                    <Text style={styles.searchIntentText}>
                      Dejamos listo este texto para conectarlo despues con una busqueda asistida por IA.
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={palette.accentDark} />
                </Pressable>
              ) : null}

              {matchedCategories.length ? (
                <View style={styles.searchSection}>
                  <View style={styles.searchSectionHeader}>
                    <Text style={styles.searchSectionTitle}>Secciones</Text>
                    <Text style={styles.searchSectionMeta}>{matchedCategories.length}</Text>
                  </View>

                  <View style={styles.searchCategoryGrid}>
                    {matchedCategories.map((category, index) => {
                      const categoryTheme = getCategoryTheme(category, index);

                      return (
                        <Pressable
                          key={`overlay-category-${category.id}`}
                          onPress={() => handleOverlayCategorySelect(category)}
                          style={[styles.searchCategoryCard, shadows.card]}
                        >
                          <View
                            style={[
                              styles.searchCategoryIconWrap,
                              { backgroundColor: withAlpha(categoryTheme.colors[0], 0.14) },
                            ]}
                          >
                            <Ionicons name={getCategoryIcon(category, index)} size={18} color={categoryTheme.colors[0]} />
                          </View>
                          <Text numberOfLines={2} style={styles.searchCategoryTitle}>
                            {category.name}
                          </Text>
                          <Text numberOfLines={2} style={styles.searchCategorySubtitle}>
                            {category.description || 'Explora especialistas disponibles en esta seccion.'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {matchedProfessionals.length ? (
                <View style={styles.searchSection}>
                  <View style={styles.searchSectionHeader}>
                    <Text style={styles.searchSectionTitle}>Profesionales</Text>
                    <Text style={styles.searchSectionMeta}>{matchedProfessionals.length}</Text>
                  </View>

                  {matchedProfessionals.map((professional, index) => {
                    const previewImage = getProfessionalPreviewImage(professional);
                    const professionalTheme = getCategoryTheme(professional.categories?.[0], index);

                    return (
                      <Pressable
                        key={`overlay-professional-${professional.id}`}
                        onPress={() => handleOverlayProfessionalSelect(professional.id)}
                        style={[styles.searchProfessionalRow, shadows.card]}
                      >
                        <View style={styles.searchProfessionalMedia}>
                          {previewImage ? (
                            <Image source={{ uri: previewImage }} style={styles.searchProfessionalPhoto} resizeMode="cover" />
                          ) : (
                            <View
                              style={[
                                styles.searchProfessionalFallback,
                                { backgroundColor: withAlpha(professionalTheme.colors[0], 0.16) },
                              ]}
                            >
                              <Ionicons
                                name={getCategoryIcon(professional.categories?.[0], index)}
                                size={18}
                                color={professionalTheme.colors[0]}
                              />
                            </View>
                          )}
                        </View>

                        <View style={styles.searchProfessionalBody}>
                          <Text numberOfLines={1} style={styles.searchProfessionalTitle}>
                            {professional.businessName}
                          </Text>
                          <Text numberOfLines={1} style={styles.searchProfessionalSubtitle}>
                            {professional.categories?.[0]?.name || 'Servicio general'} - {formatLocation(professional)}
                          </Text>
                          <View style={styles.searchProfessionalMetaRow}>
                            <Ionicons name="star" size={12} color={palette.warning} />
                            <Text style={styles.searchProfessionalMetaText}>
                              {formatRating(professional)} ({professional.reviewCount || 0})
                            </Text>
                          </View>
                        </View>

                        <Ionicons name="arrow-forward" size={16} color={palette.accentDark} />
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {matchedPrompts.length ? (
                <View style={styles.searchSection}>
                  <View style={styles.searchSectionHeader}>
                    <Text style={styles.searchSectionTitle}>Ideas rapidas</Text>
                    <Text style={styles.searchSectionMeta}>{matchedPrompts.length}</Text>
                  </View>

                  <View style={styles.searchPromptRail}>
                    {matchedPrompts.map((prompt) => (
                      <Pressable key={prompt} onPress={() => handlePromptPress(prompt)} style={styles.searchPromptChip}>
                        <Ionicons name="flash-outline" size={14} color={palette.accentDark} />
                        <Text style={styles.searchPromptChipText}>{prompt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {!hasOverlayResults ? (
                <View style={styles.searchEmptyState}>
                  <Text style={styles.searchEmptyTitle}>No vemos coincidencias exactas</Text>
                  <Text style={styles.searchEmptyCopy}>
                    Sigue escribiendo o envia la busqueda para usarla mas adelante como entrada de la interpretacion inteligente.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.white,
  },
  screenLayer: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 144,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  root: {
    flex: 1,
    backgroundColor: palette.white,
  },
  screenLayer: {
    flex: 1,
  },
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
  searchPreviewText: {
    flex: 1,
    color: palette.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  searchPreviewTextFilled: {
    color: palette.ink,
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
  categoryBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  categoryBannerOrbPrimary: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    top: -44,
    left: -18,
  },
  categoryBannerOrbSecondary: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    right: -10,
    bottom: -28,
  },
  categoryBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryBannerEyebrow: {
    flex: 1,
    color: palette.whiteSoft,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  categoryBannerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 168,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  categoryBannerToggleActive: {
    backgroundColor: palette.white,
    borderColor: palette.white,
  },
  categoryBannerToggleText: {
    flexShrink: 1,
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBannerToggleTextActive: {
    color: palette.accentDark,
  },
  categoryBannerBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryBannerCopy: {
    flex: 1,
    gap: 2,
  },
  categoryBannerTitle: {
    color: palette.white,
    fontSize: 19,
    fontWeight: '800',
  },
  categoryBannerSubtitle: {
    color: palette.whiteSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  categoryBannerClear: {
    paddingVertical: 4,
  },
  categoryBannerClearText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryRail: {
    gap: 14,
    paddingRight: 8,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
    width: 76,
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
    overflow: 'hidden',
  },
  gridCardPlaceholder: {
    flex: 1,
  },
  gridMediaShell: {
    minHeight: 118,
    backgroundColor: palette.surfaceMuted,
  },
  gridPhoto: {
    width: '100%',
    height: 118,
  },
  gridArtwork: {
    minHeight: 118,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  gridBody: {
    position: 'relative',
    minHeight: 138,
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 0,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  gridBodyAccentLarge: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    top: -24,
    right: -38,
  },
  gridBodyAccentSmall: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 999,
    bottom: -18,
    right: -10,
  },
  gridIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: -18,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  gridMetaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  gridDescription: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  gridLocation: {
    color: palette.ink,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  searchOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  searchOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 22, 39, 0.26)',
  },
  searchOverlaySafeArea: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 14,
  },
  searchOverlayPanel: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    overflow: 'hidden',
    gap: 14,
  },
  searchOverlayOrbTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -74,
    right: -46,
    backgroundColor: 'rgba(57, 169, 255, 0.12)',
  },
  searchOverlayOrbBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    bottom: -82,
    left: -54,
    backgroundColor: 'rgba(37, 150, 243, 0.08)',
  },
  searchOverlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchOverlayEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  searchOverlayEyebrowText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  searchOverlayClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  searchOverlayTitle: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    maxWidth: '92%',
  },
  searchComposer: {
    borderRadius: 24,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchComposerIcon: {
    marginTop: 1,
  },
  searchComposerInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 18,
  },
  searchComposerAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  searchOverlayHint: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  searchOverlayScrollContent: {
    gap: 18,
    paddingBottom: 34,
  },
  searchIntentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  searchIntentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  searchIntentCopy: {
    flex: 1,
    gap: 4,
  },
  searchIntentTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  searchIntentText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  searchSection: {
    gap: 12,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchSectionTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  searchSectionMeta: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  searchCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  searchCategoryCard: {
    width: '48%',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  searchCategoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCategoryTitle: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  searchCategorySubtitle: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  searchProfessionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  searchProfessionalMedia: {
    width: 62,
    height: 62,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: palette.surfaceMuted,
  },
  searchProfessionalPhoto: {
    width: '100%',
    height: '100%',
  },
  searchProfessionalFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchProfessionalBody: {
    flex: 1,
    gap: 4,
  },
  searchProfessionalTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  searchProfessionalSubtitle: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  searchProfessionalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  searchProfessionalMetaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  searchPromptRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  searchPromptChipText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  searchEmptyState: {
    gap: 8,
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  searchEmptyTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  searchEmptyCopy: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});

module.exports = {
  HomeScreen,
};

