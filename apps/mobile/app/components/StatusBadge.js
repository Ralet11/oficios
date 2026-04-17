const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { statusStyles } = require('../theme');

function normalize(status) {
  if (status === 'REJECTED') {
    return 'REJECTED';
  }
  return status;
}

function StatusBadge({ status }) {
  const key = normalize(status);
  const stylesForStatus = statusStyles[key] || statusStyles.DRAFT;

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
    paddingVertical: 7,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

module.exports = {
  StatusBadge,
};
