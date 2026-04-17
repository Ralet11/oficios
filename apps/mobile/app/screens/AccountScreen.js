const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { Ionicons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { SectionCard } = require('../components/SectionCard');
const { useAuth } = require('../contexts/AuthContext');
const { palette, shadows, spacing } = require('../theme');

function getInitials(user) {
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'U';
}

function AccountScreen() {
  const navigation = useNavigation();
  const { user, signOut, refreshSession } = useAuth();

  return (
    <Screen contentStyle={styles.content}>
      <View style={[styles.profileCard, shadows.card]}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user)}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.roleRow}>
          {(user.roles || []).map((role) => (
            <View key={role} style={styles.rolePill}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionCard title="Account Summary">
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user.phone || 'No informado'}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Roles</Text>
          <Text style={styles.infoValue}>{(user.roles || []).join(', ')}</Text>
        </View>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <View style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <Ionicons name="notifications-outline" size={18} color={palette.accentDark} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Notifications</Text>
            <Text style={styles.actionText}>Check marketplace updates and unread events.</Text>
          </View>
        </View>
        <AppButton variant="secondary" onPress={() => navigation.navigate('Notifications')}>
          View Notifications
        </AppButton>

        <View style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <Ionicons name="sync-outline" size={18} color={palette.accentDark} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Refresh Session</Text>
            <Text style={styles.actionText}>Sync roles and refresh the current account data.</Text>
          </View>
        </View>
        <AppButton variant="ghost" onPress={refreshSession}>
          Refresh Session
        </AppButton>

        <View style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <Ionicons name="log-out-outline" size={18} color={palette.accentDark} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Sign Out</Text>
            <Text style={styles.actionText}>Close the active session on this device.</Text>
          </View>
        </View>
        <AppButton onPress={signOut}>Sign Out</AppButton>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 140,
  },
  profileCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  avatarText: {
    color: palette.accentDark,
    fontSize: 24,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: palette.ink,
    fontSize: 25,
    fontWeight: '800',
  },
  email: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
  },
  roleText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  infoBlock: {
    gap: 2,
  },
  infoLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  actionCopy: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  actionTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  actionText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});

module.exports = {
  AccountScreen,
};
