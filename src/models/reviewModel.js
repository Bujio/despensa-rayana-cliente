import { apiRequest } from './apiClient.js';

export const emptyReviewForm = {
  rating: 5,
  title: '',
  comment: '',
};

function getList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export const reviewModel = {
  listProduct(productId) {
    return apiRequest('/reviews/product/' + productId, {}, null).then(getList);
  },
  listMine(request) {
    return request('/reviews/me');
  },
  async listAll(request) {
    const result = await request('/reviews?limit=100');
    return getList(result);
  },
  create(request, productId, form) {
    return request('/reviews/product/' + productId, {
      method: 'POST',
      body: JSON.stringify({
        rating: Number(form.rating),
        title: form.title,
        comment: form.comment,
      }),
    });
  },
  update(request, reviewId, form) {
    return request('/reviews/' + reviewId, {
      method: 'PATCH',
      body: JSON.stringify({
        rating: Number(form.rating),
        title: form.title,
        comment: form.comment,
      }),
    });
  },
  delete(request, reviewId) {
    return request('/reviews/' + reviewId, { method: 'DELETE' });
  },
  getSummary(reviews = []) {
    if (!reviews.length) return { average: 0, count: 0 };
    const average = reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length;
    return { average, count: reviews.length };
  },
};
