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
    return fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:3000/api'}/reviews/product/${productId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || 'No se pudieron cargar las opiniones');
        return getList(payload);
      });
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
