const React = require('react');
const { Pressable, StyleSheet, Text, View } = require('react-native');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { palette, spacing, type } = require('../theme');

function CollapsibleSection({
  badge,
  children,
  defaultExpanded = false,
  icon,
  onToggle,
  title,
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    onToggle?.(next);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.headerLeft}>
          {icon ? (
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={icon} size={20} color={palette.accentDark} />
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={palette.muted}
        />
      </Pressable>
      {isExpanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.white,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerPressed: {
    backgroundColor: palette.surfaceElevated,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.body,
    fontWeight: '700',
    color: palette.ink,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.accent,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
});

module.exports = {
  CollapsibleSection,
};
