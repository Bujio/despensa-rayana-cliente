export const emptySupplierContactForm = {
  subject: '',
  message: '',
};

function getList(result) {
  return Array.isArray(result) ? result : result?.data || [];
}

export const supplierMessageModel = {
  createForProduct(request, productId, form) {
    return request('/supplier-messages/product/' + productId, {
      method: 'POST',
      body: JSON.stringify({
        subject: form.subject?.trim() || '',
        message: form.message.trim(),
      }),
    });
  },

  listMine(request) {
    return request('/supplier-messages/me').then(getList);
  },

  listSupplier(request) {
    return request('/supplier-messages/supplier').then(getList);
  },

  reply(request, threadId, message) {
    return request('/supplier-messages/' + threadId + '/reply', {
      method: 'POST',
      body: JSON.stringify({ message: message.trim() }),
    });
  },

  markRead(request, threadId) {
    return request('/supplier-messages/' + threadId + '/read', {
      method: 'PATCH',
    });
  },
};
