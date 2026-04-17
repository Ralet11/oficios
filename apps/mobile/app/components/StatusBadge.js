const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette } = require('../theme');

const stylesByStatus = {
  APPROVED: { backgroundColor: '#DEF7E8', color: palette.success },
  PENDING_APPROVAL: { backgroundColor: '#FEEBC8', color: palette.warning },
  REJECTED: { backgroundColor: '#FED7D7', color: palette.danger },
  PAUSED: { backgroundColor: '#E2E8F0', color: palette.muted },
  DRAFT: { backgroundColor: '#E2E8F0', color: palette.muted },
  PENDING: { backgroundColor: '#FEEBC8', color: palette.warning },
  ACCEPTED: { backgroundColor: '#DEF7E8', color: palette.success },
  CANCELLED: { backgroundColor: '#FED7D7', color: palette.danger },
  REJECTED_REQUEST: { backgroundColor: '#FED7D7', color: palette.danger },
  COMPLETED: { backgroundColor: '#D7E7F5', color: '#2B6CB0' },
  EXPIRED: { backgroundColor: '#E2E8F0', color: palette.muted },
  VISIBLE: { backgroundColor: '#DEF7E8', color: palette.success },
  HIDDEN: { backgroundColor: '#FED7D7', color: palette.danger },
};

function normalize(status) {
  if (status === 'REJECTED') {
    return 'REJECTED';
  }
  return status;
}

function StatusBadge({ status }) {
  const key = normalize(status);
  const stylesForStatus = stylesByStatus[key] || stylesByStatus.DRAFT;

  return (
    <View style={[styles.badge, { backgroundColor: stylesForStatus.backgroundColor }]}>
      <Text style={[styles.text, { color: stylesForStatus.color }]}>{String(status).replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

module.exports = {
  StatusBadge,
};
