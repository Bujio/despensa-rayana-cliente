export const supplierModel = {
  async getProfile(request) {
    return request('/suppliers/me');
  },

  async listProducts(request) {
    const result = await request('/products/supplier/my');
    return Array.isArray(result) ? result : result?.data || [];
  },
};
