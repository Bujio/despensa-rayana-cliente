function buildProductPayload(form) {
  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    price: Number(form.price),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    stock: Number(form.stock),
    supplier: {
      id: Number(form.supplierId),
    },
  };

  if (form.category) payload.category = form.category;
  if (form.supplierName.trim()) payload.supplier.name = form.supplierName.trim();
  if (Array.isArray(form.supplierImages)) payload.supplier.images = form.supplierImages;
  if (Array.isArray(form.images)) {
    payload.images = form.images
      .filter((image) => image?.url?.trim())
      .map((image) => ({
        url: image.url.trim(),
        name: image.name?.trim() || 'Imagen del producto',
      }))
      .slice(0, 5);
  }

  if (form.offerType && form.offerType !== 'none') {
    payload.offer = {
      type: form.offerType,
      value: Number(form.offerValue || 0),
      bundleQuantity: Number(form.offerBundleQuantity || 0),
      bundlePayQuantity: Number(form.offerBundlePayQuantity || 0),
      label: form.offerLabel.trim() || undefined,
      validFrom: form.offerValidFrom || undefined,
      validUntil: form.offerValidUntil ? form.offerValidUntil + 'T23:59:59.999' : undefined,
      active: true,
    };
  } else {
    payload.offer = {
      type: 'none',
      value: 0,
      bundleQuantity: 0,
      bundlePayQuantity: 0,
      label: '',
      active: false,
    };
  }

  return payload;
}

function normalizePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function getAdminProductId(product) {
  const value = product?._id ?? product?.id;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Number.isSafeInteger(value) && value >= 0) return String(value);
  return '';
}

function invalidAdminProductsResponse() {
  return new Error('El inventario administrativo devolvió una respuesta no válida.');
}

const INVALID_PRODUCT_RESPONSE_MESSAGE = 'No se ha podido confirmar el resultado de la operación. Comprueba el estado del producto antes de volver a intentarlo.';

