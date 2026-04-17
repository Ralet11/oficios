const React = require('react');
const { View } = require('react-native');
const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
const { Ionicons } = require('@expo/vector-icons');
const { hasRole } = require('@oficios/domain');
const { useAuth } = require('../contexts/AuthContext');
const { LoadingView } = require('../components/LoadingView');
const { navigation, palette } = require('../theme');
const { WelcomeScreen } = require('../screens/WelcomeScreen');
const { LoginScreen } = require('../screens/LoginScreen');
const { RegisterScreen } = require('../screens/RegisterScreen');
const { HomeScreen } = require('../screens/HomeScreen');
const { ProfessionalDetailScreen } = require('../screens/ProfessionalDetailScreen');
const { CreateServiceRequestScreen } = require('../screens/CreateServiceRequestScreen');
const { RequestsScreen } = require('../screens/RequestsScreen');
const { RequestDetailScreen } = require('../screens/RequestDetailScreen');
const { ProfessionalHubScreen } = require('../screens/ProfessionalHubScreen');
const { AdminDashboardScreen } = require('../screens/AdminDashboardScreen');
const { AccountScreen } = require('../screens/AccountScreen');
const { NotificationsScreen } = require('../screens/NotificationsScreen');

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { user } = useAuth();
  const isProfessional = hasRole(user, 'PROFESSIONAL');
  const isAdmin = hasRole(user, 'ADMIN');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: navigation.tabBarActiveTint,
        tabBarInactiveTintColor: navigation.tabBarInactiveTint,
        tabBarStyle: {
          height: 82,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 10,
          backgroundColor: navigation.tabBarBackground,
          borderTopColor: navigation.tabBarBackground,
          borderTopWidth: 0,
          shadowColor: palette.black,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -6 },
          shadowRadius: 18,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home-outline',
            Requests: 'calendar-outline',
            Professional: 'briefcase-outline',
            Admin: 'shield-checkmark',
            Account: 'person-outline',
          };

          const active = color === navigation.tabBarActiveTint;

          return (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? palette.accent : 'transparent',
              }}
            >
              <Ionicons name={icons[route.name]} size={size} color={active ? palette.white : color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ title: 'Booking' }} />
      <Tab.Screen
        name="Professional"
        component={ProfessionalHubScreen}
        options={{ title: isProfessional ? 'Pro' : 'Become Pro' }}
      />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} /> : null}
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: navigation.headerTintColor,
        headerStyle: { backgroundColor: navigation.headerBackground },
        contentStyle: { backgroundColor: navigation.contentBackground },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProfessionalDetail" component={ProfessionalDetailScreen} options={{ title: 'Profesional' }} />
      <Stack.Screen name="CreateServiceRequest" component={CreateServiceRequestScreen} options={{ title: 'Nueva solicitud' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Solicitud' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { booting, signedIn } = useAuth();

  if (booting) {
    return <LoadingView label="Preparando tu sesion..." />;
  }

  return signedIn ? <AppNavigator /> : <AuthNavigator />;
}

module.exports = {
  RootNavigator,
};
