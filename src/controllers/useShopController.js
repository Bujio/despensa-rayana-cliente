import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../models/apiClient.js';
import { categoryVisualModel } from '../models/categoryVisualModel.js';
import { emptyFilters } from '../models/productModel.js';
import { favoritesModel } from '../models/favoritesModel.js';
import { homeContentModel } from '../models/homeContentModel.js';
import { orderModel } from '../models/orderModel.js';
import { sessionModel } from '../models/sessionModel.js';
import { emptyReviewForm } from '../models/reviewModel.js';
import { createAdminControllerActions } from './adminControllerActions.js';
import { createAuthAccountControllerActions } from './authAccountControllerActions.js';
import { createCartCheckoutControllerActions } from './cartCheckoutControllerActions.js';
import { createCatalogControllerActions } from './catalogControllerActions.js';
import { createHomeContentControllerActions } from './homeContentControllerActions.js';
import { createReviewControllerActions } from './reviewControllerActions.js';
import { createSupplierControllerActions } from './supplierControllerActions.js';
import {
  initialAccountProfileForm,
  initialAdminSearch,
  initialAdminUserForm,
  initialAuthForm,
  initialCategoryForm,
  initialHomeComponentForm,
  initialImageForm,
  initialPaymentForm,
  initialProductForm,
  initialSupplierForm,
} from './controllerInitialState.js';
import {
  getAccountProfileDefaults,
  getProductId,
  getShippingDefaults,
  isInvalidSessionMessage,
} from './controllerHelpers.js';
import {
  adminRouteByTab,
  adminTabByRoute,
  buildRoute,
} from './controllerRoutes.js';

