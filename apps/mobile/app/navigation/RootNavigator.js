const React = require('react');
const { StyleSheet, View } = require('react-native');
const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { LinearGradient } = require('expo-linear-gradient');
const { hasRole } = require('@oficios/domain');
const { useAuth } = require('../contexts/AuthContext');
const { LoadingView } = require('../components/LoadingView');
const { APP_MODES } = require('../services/sessionMode');
const { navigation, palette } = require('../theme');
const { WelcomeScreen } = require('../screens/WelcomeScreen');
const { LoginScreen } = require('../screens/LoginScreen');
const { PhoneAuthScreen } = require('../screens/PhoneAuthScreen');
const { RegisterScreen } = require('../screens/RegisterScreen');
const { HomeScreen } = require('../screens/HomeScreen');
const { ProfessionalDetailScreen } = require('../screens/ProfessionalDetailScreen');
const { CreateServiceRequestScreen } = require('../screens/CreateServiceRequestScreen');
const { RequestsScreen } = require('../screens/RequestsScreen');
const { RequestDetailScreen } = require('../screens/RequestDetailScreen');
const { ServiceNeedComposerScreen } = require('../screens/ServiceNeedComposerScreen');
const { ServiceNeedDetailScreen } = require('../screens/ServiceNeedDetailScreen');
const { SelectProfessionalsScreen } = require('../screens/SelectProfessionalsScreen');
const { OpportunitiesBoardScreen } = require('../screens/OpportunitiesBoardScreen');
const { OpportunityDetailScreen } = require('../screens/OpportunityDetailScreen');
const { ProfessionalHubScreen } = require('../screens/ProfessionalHubScreen');
const { AdminDashboardScreen } = require('../screens/AdminDashboardScreen');
const { AccountScreen } = require('../screens/AccountScreen');
const { EditCustomerProfileScreen } = require('../screens/EditCustomerProfileScreen');
const { NotificationsScreen } = require('../screens/NotificationsScreen');
const { HelpScreen } = require('../screens/HelpScreen');
const { PrivacyScreen } = require('../screens/PrivacyScreen');

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Filled / outline icon pairs per tab
const TAB_ICONS = {
  Home:         { active: 'home-variant',       inactive: 'home-variant-outline' },
  Requests:     { active: 'clipboard-list',      inactive: 'clipboard-list-outline' },
  Oportunidades: { active: 'briefcase-search',    inactive: 'briefcase-search-outline' },
  ProfessionalHub: { active: 'briefcase',           inactive: 'briefcase-outline' },
  Admin:        { active: 'shield-crown',         inactive: 'shield-crown-outline' },
  Account:      { active: 'account-circle',      inactive: 'account-circle-outline' },
};

function TabIcon({ routeName, focused }) {
  const icons = TAB_ICONS[routeName] || TAB_ICONS.Home;
  const iconName = focused ? icons.active : icons.inactive;

  if (focused) {
    return (
      <View style={tabStyles.activeWrap}>
        <LinearGradient
          colors={[palette.accentDark, palette.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <MaterialCommunityIcons name={iconName} size={22} color={palette.white} />
      </View>
    );
  }

  return (
    <View style={tabStyles.inactiveWrap}>
      <MaterialCommunityIcons name={iconName} size={22} color={navigation.tabBarInactiveTint} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  activeWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.accentDeep,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  inactiveWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
    </Stack.Navigator>
  );
}

function getTabScreenOptions(route) {
  return {
    headerShown: false,
    tabBarActiveTintColor: navigation.tabBarActiveTint,
    tabBarInactiveTintColor: navigation.tabBarInactiveTint,
    tabBarStyle: {
      height: 84,
      paddingTop: 8,
      paddingBottom: 14,
      paddingHorizontal: 12,
      backgroundColor: navigation.tabBarBackground,
      borderTopWidth: 0,
      shadowColor: palette.black,
      shadowOpacity: 0.09,
      shadowOffset: { width: 0, height: -8 },
      shadowRadius: 20,
      elevation: 18,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: 2,
    },
    tabBarIcon: ({ focused }) => (
      <TabIcon routeName={route.name} focused={focused} />
    ),
  };
}

function CustomerTabs() {
  const { user } = useAuth();
  const isAdmin = hasRole(user, 'ADMIN');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => getTabScreenOptions(route)}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ title: 'Mis problemas' }} />
      {isAdmin ? (
        <Tab.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      ) : null}
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Cuenta' }} />
    </Tab.Navigator>
  );
}

function ProfessionalTabs() {
  const { user, professionalProfile } = useAuth();
  const isAdmin = hasRole(user, 'ADMIN');
  const isApprovedProfessional = professionalProfile?.status === 'APPROVED';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => getTabScreenOptions(route)}
    >
      {isApprovedProfessional ? (
        <Tab.Screen name="Requests" component={RequestsScreen} options={{ title: 'Conversaciones' }} />
      ) : null}
      {isApprovedProfessional ? (
        <Tab.Screen name="Oportunidades" component={OpportunitiesBoardScreen} options={{ title: 'Oportunidades' }} />
      ) : null}
      <Tab.Screen name="ProfessionalHub" component={ProfessionalHubScreen} options={{ title: 'Mi Hub' }} />
      {isAdmin ? (
        <Tab.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      ) : null}
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Cuenta' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { activeMode } = useAuth();
  const isProfessionalMode = activeMode === APP_MODES.PROFESSIONAL;

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: navigation.headerTintColor,
        headerStyle: { backgroundColor: navigation.headerBackground },
        contentStyle: { backgroundColor: navigation.contentBackground },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" options={{ headerShown: false }}>
        {() => (isProfessionalMode ? <ProfessionalTabs /> : <CustomerTabs />)}
      </Stack.Screen>
      <Stack.Screen name="ProfessionalDetail" component={ProfessionalDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfessionalHubEntry" component={ProfessionalHubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateServiceRequest" component={CreateServiceRequestScreen} options={{ title: 'Nueva solicitud' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Solicitud' }} />
      <Stack.Screen name="ServiceNeedComposer" component={ServiceNeedComposerScreen} options={{ title: 'Nuevo problema' }} />
      <Stack.Screen name="ServiceNeedDetail" component={ServiceNeedDetailScreen} options={{ title: 'Mi problema' }} />
      <Stack.Screen name="SelectProfessionals" component={SelectProfessionalsScreen} options={{ title: 'Elegir profesionales' }} />
      <Stack.Screen name="OpportunitiesBoard" component={OpportunitiesBoardScreen} options={{ title: 'Tablero' }} />
      <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} options={{ title: 'Oportunidad' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="EditCustomerProfile" component={EditCustomerProfileScreen} options={{ title: 'Editar perfil', presentation: 'modal' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Ayuda' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacidad' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { activeMode, booting, signedIn } = useAuth();

  if (booting) {
    return <LoadingView label="Preparando tu sesion..." />;
  }

  return signedIn ? <AppNavigator key={activeMode} /> : <AuthNavigator />;
}

module.exports = { RootNavigator };
