const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette, type } = require('../theme');

function EmptyState({ title, message }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFF8EF',
    borderWidth: 1,
    borderColor: '#F2E6D6',
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  title: {
    ...type.subtitle,
  },
  message: {
    ...type.body,
    color: palette.muted,
  },
});

module.exports = {
  EmptyState,
};
