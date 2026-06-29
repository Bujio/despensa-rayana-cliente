function buildProductPayload(form) {
  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    supplier: {
      id: Number(form.supplierId),
    },
  };

  if (form.description.trim()) payload.description = form.description.trim();
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

export const adminModel = {
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

  createProduct(request, form) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(buildProductPayload(form)),
    });
  },

  updateProduct(request, productId, form) {
    return request('/products/' + productId, {
      method: 'PATCH',
      body: JSON.stringify(buildProductPayload(form)),
    });
  },

  deleteProduct(request, productId) {
    return request('/products/' + productId, { method: 'DELETE' });
  },

  uploadProductImages(request, productId, files) {
    const formData = new FormData();
    files.slice(0, 5).forEach((file) => formData.append('images', file));

    return request('/products/' + productId + '/images', {
      method: 'POST',
      body: formData,
    });
  },

  saveImageUrl(request, product, imageUrl, imageName) {
    const currentImages = Array.isArray(product.images) ? product.images : [];
    const nextImage = {
      url: imageUrl.trim(),
      name: imageName.trim() || 'Imagen del producto',
    };

    return request('/products/' + (product._id || product.id), {
      method: 'PATCH',
      body: JSON.stringify({
        images: [...currentImages, nextImage].slice(-5),
      }),
    });
  },
};
