const React = require('react');
const { StatusBar } = require('expo-status-bar');
const { NavigationContainer } = require('@react-navigation/native');
const { SafeAreaProvider } = require('react-native-safe-area-context');
const { AuthProvider } = require('./app/contexts/AuthContext');
const { RootNavigator } = require('./app/navigation/RootNavigator');
const { navigationTheme } = require('./app/theme');

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
