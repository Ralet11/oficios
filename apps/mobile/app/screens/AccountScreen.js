const React = require('react');
const { StyleSheet, View } = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { LoadingView } = require('../components/LoadingView');
const { useAuth } = require('../contexts/AuthContext');
const { palette, spacing } = require('../theme');
const {
  ProfileHeader,
  SectionHeader,
  StatRow,
  SettingsRow,
  ReputationSection,
} = require('../components/account');

function formatPhone(phone) {
  if (!phone) { return 'No informado'; }
  return phone;
}

function AccountScreen() {
  const navigation = useNavigation();
  const { user, signOut, refreshSession, customerProfile } = useAuth();

  if (!user) {
    return <LoadingView label="Cargando cuenta..." />;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const phone = formatPhone(user.phone);
  const city = customerProfile?.city || 'No configurada';
  const activeRequests = 0;
  const reviewCount = customerProfile?.reviewCount || 0;
  const isProfessional = (user.roles || []).includes('PROFESSIONAL');

  return (
    <Screen contentStyle={styles.content}>
      <ProfileHeader user={user} customerProfile={customerProfile} />

      <View style={styles.section}>
        <SectionHeader title="Tu reputacion" />
        <ReputationSection customerProfile={customerProfile} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Tus datos"
          action="Editar"
          onActionPress={() => navigation.navigate('EditCustomerProfile')}
        />
        <View style={styles.dataRows}>
          <StatRow icon="phone" label="Telefono" value={phone} />
          <StatRow icon="email" label="Email" value={user.email || 'No informado'} />
          <StatRow icon="map" label="Ciudad" value={city} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Actividad" />
        <View style={styles.dataRows}>
          <StatRow
            icon="clipboard-text"
            label="Solicitudes activas"
            value={activeRequests.toString()}
            showChevron
            onPress={() => navigation.navigate('Requests')}
          />
          <StatRow
            icon="message-draw"
            label={`Reseñas escritas (${reviewCount})`}
            value=""
            showChevron
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Acciones" />
        <View style={styles.dataRows}>
          <SettingsRow
            label="Ayuda y soporte"
            icon="help-circle"
            onPress={() => navigation.navigate('Help')}
          />
          <SettingsRow
            label="Privacidad"
            icon="shield-account"
            onPress={() => navigation.navigate('Privacy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Cerrar sesion"
            icon="logout"
            onPress={signOut}
            danger
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: 140,
  },
  section: {
    gap: spacing.xs,
  },
  dataRows: {
    gap: 0,
  },
  divider: {
    height: spacing.xs,
  },
});

module.exports = {
  AccountScreen,
};