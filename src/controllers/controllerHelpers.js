export function formatNoticeProductName(value) {
  const name = String(value || '').trim();
  if (!name) return '';
  return name.charAt(0).toLocaleUpperCase('es-ES') + name.slice(1);
}

export function isInvalidSessionMessage(message) {
  const value = String(message || '').toLowerCase();
  return [
    'invalid token',
    'jwt expired',
    'jwt malformed',
    'invalid signature',
    'token expired',
  ].some((tokenMessage) => value.includes(tokenMessage));
}

export function shouldShowSupplierLoginWelcome(user) {
  if (user?.role !== 'supplier') return false;
  const userKey = user._id || user.id || user.email;
  if (!userKey || typeof window === 'undefined') return false;

  const storageKey = 'despensa-supplier-welcome-seen:' + userKey;
  if (window.localStorage.getItem(storageKey)) return false;
  window.localStorage.setItem(storageKey, 'true');
  return true;
}

export function translateAuthMessage(message) {
  const value = String(message || '').toLowerCase();
  if (!value) return 'No se pudo completar la operación.';
  if (value.includes('invalid credentials')) return 'El email o la contraseña no son correctos.';
  if (value.includes('email already in use')) return 'Ya existe una cuenta con este email.';
  if (value.includes('password must be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (value.includes('password must contain at least one uppercase')) return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (value.includes('password must contain at least one number')) return 'La contraseña debe incluir al menos un número.';
  if (value.includes('invalid email')) return 'Introduce un email válido.';
  if (value.includes('name must be at least')) return 'El nombre debe tener al menos 2 caracteres.';
  if (value.includes('too many')) return 'Se han realizado demasiados intentos. Inténtalo de nuevo más tarde.';
  if (value.includes('failed to fetch') || value.includes('networkerror')) return 'No se ha podido conectar con el servidor.';
  return message || 'No se pudo completar la operación.';
}

export const getShippingDefaults = (session) => ({
  street: session?.user?.address?.street || '',
  codePostal: session?.user?.address?.codePostal || '',
  city: session?.user?.address?.city || '',
  country: session?.user?.address?.country || 'España',
  phone: session?.user?.phone || '',
});

export const getAccountProfileDefaults = (session) => ({
  name: session?.user?.name || '',
  email: session?.user?.email || '',
  phone: session?.user?.phone || '',
  street: session?.user?.address?.street || '',
  codePostal: session?.user?.address?.codePostal || '',
  city: session?.user?.address?.city || '',
  country: session?.user?.address?.country || 'España',
  password: '',
});

export const validateShippingForm = (form) => {
  const errors = {};
  if (form.street.trim().length < 3) errors.street = 'Indica una calle válida.';
  if (!/^\d{5}$/.test(form.codePostal.trim())) errors.codePostal = 'El código postal debe tener 5 números.';
  if (form.city.trim().length < 2) errors.city = 'Indica una ciudad válida.';
  if (form.country.trim().length < 2) errors.country = 'Indica un país válido.';
  if (form.phone.replace(/\s/g, '').length < 6) errors.phone = 'Indica un teléfono válido.';
  return errors;
};

export const validateCheckoutConfirmation = (form) => {
  const errors = {};
  if (!form.accepted) {
    errors.accepted = 'Debes aceptar las condiciones de esta beta para registrar el pedido.';
  }
  return errors;
};

export const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const getProductId = (product) => String(product?._id || product?.id || product?.sku || '');

export const getSupplierKey = (supplier) => String(
  supplier?._id || supplier?.id || supplier?.supplierCode || supplier?.name || '',
).trim();

export function getProductFormFromProduct(product, supplierOverride = null) {
  const offer = product?.offer || {};
  const supplier = supplierOverride || product?.supplier || {};
  const supplierRef = typeof product?.supplierRef === 'object'
    ? product.supplierRef?._id || product.supplierRef?.id || ''
    : product?.supplierRef || '';

  return {
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price ?? '',
    shortDescription: product?.shortDescription || '',
    description: product?.description || '',
    stock: product?.stock ?? '0',
    category: typeof product?.category === 'object' ? product.category?._id || product.category?.id || '' : product?.category || '',
    supplierId: supplierRef || supplier.supplierCode || supplier.id || '0',
    supplierName: supplier.name || product?.supplierRef?.name || '',
    supplierImages: Array.isArray(supplier.images) ? supplier.images : [],
    images: Array.isArray(product?.images) ? product.images : [],
    status: product?.status || 'pending_review',
    offerType: offer.active ? offer.type || 'none' : 'none',
    offerValue: offer.value ?? '',
    offerBundleQuantity: offer.bundleQuantity || '3',
    offerBundlePayQuantity: offer.bundlePayQuantity || '2',
    offerLabel: offer.label || '',
    offerValidFrom: formatDateInput(offer.validFrom),
    offerValidUntil: formatDateInput(offer.validUntil),
  };
}

export function assignHomeImage(content, target, imageUrl) {
  if (target === 'hero.imageUrl') {
    return {
      ...content,
      hero: {
        ...content.hero,
        imageUrl,
      },
    };
  }

  if (target.startsWith('sectionItem.')) {
    const [, sectionId, itemIndex, field] = target.split('.');
    return {
      ...content,
      sections: content.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const items = [...(Array.isArray(section.items) ? section.items : [])];
        items[Number(itemIndex)] = {
          title: '',
          body: '',
          imageUrl: '',
          linkUrl: '',
          ...(items[Number(itemIndex)] || {}),
          [field]: imageUrl,
        };
        return { ...section, items };
      }),
    };
  }

  if (target.startsWith('section.')) {
    const [, sectionId, field] = target.split('.');
    return {
      ...content,
      sections: content.sections.map((section) => (
        section.id === sectionId ? { ...section, [field]: imageUrl } : section
      )),
    };
  }

  return content;
}

export const hasClientSideFilters = (filters) => Boolean(
  filters.onlyOffers ||
  filters.origin ||
  filters.favoritesOnly ||
  filters.categoryGroupIds?.length,
);
