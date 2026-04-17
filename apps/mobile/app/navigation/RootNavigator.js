const React = require('react');
const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
const { Ionicons } = require('@expo/vector-icons');
const { hasRole } = require('@oficios/domain');
const { useAuth } = require('../contexts/AuthContext');
const { LoadingView } = require('../components/LoadingView');
const { palette } = require('../theme');
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
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: '#7B8794',
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          backgroundColor: '#FFFDFC',
          borderTopColor: '#E7D8C5',
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'search',
            Requests: 'mail-open',
            Professional: 'briefcase',
            Admin: 'shield-checkmark',
            Account: 'person-circle',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Explorar' }} />
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ title: 'Solicitudes' }} />
      <Tab.Screen
        name="Professional"
        component={ProfessionalHubScreen}
        options={{ title: isProfessional ? 'Profesional' : 'Activar' }}
      />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} /> : null}
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Cuenta' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: palette.ink,
        headerStyle: { backgroundColor: '#FFF8EF' },
        contentStyle: { backgroundColor: palette.canvas },
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
    return <LoadingView label="Preparando tu sesión..." />;
  }

  return signedIn ? <AppNavigator /> : <AuthNavigator />;
}

module.exports = {
  RootNavigator,
};
