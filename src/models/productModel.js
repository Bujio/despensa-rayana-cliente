export const emptyFilters = {
  search: '',
  categoryId: '',
  categoryGroupIds: [],
  inStock: true,
  minPrice: '',
  maxPrice: '',
  sort: 'createdAt',
  order: 'desc',
  origin: '',
  onlyOffers: false,
  favoritesOnly: false,
};

function readImageUrl(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.secure_url || image.src || '';
}

function readDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isOfferActive(offer, now = new Date()) {
  if (!offer?.active || offer.type === 'none') return false;
  const validFrom = readDate(offer.validFrom);
  const validUntil = readDate(offer.validUntil);
  if (validFrom && now < validFrom) return false;
  if (validUntil && now > validUntil) return false;
  return true;
}

export const productModel = {
  getImages(product) {
    const productImages = Array.isArray(product?.images) ? product.images : [];
    return productImages
      .map((image) => ({
        ...((image && typeof image === 'object') ? image : {}),
        url: readImageUrl(image),
        name: image?.name || product?.name || 'Producto',
      }))
      .filter((image) => image.url);
  },
  getImage(product) {
    return this.getImages(product)[0]?.url
      || readImageUrl(product?.image)
      || readImageUrl(product?.imageUrl)
      || '';
  },
  getCategoryName(category) {
    if (!category || typeof category === 'string') return 'Producto local';
    return category.name || 'Producto local';
  },
  getKey(product) {
    return product._id || product.id || product.sku;
  },
  getAvailableStock(product, reservedBySku = {}) {
    const stock = Number(product?.stock || 0);
    const reserved = Number(reservedBySku[product?.sku] || 0);
    return Math.max(stock - reserved, 0);
  },
  getOfferLabel(product) {
    const offer = product?.offer;
    if (!isOfferActive(offer)) return '';
    if (offer.label) return offer.label;
    if (offer.type === 'percent') return offer.value + '% dto.';
    if (offer.type === 'amount') return Number(offer.value || 0).toFixed(2) + ' € dto.';
    if (offer.type === 'bundle') return offer.bundleQuantity + 'x' + offer.bundlePayQuantity;
    return '';
  },
  getOfferPrice(product) {
    const offer = product?.offer;
    const price = Number(product?.price || 0);
    if (!isOfferActive(offer)) return price;
    if (offer.type === 'percent') return Math.max(price * (1 - Number(offer.value || 0) / 100), 0);
    if (offer.type === 'amount') return Math.max(price - Number(offer.value || 0), 0);
    return price;
  },
  isOfferActive(product) {
    return isOfferActive(product?.offer);
  },
  matchesOrigin(product, origin) {
    if (!origin) return true;
    const categoryName = this.getCategoryName(product?.category);
    const haystack = [
      product?.name,
      product?.description,
      product?.supplier?.name,
      categoryName,
      product?.origin,
    ].filter(Boolean).join(' ').toLowerCase();

    const terms = {
      rayano: ['raya', 'rayana', 'extremadura', 'badajoz', 'caceres', 'cáceres', 'portugal'],
      dehesa: ['dehesa', 'iberico', 'ibérico', 'campo'],
      sierra: ['sierra', 'villuercas', 'gata', 'montanchez', 'montánchez', 'hurdes'],
    };

    return (terms[origin] || [origin]).some((term) => haystack.includes(term));
  },
};
