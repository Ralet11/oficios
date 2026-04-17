const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette, shadows, type } = require('../theme');

function SectionCard({ title, subtitle, children, footer }) {
  return (
    <View style={[styles.card, shadows.card]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    overflow: 'hidden',
    paddingTop: 2,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: palette.ink,
  },
  subtitle: {
    ...type.body,
  },
  body: {
    padding: 18,
    gap: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.borderMuted,
    padding: 18,
  },
});

module.exports = {
  SectionCard,
};
