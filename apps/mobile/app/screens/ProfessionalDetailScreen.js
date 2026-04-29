const React = require('react');
const { Alert, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } = require('react-native');
const { useRoute } = require('@react-navigation/native');
const { SafeAreaView, useSafeAreaInsets } = require('react-native-safe-area-context');
const { Ionicons } = require('@expo/vector-icons');
const { LinearGradient } = require('expo-linear-gradient');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows } = require('../theme');

function formatRating(value) {
  return (Number(value) || 0).toFixed(1);
}

function formatReviewCount(count) {
  if (!count) {
    return 'Sin resenas todavia';
  }

  return `${count} ${count === 1 ? 'resena' : 'resenas'}`;
}

function formatLocation(professional) {
  return [professional.city, professional.province].filter(Boolean).join(', ') || 'Argentina';
}

function formatCompletedJobsCompact(count) {
  const value = Number(count) || 0;

  if (!value) {
    return 'Nuevo';
  }

  return String(value);
}

function formatResponseTimeCompact(minutes) {
  const value = Number(minutes) || 0;

  if (!value) {
    return 'A coord.';
  }

  if (value < 60) {
    return `~${value} min`;
  }

  const hours = Math.round(value / 60);
  return `~${hours} h`;
}

function formatYearsExperience(yearsExperience) {
  const value = Number(yearsExperience) || 0;

  if (!value) {
    return 'Experiencia inicial';
  }

  return `${value} ${value === 1 ? 'ano' : 'anos'} de experiencia`;
}

function buildPersonalDetails(professional) {
  const details = professional.personalDetails || {};
  const items = [];

  if (details.age) {
    items.push({
      icon: 'person-outline',
      label: 'Edad',
      value: `${details.age} anos`,
    });
  }

  if (details.nationality) {
    items.push({
      icon: 'flag-outline',
      label: 'Nacionalidad',
      value: details.nationality,
    });
  }

  if (details.languages?.length) {
    items.push({
      icon: 'chatbubbles-outline',
      label: 'Idiomas',
      value: details.languages.join(', '),
    });
  }

  return items;
}

function buildCertificationMeta(certification) {
  return [
    certification.issuer,
    certification.year ? String(certification.year) : null,
    certification.credentialId ? `Credencial ${certification.credentialId}` : null,
    certification.evidenceUrl ? 'Respaldo disponible' : null,
  ].filter(Boolean);
}

function pushUnique(list, seen, value) {
  if (!value || typeof value !== 'string' || seen.has(value)) {
    return;
  }

  seen.add(value);
  list.push(value);
}

function buildHeroImages(professional) {
  const images = [];
  const seen = new Set();

  pushUnique(images, seen, professional.coverUrl);

  (professional.photoUrls || []).forEach((photoUrl) => pushUnique(images, seen, photoUrl));

  (professional.workPosts || []).forEach((post) => {
    (post.photoUrls || []).forEach((photoUrl) => pushUnique(images, seen, photoUrl));
  });

  return images;
}

function buildAvatarSource(professional, heroImages) {
  return professional.avatarUrl || professional.photoUrls?.[0] || heroImages[0] || null;
}

function buildGalleryFeedItems(professional, heroImages) {
  if (professional.workPosts?.length) {
    return professional.workPosts.map((post, index) => ({
      id: post.id || `post-${index}`,
      title: post.title || `Trabajo ${index + 1}`,
      body: post.body || professional.bio || professional.headline || '',
      photoUrls: (post.photoUrls || []).filter(Boolean),
      highlightLines: post.highlightLines || [],
    }));
  }

  if (!heroImages.length) {
    return [];
  }

  return [
    {
      id: 'hero-gallery',
      title: professional.businessName,
      body: professional.bio || professional.headline || 'Galeria visual del profesional.',
      photoUrls: heroImages,
      highlightLines: (professional.categories || []).map((category) => category.name).filter(Boolean).slice(0, 4),
    },
  ];
}

