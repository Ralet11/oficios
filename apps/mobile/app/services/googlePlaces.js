const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function hasGoogleMapsApiKey() {
  return Boolean(GOOGLE_MAPS_API_KEY);
}

function buildGooglePlacesUrl(path, params) {
  const query = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    language: 'es',
    ...params,
  });

  return `https://maps.googleapis.com/maps/api/place/${path}/json?${query.toString()}`;
}

async function fetchGooglePlaces(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('No se pudo consultar Google Maps.');
  }

  const payload = await response.json();

  if (payload.status && !['OK', 'ZERO_RESULTS'].includes(payload.status)) {
    throw new Error(payload.error_message || 'Google Maps devolvio un error.');
  }

  return payload;
}

function readAddressComponent(components, targetTypes) {
  const match = (components || []).find((component) =>
    targetTypes.some((type) => component.types?.includes(type)),
  );

  return match?.long_name || null;
}

function buildPlaceLocation(result) {
  const components = result.address_components || [];
  const city =
    readAddressComponent(components, ['locality']) ||
    readAddressComponent(components, ['administrative_area_level_2']) ||
    readAddressComponent(components, ['administrative_area_level_3']) ||
    readAddressComponent(components, ['sublocality', 'sublocality_level_1']) ||
    '';
  const province = readAddressComponent(components, ['administrative_area_level_1']) || '';

  return {
    addressLine: result.formatted_address || result.name || '',
    city,
    label: result.formatted_address || result.name || [city, province].filter(Boolean).join(', '),
    lat: typeof result.geometry?.location?.lat === 'number' ? result.geometry.location.lat : null,
    lng: typeof result.geometry?.location?.lng === 'number' ? result.geometry.location.lng : null,
    placeId: result.place_id || null,
    province,
  };
}

async function searchPlaces(query) {
  const normalized = String(query || '').trim();

  if (!hasGoogleMapsApiKey() || normalized.length < 3) {
    return [];
  }

  const url = buildGooglePlacesUrl('autocomplete', {
    components: 'country:ar',
    input: normalized,
    types: 'geocode',
  });
  const payload = await fetchGooglePlaces(url);

  return (payload.predictions || []).map((prediction) => ({
    description: prediction.description,
    id: prediction.place_id,
    placeId: prediction.place_id,
    subtitle: prediction.structured_formatting?.secondary_text || '',
    title: prediction.structured_formatting?.main_text || prediction.description,
  }));
}

async function getPlaceDetails(placeId) {
  if (!hasGoogleMapsApiKey()) {
    throw new Error('Falta configurar la clave publica de Google Maps.');
  }

  const normalized = String(placeId || '').trim();

  if (!normalized) {
    throw new Error('La ubicacion seleccionada no es valida.');
  }

  const url = buildGooglePlacesUrl('details', {
    fields: 'address_component,formatted_address,geometry,name,place_id',
    place_id: normalized,
  });
  const payload = await fetchGooglePlaces(url);

  if (!payload.result) {
    throw new Error('No se pudieron leer los detalles de la ubicacion.');
  }

  return buildPlaceLocation(payload.result);
}

module.exports = {
  getPlaceDetails,
  hasGoogleMapsApiKey,
  searchPlaces,
};
