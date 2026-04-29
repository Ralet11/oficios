const React = require('react');
const { Image, Pressable, StyleSheet, Text, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const { palette, spacing, type } = require('../theme');

function WorkPostCardLinkedIn({ onPress, post = {}, style }) {
  const { title, body, photoUrls = [], highlightLines = [] } = post;
  const cover = photoUrls[0] || null;
  const gridPhotos = photoUrls.slice(1, 5).filter(Boolean); // máximo 4 fotos para el grid 2x2

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      {/* Portada a ancho completo */}
      {cover ? (
        <Image
          resizeMode="cover"
          source={{ uri: cover }}
          style={styles.cover}
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons color={palette.mutedSoft} name="image-outline" size={28} />
          <Text style={styles.coverPlaceholderText}>Sin portada</Text>
        </View>
      )}

      {/* Grid 2x2 de fotos adicionales */}
      {gridPhotos.length > 0 ? (
        <View style={styles.gridContainer}>
          {gridPhotos.map((uri, index) => (
            <Image
              key={`grid-${index}-${uri}`}
              resizeMode="cover"
              source={{ uri }}
              style={styles.gridItem}
            />
          ))}
          {/* Rellenar espacios vacíos del grid si hay menos de 4 fotos */}
          {Array.from({ length: 4 - gridPhotos.length }).map((_, index) => (
            <View key={`empty-${index}`} style={[styles.gridItem, styles.gridEmpty]} />
          ))}
        </View>
      ) : null}

      {/* Contenido de texto */}
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>
          {title || 'Sin título'}
        </Text>
        {body ? (
          <Text numberOfLines={3} style={styles.body}>
            {body}
          </Text>
        ) : null}
        {highlightLines.length > 0 ? (
          <View style={styles.highlights}>
            {highlightLines.slice(0, 3).map((line, index) => (
              <View key={`hl-${index}`} style={styles.highlightRow}>
                <Ionicons color={palette.accentDark} name="checkmark-circle" size={14} />
                <Text numberOfLines={1} style={styles.highlightText}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons color={palette.accentDark} name="images-outline" size={14} />
            <Text style={styles.metaPillText}>{photoUrls.length} fotos</Text>
          </View>
          {highlightLines.length > 0 ? (
            <View style={styles.metaPill}>
              <Ionicons color={palette.accentDark} name="chatbubble-ellipses-outline" size={14} />
              <Text style={styles.metaPillText}>{highlightLines.length} mensajes</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: palette.surfaceElevated,
  },
  cover: {
    width: '100%',
    height: 200,
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
    gap: spacing.sm,
  },
  coverPlaceholderText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 180,
  },
  gridItem: {
    width: '50%',
    height: '50%',
    borderWidth: 1,
    borderColor: palette.white,
  },
  gridEmpty: {
    backgroundColor: palette.surfaceMuted,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: palette.ink,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.muted,
  },
  highlights: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  highlightText: {
    fontSize: 12,
    color: palette.ink,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
  },
  metaPillText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '800',
  },
});

module.exports = {
  WorkPostCardLinkedIn,
};
