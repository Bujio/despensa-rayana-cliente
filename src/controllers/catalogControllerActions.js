import { catalogModel } from '../models/catalogModel.js';
import { emptyFilters, productModel } from '../models/productModel.js';
import { reviewModel } from '../models/reviewModel.js';
import {
  getProductId,
  hasClientSideFilters,
} from './controllerHelpers.js';

export function createCatalogControllerActions({
  favoriteIds,
  filters,
  page,
  selectedProduct,
  setCategories,
  setFeaturedProducts,
  setLoadingProductDetail,
  setLoadingProducts,
  setNotice,
  setPagination,
  setProductReviews,
  setProducts,
  setSelectedProduct,
  setView,
}) {
  async function loadCategories() {
    try {
      setCategories(await catalogModel.listCategories());
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const needsLocalFiltering = hasClientSideFilters(filters);
      const result = await catalogModel.listProducts({
        page: needsLocalFiltering ? 1 : page,
        filters,
        limit: needsLocalFiltering ? 100 : 9,
      });
      const filteredProducts = result.products.filter((product) => {
        const categoryId = typeof product.category === 'object' ? product.category?._id || product.category?.id : product.category;
        if (filters.categoryGroupIds?.length && !filters.categoryGroupIds.includes(String(categoryId))) return false;
        if (filters.onlyOffers && !productModel.isOfferActive(product)) return false;
        if (filters.origin && !productModel.matchesOrigin(product, filters.origin)) return false;
        if (filters.favoritesOnly && !favoriteIds.includes(getProductId(product))) return false;
        return true;
      });

      setProducts(filteredProducts);
      setPagination(needsLocalFiltering ? { page: 1, totalPages: 1 } : result.pagination);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadFeaturedProducts() {
    try {
      const result = await catalogModel.listProducts({
        page: 1,
        filters: { ...emptyFilters, inStock: false },
        limit: 100,
      });
      setFeaturedProducts(result.products);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadProductReviews(productId) {
    try {
      setProductReviews(await reviewModel.listProduct(productId));
    } catch (error) {
      setNotice(error.message);
      setProductReviews([]);
    }
  }

  async function openProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId) return;

    setSelectedProduct(product);
    setView('product', { productId });
    setLoadingProductDetail(true);
    await loadProductReviews(productId);
    try {
      const fullProduct = await catalogModel.getProduct(productId);
      setSelectedProduct(fullProduct);
      await loadProductReviews(productId);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoadingProductDetail(false);
    }
  }

  async function loadProductFromRoute(productId) {
    if (!productId) return;
    const selectedId = selectedProduct?._id || selectedProduct?.id;
    if (String(selectedId || '') === String(productId) && selectedProduct?.name) return;

    setLoadingProductDetail(true);
    try {
      const fullProduct = await catalogModel.getProduct(productId);
      setSelectedProduct(fullProduct);
      await loadProductReviews(productId);
    } catch (error) {
      setNotice(error.message);
      setSelectedProduct(null);
    } finally {
      setLoadingProductDetail(false);
    }
  }

  return {
    loadCategories,
    loadFeaturedProducts,
    loadProductFromRoute,
    loadProductReviews,
    loadProducts,
    openProduct,
  };
}
