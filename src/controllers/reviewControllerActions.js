import { emptyReviewForm, reviewModel } from '../models/reviewModel.js';

export function createReviewControllerActions({
  accountReviewForm,
  loadProductReviews,
  request,
  reviewForm,
  selectedAccountReviewId,
  selectedProduct,
  session,
  setAccountReviewForm,
  setAdminReviews,
  setBusy,
  setMyReviews,
  setNotice,
  setReviewForm,
  setSelectedAccountReviewId,
  setView,
}) {
  async function loadMyReviews() {
    if (!session?.accessToken) return;
    try {
      setMyReviews(await reviewModel.listMine(request));
    } catch {
      setMyReviews([]);
    }
  }

  async function loadAdminReviews() {
    if (session?.user?.role !== 'admin') return;
    try {
      setAdminReviews(await reviewModel.listAll(request));
    } catch {
      setAdminReviews([]);
    }
  }

  const updateReviewForm = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: value }));
  };

  const updateAccountReviewForm = (field, value) => {
    setAccountReviewForm((current) => ({ ...current, [field]: value }));
  };

  async function submitProductReview(event) {
    event.preventDefault();
    const productId = selectedProduct?._id || selectedProduct?.id;
    if (!session) {
      setNotice('Entra en tu cuenta para dejar una opinión.');
      setView('account');
      return;
    }
    if (!productId) return;

    setBusy(true);
    try {
      await reviewModel.create(request, productId, reviewForm);
      setReviewForm({ ...emptyReviewForm });
      await loadProductReviews(productId);
      await loadMyReviews();
      await loadAdminReviews();
      setNotice('Opinión guardada correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function selectAccountReview(review) {
    setSelectedAccountReviewId(review?._id || review?.id || '');
    setAccountReviewForm({
      rating: Number(review?.rating || 5),
      title: review?.title || '',
      comment: review?.comment || '',
    });
  }

  async function saveAccountReview(event) {
    event.preventDefault();
    if (!selectedAccountReviewId) {
      setNotice('Selecciona una opinión para modificarla.');
      return;
    }

    setBusy(true);
    try {
      await reviewModel.update(request, selectedAccountReviewId, accountReviewForm);
      setSelectedAccountReviewId('');
      setAccountReviewForm({ ...emptyReviewForm });
      await loadMyReviews();
      await loadAdminReviews();
      if (selectedProduct?._id || selectedProduct?.id) {
        await loadProductReviews(selectedProduct._id || selectedProduct.id);
      }
      setNotice('Opinión actualizada correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview(review) {
    const reviewId = review?._id || review?.id;
    if (!reviewId) return;

    setBusy(true);
    try {
      await reviewModel.delete(request, reviewId);
      if (selectedAccountReviewId === reviewId) {
        setSelectedAccountReviewId('');
        setAccountReviewForm({ ...emptyReviewForm });
      }
      await loadMyReviews();
      await loadAdminReviews();
      if (selectedProduct?._id || selectedProduct?.id) {
        await loadProductReviews(selectedProduct._id || selectedProduct.id);
      }
      setNotice('Opinión eliminada correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    deleteReview,
    loadAdminReviews,
    loadMyReviews,
    saveAccountReview,
    selectAccountReview,
    submitProductReview,
    updateAccountReviewForm,
    updateReviewForm,
  };
}
