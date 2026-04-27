const React = require('react');
const { StyleSheet, Text, View, ScrollView, Linking, Alert } = require('react-native');
const { Screen } = require('../components/Screen');
const { AppButton } = require('../components/AppButton');
const { palette, spacing } = require('../theme');

function HelpScreen() {
  const handleContact = () => {
    Linking.openURL('mailto:soporte@oficios.app?subject=Ayuda%20OFICIOS').catch(() => {
      Alert.alert('Error', 'No se pudo abrir el correo');
    });
  };

  const handleFAQ = () => {
    Alert.alert(
      'Preguntas Frecuentes',
      '• ¿Cómo busco un profesional?\n  Usá el buscador en la_home con categoría y zona.\n\n• ¿Cómo solicito un trabajo?\n  Entrá al perfil del profesional y tocá "Solicitar".\n\n• ¿Cómo califico?\n  Una vez completado el trabajo, desde la solicitud.',
    );
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>¿En qué podemos ayudarte?</Text>
          <Text style={styles.subtitle}>
            Encontrá respuestas a las dudas más comunes o contactanos directamente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayuda rápida</Text>
          <AppButton variant="secondary" onPress={handleFAQ}>
            Preguntas frecuentes
          </AppButton>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <Text style={styles.text}>
            ¿No encontraste lo que buscabas? Nuestro equipo está para ayudarte.
          </Text>
          <AppButton variant="secondary" onPress={handleContact}>
            Escribinos por email
          </AppButton>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Horario de atención</Text>
            <Text style={styles.infoValue}>Lunes a viernes 9am - 6pm</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tiempo de respuesta</Text>
            <Text style={styles.infoValue}>hasta 24hs hábiles</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  title: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  text: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  infoLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});

module.exports = {
  HelpScreen,
};