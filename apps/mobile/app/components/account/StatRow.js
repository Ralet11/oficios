const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { palette, spacing } = require('../../theme');

function iconMap(icon) {
  const map = {
    star: 'star',
    phone: 'phone',
    email: 'email',
    map: 'map-marker',
    jobs: 'briefcase-check',
    clock: 'clock-outline',
    edit: 'pencil',
    chevron: 'chevron-right',
  };
  return map[icon] || 'circle';
}

function StatRow({ icon, label, value, showChevron = false, onPress, danger = false }) {
  const content = (
    <View style={styles.row}>
      <View style={[styles.iconWrap, danger && styles.iconDanger]}>
        <MaterialCommunityIcons
          name={iconMap(icon)}
          size={18}
          color={danger ? palette.danger : palette.accentDark}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, danger && styles.valueDanger]}>{value}</Text>
      </View>
      {showChevron && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={palette.mutedSoft} />
      )}
    </View>
  );

  if (onPress) {
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderMuted,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  iconDanger: {
    backgroundColor: palette.dangerSoft,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  valueDanger: {
    color: palette.danger,
  },
});

module.exports = {
  StatRow,
};