function getList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

function cartItemsToOrderProducts(items) {
  return items.map((item) => ({
    sku: item.sku,
    count: item.quantity || item.count,
  }));
}

export const orderModel = {
  async listAll(request) {
    const result = await request('/orders?limit=100');
    return getList(result);
  },
  async listByEmail(request, email) {
    if (!email) return [];
    const result = await request('/orders/client/' + encodeURIComponent(email));
    return getList(result);
  },
  createFromCart(request, email, items, shippingAddress) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        email,
        shippingAddress,
        paymentMethod: 'external_pending',
        products: cartItemsToOrderProducts(items),
      }),
    });
  },
  delete(request, orderId) {
    return request('/orders/' + orderId, { method: 'DELETE' });
  },
  cancel(request, orderId, reason = '') {
    return request('/orders/' + orderId + '/cancel', {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
  getTotal(order) {
    return order.total || order.products?.reduce((sum, item) => sum + item.price * item.count, 0) || 0;
  },
};
