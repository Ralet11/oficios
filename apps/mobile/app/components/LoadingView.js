const React = require('react');
const { ActivityIndicator, StyleSheet, Text, View } = require('react-native');
const { palette } = require('../theme');

function LoadingView({ label = 'Cargando...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={palette.accent} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    color: palette.muted,
    fontSize: 15,
  },
});

module.exports = {
  LoadingView,
};