function HeroMedia({ images, icon, title }) {
  if (!images.length) {
    return (
      <LinearGradient colors={[palette.accentDeep, palette.accent]} style={styles.heroFallback}>
        <View style={styles.heroFallbackOrbLarge} />
        <View style={styles.heroFallbackOrbSmall} />
        <View style={styles.heroFallbackIcon}>
          <Ionicons name={icon} size={38} color={palette.white} />
        </View>
        <Text style={styles.heroFallbackTitle}>{title}</Text>
      </LinearGradient>
    );
  }

  if (images.length === 1) {
    return <Image source={{ uri: images[0] }} style={styles.heroSingleImage} resizeMode="cover" />;
  }

  if (images.length === 2) {
    return (
      <View style={styles.heroDoubleRow}>
        {images.slice(0, 2).map((imageUrl) => (
          <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.heroDoubleImage} resizeMode="cover" />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.heroMosaic}>
      <Image source={{ uri: images[0] }} style={styles.heroMosaicMain} resizeMode="cover" />

      <View style={styles.heroMosaicSideColumn}>
        {images.slice(1, 3).map((imageUrl) => (
          <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.heroMosaicSideImage} resizeMode="cover" />
        ))}
      </View>
    </View>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <View style={styles.sectionHeading}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ProfessionalDetailScreen({ navigation }) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const professionalId = route.params.professionalId;
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);
  const [showFullBio, setShowFullBio] = React.useState(false);
  const [bottomBarHeight, setBottomBarHeight] = React.useState(0);
  const [galleryVisible, setGalleryVisible] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await api.professional(professionalId, token);

        if (mounted) {
          setDetail(response);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert('No se pudo cargar el perfil', error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [professionalId, token]);

  async function handleShare(professional) {
    try {
      await Share.share({
        title: professional.businessName,
        message: `${professional.businessName} | ${professional.headline || 'Profesional recomendado'} | ${formatLocation(professional)}`,
      });
    } catch (error) {
      Alert.alert('No se pudo compartir', error.message);
    }
  }

  function handleCreateRequest(professional) {
    navigation.navigate('ServiceNeedComposer', {
      targetProfessional: {
        id: professional.id,
        avatarUrl: professional.avatarUrl || null,
        availableNow: Boolean(professional.availableNow),
        businessName: professional.businessName,
        categories: professional.categories || [],
        city: professional.city || '',
        coverUrl: professional.coverUrl || null,
        headline: professional.headline || '',
        photoUrls: professional.photoUrls || [],
        province: professional.province || '',
        ratingAverage: professional.ratingAverage || 0,
        reviewCount: professional.reviewCount || 0,
      },
    });
  }

  if (loading) {
    return <LoadingView label="Cargando perfil..." />;
  }

  if (!detail?.data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={styles.emptyShell}>
          <EmptyState title="Perfil no disponible" message="El profesional no esta visible o no existe." />
        </View>
      </SafeAreaView>
    );
  }

  const professional = detail.data;
  const heroIcon = getCategoryIcon(professional.categories?.[0], 0);
  const heroImages = buildHeroImages(professional);
  const avatarSource = buildAvatarSource(professional, heroImages);
  const galleryFeedItems = buildGalleryFeedItems(professional, heroImages);
  const location = formatLocation(professional);
  const reviewHeroScore = professional.reviewCount ? formatRating(professional.ratingAverage) : 'Nuevo';
  const reviewCountCopy = formatReviewCount(professional.reviewCount || 0);
  const bioText =
    professional.bio ||
    professional.headline ||
    'Perfil aprobado para recibir solicitudes y coordinar trabajos del hogar.';
  const shouldCollapseBio = bioText.length > 220;
  const personalDetails = buildPersonalDetails(professional);
  const yearsExperienceValue = Number(professional.yearsExperience) || 0;
  const certifications = professional.certifications || [];
  const references = professional.references || [];
  const showExperienceSection = yearsExperienceValue > 0 || certifications.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(bottomBarHeight + 28, 190 + insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            disabled={!galleryFeedItems.length}
            onPress={() => setGalleryVisible(true)}
            style={styles.heroShell}
          >
            <HeroMedia images={heroImages.slice(0, 3)} icon={heroIcon} title={professional.businessName} />
            <LinearGradient colors={['rgba(10, 15, 28, 0.08)', 'rgba(10, 15, 28, 0.72)']} style={styles.heroGradient} />

            <View style={[styles.heroTopBar, { top: insets.top + 10 }]}>
              <Pressable
                hitSlop={8}
                onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs'))}
                style={styles.heroActionButton}
              >
                <Ionicons name="chevron-back" size={20} color={palette.white} />
              </Pressable>

              <Pressable hitSlop={8} onPress={() => handleShare(professional)} style={styles.heroActionButton}>
                <Ionicons name="share-social-outline" size={18} color={palette.white} />
              </Pressable>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.heroGalleryHint}>
                <Ionicons name="images-outline" size={14} color={palette.white} />
                <Text style={styles.heroGalleryHintText}>
                  {galleryFeedItems.length > 1 ? `Ver ${galleryFeedItems.length} trabajos` : 'Ver trabajos'}
                </Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.identityRow}>
              <View style={styles.avatarShell}>
                {avatarSource ? (
                  <Image source={{ uri: avatarSource }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name={heroIcon} size={24} color={palette.accentDark} />
                  </View>
                )}
              </View>

              <View style={styles.identityBody}>
                <Text style={styles.name}>{professional.businessName}</Text>
                <Text style={styles.headline}>{professional.headline || 'Profesional aprobado para recibir solicitudes.'}</Text>

                <View style={styles.identityMetaRow}>
                  {professional.categories?.[0]?.name ? (
                    <View style={styles.identityCategoryPill}>
                      <Ionicons name={heroIcon} size={13} color={palette.accentDark} />
                      <Text style={styles.identityCategoryText}>{professional.categories[0].name}</Text>
                    </View>
                  ) : null}

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={15} color={palette.muted} />
                    <Text style={styles.locationText}>{location}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.metricsSection}>
              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <Ionicons name="star" size={15} color={palette.warning} />
                </View>
                <Text style={styles.metricCardValue}>{reviewHeroScore}</Text>
                <Text numberOfLines={1} style={styles.metricCardLabel}>
                  {reviewCountCopy}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <Ionicons name="briefcase-outline" size={15} color={palette.accentDark} />
                </View>
                <Text style={styles.metricCardValue}>{formatCompletedJobsCompact(professional.completedJobsCount)}</Text>
                <Text numberOfLines={2} style={styles.metricCardLabel}>
                  trabajos completados
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <Ionicons name="time-outline" size={15} color={palette.accentDark} />
                </View>
                <Text style={styles.metricCardValue}>{formatResponseTimeCompact(professional.responseTimeMinutes)}</Text>
                <Text numberOfLines={2} style={styles.metricCardLabel}>
                  tiempo de respuesta
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeading eyebrow="Trabajos reales" title="Trabajos previos" />

              {professional.workPosts?.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.workPostRail}
                >
                  {professional.workPosts.map((post, index) => (
                    <View key={post.id || `${post.title}-${index}`} style={[styles.workPostCard, shadows.card]}>
                      {post.photoUrls?.[0] ? (
                        <Image source={{ uri: post.photoUrls[0] }} style={styles.workPostImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.workPostFallback}>
                          <Ionicons name={heroIcon} size={22} color={palette.accentDark} />
                        </View>
                      )}

                      <View style={styles.workPostBody}>
                        <View style={styles.workPostTopRow}>
                          <Text numberOfLines={2} style={styles.workPostTitle}>
                            {post.title}
                          </Text>
                          <Text style={styles.workPostMeta}>{post.photoUrls?.length || 0} fotos</Text>
                        </View>

                        <Text numberOfLines={4} style={styles.workPostText}>
                          {post.body}
                        </Text>

                        {post.highlightLines?.length ? (
                          <View style={styles.highlightRow}>
                            {post.highlightLines.slice(0, 3).map((line) => (
                              <View key={`${post.id || index}-${line}`} style={styles.highlightChip}>
                                <Text numberOfLines={1} style={styles.highlightText}>
                                  {line}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <EmptyState
                  title="Sin trabajos publicados"
                  message="Este profesional todavia no compartio posts de trabajos previos."
                />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeading eyebrow="Presentacion" title="Sobre este profesional" />
              <Text numberOfLines={showFullBio || !shouldCollapseBio ? undefined : 5} style={styles.bodyText}>
                {bioText}
              </Text>

              {shouldCollapseBio ? (
                <Pressable hitSlop={8} onPress={() => setShowFullBio((current) => !current)} style={styles.inlineAction}>
                  <Text style={styles.inlineActionText}>{showFullBio ? 'Ver menos' : 'Ver mas'}</Text>
                </Pressable>
              ) : null}

              {personalDetails.length ? (
                <View style={styles.infoGrid}>
                  {personalDetails.map((item) => (
                    <View key={item.label} style={styles.infoCard}>
                      <View style={styles.infoCardIcon}>
                        <Ionicons name={item.icon} size={16} color={palette.accentDark} />
                      </View>
                      <Text style={styles.infoCardLabel}>{item.label}</Text>
                      <Text style={styles.infoCardValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {showExperienceSection ? (
              <View style={styles.section}>
                <SectionHeading eyebrow="Trayectoria" title="Experiencia y certificaciones" />

                {yearsExperienceValue > 0 ? (
                  <View style={styles.experienceCard}>
                    <View style={styles.experienceIcon}>
                      <Ionicons name="briefcase-outline" size={20} color={palette.accentDark} />
                    </View>

                    <View style={styles.experienceBody}>
                      <Text style={styles.experienceTitle}>{formatYearsExperience(yearsExperienceValue)}</Text>
                      <Text style={styles.experienceText}>
                        Experiencia declarada por el profesional para trabajos en esta categoria.
                      </Text>
                    </View>
                  </View>
                ) : null}

                {certifications.map((certification, index) => {
                  const certificationMeta = buildCertificationMeta(certification);

                  return (
                    <View
                      key={`${certification.title || certification.issuer || 'certification'}-${index}`}
                      style={styles.detailListCard}
                    >
                      <View style={styles.detailListIcon}>
                        <Ionicons name="ribbon-outline" size={18} color={palette.accentDark} />
                      </View>

                      <View style={styles.detailListBody}>
                        <Text style={styles.detailListTitle}>{certification.title}</Text>
                        <Text style={styles.detailListText}>{certification.issuer}</Text>

                        {certificationMeta.length ? (
                          <View style={styles.detailChipRow}>
                            {certificationMeta.map((item) => (
                              <View key={`${certification.title}-${item}`} style={styles.detailMetaChip}>
                                <Text style={styles.detailMetaText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {references.length ? (
              <View style={styles.section}>
                <SectionHeading eyebrow="Referencias" title="Referencias declaradas" />
                <Text style={styles.sectionSupportingText}>
                  Compartidas por el profesional como contexto adicional del perfil.
                </Text>

                {references.map((reference, index) => (
                  <View key={`${reference.name || 'reference'}-${index}`} style={styles.referenceCard}>
                    <View style={styles.referenceTopRow}>
                      <View style={styles.referenceIdentity}>
                        <Text style={styles.referenceName}>{reference.name}</Text>
                        <Text style={styles.referenceRelationship}>{reference.relationship}</Text>
                      </View>

                      <View style={styles.referenceBadge}>
                        <Text style={styles.referenceBadgeText}>Declarada</Text>
                      </View>
                    </View>

                    {reference.location ? <Text style={styles.referenceLocation}>{reference.location}</Text> : null}
                    <Text style={styles.referenceSummary}>{reference.summary}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeading eyebrow="Servicios" title="Categorias que atiende" />

              <View style={styles.categoryRow}>
                {(professional.categories || []).map((category) => (
                  <View key={category.id} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{category.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeading eyebrow="Cobertura" title="Zonas de trabajo" />

              {professional.serviceAreas?.length ? (
                professional.serviceAreas.map((area) => (
                  <View key={area.id || `${area.city}-${area.province}`} style={styles.coverageCard}>
                    <View style={styles.coverageIcon}>
                      <Ionicons name="navigate-outline" size={18} color={palette.accentDark} />
                    </View>

                    <View style={styles.coverageBody}>
                      <Text style={styles.coverageTitle}>
                        {area.city}, {area.province}
                      </Text>
                      <Text style={styles.coverageText}>Radio de cobertura: {area.radiusKm} km</Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState title="Sin zonas publicadas" message="El profesional todavia no publico zonas de cobertura." />
              )}
            </View>
          </View>
        </ScrollView>

        <View
          onLayout={(event) => setBottomBarHeight(event.nativeEvent.layout.height)}
          style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <Text style={styles.bottomBarEyebrow}>Solicitud directa</Text>
          <Text style={styles.bottomBarText}>Crea tu problema y enviaselo desde aqui.</Text>

          <AppButton onPress={() => handleCreateRequest(professional)} style={styles.bottomBarButton}>
            Solicitar trabajo
          </AppButton>
        </View>

        <Modal
          animationType="slide"
          transparent
          visible={galleryVisible}
          onRequestClose={() => setGalleryVisible(false)}
        >
          <View style={styles.galleryBackdrop}>
            <SafeAreaView style={styles.gallerySafeArea} edges={['top', 'left', 'right', 'bottom']}>
              <View style={styles.gallerySheet}>
                <View style={styles.galleryHeader}>
                  <View style={styles.galleryHeaderCopy}>
                    <Text style={styles.galleryEyebrow}>Trabajos del profesional</Text>
                    <Text style={styles.galleryTitle}>{professional.businessName}</Text>
                    <Text style={styles.gallerySubtitle}>Fotos y notas reales del perfil</Text>
                  </View>

                  <Pressable hitSlop={8} onPress={() => setGalleryVisible(false)} style={styles.galleryCloseButton}>
                    <Ionicons name="close" size={20} color={palette.ink} />
                  </Pressable>
                </View>

                <ScrollView
                  bounces={false}
                  contentContainerStyle={styles.galleryFeed}
                  showsVerticalScrollIndicator={false}
                >
                  {galleryFeedItems.map((item) => (
                    <View key={item.id} style={styles.galleryPostCard}>
                      {item.photoUrls?.length ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.galleryPhotoRail}
                        >
                          {item.photoUrls.map((photoUrl, photoIndex) => (
                            <Image
                              key={`${item.id}-${photoIndex}`}
                              source={{ uri: photoUrl }}
                              style={[styles.galleryPhoto, photoIndex === 0 && styles.galleryPhotoPrimary]}
                              resizeMode="cover"
                            />
                          ))}
                        </ScrollView>
                      ) : null}

                      <View style={styles.galleryPostBody}>
                        <Text style={styles.galleryPostTitle}>{item.title}</Text>
                        <Text style={styles.galleryPostText}>{item.body}</Text>

                        {item.highlightLines?.length ? (
                          <View style={styles.galleryHighlightRow}>
                            {item.highlightLines.map((line) => (
                              <View key={`${item.id}-${line}`} style={styles.galleryHighlightChip}>
                                <Text style={styles.galleryHighlightText}>{line}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  emptyShell: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  scrollContent: {
    backgroundColor: palette.canvas,
  },
  heroShell: {
    minHeight: 330,
    backgroundColor: palette.surfaceMuted,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroFallback: {
    minHeight: 330,
    justifyContent: 'flex-end',
    padding: 24,
    overflow: 'hidden',
  },
  heroFallbackOrbLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: palette.whiteGlass,
    top: -80,
    left: -40,
  },
  heroFallbackOrbSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: palette.whiteGlassStrong,
    right: -40,
    bottom: 10,
  },
  heroFallbackIcon: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteGlassStrong,
    marginBottom: 18,
  },
  heroFallbackTitle: {
    color: palette.white,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    maxWidth: '72%',
  },
  heroSingleImage: {
    width: '100%',
    height: 330,
  },
  heroDoubleRow: {
    flexDirection: 'row',
    gap: 2,
    height: 330,
    backgroundColor: palette.canvas,
  },
  heroDoubleImage: {
    flex: 1,
    height: '100%',
  },
  heroMosaic: {
    flexDirection: 'row',
    gap: 2,
    height: 330,
    backgroundColor: palette.canvas,
  },
  heroMosaicMain: {
    flex: 1.2,
    height: '100%',
  },
  heroMosaicSideColumn: {
    flex: 0.8,
    gap: 2,
  },
  heroMosaicSideImage: {
    flex: 1,
    width: '100%',
  },
  heroTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    gap: 10,
    zIndex: 2,
  },
  heroGalleryHint: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
  },
  heroGalleryHintText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sheet: {
    marginTop: -24,
    backgroundColor: palette.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 26,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.border,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: -34,
  },
  avatarShell: {
    width: 88,
    height: 88,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: palette.surface,
    backgroundColor: palette.surfaceElevated,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  identityBody: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  name: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  headline: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  identityMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  identityCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  identityCategoryText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  metricsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    minHeight: 96,
    gap: 8,
  },
  metricCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
  },
  metricCardValue: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800',
  },
  metricCardLabel: {
    color: palette.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  section: {
    gap: 14,
  },
  sectionHeading: {
    gap: 4,
  },
  sectionEyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
  },
  bodyText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionSupportingText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  inlineActionText: {
    color: palette.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoCard: {
    flexGrow: 1,
    minWidth: 110,
    maxWidth: '100%',
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
    gap: 6,
  },
  infoCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  infoCardLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoCardValue: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.surfaceElevated,
  },
  experienceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  experienceBody: {
    flex: 1,
    gap: 4,
  },
  experienceTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  experienceText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  detailListCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated,
  },
  detailListIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  detailListBody: {
    flex: 1,
    gap: 6,
  },
  detailListTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  detailListText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  detailChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailMetaChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  detailMetaText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  workPostRail: {
    paddingRight: 20,
    gap: 14,
  },
  workPostCard: {
    width: 272,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: palette.surfaceElevated,
  },
  workPostImage: {
    width: '100%',
    height: 170,
    backgroundColor: palette.surfaceMuted,
  },
  workPostFallback: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  workPostBody: {
    padding: 16,
    gap: 12,
  },
  workPostTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  workPostTitle: {
    flex: 1,
    color: palette.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  workPostMeta: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  workPostText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  highlightText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  categoryChipText: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },
  coverageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated,
  },
  coverageIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  coverageBody: {
    flex: 1,
    gap: 2,
  },
  coverageTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  coverageText: {
    color: palette.muted,
    fontSize: 13,
  },
  referenceCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.surfaceElevated,
    gap: 10,
  },
  referenceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  referenceIdentity: {
    flex: 1,
    gap: 4,
  },
  referenceName: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  referenceRelationship: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  referenceLocation: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  referenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  referenceBadgeText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
  referenceSummary: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(250, 252, 255, 0.96)',
    borderWidth: 1,
    borderColor: palette.borderSoft,
    shadowColor: palette.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 14,
    elevation: 14,
  },
  bottomBarEyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomBarText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  bottomBarButton: {
    width: '100%',
  },
  galleryBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 17, 28, 0.42)',
  },
  gallerySafeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gallerySheet: {
    minHeight: '78%',
    maxHeight: '92%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 18,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderMuted,
  },
  galleryHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  galleryEyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  galleryTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
  gallerySubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  galleryCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  galleryFeed: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  galleryPostCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: palette.surfaceElevated,
  },
  galleryPhotoRail: {
    padding: 12,
    gap: 10,
  },
  galleryPhoto: {
    width: 178,
    height: 170,
    borderRadius: 18,
    backgroundColor: palette.surfaceMuted,
  },
  galleryPhotoPrimary: {
    width: 230,
  },
  galleryPostBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  galleryPostTitle: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  galleryPostText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  galleryHighlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryHighlightChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  galleryHighlightText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
});

module.exports = {
  ProfessionalDetailScreen,
};
