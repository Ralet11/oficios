const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { palette, spacing } = require('../../theme');
const { StatBadge } = require('./StatBadge');

function ReputationSection({ customerProfile }) {
  const rating = customerProfile?.ratingAverage || 0;
  const jobs = customerProfile?.completedRequestsCount || 0;
  const cancelled = customerProfile?.cancellationRate || 0;
  const responseMin = customerProfile?.responseTimeMinutes || null;
  const tags = customerProfile?.tags || [];
  const topTags = customerProfile?.topTags || customerProfile?.tags || [];

  const hasRating = rating > 0;

  let cancelTag = null;
  if (cancelled > 0) {
    cancelTag = {
      label: cancelled < 0.1 ? 'Cancela poco' : 'Cancelaciones altas',
      variant: cancelled < 0.1 ? 'positive' : 'negative',
    };
  }

  let responseTag = null;
  if (responseMin) {
    responseTag = {
      label: responseMin <= 30 ? 'Responde rápido' : `Responde en ~${responseMin}min`,
      variant: responseMin <= 30 ? 'positive' : 'neutral',
    };
  }

  const allTags = [
    ...(cancelTag ? [cancelTag] : []),
    ...(responseTag ? [responseTag] : []),
    ...topTags.slice(0, 3).map((t) => ({ label: t, variant: 'positive' })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={16} color={palette.white} fill={palette.white} />
        </View>
        <View style={styles.ratingContent}>
          <Text style={styles.ratingValue}>
            {hasRating ? rating.toFixed(1) : '—'}
          </Text>
          {hasRating ? (
            <Text style={styles.ratingMeta}>/ 5 · {jobs} trabajo{jobs !== 1 ? 's' : ''}</Text>
          ) : (
            <Text style={styles.ratingMeta}>Sin calificaciones aún</Text>
          )}
        </View>
      </View>

      {allTags.length > 0 && (
        <View style={styles.tagsRow}>
          {allTags.map((tag, i) => (
            <StatBadge key={i} label={tag.label} variant={tag.variant} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingContent: {
    flex: 1,
    gap: 1,
  },
  ratingValue: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 32,
  },
  ratingMeta: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

module.exports = {
  ReputationSection,
};