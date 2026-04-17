const React = require('react');
const { ScrollView, StyleSheet, View } = require('react-native');
const { SafeAreaView } = require('react-native-safe-area-context');
const { LinearGradient } = require('expo-linear-gradient');
const { palette } = require('../theme');

function Screen({ children, scroll = true, contentStyle, gradient = true }) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {gradient ? (
        <LinearGradient colors={['#F8F2E8', '#F4EFE7', '#E8DCCB']} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.gradient}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
});

module.exports = {
  Screen,
};
