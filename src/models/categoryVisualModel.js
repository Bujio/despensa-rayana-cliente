const categoryVisuals = [
  {
    label: 'Alimentación',
    aliases: ['alimentacion', 'aceites', 'conservas vegetales', 'legumbres y cereales', 'pimenton y condimentos'],
    image: 'https://live.staticflickr.com/7052/6970874754_968f8745a0_b.jpg',
    description: 'Despensa y básicos',
  },
  {
    label: 'Ibéricos',
    aliases: ['ibericos', 'embutidos'],
    image: 'https://live.staticflickr.com/3173/3079269863_c72174720d_b.jpg',
    description: 'Jamones y embutidos',
  },
  {
    label: 'Quesos',
    aliases: ['quesos'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Torta_del_Casar_DOP.jpg',
    description: 'De cabra, oveja y vaca',
  },
  {
    label: 'Dulces y miel',
    aliases: ['dulces y miel', 'mieles y dulces', 'miel', 'dulces'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Selection_of_creamed_honey_jars_from_Europe.jpg',
    description: 'Tradición dulce',
  },
  {
    label: 'Bebidas',
    aliases: ['bebidas', 'vinos y bebidas', 'vinos'],
    image: 'https://live.staticflickr.com/3510/3212368391_8df6862648_b.jpg',
    description: 'Vinos, licores y más',
  },
  {
    label: 'Artesanía',
    aliases: ['artesania', 'artesanía'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Cork_coaster.jpg',
    description: 'Hecho a mano',
  },
  {
    label: 'Packs regalo',
    aliases: ['packs regalo', 'packs', 'regalo'],
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80',
    description: 'Sorprende con lo nuestro',
  },
  {
    label: 'Ofertas',
    aliases: ['ofertas'],
    image: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=600&q=80',
  },
];

function normalize(value = '') {
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const categoryVisualModel = {
  list() {
    return categoryVisuals;
  },
  normalize,
  findVisual(label) {
    const normalized = normalize(label);
    return categoryVisuals.find((visual) => (
      normalize(visual.label) === normalized ||
      visual.aliases.some((alias) => normalize(alias) === normalized)
    ));
  },
  getImage(label) {
    return this.findVisual(label)?.image || '';
  },
  matches(category, visual) {
    const values = [category?.name, category?.slug].filter(Boolean).map(normalize);
    return values.some((value) => (
      normalize(visual.label) === value ||
      visual.aliases.some((alias) => normalize(alias) === value)
    ));
  },
};
