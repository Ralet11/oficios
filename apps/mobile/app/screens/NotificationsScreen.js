const React = require('react');
const { Alert, Pressable, StyleSheet, Text, View } = require('react-native');
const { useFocusEffect } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { EmptyState } = require('../components/EmptyState');
const { LoadingView } = require('../components/LoadingView');
const { useAuth } = require('../contexts/AuthContext');
const { api } = require('../services/api');
const { palette, shadows, spacing } = require('../theme');

function NotificationsScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState([]);

  const load = React.useCallback(async () => {
    try {
      const response = await api.notifications(token);
      setNotifications(response.data || []);
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
      Alert.alert('No se pudo marcar como leida', error.message);
    }
  }

  if (loading) {
    return <LoadingView label="Cargando notificaciones..." />;
  }

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <View style={styles.metricPill}>
          <Ionicons name="notifications-outline" size={15} color={palette.accentDark} />
          <Text style={styles.metricText}>{unreadCount} unread</Text>
        </View>
      </View>

      {notifications.length ? (
        notifications.map((notification) => {
          const unread = !notification.readAt;

          return (
            <Pressable key={notification.id} onPress={() => unread && markAsRead(notification.id)}>
              <View style={[styles.card, shadows.card, unread && styles.cardUnread]}>
                <View style={styles.cardTopRow}>
                  <View style={styles.typePill}>
                    <Text style={styles.typeText}>{notification.type}</Text>
                  </View>
                  <Text style={[styles.stateText, unread && styles.stateTextUnread]}>
                    {unread ? 'Tap to read' : 'Read'}
                  </Text>
                </View>

                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.cardBody}>{notification.body}</Text>
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyState title="No notifications" message="Todavia no hubo eventos para esta cuenta." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 140,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: {
    color: palette.ink,
    fontSize: 31,
    fontWeight: '800',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  metricText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: palette.accentSoft,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  typeText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  stateText: {
    color: palette.mutedSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  stateTextUnread: {
    color: palette.accentDark,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  cardBody: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});

module.exports = {
  NotificationsScreen,
};
