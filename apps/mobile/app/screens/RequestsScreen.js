const React = require('react');
const { Alert, Pressable, ScrollView, StyleSheet, Text, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { StatusBadge } = require('../components/StatusBadge');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function RequestsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [scope, setScope] = React.useState('all');
  const [requests, setRequests] = React.useState([]);

  const load = React.useCallback(async () => {
    try {
      const response = await api.serviceRequests({ page: 1, pageSize: 30, scope }, token);
      setRequests(response.data);
    } catch (error) {
      Alert.alert('No se pudieron cargar las solicitudes', error.message);
    } finally {
      setLoading(false);
    }
  }, [scope, token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return <LoadingView label="Cargando solicitudes..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox de solicitudes</Text>
        <Text style={styles.copy}>Gestioná conversaciones, cambios de estado y reseñas desde un solo flujo.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {[
          { label: 'Todas', value: 'all' },
          { label: 'Como cliente', value: 'customer' },
          { label: 'Como profesional', value: 'professional' },
        ].map((item) => (
          <Pressable
            key={item.value}
            onPress={() => {
              setLoading(true);
              setScope(item.value);
            }}
            style={[styles.filterChip, scope === item.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, scope === item.value && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {requests.length === 0 ? (
        <EmptyState title="Sin solicitudes" message="Todavía no hay conversaciones para este filtro." />
      ) : (
        requests.map((request) => {
          const counterpart =
            request.customer?.id === user.id
              ? request.professional?.businessName
              : `${request.customer?.firstName} ${request.customer?.lastName}`;

          return (
            <Pressable key={request.id} onPress={() => navigation.navigate('RequestDetail', { requestId: request.id })}>
              <SectionCard
                title={request.title}
                subtitle={counterpart}
                footer={<Text style={styles.footerText}>{request.messages?.[0]?.body || 'Sin mensajes todavía.'}</Text>}
              >
                <View style={styles.rowBetween}>
                  <StatusBadge status={request.status} />
                  <Text style={styles.meta}>
                    {request.city}, {request.province}
                  </Text>
                </View>
                <Text style={styles.body}>{request.customerMessage}</Text>
              </SectionCard>
            </Pressable>
          );
        })
      )}

      <AppButton variant="ghost" onPress={() => {
        setLoading(true);
        load();
      }}>
        Refrescar
      </AppButton>
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
  filters: {
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E7D8C5',
    backgroundColor: '#FFF8EF',
  },
  filterChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  filterText: {
    color: palette.ink,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  meta: {
    color: palette.muted,
  },
  body: {
    ...type.body,
  },
  footerText: {
    color: palette.muted,
  },
});

module.exports = {
  RequestsScreen,
};
