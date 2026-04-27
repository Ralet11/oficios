const React = require('react');
const { StyleSheet, Text, View, ScrollView } = require('react-native');
const { Screen } = require('../components/Screen');
const { palette, spacing } = require('../theme');

function PrivacyScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>Privacidad y Protección</Text>
          <Text style={styles.subtitle}>
            Conocé cómo protegemos tus datos personales.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos que收集amos</Text>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>
              Información de contacto (nombre, email, teléfono)
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>
              Datos de ubicación para buscar profesionales cercanos
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>
              Historial de solicitudes y conversaciones
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo usamos tus datos</Text>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>
              Conectar profesionales con clientes en tu zona
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>
              Comunicar actualizaciones de tus solicitudes
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Mejorar nuestra plataforma</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus derechos</Text>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Acceder a tus datos personales</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Solicitar corrección o eliminación</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Revocar consentimiento en cualquier momento</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <Text style={styles.text}>
            Para ejercer tus derechos o preguntar sobre privacidad:
          </Text>
          <Text style={styles.email}>privacidad@oficios.app</Text>
        </View>

        <Text style={styles.footer}>
          Última actualización: Abril 2026
        </Text>
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
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    color: palette.muted,
    fontSize: 14,
  },
  text: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  email: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  footer: {
    color: palette.muted,
    fontSize: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});

module.exports = {
  PrivacyScreen,
};