const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette, spacing } = require('../../theme');

function getInitials(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'U';
}

function RolePill({ role }) {
  const label = role === 'PROFESSIONAL' ? 'PRO' : role === 'CUSTOMER' ? 'CLIENTE' : role;
  return (
    <View style={styles.rolePill}>
      <Text style={styles.roleText}>{label}</Text>
    </View>
  );
}

function VerifiedBadge({ type }) {
  if (!type) { return null; }
  return (
    <View style={[styles.verifiedBadge, type === 'phone' ? styles.verifiedPhone : styles.verifiedEmail]}>
      <Text style={[styles.verifiedText, type === 'phone' ? styles.verifiedPhoneText : styles.verifiedEmailText]}>
        {type === 'phone' ? '✓ Tel' : '✓ Email'}
      </Text>
    </View>
  );
}

function ProfileHeader({ user, customerProfile }) {
  const initials = getInitials(user);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Sin nombre';
  const email = user?.email || 'Sin email';
  const roles = user?.roles || [];

  return (
    <View style={styles.container}>
      <View style={styles.avatarRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.badgesRow}>
            {roles.map((role) => (
              <RolePill key={role} role={role} />
            ))}
            {customerProfile?.verifiedPhone && <VerifiedBadge type="phone" />}
            {customerProfile?.verifiedEmail && <VerifiedBadge type="email" />}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  avatarText: {
    color: palette.accentDark,
    fontSize: 26,
    fontWeight: '800',
  },
  infoColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  email: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  roleText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedPhone: {
    backgroundColor: palette.successSoft,
  },
  verifiedEmail: {
    backgroundColor: palette.sky,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedPhoneText: {
    color: palette.success,
  },
  verifiedEmailText: {
    color: palette.info,
  },
});

module.exports = {
  ProfileHeader,
  RolePill,
  VerifiedBadge,
};