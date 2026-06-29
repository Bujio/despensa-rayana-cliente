export const cartModel = {
  get(request) {
    return request('/cart');
  },
  addItem(request, product, quantity = 1) {
    return request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ sku: product.sku, quantity }),
    });
  },
  updateItem(request, item, quantity) {
    return request('/cart/items/' + encodeURIComponent(item.sku), {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },
  removeItem(request, item) {
    return request('/cart/items/' + encodeURIComponent(item.sku), { method: 'DELETE' });
  },
  clear(request) {
    return request('/cart', { method: 'DELETE' });
  },
};
