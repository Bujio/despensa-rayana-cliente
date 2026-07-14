function getList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

function createCheckoutError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function cartItemsToOrderProducts(items) {
  const products = items.map((item) => ({
    sku: typeof item?.sku === 'string' ? item.sku.trim() : '',
    count: Number(item?.quantity ?? item?.count),
  }));

  if (products.some(({ sku, count }) => !sku || !Number.isInteger(count) || count < 1)) {
    throw createCheckoutError(
      'INVALID_CHECKOUT_CART',
      'El carrito contiene un producto sin SKU o cantidad válida.',
    );
  }

  return products;
}

function assertPendingOrderCreated(order) {
  const orderId = order?._id || order?.id;
  const isCreatedPendingOrder = Boolean(
    order
    && typeof order === 'object'
    && !Array.isArray(order)
    && orderId
    && order.status === 'pending'
    && order.payment?.method === 'external_pending'
    && order.payment?.status === 'pending'
    && Array.isArray(order.products)
    && order.products.length,
  );

  if (!isCreatedPendingOrder) {
    throw createCheckoutError(
      'INVALID_ORDER_CONFIRMATION',
      'El servidor no devolvió una confirmación válida del pedido pendiente.',
    );
  }

  return order;
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
  async createFromCart(request, email, items, shippingAddress) {
    const order = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        email,
        shippingAddress,
        paymentMethod: 'external_pending',
        products: cartItemsToOrderProducts(items),
      }),
    });
    return assertPendingOrderCreated(order);
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
