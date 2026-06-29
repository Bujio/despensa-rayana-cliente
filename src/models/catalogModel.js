import { apiRequest } from './apiClient.js';

function getList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export const catalogModel = {
  async listCategories() {
    const result = await apiRequest('/categories?limit=100', {}, null);
    return getList(result);
  },
  async getProduct(productId) {
    return apiRequest('/products/' + productId, {}, null);
  },
  async listProducts({ page, filters, limit = 9 }) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const apiFilterKeys = new Set(['search', 'categoryId', 'inStock', 'minPrice', 'maxPrice', 'sort', 'order']);

    Object.entries(filters).forEach(([key, value]) => {
      if (apiFilterKeys.has(key) && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });

    const result = await apiRequest('/products?' + params.toString(), {}, null);
    return {
      products: result?.data || [],
      pagination: result?.pagination || null,
    };
  },
};
