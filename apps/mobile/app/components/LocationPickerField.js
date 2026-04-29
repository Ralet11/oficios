const React = require('react');
const { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } = require('react-native');
const { Ionicons } = require('@expo/vector-icons');
const Maps = require('react-native-maps');
const { getPlaceDetails, hasGoogleMapsApiKey, searchPlaces } = require('../services/googlePlaces');
const { palette, shadows, spacing, type } = require('../theme');

const MapView = Maps.default;
const { Circle, Marker } = Maps;

const DEFAULT_REGION = {
  latitude: -34.6037,
  latitudeDelta: 0.22,
  longitude: -58.3816,
  longitudeDelta: 0.22,
};

function buildRegion(latitude, longitude, radiusKm) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return DEFAULT_REGION;
  }

  const delta = Math.max(0.035, (Number(radiusKm) || 8) / 40);

  return {
    latitude,
    latitudeDelta: delta,
    longitude,
    longitudeDelta: delta,
  };
}

function LocationPickerField({
  helperText,
  label,
  latitude,
  longitude,
  onChangeQuery,
  onSelectLocation,
  placeholder,
  query,
  radiusKm,
}) {
  const apiEnabled = hasGoogleMapsApiKey();
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [selectionError, setSelectionError] = React.useState('');

  React.useEffect(() => {
    const normalized = String(query || '').trim();

    if (!apiEnabled || normalized.length < 3) {
      setSuggestions([]);
      setSelectionError('');
      return undefined;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setSelectionError('');

      try {
        const nextSuggestions = await searchPlaces(normalized);

        if (!cancelled) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
          setSelectionError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [apiEnabled, query]);

  async function handleSuggestionPress(suggestion) {
    try {
      setLoading(true);
      setSelectionError('');
      const selectedLocation = await getPlaceDetails(suggestion.placeId);
      onChangeQuery(selectedLocation.label);
      onSelectLocation(selectedLocation);
      setSuggestions([]);
    } catch (error) {
      setSelectionError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const region = React.useMemo(
    () => buildRegion(latitude, longitude, radiusKm),
    [latitude, longitude, radiusKm],
  );
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.searchField}>
        <Ionicons color={palette.muted} name="search-outline" size={18} />
        <TextInput
          autoCorrect={false}
          placeholder={placeholder || 'Buscar ubicacion'}
          placeholderTextColor={palette.mutedSoft}
          style={styles.searchInput}
          value={query}
          onChangeText={onChangeQuery}
        />
        {loading ? <ActivityIndicator color={palette.accentDark} size="small" /> : null}
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      {!apiEnabled ? <Text style={styles.warningText}>Configura `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` para activar Google Maps.</Text> : null}
      {selectionError ? <Text style={styles.errorText}>{selectionError}</Text> : null}

      {suggestions.length ? (
        <View style={[styles.suggestionsCard, shadows.card]}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              onPress={() => handleSuggestionPress(suggestion)}
              style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionRowPressed]}
            >
              <View style={styles.suggestionIcon}>
                <Ionicons color={palette.accentDark} name="location-outline" size={16} />
              </View>
              <View style={styles.suggestionCopy}>
                <Text numberOfLines={1} style={styles.suggestionTitle}>
                  {suggestion.title}
                </Text>
                <Text numberOfLines={1} style={styles.suggestionSubtitle}>
                  {suggestion.subtitle || suggestion.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.mapShell}>
        {apiEnabled ? (
          <MapView
            region={region}
            scrollEnabled={false}
            rotateEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            style={styles.map}
          >
            {hasCoordinates ? (
              <>
                <Marker coordinate={{ latitude, longitude }} />
                {Number(radiusKm) > 0 ? (
                  <Circle
                    center={{ latitude, longitude }}
                    radius={Number(radiusKm) * 1000}
                    fillColor="rgba(57, 169, 255, 0.14)"
                    strokeColor="rgba(37, 150, 243, 0.45)"
                    strokeWidth={1.2}
                  />
                ) : null}
              </>
            ) : null}
          </MapView>
        ) : (
          <View style={styles.mapFallback} />
        )}

        {!hasCoordinates ? (
          <View style={styles.mapOverlay}>
            <Ionicons color={palette.accentDark} name="map-outline" size={20} />
            <Text style={styles.mapOverlayTitle}>Selecciona una ubicacion</Text>
            <Text style={styles.mapOverlayText}>Busca una zona para guardar su punto y ver el mapa aqui.</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    ...type.label,
    color: palette.ink,
  },
  searchField: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 12,
    color: palette.muted,
  },
  warningText: {
    fontSize: 12,
    color: palette.warning,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    color: palette.danger,
    lineHeight: 18,
  },
  suggestionsCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderMuted,
  },
  suggestionRowPressed: {
    backgroundColor: palette.surfaceElevated,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  suggestionCopy: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionSubtitle: {
    color: palette.muted,
    fontSize: 12,
  },
  mapShell: {
    height: 184,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    backgroundColor: palette.surfaceElevated,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: 8,
    backgroundColor: 'rgba(248, 251, 255, 0.82)',
  },
  mapOverlayTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  mapOverlayText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

module.exports = {
  LocationPickerField,
};
