const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette, spacing } = require('../../theme');

function SectionHeader({ title, action, onActionPress }) {
  const { TouchableOpacity } = require('react-native');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.6}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  action: {
    color: palette.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
});

module.exports = {
  SectionHeader,
};