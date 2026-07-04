import { API_URL, apiRequest } from './apiClient.js';

function buildSupplierProductPayload(form) {
  const payload = {
    name: form.name.trim(),
    price: Number(form.price),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    stock: Number(form.stock),
    status: form.status === 'draft' ? 'draft' : 'pending_review',
  };

  if (form.sku.trim()) payload.sku = form.sku.trim();
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
  register(form) {
    return fetch(API_URL + '/suppliers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'No se pudo registrar el proveedor.');
      return data;
    });
  },

  async getProfile(request) {
    return request('/suppliers/me');
  },

  async listProducts(request) {
    const result = await request('/products/supplier/my');
    return Array.isArray(result) ? result : result?.data || [];
  },

  updateProfile(request, form) {
    return request('/suppliers/me', {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
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

  uploadProductImages(request, productId, files) {
    const formData = new FormData();
    files.slice(0, 5).forEach((file) => formData.append('images', file));

    return request('/products/supplier/' + productId + '/images', {
      method: 'POST',
      body: formData,
    });
  },

  uploadProfileLogo(session, file) {
    const formData = new FormData();
    formData.append('images', file);
    return apiRequest('/suppliers/me/logo', { method: 'POST', body: formData }, session);
  },

  uploadProfileMainImage(session, file) {
    const formData = new FormData();
    formData.append('images', file);
    return apiRequest('/suppliers/me/main-image', { method: 'POST', body: formData }, session);
  },

  uploadProfileGallery(session, files) {
    const formData = new FormData();
    files.slice(0, 5).forEach((file) => formData.append('images', file));
    return apiRequest('/suppliers/me/images', { method: 'POST', body: formData }, session);
  },

  async getSalesReport(request) {
    return request('/supplier/reports/sales');
  },

  async getProductsReport(request) {
    return request('/supplier/reports/products');
  },

  async listOrders(request) {
    const result = await request('/supplier/orders');
    return Array.isArray(result) ? result : result?.data || [];
  },
};
