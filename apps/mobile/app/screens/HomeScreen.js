const React = require('react');
const { Alert, Pressable, ScrollView, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppInput } = require('../components/AppInput');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function HomeScreen({ navigation }) {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [professionals, setProfessionals] = React.useState([]);
  const [filters, setFilters] = React.useState({
    text: '',
    categoryId: '',
    availableNow: false,
  });

  const load = React.useCallback(async () => {
    try {
      const [categoriesResponse, professionalsResponse] = await Promise.all([
        api.categories(),
        api.professionals({
          page: 1,
          pageSize: 20,
          text: filters.text,
          categoryId: filters.categoryId || undefined,
          availableNow: filters.availableNow,
        }),
      ]);
      setCategories(categoriesResponse.data);
      setProfessionals(professionalsResponse.data);
    } catch (error) {
      Alert.alert('No se pudo cargar el catálogo', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.availableNow, filters.categoryId, filters.text]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingView label="Buscando profesionales..." />;
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Argentina, mobile-first</Text>
        <Text style={styles.title}>Resolvé trabajos del hogar sin salir del teléfono.</Text>
        <Text style={styles.copy}>Filtrá por rubro, disponibilidad y abrí la conversación con una solicitud.</Text>
      </View>

      <SectionCard title="Buscar" subtitle="La API pública principal vive en `/professionals` y esta pantalla la consume.">
        <AppInput
          label="Texto"
          value={filters.text}
          onChangeText={(value) => setFilters((current) => ({ ...current, text: value }))}
          placeholder="Ej. plomero urgente en CABA"
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Solo disponibles ahora</Text>
          <AppButton
            variant={filters.availableNow ? 'primary' : 'secondary'}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                availableNow: !current.availableNow,
              }))
            }
          >
            {filters.availableNow ? 'Sí' : 'No'}
          </AppButton>
        </View>
        <AppButton onPress={() => load()}>Aplicar filtros</AppButton>
      </SectionCard>

      <View>
        <Text style={styles.sectionTitle}>Categorías</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            onPress={() => setFilters((current) => ({ ...current, categoryId: '' }))}
            style={[styles.chip, !filters.categoryId && styles.chipActive]}
          >
            <Text style={[styles.chipText, !filters.categoryId && styles.chipTextActive]}>Todas</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setFilters((current) => ({ ...current, categoryId: String(category.id) }))}
              style={[styles.chip, String(filters.categoryId) === String(category.id) && styles.chipActive]}
            >
              <Text style={[styles.chipText, String(filters.categoryId) === String(category.id) && styles.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {professionals.length === 0 ? (
        <EmptyState title="Sin resultados" message="Probá con menos filtros o con otra categoría." />
      ) : (
        professionals.map((professional) => (
          <Pressable
            key={professional.id}
            onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: professional.id })}
          >
            <SectionCard
              title={professional.businessName}
              subtitle={`${professional.city}, ${professional.province}`}
              footer={
                <View style={styles.footerRow}>
                  <Text style={styles.rating}>★ {professional.ratingAverage.toFixed(1)}</Text>
                  <Text style={styles.meta}>{professional.reviewCount} reseñas</Text>
                </View>
              }
            >
              <View style={styles.cardHeader}>
                <StatusBadge status={professional.status} />
                {professional.availableNow ? (
                  <View style={styles.livePill}>
                    <Ionicons name="flash" size={14} color={palette.accentDark} />
                    <Text style={styles.liveText}>Disponible ahora</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.headline}>{professional.headline || 'Profesional verificado'}</Text>
              <Text style={styles.bio}>{professional.bio}</Text>
              <View style={styles.tags}>
                {professional.categories?.map((category) => (
                  <View key={category.id} style={styles.tag}>
                    <Text style={styles.tagText}>{category.name}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </Pressable>
        ))
      )}

      <AppButton
        variant="ghost"
        onPress={() => {
          setRefreshing(true);
          load();
        }}
        loading={refreshing}
      >
        Refrescar catálogo
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
  },
  kicker: {
    ...type.label,
    color: palette.accentDark,
  },
  title: {
    ...type.title,
  },
  copy: {
    ...type.body,
    color: palette.ink,
  },
  sectionTitle: {
    ...type.subtitle,
  },
  chips: {
    gap: 10,
    paddingTop: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: '#E7D8C5',
  },
  chipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipText: {
    color: palette.ink,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    gap: 12,
  },
  toggleLabel: {
    color: palette.ink,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FDEBD9',
    borderRadius: 999,
  },
  liveText: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.ink,
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
    backgroundColor: palette.sky,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagText: {
    color: '#2B6CB0',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rating: {
    color: palette.ink,
    fontWeight: '700',
  },
  meta: {
    color: palette.muted,
  },
});

module.exports = {
  HomeScreen,
};
