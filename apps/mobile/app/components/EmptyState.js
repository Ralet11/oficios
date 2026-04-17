const React = require('react');
const { Ionicons } = require('@expo/vector-icons');
const { StyleSheet, Text, View } = require('react-native');
const { palette, type } = require('../theme');

function EmptyState({ title, message }) {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <Ionicons name="file-tray-outline" size={20} color={palette.accentDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: 24,
    padding: 20,
    gap: 8,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
  },
  message: {
    ...type.body,
    color: palette.muted,
  },
});

module.exports = {
  EmptyState,
};
