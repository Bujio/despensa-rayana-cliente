import { apiRequest } from './apiClient.js';

export const emptyReviewForm = {
  rating: 5,
  title: '',
  comment: '',
};

function getList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

function buildReviewPayload(form) {
  return {
    rating: Number(form.rating),
    title: String(form.title || '').trim(),
    comment: String(form.comment || '').trim(),
  };
}

function assertCanonicalReview(review, expected = {}) {
  const reviewId = review?._id || review?.id;
  const productId = review?.product?._id || review?.product?.id || review?.product;
  const expectedReviewId = expected.reviewId;
  const expectedProductId = expected.productId;
  const rating = Number(review?.rating);

  if (
    !review
    || typeof review !== 'object'
    || Array.isArray(review)
    || !reviewId
    || !Number.isInteger(rating)
    || rating < 1
    || rating > 5
    || typeof review.comment !== 'string'
    || (expectedReviewId && String(reviewId) !== String(expectedReviewId))
    || (expectedProductId && String(productId) !== String(expectedProductId))
  ) {
    const error = new Error('El servidor no devolvió una confirmación válida de la opinión.');
    error.code = 'INVALID_REVIEW_CONFIRMATION';
    throw error;
  }

  return review;
}

export const reviewModel = {
  listProduct(productId, options = {}) {
    return apiRequest('/reviews/product/' + productId, options, null).then(getList);
  },
  listMine(request) {
    return request('/reviews/me');
  },
  async listAll(request) {
    const result = await request('/reviews?limit=100');
    return getList(result);
  },
  async create(request, productId, form) {
    const review = await request('/reviews/product/' + productId, {
      method: 'POST',
      body: JSON.stringify(buildReviewPayload(form)),
    });
    return assertCanonicalReview(review, { productId });
  },
  async update(request, reviewId, form) {
    const review = await request('/reviews/' + reviewId, {
      method: 'PATCH',
      body: JSON.stringify(buildReviewPayload(form)),
    });
    return assertCanonicalReview(review, { reviewId });
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
