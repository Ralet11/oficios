const React = require('react');
const { StatusBar } = require('expo-status-bar');
const { NavigationContainer, DefaultTheme } = require('@react-navigation/native');
const { SafeAreaProvider } = require('react-native-safe-area-context');
const { AuthProvider } = require('./app/contexts/AuthContext');
const { RootNavigator } = require('./app/navigation/RootNavigator');
const { palette } = require('./app/theme');

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.canvas,
    card: palette.surface,
    text: palette.ink,
    primary: palette.accent,
    border: palette.border,
  },
};

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

module.exports = App;
