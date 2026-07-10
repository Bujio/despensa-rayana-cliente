const CONSENT_KEY = 'despensa-cookie-consent';

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  try {
    const consent = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || 'null');
    return Boolean(consent?.analytics);
  } catch {
    return false;
  }
}

function buildProductPayload(product, quantity = 1) {
  return {
    item_id: product?.sku || product?._id || product?.id || '',
    item_name: product?.name || '',
    price: Number(product?.price || 0),
    quantity: Number(quantity || 1),
    item_category: typeof product?.category === 'object' ? product.category?.name || '' : product?.category || '',
    supplier: product?.supplier?.name || product?.supplierRef?.name || product?.supplierName || '',
  };
}

export function trackEvent(eventName, payload = {}) {
  if (!hasAnalyticsConsent()) return;
  const event = {
    event: eventName,
    ecommerce: payload,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
  window.dispatchEvent(new CustomEvent('despensa-analytics', { detail: event }));
}

export function trackProductView(product) {
  trackEvent('view_item', {
    items: [buildProductPayload(product)],
  });
}

export function trackAddToCart(product, quantity) {
  trackEvent('add_to_cart', {
    items: [buildProductPayload(product, quantity)],
  });
}

export function trackRemoveFromCart(item) {
  trackEvent('remove_from_cart', {
    items: [{
      item_id: item?.sku || '',
      item_name: item?.name || '',
      price: Number(item?.price || 0),
      quantity: Number(item?.quantity || item?.count || 1),
    }],
  });
}

export function trackBeginCheckout(items, value) {
  trackEvent('begin_checkout', {
    value: Number(value || 0),
    currency: 'EUR',
    items: items.map((item) => ({
      item_id: item?.sku || '',
      item_name: item?.name || '',
      price: Number(item?.price || 0),
      quantity: Number(item?.quantity || item?.count || 1),
    })),
  });
}

export function trackPurchase(order, items, value) {
  trackEvent('purchase', {
    transaction_id: order?._id || order?.id || '',
    value: Number(value || order?.total || 0),
    currency: 'EUR',
    payment_status: order?.payment?.status || 'pending',
    items: items.map((item) => ({
      item_id: item?.sku || '',
      item_name: item?.name || '',
      price: Number(item?.price || 0),
      quantity: Number(item?.quantity || item?.count || 1),
    })),
  });
}
