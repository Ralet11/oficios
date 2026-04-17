const React = require('react');
const { Alert, StyleSheet, Text, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { AppInput } = require('../components/AppInput');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function AdminDashboardScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState(null);
  const [professionals, setProfessionals] = React.useState([]);
  const [reviews, setReviews] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [serviceRequests, setServiceRequests] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [categoryForm, setCategoryForm] = React.useState({
    id: null,
    name: '',
    slug: '',
    description: '',
    icon: 'briefcase',
    isActive: true,
  });

  const load = React.useCallback(async () => {
    try {
      const [overviewResponse, professionalsResponse, reviewsResponse, usersResponse, requestsResponse, categoriesResponse] =
        await Promise.all([
          api.adminOverview(token),
          api.adminProfessionals({ status: 'PENDING_APPROVAL', page: 1, pageSize: 10 }, token),
          api.adminReviews({ page: 1, pageSize: 10 }, token),
          api.adminUsers({ page: 1, pageSize: 10 }, token),
          api.adminServiceRequests({ page: 1, pageSize: 10 }, token),
          api.adminCategories(token),
        ]);

      setOverview(overviewResponse.data);
      setProfessionals(professionalsResponse.data);
      setReviews(reviewsResponse.data);
      setUsers(usersResponse.data);
      setServiceRequests(requestsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      Alert.alert('No se pudo cargar el panel admin', error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  async function moderateProfessional(id, status, rejectionReason) {
    try {
      await api.moderateProfessional(id, { status, rejectionReason }, token);
      await load();
    } catch (error) {
      Alert.alert('No se pudo moderar el profesional', error.message);
    }
  }

  async function moderateReview(id, status) {
    try {
      await api.moderateReview(id, { status }, token);
      await load();
    } catch (error) {
      Alert.alert('No se pudo moderar la reseña', error.message);
    }
  }

  async function saveCategory() {
    try {
      if (categoryForm.id) {
        await api.updateCategory(categoryForm.id, {
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description,
          icon: categoryForm.icon,
          isActive: categoryForm.isActive,
        }, token);
      } else {
        await api.createCategory(categoryForm, token);
      }

      setCategoryForm({
        id: null,
        name: '',
        slug: '',
        description: '',
        icon: 'briefcase',
        isActive: true,
      });
      await load();
    } catch (error) {
      Alert.alert('No se pudo guardar la categoría', error.message);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando panel admin..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Operación interna</Text>
        <Text style={styles.copy}>Moderá profesionales, reseñas, categorías y monitoreá actividad base del marketplace.</Text>
      </View>

      <SectionCard title="Resumen general">
        <View style={styles.statsGrid}>
          {[
            ['Usuarios', overview?.users],
            ['Profesionales', overview?.professionals],
            ['Pendientes', overview?.pendingProfessionals],
            ['Solicitudes', overview?.serviceRequests],
            ['Reseñas', overview?.reviews],
          ].map(([label, value]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value ?? 0}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Profesionales pendientes">
        {professionals.length ? (
          professionals.map((professional) => (
            <View key={professional.id} style={styles.itemBlock}>
              <Text style={styles.itemTitle}>{professional.businessName}</Text>
              <StatusBadge status={professional.status} />
              <Text style={styles.itemText}>{professional.user?.email}</Text>
              <View style={styles.rowActions}>
                <AppButton onPress={() => moderateProfessional(professional.id, 'APPROVED')} variant="secondary">
                  Aprobar
                </AppButton>
                <AppButton onPress={() => moderateProfessional(professional.id, 'REJECTED', 'Falta completar datos.')} variant="ghost">
                  Rechazar
                </AppButton>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="Sin pendientes" message="No hay perfiles esperando moderación." />
        )}
      </SectionCard>

      <SectionCard title="Moderación de reseñas">
        {reviews.length ? (
          reviews.map((review) => (
            <View key={review.id} style={styles.itemBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle}>★ {review.rating}</Text>
                <StatusBadge status={review.status} />
              </View>
              <Text style={styles.itemText}>{review.comment}</Text>
              <View style={styles.rowActions}>
                <AppButton onPress={() => moderateReview(review.id, 'VISIBLE')} variant="secondary">
                  Visible
                </AppButton>
                <AppButton onPress={() => moderateReview(review.id, 'HIDDEN')} variant="ghost">
                  Ocultar
                </AppButton>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="Sin reseñas" message="Todavía no hay reseñas para moderar." />
        )}
      </SectionCard>

      <SectionCard title="Categorías">
        <AppInput label="Nombre" value={categoryForm.name} onChangeText={(value) => setCategoryForm((current) => ({ ...current, name: value }))} />
        <AppInput label="Slug" value={categoryForm.slug} onChangeText={(value) => setCategoryForm((current) => ({ ...current, slug: value }))} />
        <AppInput label="Descripción" value={categoryForm.description} onChangeText={(value) => setCategoryForm((current) => ({ ...current, description: value }))} multiline />
        <AppInput label="Icono" value={categoryForm.icon} onChangeText={(value) => setCategoryForm((current) => ({ ...current, icon: value }))} />
        <AppButton onPress={saveCategory}>{categoryForm.id ? 'Actualizar categoría' : 'Crear categoría'}</AppButton>
        {categories.map((category) => (
          <View key={category.id} style={styles.itemBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>{category.name}</Text>
              <StatusBadge status={category.isActive ? 'VISIBLE' : 'HIDDEN'} />
            </View>
            <Text style={styles.itemText}>{category.description}</Text>
            <View style={styles.rowActions}>
              <AppButton
                variant="secondary"
                onPress={() =>
                  setCategoryForm({
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    icon: category.icon,
                    isActive: category.isActive,
                  })
                }
              >
                Editar
              </AppButton>
              <AppButton
                variant="ghost"
                onPress={() =>
                  api
                    .updateCategory(category.id, { isActive: !category.isActive }, token)
                    .then(load)
                    .catch((error) => Alert.alert('No se pudo actualizar la categoría', error.message))
                }
              >
                {category.isActive ? 'Desactivar' : 'Activar'}
              </AppButton>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Usuarios recientes">
        {users.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={styles.itemTitle}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.itemText}>{item.email}</Text>
            <Text style={styles.itemText}>Roles: {(item.roles || []).join(', ')}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Solicitudes recientes">
        {serviceRequests.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.itemText}>
              {item.customer?.firstName} -> {item.professional?.businessName}
            </Text>
          </View>
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    ...type.title,
  },
  copy: {
    ...type.body,
    color: palette.ink,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    minHeight: 110,
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated,
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
  },
  statLabel: {
    color: palette.muted,
    fontWeight: '600',
  },
  itemBlock: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderMuted,
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.ink,
  },
  itemText: {
    color: palette.muted,
  },
  rowActions: {
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
});

module.exports = {
  AdminDashboardScreen,
};