export function useShopController({ navigate, routeCategorySlug = '', routePath = '/', routeProductId = '', routeView = 'home' } = {}) {
  const [session, setSession] = useState(() => sessionModel.get());
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [accountReviewForm, setAccountReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [accountProfileForm, setAccountProfileForm] = useState(() => ({ ...initialAccountProfileForm }));
  const [selectedAccountReviewId, setSelectedAccountReviewId] = useState('');
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...emptyFilters }));
  const [favoriteIds, setFavoriteIds] = useState(() => favoritesModel.getAll());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notice, setNoticeState] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(() => ({ ...initialAuthForm }));
  const [authFeedback, setAuthFeedback] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [adminSearch, setAdminSearchState] = useState(() => ({ ...initialAdminSearch }));
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminSuppliers, setAdminSuppliers] = useState([]);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [supplierReports, setSupplierReports] = useState({ sales: null, products: null });
  const [selectedSupplierProductId, setSelectedSupplierProductId] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserForm, setAdminUserForm] = useState(() => ({ ...initialAdminUserForm }));
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState('');
  const [selectedAdminProductId, setSelectedAdminProductId] = useState('');
  const [selectedAdminCategoryId, setSelectedAdminCategoryId] = useState('');
  const [selectedAdminSupplierId, setSelectedAdminSupplierId] = useState('');
  const [selectedAdminSupplierKey, setSelectedAdminSupplierKey] = useState('');
  const [supplierForm, setSupplierForm] = useState(() => ({ ...initialSupplierForm }));
  const [categoryForm, setCategoryForm] = useState(() => ({ ...initialCategoryForm }));
  const [productForm, setProductForm] = useState(() => ({ ...initialProductForm }));
  const [imageForm, setImageForm] = useState(() => ({ ...initialImageForm }));
  const [homeContent, setHomeContent] = useState(() => homeContentModel.load());
  const [homeComponentForm, setHomeComponentForm] = useState(() => ({ ...initialHomeComponentForm }));
  const [checkoutStep, setCheckoutStep] = useState('items');
  const [shippingForm, setShippingForm] = useState(() => getShippingDefaults(session));
  const [paymentForm, setPaymentForm] = useState(() => ({ ...initialPaymentForm }));
  const [checkoutErrors, setCheckoutErrors] = useState({});

  const cartItems = cart?.items || [];
  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || item.count || 0), 0),
    [cartItems],
  );
  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.quantity || item.count || 0), 0),
    [cartItems],
  );
  const reservedBySku = useMemo(
    () => cartItems.reduce((reserved, item) => ({
      ...reserved,
      [item.sku]: Number(item.quantity || item.count || 0),
    }), {}),
    [cartItems],
  );
  const selectedAdminUser = useMemo(
    () => adminUsers.find((user) => (user._id || user.id) === selectedAdminUserId) || null,
    [adminUsers, selectedAdminUserId],
  );
  const selectedAdminUserOrders = useMemo(() => {
    if (!selectedAdminUser) return [];
    const userId = selectedAdminUser._id || selectedAdminUser.id;
    const userEmail = selectedAdminUser.email?.toLowerCase();
    return orders.filter((order) => {
      const orderUserId = typeof order.userId === 'object' ? order.userId?._id || order.userId?.id : order.userId;
      return (orderUserId && String(orderUserId) === String(userId))
        || (order.email || '').toLowerCase() === userEmail;
    });
  }, [orders, selectedAdminUser]);
  const selectedAdminOrder = useMemo(
    () => orders.find((order) => (order._id || order.id) === selectedAdminOrderId) || null,
    [orders, selectedAdminOrderId],
  );

  const applySession = (nextSession) => {
    setSession(nextSession);
    if (nextSession) sessionModel.save(nextSession);
    else sessionModel.clear();
  };

  const setNotice = (message) => {
    if (isInvalidSessionMessage(message)) {
      setSession(null);
      sessionModel.clear();
      setNoticeState('');
      return;
    }
    setNoticeState(message);
  };

  const request = (path, options) => apiRequest(path, options, session, applySession);

  const setView = (nextView, options = {}) => {
    const nextPath = buildRoute(nextView, {
      categorySlug: options.categorySlug || '',
      productId: options.productId || '',
    });

    if (navigate && routePath !== nextPath) {
      navigate(nextPath, { replace: Boolean(options.replace) });
    }
  };

  function openAdminTab(nextTab) {
    setAdminTab(nextTab);
    const nextPath = adminRouteByTab[nextTab] || '/admin';
    if (navigate && routePath !== nextPath) {
      navigate(nextPath, { replace: false });
    }
  }

  const {
    loadCategories,
    loadFeaturedProducts,
    loadProductFromRoute,
    loadProductReviews,
    loadProducts,
    openProduct,
  } = createCatalogControllerActions({
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
  });

  const {
    addToCart,
    clearCart,
    createOrder,
    goToCartItems,
    goToPayment,
    goToShipping,
    loadCart,
    removeCartItem,
    updateCartItem,
    updatePaymentForm,
    updateShippingForm,
  } = createCartCheckoutControllerActions({
    cartItems,
    loadOrders,
    loadProducts,
    paymentForm,
    request,
    reservedBySku,
    session,
    setBusy,
    setCart,
    setCheckoutErrors,
    setCheckoutStep,
    setNotice,
    setPaymentForm,
    setShippingForm,
    setView,
    shippingForm,
  });

  const {
    changeAuthMode,
    chooseAccountType,
    deleteOwnAccount,
    handleAuth,
    handleLogout,
    saveAccountProfile,
    updateAccountProfileForm,
    updateAuthForm,
  } = createAuthAccountControllerActions({
    accountProfileForm,
    applySession,
    authForm,
    authMode,
    request,
    session,
    setAccountProfileForm,
    setAuthFeedback,
    setAuthForm,
    setAuthMode,
    setBusy,
    setCart,
    setNotice,
    setOrders,
    setView,
  });

  const {
    deleteReview,
    loadAdminReviews,
    loadMyReviews,
    saveAccountReview,
    selectAccountReview,
    submitProductReview,
    updateAccountReviewForm,
    updateReviewForm,
  } = createReviewControllerActions({
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
  });

  const {
    deleteSupplierProduct,
    duplicateSupplierProduct,
    loadSupplierPanel,
    registerSupplierProfile,
    removeSupplierOffer,
    resetSupplierProductForm,
    saveSupplierOffer,
    saveSupplierProduct,
    saveSupplierProfile,
    selectSupplierProduct,
    uploadSupplierProductImages,
  } = createSupplierControllerActions({
    imageForm,
    loadFeaturedProducts,
    loadProducts,
    productForm,
    request,
    selectedSupplierProductId,
    session,
    setBusy,
    setImageForm,
    setNotice,
    setProductForm,
    setSelectedSupplierProductId,
    setSupplierOrders,
    setSupplierProducts,
    setSupplierProfile,
    setSupplierReports,
    supplierProfile,
  });

  const {
    createHomeComponent,
    deleteHomeSection,
    loadHomeContent,
    moveHomeSection,
    resetHomeContent,
    saveHomeContentSettings,
    toggleFeaturedProduct,
    toggleHomeComponentProduct,
    toggleHomeSection,
    toggleHomeSectionProduct,
    updateHomeComponentForm,
    updateHomeHero,
    updateHomeSection,
    updateHomeSectionItem,
    uploadHomeImage,
  } = createHomeContentControllerActions({
    homeComponentForm,
    homeContent,
    request,
    session,
    setBusy,
    setHomeComponentForm,
    setHomeContent,
    setNotice,
  });

  const {
    approveAdminProduct,
    createCategory,
    createProduct,
    deleteAdminSupplier,
    deleteAdminUser,
    deleteCategory,
    deleteOrder,
    deleteProduct,
    loadAdminProducts,
    loadAdminSuppliers,
    loadAdminUsers,
    openAdminOrder,
    openAdminUserOrders,
    rejectAdminProduct,
    resetCategoryForm,
    resetProductForm,
    resetSupplierForm,
    saveAdminSupplier,
    saveAdminUser,
    saveImageUrl,
    selectAdminCategory,
    selectAdminProduct,
    selectAdminSupplier,
    selectAdminUser,
    setAdminSearch,
    setAdminSupplierAction,
    updateAdminUserForm,
    updateSupplierForm,
    uploadProductImages,
  } = createAdminControllerActions({
    adminProducts,
    adminSearch,
    adminUserForm,
    categoryForm,
    imageForm,
    loadCategories,
    loadFeaturedProducts,
    loadOrders,
    loadProducts,
    productForm,
    request,
    selectedAdminCategoryId,
    selectedAdminProductId,
    selectedAdminSupplierId,
    selectedAdminUserId,
    session,
    setAdminProducts,
    setAdminSearchState,
    setAdminSuppliers,
    setAdminUserForm,
    setAdminUsers,
    setBusy,
    setCategoryForm,
    setImageForm,
    setNotice,
    setProductForm,
    setSelectedAdminCategoryId,
    setSelectedAdminOrderId,
    setSelectedAdminProductId,
    setSelectedAdminSupplierId,
    setSelectedAdminSupplierKey,
    setSelectedAdminUserId,
    setSupplierForm,
    supplierForm,
  });

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
    loadHomeContent();
  }, []);

  useEffect(() => {
    if (routeView !== 'admin') return;
    setAdminTab(adminTabByRoute[routePath] || (routePath === '/gestion' ? 'dashboard' : 'dashboard'));
  }, [routeView, routePath]);

  useEffect(() => {
    if (routeView !== 'product') {
      setSelectedProduct(null);
      setProductReviews([]);
    }
  }, [routeView]);

  useEffect(() => {
    loadProducts();
  }, [page, filters, favoriteIds]);

  useEffect(() => {
    if (routeView === 'product' && routeProductId) {
      loadProductFromRoute(routeProductId);
    }
  }, [routeView, routeProductId]);

  useEffect(() => {
    if (session) {
      setAccountProfileForm(getAccountProfileDefaults(session));
      setShippingForm(getShippingDefaults(session));
      loadCart();
      loadOrders();
      loadMyReviews();
      if (session.user?.role === 'admin') {
        loadAdminProducts();
        loadAdminSuppliers();
        loadAdminUsers();
        loadAdminReviews();
      }
      if (session.user?.role === 'supplier') {
        loadSupplierPanel();
      }
    } else {
      setCart(null);
      setOrders([]);
      setMyReviews([]);
      setAdminReviews([]);
      setReviewForm({ ...emptyReviewForm });
      setAccountReviewForm({ ...emptyReviewForm });
      setAccountProfileForm({ ...initialAccountProfileForm });
      setSelectedAccountReviewId('');
      setAdminProducts([]);
      setAdminSuppliers([]);
      setSupplierProfile(null);
      setSupplierProducts([]);
      setSupplierOrders([]);
      setSupplierReports({ sales: null, products: null });
      setSelectedSupplierProductId('');
      setAdminUsers([]);
      setAdminUserForm({ ...initialAdminUserForm });
      setSelectedAdminUserId('');
      setSelectedAdminOrderId('');
      setSelectedAdminProductId('');
      setSelectedAdminCategoryId('');
      setSelectedAdminSupplierId('');
      setSelectedAdminSupplierKey('');
      setSupplierForm({ ...initialSupplierForm });
      setAdminTab('dashboard');
      setAdminSearchState({ ...initialAdminSearch });
      setCheckoutStep('items');
      setShippingForm(getShippingDefaults(null));
      setPaymentForm({ ...initialPaymentForm });
      setCheckoutErrors({});
    }
  }, [session?.accessToken]);

  async function loadOrders() {
    try {
      if (session?.user?.role === 'admin') {
        setOrders(await orderModel.listAll(request));
      } else {
        setOrders(await orderModel.listByEmail(request, session?.user?.email));
      }
    } catch {
      setOrders([]);
    }
  }

  async function cancelOrder(order, reason = 'Cancelado por el cliente') {
    const orderId = order?._id || order?.id;
    if (!orderId || !session) return;
    if ((order.status || 'pending') !== 'pending') {
      setNotice('Solo puedes anular pedidos en estado pendiente.');
      return;
    }
    if (!window.confirm('¿Quieres anular este pedido pendiente?')) return;

    setBusy(true);
    try {
      await orderModel.cancel(request, orderId, reason);
      await loadOrders();
      await loadProducts();
      await loadFeaturedProducts();
      if (session.user?.role === 'admin') {
        await loadAdminProducts();
        await loadAdminSuppliers();
      }
      if (session.user?.role === 'supplier') {
        await loadSupplierPanel();
      }
      setNotice('Pedido anulado correctamente. El stock vuelve a estar disponible y queda registrado el abono.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'categoryId' ? { categoryGroupIds: [] } : {}),
    }));
  };

  const showFavorites = () => {
    setPage(1);
    setFilters((current) => ({ ...current, favoritesOnly: true }));
    setView('catalog');
  };

  const applyCommerceCategoryFilters = (label) => {
    const visual = categoryVisualModel.findVisual(label);
    const matchedCategories = visual
      ? categories.filter((item) => categoryVisualModel.matches(item, visual))
      : categories.filter((item) => categoryVisualModel.normalize(item.name) === categoryVisualModel.normalize(label));
    const categoryIds = matchedCategories
      .map((item) => item._id || item.id)
      .filter(Boolean)
      .map(String);

    setPage(1);
    if (categoryIds.length > 1) {
      setFilters({ ...emptyFilters, categoryGroupIds: categoryIds, inStock: true });
    } else if (categoryIds.length === 1) {
      setFilters({ ...emptyFilters, categoryId: categoryIds[0], categoryGroupIds: [], inStock: true });
    } else {
      setFilters({ ...emptyFilters, search: label, inStock: true });
    }
  };

  const openCommerceCategory = (label) => {
    if (label === 'La Rayana') {
      setView('story');
      return;
    }

    if (label === 'Ofertas') {
      setPage(1);
      setFilters({ ...emptyFilters, onlyOffers: true, inStock: true });
      setView('catalog', { categorySlug: 'ofertas' });
      return;
    }

    applyCommerceCategoryFilters(label);
    setView('catalog', { categorySlug: categoryVisualModel.slugify(label) });
  };

  useEffect(() => {
    if (routeView !== 'catalog') return;

    if (!routeCategorySlug) {
      setPage(1);
      setFilters((current) => (
        current.categoryId || current.categoryGroupIds?.length || current.onlyOffers
          ? { ...emptyFilters, inStock: true }
          : current
      ));
      return;
    }

    const visual = categoryVisualModel.findBySlug(routeCategorySlug);
    if (visual?.label === 'Ofertas' || routeCategorySlug === 'ofertas') {
      setPage(1);
      setFilters({ ...emptyFilters, onlyOffers: true, inStock: true });
      return;
    }

    applyCommerceCategoryFilters(visual?.label || routeCategorySlug.replace(/-/g, ' '));
  }, [routeView, routeCategorySlug, categories.length]);

  const toggleFavorite = (product) => {
    const productId = getProductId(product);
    if (!productId) return;
    const nextFavorites = favoritesModel.toggle(productId);
    setFavoriteIds(nextFavorites);
    setNotice(nextFavorites.includes(productId) ? 'Producto guardado en favoritos.' : 'Producto quitado de favoritos.');
  };

  const setSort = (value) => {
    const [sort, order] = value.split(':');
    setPage(1);
    setFilters((current) => ({ ...current, sort, order }));
  };

  const resetFilters = () => {
    setFilters({ ...emptyFilters });
    setPage(1);
  };

  const updateCategoryForm = (field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  };

  const updateProductForm = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const updateImageForm = (field, value) => {
    setImageForm((current) => ({ ...current, [field]: value }));
  };

  const addProductImageUrl = () => {
    const imageUrl = imageForm.imageUrl.trim();
    if (!imageUrl) {
      setNotice('Pega una URL de imagen valida.');
      return;
    }

    const nextImage = {
      url: imageUrl,
      name: imageForm.imageName.trim() || 'Imagen del producto',
    };

    setProductForm((current) => ({
      ...current,
      images: [...(Array.isArray(current.images) ? current.images : []), nextImage].slice(-5),
    }));
    setImageForm((current) => ({ ...current, imageUrl: '', imageName: '' }));
    setNotice('Imagen anadida al producto. Guarda el producto para persistir el cambio.');
  };

  const removeProductFormImage = (imageIndex) => {
    setProductForm((current) => ({
      ...current,
      images: (Array.isArray(current.images) ? current.images : []).filter((_, index) => index !== imageIndex),
    }));
    setNotice('Imagen quitada del producto. Guarda el producto para persistir el cambio.');
  };

  return {
    state: {
      adminTab,
      adminProducts,
      adminSuppliers,
      adminSearch,
      adminReviews,
      accountReviewForm,
      accountProfileForm,
      adminUserForm,
      adminUsers,
      authFeedback,
      authForm,
      authMode,
      busy,
      cartCount,
      cartItems,
      cartTotal,
      categories,
      categoryForm,
      checkoutErrors,
      checkoutStep,
      filters,
      favoriteIds,
      featuredProducts,
      homeComponentForm,
      homeContent,
      imageForm,
      loadingProductDetail,
      loadingProducts,
      myReviews,
      notice,
      orders,
      page,
      pagination,
      paymentForm,
      productForm,
      productReviews,
      products,
      reviewForm,
      reservedBySku,
      selectedProduct,
      selectedAdminOrder,
      selectedAdminOrderId,
      selectedAdminCategoryId,
      selectedAdminProductId,
      selectedSupplierProductId,
      selectedAdminSupplierId,
      selectedAdminSupplierKey,
      supplierForm,
      supplierOrders,
      supplierProducts,
      supplierProfile,
      supplierReports,
      selectedAdminUser,
      selectedAdminUserId,
      selectedAdminUserOrders,
      selectedAccountReviewId,
      session,
      shippingForm,
      view: routeView,
    },
    actions: {
      addToCart,
      chooseAccountType,
      clearCart,
      createCategory,
      createProduct,
      createOrder,
      approveAdminProduct,
      rejectAdminProduct,
      cancelOrder,
      deleteAdminUser,
      deleteCategory,
      deleteProduct,
      deleteReview,
      goToCartItems,
      goToPayment,
      goToShipping,
      handleAuth,
      handleLogout,
      openProduct,
      openAdminOrder,
      openAdminTab,
      openAdminUserOrders,
      removeCartItem,
      resetFilters,
      resetCategoryForm,
      resetProductForm,
      resetSupplierProductForm,
      resetSupplierForm,
      saveAdminSupplier,
      setAdminSupplierAction,
      saveAdminUser,
      saveAccountReview,
      saveAccountProfile,
      saveSupplierProfile,
      selectAdminCategory,
      selectAdminProduct,
      selectAdminSupplier,
      selectSupplierProduct,
      selectAccountReview,
      setAuthMode: changeAuthMode,
      setAdminTab,
      setAdminSearch,
      setFilter,
      openCommerceCategory,
      showFavorites,
      setNotice,
      setPage,
      setSort,
      setView,
      selectAdminUser,
      updateAuthForm,
      updateAdminUserForm,
      updateAccountReviewForm,
      updateAccountProfileForm,
      updateCartItem,
      updateCategoryForm,
      updateHomeComponentForm,
      toggleHomeComponentProduct,
      updateHomeHero,
      updateHomeSection,
      updateHomeSectionItem,
      toggleHomeSectionProduct,
      uploadHomeImage,
      updateImageForm,
      updatePaymentForm,
      updateProductForm,
      updateSupplierForm,
      updateReviewForm,
      updateShippingForm,
      addProductImageUrl,
      removeProductFormImage,
      toggleFavorite,
      toggleFeaturedProduct,
      toggleHomeSection,
      moveHomeSection,
      deleteHomeSection,
      createHomeComponent,
      resetHomeContent,
      saveHomeContentSettings,
      saveImageUrl,
      saveSupplierProduct,
      registerSupplierProfile,
      loadSupplierPanel,
      submitProductReview,
      uploadProductImages,
      uploadSupplierProductImages,
      deleteOrder,
      deleteOwnAccount,
      deleteSupplierProduct,
      deleteAdminSupplier,
      duplicateSupplierProduct,
      saveSupplierOffer,
      removeSupplierOffer,
    },
  };
}
