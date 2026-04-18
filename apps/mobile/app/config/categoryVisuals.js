const { palette } = require('../theme');

const CATEGORY_VISUALS = [
  {
    matchers: ['plom', 'agua', 'water', 'canilla', 'grifo'],
    icon: 'water-outline',
    badge: 'Urgencias del dia',
    title: 'Soluciones rapidas para plomeria',
    subtitle: 'Profesionales listos para perdidas, canillas y arreglos del hogar.',
    colors: ['#0F7CFF', '#35C2FF'],
  },
  {
    matchers: ['elect', 'luz', 'cable', 'flash'],
    icon: 'flash-outline',
    badge: 'Atencion segura',
    title: 'Electricistas para cada detalle',
    subtitle: 'Instalaciones, chequeos y reparaciones con respuesta clara y veloz.',
    colors: ['#FF9A3C', '#FFD166'],
  },
  {
    matchers: ['pint', 'color', 'brush', 'rodillo'],
    icon: 'brush-outline',
    badge: 'Renova espacios',
    title: 'Pintura con terminacion prolija',
    subtitle: 'Cambios de aire para interiores y exteriores con mano experta.',
    colors: ['#FF6B6B', '#FF8E72'],
  },
  {
    matchers: ['jard', 'garden', 'leaf', 'parque'],
    icon: 'leaf-outline',
    badge: 'Exterior cuidado',
    title: 'Jardineria para mantener todo vivo',
    subtitle: 'Corte, poda y mantenimiento para que tu patio siempre luzca bien.',
    colors: ['#1E9E69', '#57D18C'],
  },
  {
    matchers: ['aire', 'clima', 'frio', 'snow'],
    icon: 'snow-outline',
    badge: 'Confort total',
    title: 'Aire acondicionado y climatizacion',
    subtitle: 'Instalacion, service y mantenimiento para cualquier temporada.',
    colors: ['#3B82F6', '#7DD3FC'],
  },
  {
    matchers: ['cons', 'obra', 'alba', 'hammer', 'refac'],
    icon: 'hammer-outline',
    badge: 'Obras en marcha',
    title: 'Maestros para reformas y arreglos',
    subtitle: 'Apoyo para mejoras, reparaciones estructurales y trabajos pesados.',
    colors: ['#6D5DF6', '#9B8AFB'],
  },
  {
    matchers: ['clean', 'limp', 'spark'],
    icon: 'sparkles-outline',
    badge: 'Casa impecable',
    title: 'Limpieza lista para hoy',
    subtitle: 'Servicios confiables para mantener tu hogar ordenado y brillante.',
    colors: ['#13A8A8', '#58D6D6'],
  },
];

const CATEGORY_ICON_FALLBACKS = [
  'sparkles-outline',
  'water-outline',
  'flash-outline',
  'hammer-outline',
  'brush-outline',
  'leaf-outline',
  'snow-outline',
  'construct-outline',
];

function normalizeCategoryValue(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findCategoryVisual(category) {
  const normalizedName = normalizeCategoryValue(category?.name);
  const normalizedSlug = normalizeCategoryValue(category?.slug);
  const matchableText = `${normalizedName} ${normalizedSlug}`;

  return (
    CATEGORY_VISUALS.find((theme) => theme.matchers.some((matcher) => matchableText.includes(matcher))) || null
  );
}

function getCategoryIcon(category, index = 0) {
  const visual = findCategoryVisual(category);

  if (visual?.icon) {
    return visual.icon;
  }

  if (category?.icon) {
    return category.icon;
  }

  return CATEGORY_ICON_FALLBACKS[index % CATEGORY_ICON_FALLBACKS.length];
}

function getCategoryTheme(category, index = 0) {
  const safeIndex = index >= 0 ? index : 0;
  const matchedTheme = findCategoryVisual(category);

  if (matchedTheme) {
    return {
      ...matchedTheme,
      key: `category-${category?.id || safeIndex || 'default'}`,
      categoryId: category?.id || '',
      categoryName: category?.name || 'Servicios',
    };
  }

  const fallbackColors = [
    [palette.accentDeep, palette.accent],
    ['#E56B6F', '#F4A261'],
    ['#2A9D8F', '#4CC9A6'],
    ['#577590', '#89C2D9'],
  ];
  const colors = fallbackColors[safeIndex % fallbackColors.length];

  return {
    key: `category-${category?.id || safeIndex || 'default'}`,
    categoryId: category?.id || '',
    categoryName: category?.name || 'Servicios',
    icon: getCategoryIcon(category, safeIndex),
    badge: category?.name ? `${category.name} destacado` : 'Elegi tu oficio',
    title: category?.name ? `${category.name} para cada necesidad` : 'Explora oficios para tu hogar',
    subtitle:
      category?.description || 'Descubri profesionales verificados y elegi el servicio ideal para tu casa.',
    colors,
  };
}

module.exports = {
  getCategoryIcon,
  getCategoryTheme,
};
