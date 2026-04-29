const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { MaterialCommunityIcons } = require('@expo/vector-icons');
const { Screen } = require('../components/Screen');
const { palette, spacing, type } = require('../theme');

function OpportunitiesScreen() {
  return (
    <Screen gradient>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Oportunidades</Text>
          <Text style={styles.subtitle}>
            Explora solicitudes publicadas por clientes y encuentra nuevos trabajos.
          </Text>
        </View>

        <View style={styles.placeholderCard}>
          <MaterialCommunityIcons
            name="briefcase-search-outline"
            size={48}
            color={palette.accent}
          />
          <Text style={styles.placeholderTitle}>Próximamente</Text>
          <Text style={styles.placeholderText}>
            Aquí verás las oportunidades de trabajo publicadas en el tablero general. Podrás filtrar por categoría, zona y más.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...type.title,
  },
  subtitle: {
    ...type.body,
    color: palette.ink,
  },
  placeholderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 24,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
  },
  placeholderText: {
    ...type.body,
    textAlign: 'center',
  },
});

module.exports = {
  OpportunitiesScreen,
};
