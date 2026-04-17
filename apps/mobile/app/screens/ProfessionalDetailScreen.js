const React = require('react');
const { Alert, StyleSheet, Text, View } = require('react-native');
const { useRoute } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function ProfessionalDetailScreen({ navigation }) {
  const route = useRoute();
  const { token } = useAuth();
  const professionalId = route.params.professionalId;
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);

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
        <EmptyState title="Perfil no disponible" message="El profesional no está visible o no existe." />
      </Screen>
    );
  }

  const professional = detail.data;

  return (
    <Screen>
      <SectionCard
        title={professional.businessName}
        subtitle={`${professional.city}, ${professional.province}`}
        footer={
          <View style={styles.footerStats}>
            <Text style={styles.rating}>★ {professional.ratingAverage.toFixed(1)}</Text>
            <Text style={styles.stat}>{professional.reviewCount} reseñas</Text>
            <Text style={styles.stat}>{professional.yearsExperience} años</Text>
          </View>
        }
      >
        <StatusBadge status={professional.status} />
        <Text style={styles.headline}>{professional.headline}</Text>
        <Text style={styles.bio}>{professional.bio}</Text>
        <View style={styles.tags}>
          {professional.categories?.map((category) => (
            <View key={category.id} style={styles.tag}>
              <Text style={styles.tagText}>{category.name}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Zonas de trabajo">
        {professional.serviceAreas?.length ? (
          professional.serviceAreas.map((area) => (
            <Text key={area.id || `${area.city}-${area.province}`} style={styles.area}>
              {area.city}, {area.province} · Radio {area.radiusKm} km
            </Text>
          ))
        ) : (
          <Text style={styles.area}>Sin zonas configuradas.</Text>
        )}
      </SectionCard>

      <SectionCard title="Reseñas recientes">
        {detail.reviews?.length ? (
          detail.reviews.map((review) => (
            <View key={review.id} style={styles.review}>
              <Text style={styles.reviewHeader}>
                ★ {review.rating} · {review.reviewer?.firstName} {review.reviewer?.lastName}
              </Text>
              <Text style={styles.reviewBody}>{review.comment}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="Todavía no hay reseñas" message="Este profesional aún no recibió comentarios visibles." />
        )}
      </SectionCard>

      <AppButton onPress={() => navigation.navigate('CreateServiceRequest', { professional })}>
        Solicitar trabajo
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footerStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  rating: {
    color: palette.ink,
    fontWeight: '700',
  },
  stat: {
    color: palette.muted,
  },
  headline: {
    ...type.subtitle,
  },
  bio: {
    ...type.body,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FDEBD9',
    borderRadius: 999,
  },
  tagText: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  area: {
    ...type.body,
    color: palette.ink,
  },
  review: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E6D6',
    gap: 6,
  },
  reviewHeader: {
    fontWeight: '700',
    color: palette.ink,
  },
  reviewBody: {
    ...type.body,
  },
});

module.exports = {
  ProfessionalDetailScreen,
};
