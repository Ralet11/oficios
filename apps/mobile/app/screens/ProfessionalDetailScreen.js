const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { useRoute } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { ServiceArtwork } = require('../components/ServiceArtwork');
const { getCategoryIcon } = require('../config/categoryVisuals');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

function formatRating(value) {
  return (Number(value) || 0).toFixed(1);
}

function buildPlans(professional) {
  const base = Math.max(10000, (Number(professional.yearsExperience) || 1) * 4500 + 9000);

  return [
    {
      key: 'basic',
      label: 'Basic',
      price: base,
      description: 'Ideal para resolver tareas puntuales y obtener una primera visita profesional.',
      features: ['Visita inicial', 'Revision basica', 'Diagnostico rapido'],
    },
    {
      key: 'standard',
      label: 'Standard',
      price: Math.round(base * 1.45),
      description: 'La opcion recomendada para servicios frecuentes con materiales y tiempo extra.',
      features: ['Revision completa', 'Trabajo principal', 'Seguimiento posterior'],
    },
    {
      key: 'premium',
      label: 'Premium',
      price: Math.round(base * 1.9),
      description: 'Pensado para servicios amplios, urgencias o coordinacion prioritaria.',
      features: ['Atencion prioritaria', 'Cobertura extendida', 'Soporte posterior'],
    },
  ];
}

function formatMoney(value) {
  return `ARS ${Number(value).toLocaleString('es-AR')}`;
}

function ProfessionalDetailScreen({ navigation }) {
  const route = useRoute();
  const { token } = useAuth();
  const professionalId = route.params.professionalId;
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);
  const [selectedPlanKey, setSelectedPlanKey] = React.useState('basic');

  const load = React.useCallback(async () => {
    try {
      const response = await api.professional(professionalId, token);
      setDetail(response);
    } catch (error) {
      Alert.alert('No se pudo cargar el perfil', error.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId, token]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingView label="Cargando perfil..." />;
  }

  if (!detail?.data) {
    return (
      <Screen>
        <EmptyState title="Perfil no disponible" message="El profesional no esta visible o no existe." />
      </Screen>
    );
  }

  const professional = detail.data;
  const location = [professional.city, professional.province].filter(Boolean).join(', ') || 'Argentina';
  const plans = buildPlans(professional);
  const selectedPlan = plans.find((plan) => plan.key === selectedPlanKey) || plans[0];
  const heroIcon = getCategoryIcon(professional.categories?.[0], 0);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.heroShell}>
        <ServiceArtwork
          size="hero"
          icon={heroIcon}
          badge="Top Rated"
          style={styles.heroArtwork}
        />

        <View style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={18} color={palette.white} />
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.serviceTitle}>{professional.businessName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaInline}>
            <Ionicons name="location-outline" size={14} color={palette.muted} />
            <Text style={styles.metaText}>{location}</Text>
          </View>
          <View style={styles.metaInline}>
            <Ionicons name="star" size={14} color={palette.warning} />
            <Text style={styles.metaText}>
              {formatRating(professional.ratingAverage)} ({professional.reviewCount || 0})
            </Text>
          </View>
        </View>

        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.descriptionText}>
          {professional.bio || professional.headline || 'Profesional validado para resolver trabajos del hogar con respuesta clara y seguimiento.'}
        </Text>
      </View>

      <View style={styles.planTabs}>
        {plans.map((plan) => {
          const active = selectedPlan.key === plan.key;

          return (
            <Pressable
              key={plan.key}
              onPress={() => setSelectedPlanKey(plan.key)}
              style={[styles.planTab, active && styles.planTabActive]}
            >
              <Text style={[styles.planTabText, active && styles.planTabTextActive]}>{plan.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.planCard, shadows.card]}>
        <Text style={styles.planDescription}>{selectedPlan.description}</Text>
        <Text style={styles.planPrice}>{formatMoney(selectedPlan.price)}</Text>

        <View style={styles.featureList}>
          {selectedPlan.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <AppButton
          onPress={() => navigation.navigate('CreateServiceRequest', { professional, packageOption: selectedPlan })}
        >
          Select {selectedPlan.label} ({formatMoney(selectedPlan.price)})
        </AppButton>
      </View>

      <SectionCard title="Service Categories">
        <View style={styles.tagsRow}>
          {(professional.categories || []).map((category) => (
            <View key={category.id} style={styles.tag}>
              <Text style={styles.tagText}>{category.name}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Coverage Area">
        {professional.serviceAreas?.length ? (
          professional.serviceAreas.map((area) => (
            <View key={area.id || `${area.city}-${area.province}`} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="navigate-outline" size={18} color={palette.accentDark} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>
                  {area.city}, {area.province}
                </Text>
                <Text style={styles.infoText}>Coverage radius: {area.radiusKm} km</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No area configured" message="El profesional todavia no publico zonas de cobertura." />
        )}
      </SectionCard>

      <SectionCard title="Recent Reviews">
        {detail.reviews?.length ? (
          detail.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <Text style={styles.reviewAuthor}>
                  {review.reviewer?.firstName} {review.reviewer?.lastName}
                </Text>
                <View style={styles.reviewRating}>
                  <Ionicons name="star" size={12} color={palette.warning} />
                  <Text style={styles.reviewRatingText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewBody}>{review.comment}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No reviews yet" message="Este profesional aun no tiene comentarios visibles." />
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
  heroShell: {
    position: 'relative',
  },
  heroArtwork: {
    minHeight: 280,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteGlass,
  },
  titleBlock: {
    gap: 10,
  },
  serviceTitle: {
    color: palette.ink,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  descriptionText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  planTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  planTab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
  },
  planTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: palette.accent,
  },
  planTabText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  planTabTextActive: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  planDescription: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  planPrice: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  featureText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  tagText: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  infoText: {
    color: palette.muted,
    fontSize: 13,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
    gap: 8,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewRatingText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewBody: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});

module.exports = {
  ProfessionalDetailScreen,
};
