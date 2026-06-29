const STORAGE_KEY = 'despensa-rayana-home-content';

export const defaultHomeContent = {
  hero: {
    eyebrow: 'Origen extremeno - Espiritu rayano',
    title: 'Sabores que cruzan fronteras, tradicion que nos une.',
    description: 'Productos de origen extremeno de la zona de La Raya, donde Extremadura se encuentra con Portugal.',
    primaryLabel: 'Descubre productos',
    secondaryLabel: 'Nuestra historia',
    imageUrl: '/camino-extremadura.png',
  },
  featuredProductIds: [],
  sections: [
    { id: 'hero', type: 'hero', title: 'Hero principal', enabled: true, locked: true },
    { id: 'trust', type: 'trust', title: 'Mensajes de confianza', enabled: true, locked: true },
    { id: 'categories', type: 'categories', title: 'Categorias visuales', enabled: true, locked: true },
    { id: 'featured', type: 'featured', title: 'Productos destacados', enabled: true, locked: true },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSection(section, index) {
  return {
    body: '',
    subtitle: '',
    ...section,
    enabled: section.enabled !== false,
    order: Number.isFinite(Number(section.order)) ? Number(section.order) : index,
  };
}

function normalize(content = {}) {
  const sections = Array.isArray(content.sections) && content.sections.length
    ? content.sections
    : defaultHomeContent.sections;

  return {
    hero: {
      ...defaultHomeContent.hero,
      ...(content.hero || {}),
    },
    featuredProductIds: Array.isArray(content.featuredProductIds)
      ? content.featuredProductIds.map(String)
      : [],
    sections: sections
      .map(normalizeSection)
      .sort((first, second) => first.order - second.order)
      .map((section, index) => ({ ...section, order: index })),
  };
}

export const homeContentModel = {
  getDefault() {
    return normalize(clone(defaultHomeContent));
  },
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getDefault();
      return normalize(JSON.parse(raw));
    } catch {
      return this.getDefault();
    }
  },
  save(content) {
    const normalized = normalize(content);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  },
};
