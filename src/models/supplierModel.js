function buildSupplierProductPayload(form) {
  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    price: Number(form.price),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    stock: Number(form.stock),
    status: 'pending_review',
  };

  if (form.category) payload.category = form.category;
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

export const supplierModel = {
  async getProfile(request) {
    return request('/suppliers/me');
  },

  async listProducts(request) {
    const result = await request('/products/supplier/my');
    return Array.isArray(result) ? result : result?.data || [];
  },

  createProduct(request, form) {
    return request('/products/supplier', {
      method: 'POST',
      body: JSON.stringify(buildSupplierProductPayload(form)),
    });
  },

  updateProduct(request, productId, form) {
    return request('/products/supplier/' + productId, {
      method: 'PATCH',
      body: JSON.stringify(buildSupplierProductPayload(form)),
    });
  },

  deleteProduct(request, productId) {
    return request('/products/supplier/' + productId, { method: 'DELETE' });
  },
};
