const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette, spacing } = require('../../theme');

function StatBadge({ label, variant = 'positive' }) {
  const colors = {
    positive: { bg: palette.successSoft, text: palette.success },
    negative: { bg: palette.dangerSoft, text: palette.danger },
    neutral: { bg: palette.surfaceElevated, text: palette.muted },
  };
  const c = colors[variant] || colors.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

module.exports = {
  StatBadge,
};