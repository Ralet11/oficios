const React = require('react');
const { ScrollView, StyleSheet, View } = require('react-native');
const { SafeAreaView } = require('react-native-safe-area-context');
const { LinearGradient } = require('expo-linear-gradient');
const { gradients, palette } = require('../theme');

function Screen({ children, scroll = true, contentStyle, gradient = false }) {
  const content = scroll ? (
    <ScrollView
      bounces={false}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {gradient ? (
        <LinearGradient colors={gradients.screen} style={styles.gradient}>
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
    backgroundColor: palette.white,
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 18,
    paddingBottom: 132,
  },
});

module.exports = {
  Screen,
};