function invalidAdminProductMutationResponse() {
  const error = new Error(INVALID_PRODUCT_RESPONSE_MESSAGE);
  error.name = 'InvalidProductResponseError';
  error.code = 'INVALID_PRODUCT_RESPONSE';
  error.operationResultUnknown = true;
  return error;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCanonicalProductImage(image) {
  return Boolean(
    image
    && typeof image === 'object'
    && !Array.isArray(image)
    && isNonEmptyString(image.url)
    && (image.name === undefined || typeof image.name === 'string')
  );
}

function isCanonicalProductImages(images) {
  return Array.isArray(images) && images.every(isCanonicalProductImage);
}

function buildAdminProductsQuery({
  page = 1,
  limit = 50,
  search = '',
  categoryId = '',
  inStock,
  minPrice,
  maxPrice,
  sort = '',
  order = '',
} = {}) {
  const query = new URLSearchParams({
    page: String(normalizePositiveInteger(page, 1)),
    limit: String(normalizePositiveInteger(limit, 50, 100)),
  });

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) query.set('search', normalizedSearch);
  if (categoryId) query.set('categoryId', String(categoryId));
  if (inStock === true) query.set('inStock', 'true');
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    query.set('minPrice', String(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    query.set('maxPrice', String(maxPrice));
  }
  if (sort) query.set('sort', String(sort));
  if (order) query.set('order', String(order));

  return query;
}

function normalizeAdminProductsResponse(result, requestedPage, requestedLimit) {
  const pagination = result?.pagination;
  const total = pagination?.total;
  const page = pagination?.page;
  const limit = pagination?.limit;
  const totalPages = pagination?.totalPages;
  const expectedTotalPages = Number.isSafeInteger(total) && Number.isSafeInteger(limit) && limit > 0
    ? Math.ceil(total / limit)
    : -1;
  const hasCanonicalPagination = Number.isSafeInteger(total)
    && total >= 0
    && Number.isSafeInteger(page)
    && page >= 1
    && Number.isSafeInteger(limit)
    && limit >= 1
    && limit <= 100
    && Number.isSafeInteger(totalPages)
    && totalPages >= 0
    && page === requestedPage
    && limit === requestedLimit
    && totalPages === expectedTotalPages
    && (total === 0 ? page === 1 && totalPages === 0 : page <= totalPages);

  if (!Array.isArray(result?.data) || !hasCanonicalPagination) {
    throw invalidAdminProductsResponse();
  }

  const ids = result.data.map(getAdminProductId);
  const maximumPageLength = total === 0
    ? 0
    : Math.min(limit, Math.max(0, total - ((page - 1) * limit)));
  if (
    result.data.length > limit
    || result.data.length !== maximumPageLength
    || ids.some((id) => !id)
    || new Set(ids).size !== ids.length
  ) throw invalidAdminProductsResponse();

  return {
    data: result.data,
    pagination: { total, page, limit, totalPages },
  };
}

function normalizeAdminProductMutationResponse(
  result,
  { expectedProductId = '', requireImages = false } = {},
) {
  const rawProductId = result?._id ?? result?.id;
  const productId = typeof rawProductId === 'string' ? rawProductId : '';
  const hasConflictingIds = result?._id !== undefined
    && result?.id !== undefined
    && (
      typeof result._id !== 'string'
      || typeof result.id !== 'string'
      || result._id !== result.id
    );
  const supplier = result?.supplier;
  const hasCanonicalImages = result?.images === undefined
    || isCanonicalProductImages(result.images);
  const hasCanonicalSupplierImages = supplier?.images === undefined
    || isCanonicalProductImages(supplier.images);
  const hasCanonicalProduct = result
    && typeof result === 'object'
    && !Array.isArray(result)
    && isNonEmptyString(productId)
    && productId === productId.trim()
    && !hasConflictingIds
    && (!expectedProductId || (
      typeof expectedProductId === 'string'
      && productId === expectedProductId
    ))
    && isNonEmptyString(result.name)
    && isNonEmptyString(result.sku)
    && typeof result.price === 'number'
    && Number.isFinite(result.price)
    && result.price >= 0
    && Number.isSafeInteger(result.stock)
    && result.stock >= 0
    && supplier
    && typeof supplier === 'object'
    && !Array.isArray(supplier)
    && Number.isSafeInteger(supplier.id)
    && supplier.id >= 0
    && hasCanonicalImages
    && hasCanonicalSupplierImages
    && (!requireImages || Array.isArray(result.images));

  if (!hasCanonicalProduct) throw invalidAdminProductMutationResponse();
  return result;
}

function normalizeAdminProductDeleteResponse(result) {
  if (
    !result
    || typeof result !== 'object'
    || Array.isArray(result)
    || result.message !== 'Product deleted successfully'
    || Object.keys(result).length !== 1
  ) throw new Error('La eliminación del producto devolvió una respuesta no válida.');
  return result;
}

export const adminModel = {
  async listProducts(request, options = {}) {
    const { signal, ...filters } = options;
    const requestedPage = filters.page === undefined ? 1 : Number(filters.page);
    const requestedLimit = filters.limit === undefined ? 50 : Number(filters.limit);
    const minPrice = filters.minPrice === '' || filters.minPrice == null
      ? null
      : Number(filters.minPrice);
    const maxPrice = filters.maxPrice === '' || filters.maxPrice == null
      ? null
      : Number(filters.maxPrice);
    const hasInvalidFilters = !Number.isSafeInteger(requestedPage)
      || requestedPage < 1
      || !Number.isSafeInteger(requestedLimit)
      || requestedLimit < 1
      || requestedLimit > 100
      || (filters.inStock !== undefined && typeof filters.inStock !== 'boolean')
      || (minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0))
      || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0))
      || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)
      || (filters.sort && !['name', 'price', 'stock', 'createdAt'].includes(filters.sort))
      || (filters.order && !['asc', 'desc'].includes(filters.order));
    if (hasInvalidFilters) {
      throw new Error('Los parámetros del inventario administrativo no son válidos.');
    }
    const query = buildAdminProductsQuery(filters);
    const result = await request('/products/admin/all?' + query.toString(), { signal });
    return normalizeAdminProductsResponse(result, requestedPage, requestedLimit);
  },

  async listUsers(request) {
    const result = await request('/users?limit=100');
    return Array.isArray(result) ? result : result?.data || [];
  },

  updateUser(request, userId, form) {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
    };

    const address = {};
    if (form.country.trim()) address.country = form.country.trim();
    if (form.street.trim()) address.street = form.street.trim();
    if (form.codePostal.trim()) address.codePostal = form.codePostal.trim();
    if (form.city.trim()) address.city = form.city.trim();
    if (Object.keys(address).length) payload.address = address;

    if (form.password.trim()) {
      payload.password = form.password;
    }

    return request('/users/' + userId, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteUser(request, userId) {
    return request('/users/' + userId, { method: 'DELETE' });
  },

  createCategory(request, form) {
    const payload = {
      name: form.name.trim(),
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCategory(request, categoryId, form) {
    const payload = {};
    if (form.name.trim()) payload.name = form.name.trim();
    payload.description = form.description.trim();

    return request('/categories/' + categoryId, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(request, categoryId) {
    return request('/categories/' + categoryId, { method: 'DELETE' });
  },

  async createProduct(request, form) {
    const result = await request('/products', {
      method: 'POST',
      body: JSON.stringify(buildProductPayload(form)),
    });
    return normalizeAdminProductMutationResponse(result);
  },

  async updateProduct(request, productId, form) {
    const result = await request('/products/' + productId, {
      method: 'PATCH',
      body: JSON.stringify(buildProductPayload(form)),
    });
    return normalizeAdminProductMutationResponse(result, { expectedProductId: productId });
  },

  async deleteProduct(request, productId) {
    const result = await request('/products/' + productId, { method: 'DELETE' });
    return normalizeAdminProductDeleteResponse(result);
  },

  async uploadProductImages(request, productId, files) {
    const formData = new FormData();
    files.slice(0, 5).forEach((file) => formData.append('images', file));

    const result = await request('/products/' + productId + '/images', {
      method: 'POST',
      body: formData,
    });
    return normalizeAdminProductMutationResponse(result, {
      expectedProductId: productId,
      requireImages: true,
    });
  },

  uploadHomeImages(request, files) {
    const formData = new FormData();
    files.slice(0, 5).forEach((file) => formData.append('images', file));

    return request('/home-content/images', {
      method: 'POST',
      body: formData,
    });
  },

  async saveImageUrl(request, product, imageUrl, imageName) {
    const currentImages = Array.isArray(product.images) ? product.images : [];
    const nextImage = {
      url: imageUrl.trim(),
      name: imageName.trim() || 'Imagen del producto',
    };

    const productId = getAdminProductId(product);
    const result = await request('/products/' + productId, {
      method: 'PATCH',
      body: JSON.stringify({
        images: [...currentImages, nextImage].slice(-5),
      }),
    });
    return normalizeAdminProductMutationResponse(result, {
      expectedProductId: productId,
      requireImages: true,
    });
  },
};
