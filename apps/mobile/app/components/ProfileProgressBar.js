const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { palette, spacing, type } = require('../theme');

/**
 * Calcula el porcentaje de completitud del perfil profesional.
 * @param {Object} profile - Datos del perfil profesional (businessName, headline, bio, yearsExperience, avatarUrl, coverUrl, photoUrls)
 * @param {Array} categories - IDs de categorías seleccionadas
 * @param {Array} serviceAreas - Zonas de servicio (city, province, radiusKm)
 * @param {Array} workPosts - Posts de trabajos previos (title, body)
 * @returns {number} Porcentaje de 0 a 100
 */
function getProfileCompletion(profile = {}, categories = [], serviceAreas = [], workPosts = []) {
  let total = 0;
  const weights = {
    BUSINESS_NAME: 10,
    HEADLINE: 10,
    BIO: 15,
    YEARS_EXP: 5,
    AVATAR_URL: 10,
    COVER_URL: 5,
    PHOTO_URLS: 10,
    CATEGORIES: 10,
    SERVICE_AREAS: 10,
    WORK_POSTS: 15,
  };

  // Nombre comercial
  if (profile.businessName?.trim()) {
    total += weights.BUSINESS_NAME;
  }

  // Titular
  if (profile.headline?.trim()) {
    total += weights.HEADLINE;
  }

  // Biografía (mínimo 50 caracteres)
  const bio = (profile.bio || '').trim();
  if (bio.length >= 50) {
    total += weights.BIO;
  }

  // Años de experiencia (mayor a 0)
  if (Number(profile.yearsExperience) > 0) {
    total += weights.YEARS_EXP;
  }

  // URL de avatar
  if (profile.avatarUrl?.trim()) {
    total += weights.AVATAR_URL;
  }

  // URL de cover
  if (profile.coverUrl?.trim()) {
    total += weights.COVER_URL;
  }

  // URLs de fotos (al menos 1)
  const photoUrls = (profile.photoUrls || []).filter(Boolean);
  if (photoUrls.length >= 1) {
    total += weights.PHOTO_URLS;
  }

  // Categorías (al menos 1)
  if (categories.length >= 1) {
    total += weights.CATEGORIES;
  }

  // Zonas de servicio (al menos 1 válida: city y province)
  const validServiceAreas = serviceAreas.filter(
    (area) => area.city?.trim() && area.province?.trim()
  );
  if (validServiceAreas.length >= 1) {
    total += weights.SERVICE_AREAS;
  }

  // Posts de trabajos (al menos 1 válido: title y body)
  const validWorkPosts = workPosts.filter(
    (post) => post.title?.trim() && post.body?.trim()
  );
  if (validWorkPosts.length >= 1) {
    total += weights.WORK_POSTS;
  }

  return Math.min(100, total);
}

function ProfileProgressBar({ profile, categories, serviceAreas, workPosts, percentage }) {
  const calculatedPercentage = percentage ?? getProfileCompletion(profile, categories, serviceAreas, workPosts);
  const clampedPercentage = Math.max(0, Math.min(100, calculatedPercentage));

  // Color de la barra según porcentaje
  const barColor =
    clampedPercentage < 30
      ? palette.progressBarWarning || palette.warning
      : palette.progressBarSuccess || palette.success;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Completitud del perfil</Text>
        <Text style={[styles.percentage, { color: barColor }]}>{clampedPercentage}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clampedPercentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...type.label,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

module.exports = {
  ProfileProgressBar,
  getProfileCompletion,
};
