const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { palette, spacing } = require('../../theme');

function SettingsRow({ label, icon, onPress, danger = false }) {
  const { TouchableOpacity } = require('react-native');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, danger && styles.iconDanger]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={danger ? palette.danger : palette.accentDark}
          />
        </View>
      ) : null}
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={danger ? palette.danger : palette.mutedSoft}
      />
    </TouchableOpacity>
  );
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
  label: {
    flex: 1,
    color: palette.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  labelDanger: {
    color: palette.danger,
  },
});

module.exports = {
  SettingsRow,
};