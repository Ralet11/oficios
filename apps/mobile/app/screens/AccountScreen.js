const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { SectionCard } = require('../components/SectionCard');
const { useAuth } = require('../contexts/AuthContext');
const { palette, type } = require('../theme');

function AccountScreen() {
  const navigation = useNavigation();
  const { user, signOut, refreshSession } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Tu cuenta</Text>
        <Text style={styles.copy}>La cuenta conserva múltiples roles y centraliza sesión, inbox y perfil profesional.</Text>
      </View>

      <SectionCard title={`${user.firstName} ${user.lastName}`} subtitle={user.email}>
        <Text style={styles.text}>Teléfono: {user.phone || 'No informado'}</Text>
        <Text style={styles.text}>Roles: {(user.roles || []).join(', ')}</Text>
      </SectionCard>

      <SectionCard title="Acciones rápidas">
        <AppButton variant="secondary" onPress={() => navigation.navigate('Notifications')}>
          Ver notificaciones
        </AppButton>
        <AppButton variant="ghost" onPress={refreshSession}>
          Refrescar sesión
        </AppButton>
        <AppButton onPress={signOut}>Cerrar sesión</AppButton>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    ...type.title,
  },
  copy: {
    ...type.body,
    color: palette.ink,
  },
  text: {
    color: palette.ink,
    fontSize: 15,
  },
});

module.exports = {
  AccountScreen,
};
