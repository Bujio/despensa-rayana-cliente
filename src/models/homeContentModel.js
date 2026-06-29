const STORAGE_KEY = 'despensa-rayana-home-content';

const defaultCategoryItems = [
  {
    title: 'Alimentación',
    body: 'Despensa y básicos',
    imageUrl: 'https://live.staticflickr.com/7052/6970874754_968f8745a0_b.jpg',
    linkUrl: 'Alimentación',
  },
  {
    title: 'Ibéricos',
    body: 'Jamones y embutidos',
    imageUrl: 'https://live.staticflickr.com/3173/3079269863_c72174720d_b.jpg',
    linkUrl: 'Ibéricos',
  },
  {
    title: 'Quesos',
    body: 'De cabra, oveja y vaca',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Torta_del_Casar_DOP.jpg',
    linkUrl: 'Quesos',
  },
  {
    title: 'Dulces y miel',
    body: 'Tradición dulce',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Selection_of_creamed_honey_jars_from_Europe.jpg',
    linkUrl: 'Dulces y miel',
  },
  {
    title: 'Bebidas',
    body: 'Vinos, licores y más',
    imageUrl: 'https://live.staticflickr.com/3510/3212368391_8df6862648_b.jpg',
    linkUrl: 'Bebidas',
  },
  {
    title: 'Artesanía',
    body: 'Hecho a mano',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Cork_coaster.jpg',
    linkUrl: 'Artesanía',
  },
  {
    title: 'Packs regalo',
    body: 'Sorprende con lo nuestro',
    imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80',
    linkUrl: 'Packs regalo',
  },
];

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
    { id: 'categories', type: 'categories', title: 'Explora nuestras categorías', enabled: true, locked: true, items: defaultCategoryItems },
    { id: 'featured', type: 'featured', title: 'Productos destacados', enabled: true, locked: true },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSection(section, index) {
  const sectionItems = Array.isArray(section.items) ? section.items : [];
  const items = section.type === 'categories' && sectionItems.length === 0
    ? clone(defaultCategoryItems)
    : sectionItems;
  return {
    body: '',
    ctaLabel: '',
    imageUrl: '',
    items: [],
    linkUrl: '',
    productIds: [],
    subtitle: '',
    ...section,
    enabled: section.enabled !== false,
    items,
    productIds: Array.isArray(section.productIds) ? section.productIds.map(String) : [],
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
  async loadRemote(apiRequest) {
    const content = await apiRequest('/home-content', {}, null);
    return this.save(content);
  },
  async saveRemote(request, content) {
    const normalized = normalize(content);
    const saved = await request('/home-content', {
      method: 'PUT',
      body: JSON.stringify(normalized),
    });
    return this.save(saved);
  },
};
