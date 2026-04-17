const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { SectionCard } = require('../components/SectionCard');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, type } = require('../theme');

function NotificationsScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState([]);

  const load = React.useCallback(async () => {
    try {
      const response = await api.notifications(token);
      setNotifications(response.data);
    } catch (error) {
      Alert.alert('No se pudieron cargar las notificaciones', error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  async function markAsRead(id) {
    try {
      await api.readNotification(id, token);
      await load();
    } catch (error) {
      Alert.alert('No se pudo marcar como leída', error.message);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando notificaciones..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.copy}>Eventos operativos básicos: nuevas solicitudes, mensajes y cambios de estado.</Text>
      </View>

      {notifications.length ? (
        notifications.map((notification) => (
          <Pressable key={notification.id} onPress={() => !notification.readAt && markAsRead(notification.id)}>
            <SectionCard title={notification.title} subtitle={notification.type}>
              <Text style={styles.body}>{notification.body}</Text>
              <Text style={styles.meta}>{notification.readAt ? 'Leída' : 'Tocá para marcar como leída'}</Text>
            </SectionCard>
          </Pressable>
        ))
      ) : (
        <EmptyState title="Sin notificaciones" message="Todavía no hubo eventos para esta cuenta." />
      )}
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
  body: {
    ...type.body,
  },
  meta: {
    color: palette.accentDark,
    fontWeight: '700',
  },
});

module.exports = {
  NotificationsScreen,
};
