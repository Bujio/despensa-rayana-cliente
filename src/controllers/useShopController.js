import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../models/apiClient.js';
import { adminModel } from '../models/adminModel.js';
import { authModel } from '../models/authModel.js';
import { cartModel } from '../models/cartModel.js';
import { catalogModel } from '../models/catalogModel.js';
import { categoryVisualModel } from '../models/categoryVisualModel.js';
import { emptyFilters, productModel } from '../models/productModel.js';
import { favoritesModel } from '../models/favoritesModel.js';
import { homeContentModel } from '../models/homeContentModel.js';
import { orderModel } from '../models/orderModel.js';
import { sessionModel } from '../models/sessionModel.js';
import { emptyReviewForm, reviewModel } from '../models/reviewModel.js';
import {
  trackAddToCart,
  trackBeginCheckout,
  trackProductView,
  trackPurchase,
  trackRemoveFromCart,
} from '../utils/analytics.js';

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  resetToken: '',
  phone: '',
  street: '',
  codePostal: '',
  city: '',
  country: 'España',
};

const initialCategoryForm = {
  name: '',
  description: '',
};

const initialProductForm = {
  name: '',
  sku: '',
  price: '',
  shortDescription: '',
  description: '',
  stock: '0',
  category: '',
  supplierId: '1',
  supplierName: '',
  supplierImages: [],
  images: [],
  status: 'pending_review',
  offerType: 'none',
  offerValue: '',
  offerBundleQuantity: '3',
  offerBundlePayQuantity: '2',
  offerLabel: '',
  offerValidFrom: '',
  offerValidUntil: '',
};

const initialAdminSearch = {
  users: '',
  products: '',
  categories: '',
  orders: '',
  media: '',
  reviews: '',
};

const initialImageForm = {
  productId: '',
  files: [],
  imageUrl: '',
  imageName: '',
};

const initialMessageReplyForm = {
  message: '',
};

const initialHomeComponentForm = {
  type: 'promoBanner',
  title: '',
  subtitle: '',
  body: '',
  imageUrl: '',
  mobileImageUrl: '',
  altText: '',
  linkUrl: '',
  ctaLabel: '',
  status: 'published',
  startDate: '',
  endDate: '',
  priority: '0',
  trackingId: '',
  campaignName: '',
  productIds: [],
  itemOneTitle: '',
  itemOneBody: '',
  itemOneImageUrl: '',
  itemOneMobileImageUrl: '',
  itemOneAltText: '',
  itemOneLinkUrl: '',
  itemOneTrackingId: '',
  itemOneCampaignName: '',
  itemTwoTitle: '',
  itemTwoBody: '',
  itemTwoImageUrl: '',
  itemTwoMobileImageUrl: '',
  itemTwoAltText: '',
  itemTwoLinkUrl: '',
  itemTwoTrackingId: '',
  itemTwoCampaignName: '',
  itemThreeTitle: '',
  itemThreeBody: '',
  itemThreeImageUrl: '',
  itemThreeMobileImageUrl: '',
  itemThreeAltText: '',
  itemThreeLinkUrl: '',
  itemThreeTrackingId: '',
  itemThreeCampaignName: '',
};

const initialAdminUserForm = {
  name: '',
  email: '',
  phone: '',
  street: '',
  codePostal: '',
  city: '',
  country: '',
  role: 'user',
  password: '',
};

const initialAccountProfileForm = {
  name: '',
  email: '',
  phone: '',
  street: '',
  codePostal: '',
  city: '',
  country: '',
  password: '',
};

const initialPaymentForm = {
  method: 'external_pending',
  accepted: false,
};

const getShippingDefaults = (session) => ({
  street: session?.user?.address?.street || '',
  codePostal: session?.user?.address?.codePostal || '',
  city: session?.user?.address?.city || '',
  country: session?.user?.address?.country || 'España',
  phone: session?.user?.phone || '',
});

const getAccountProfileDefaults = (session) => ({
  name: session?.user?.name || '',
  email: session?.user?.email || '',
  phone: session?.user?.phone || '',
  street: session?.user?.address?.street || '',
  codePostal: session?.user?.address?.codePostal || '',
  city: session?.user?.address?.city || '',
  country: session?.user?.address?.country || 'España',
  password: '',
});

const validateShippingForm = (form) => {
  const errors = {};
  if (form.street.trim().length < 3) errors.street = 'Indica una calle válida.';
  if (!/^\d{5}$/.test(form.codePostal.trim())) errors.codePostal = 'El código postal debe tener 5 números.';
  if (form.city.trim().length < 2) errors.city = 'Indica una ciudad válida.';
  if (form.country.trim().length < 2) errors.country = 'Indica un país válido.';
  if (form.phone.replace(/\s/g, '').length < 6) errors.phone = 'Indica un teléfono válido.';
  return errors;
};

const validatePaymentForm = (form) => {
  const errors = {};
  if (!form.method) errors.method = 'Selecciona una forma de pago.';
  if (!form.accepted) {
    errors.accepted = 'Confirma que entiendes que el pago se completará mediante pasarela segura externa.';
  }
  return errors;
};

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getProductId = (product) => String(product?._id || product?.id || product?.sku || '');

const routeByView = {
  home: '/',
  catalog: '/catalogo',
  cart: '/cesta',
  story: '/la-rayana',
  orders: '/pedidos',
  account: '/cuenta',
  accountRegister: '/cuenta/registro',
  admin: '/gestion',
};

function buildRoute(view, { categorySlug = '', productId = '' } = {}) {
  if (view === 'product' && productId) return '/producto/' + encodeURIComponent(productId);
  if (view === 'catalog' && categorySlug) return '/catalogo/' + encodeURIComponent(categorySlug);
  return routeByView[view] || routeByView.home;
}

function assignHomeImage(content, target, imageUrl) {
  if (target === 'hero.imageUrl' || target === 'hero.mobileImageUrl') {
    const [, field] = target.split('.');
    return {
      ...content,
      hero: {
        ...content.hero,
        [field]: imageUrl,
      },
    };
  }

  if (target.startsWith('sectionItem.')) {
    const [, sectionId, itemIndex, field] = target.split('.');
    return {
      ...content,
      sections: content.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const items = [...(Array.isArray(section.items) ? section.items : [])];
        items[Number(itemIndex)] = {
          title: '',
          body: '',
          imageUrl: '',
          mobileImageUrl: '',
          altText: '',
          linkUrl: '',
          trackingId: '',
          campaignName: '',
          ...(items[Number(itemIndex)] || {}),
          [field]: imageUrl,
        };
        return { ...section, items };
      }),
    };
  }

  if (target.startsWith('section.')) {
    const [, sectionId, field] = target.split('.');
    return {
      ...content,
      sections: content.sections.map((section) => (
        section.id === sectionId ? { ...section, [field]: imageUrl } : section
      )),
    };
  }

  return content;
}

const hasClientSideFilters = (filters) => Boolean(
  filters.onlyOffers ||
  filters.origin ||
  filters.favoritesOnly ||
  filters.categoryGroupIds?.length,
);

export function useShopController({
  navigate,
  routeCategorySlug = '',
  routePath = '/',
  routeSearch = '',
  routeProductId = '',
  routeView = 'home',
} = {}) {
  const [session, setSession] = useState(() => sessionModel.get());
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [productContactForm, setProductContactForm] = useState(() => ({ ...emptySupplierContactForm }));
  const [productContactFeedback, setProductContactFeedback] = useState(null);
  const [accountReviewForm, setAccountReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [accountProfileForm, setAccountProfileForm] = useState(() => ({ ...initialAccountProfileForm }));
  const [selectedAccountReviewId, setSelectedAccountReviewId] = useState('');
  const [accountSupplierMessages, setAccountSupplierMessages] = useState([]);
  const [selectedAccountMessageId, setSelectedAccountMessageId] = useState('');
  const [accountMessageReplyForm, setAccountMessageReplyForm] = useState(() => ({ ...initialMessageReplyForm }));
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(null);
  const [cartFeedback, setCartFeedback] = useState(null);
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
  const [adminTab, setAdminTab] = useState('users');
  const [adminSearch, setAdminSearchState] = useState(() => ({ ...initialAdminSearch }));
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserForm, setAdminUserForm] = useState(() => ({ ...initialAdminUserForm }));
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState('');
  const [selectedAdminProductId, setSelectedAdminProductId] = useState('');
  const [selectedAdminCategoryId, setSelectedAdminCategoryId] = useState('');
  const [categoryForm, setCategoryForm] = useState(() => ({ ...initialCategoryForm }));
  const [productForm, setProductForm] = useState(() => ({ ...initialProductForm }));
  const [imageForm, setImageForm] = useState(() => ({ ...initialImageForm }));
  const [homeContent, setHomeContent] = useState(() => homeContentModel.load());
  const [homeContentRevisions, setHomeContentRevisions] = useState([]);
  const [homeComponentForm, setHomeComponentForm] = useState(() => ({ ...initialHomeComponentForm }));
  const [checkoutStep, setCheckoutStep] = useState('items');
  const [shippingForm, setShippingForm] = useState(() => getShippingDefaults(session));
  const [paymentForm, setPaymentForm] = useState(() => ({ ...initialPaymentForm }));
  const [checkoutErrors, setCheckoutErrors] = useState({});

  useEffect(() => {
    if (routeView !== 'account' || !routeSearch) return;
    const params = new URLSearchParams(routeSearch);
    const resetToken = params.get('resetToken');
    if (!resetToken) return;
    setAuthMode('reset');
    setAuthFeedback(null);
    setAuthForm((current) => ({ ...current, resetToken }));
  }, [routeSearch, routeView]);

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

  const saveHomeContent = (updater) => {
    setHomeContent((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return homeContentModel.save(next);
    });
  };

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

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
    loadHomeContent();
  }, []);

  useEffect(() => {
    if (routeView !== 'product') {
      setSelectedProduct(null);
      setProductReviews([]);
      setRelatedProducts([]);
    }
  }, [routeView]);

  async function loadHomeContent() {
    try {
      setHomeContent(await homeContentModel.loadRemote(apiRequest, {
        admin: session?.user?.role === 'admin',
      }));
      if (session?.user?.role === 'admin') {
        const result = await adminModel.listHomeContentRevisions(request);
        setHomeContentRevisions(Array.isArray(result?.revisions) ? result.revisions : []);
      }
    } catch {
      setHomeContent(homeContentModel.load());
    }
  }

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
      loadAccountSupplierMessages();
      if (session.user?.role === 'admin') {
        loadAdminProducts();
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
      setProductContactForm({ ...emptySupplierContactForm });
      setProductContactFeedback(null);
      setAccountReviewForm({ ...emptyReviewForm });
      setAccountProfileForm({ ...initialAccountProfileForm });
      setSelectedAccountReviewId('');
      setAccountSupplierMessages([]);
      setSelectedAccountMessageId('');
      setAccountMessageReplyForm({ ...initialMessageReplyForm });
      setAdminProducts([]);
      setAdminUsers([]);
      setAdminUserForm({ ...initialAdminUserForm });
      setSelectedAdminUserId('');
      setSelectedAdminOrderId('');
      setSelectedAdminProductId('');
      setSelectedAdminCategoryId('');
      setAdminTab('users');
      setAdminSearchState({ ...initialAdminSearch });
      setCheckoutStep('items');
      setShippingForm(getShippingDefaults(null));
      setPaymentForm({ ...initialPaymentForm });
      setCheckoutErrors({});
    }
  }, [session?.accessToken]);

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

  async function openProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId) return;

    setSelectedProduct(product);
    setRelatedProducts([]);
    setView('product', { productId });
    setLoadingProductDetail(true);
    await loadProductReviews(productId);
    try {
      const fullProduct = await catalogModel.getProduct(productId);
      setSelectedProduct(fullProduct);
      trackProductView(fullProduct);
      await loadRelatedProducts(fullProduct);
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
      trackProductView(fullProduct);
      await loadRelatedProducts(fullProduct);
      await loadProductReviews(productId);
    } catch (error) {
      setNotice(error.message);
      setSelectedProduct(null);
      setRelatedProducts([]);
    } finally {
      setLoadingProductDetail(false);
    }
  }

  async function loadRelatedProducts(product) {
    try {
      const localRelated = filterRelatedProducts([...featuredProducts, ...products], product);
      if (localRelated.length >= 4) {
        setRelatedProducts(localRelated);
        return;
      }

      const result = await catalogModel.listProducts({
        page: 1,
        filters: { ...emptyFilters, inStock: false },
        limit: 100,
      });
      setRelatedProducts(filterRelatedProducts([...localRelated, ...(result.products || [])], product));
    } catch {
      setRelatedProducts(filterRelatedProducts([...featuredProducts, ...products], product));
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

  async function loadMyReviews() {
    if (!session?.accessToken) return;
    try {
      setMyReviews(await reviewModel.listMine(request));
    } catch {
      setMyReviews([]);
    }
  }

  async function loadAccountSupplierMessages() {
    if (!session?.accessToken) return;
    try {
      setAccountSupplierMessages(await supplierMessageModel.listMine(request));
    } catch {
      setAccountSupplierMessages([]);
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

  async function loadAdminProducts() {
    try {
      const result = await catalogModel.listProducts({
        page: 1,
        filters: { ...emptyFilters, inStock: false },
        limit: 100,
      });
      setAdminProducts(result.products);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadAdminUsers() {
    try {
      setAdminUsers(await adminModel.listUsers(request));
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadCart() {
    try {
      setCart(await cartModel.get(request));
    } catch (error) {
      setNotice(error.message);
    }
  }

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

  const updateAccountProfileForm = (field, value) => {
    setAccountProfileForm((current) => ({ ...current, [field]: value }));
  };

  async function saveAccountProfile(event) {
    event.preventDefault();
    const userId = session?.user?._id || session?.user?.id;
    if (!userId) return;

    setBusy(true);
    try {
      const updated = await userModel.update(request, userId, accountProfileForm);
      const nextSession = {
        ...session,
        user: {
          ...session.user,
          ...updated,
        },
      };
      applySession(nextSession);
      setAccountProfileForm(getAccountProfileDefaults(nextSession));
      setNotice('Datos de perfil actualizados correctamente.');
    } catch (error) {
      setNotice(translateAuthMessage(error.message));
    } finally {
      setBusy(false);
    }
  }

  async function deleteOwnAccount() {
    const userId = session?.user?._id || session?.user?.id;
    if (!userId) return;
    if (!window.confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción cerrará tu sesión.')) return;

    setBusy(true);
    try {
      await userModel.delete(request, userId);
      applySession(null);
      setOrders([]);
      setCart(null);
      setView('home');
      setNotice('Tu cuenta se ha eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
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

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      if (authMode === 'forgot') {
        await authModel.requestPasswordReset(authForm.email);
        setAuthFeedback({
          type: 'success',
          message: 'Si el email existe, te enviaremos un enlace para crear una nueva contraseña.',
        });
        return;
      }

      if (authMode === 'reset') {
        if (!authForm.resetToken) {
          setAuthFeedback({ type: 'error', message: 'El enlace de recuperación no es válido o está incompleto.' });
          return;
        }
        if (authForm.password !== authForm.confirmPassword) {
          setAuthFeedback({ type: 'error', message: 'Las contraseñas no coinciden.' });
          return;
        }
        await authModel.resetPassword(authForm.resetToken, authForm.password);
        setAuthMode('login');
        setAuthForm({ ...initialAuthForm });
        if (navigate) navigate('/cuenta', { replace: true });
        setAuthFeedback({ type: 'success', message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
        return;
      }

      if (authMode === 'login') {
        const next = await authModel.login(authForm.email, authForm.password);
        applySession(next);
        setView(next.user?.role === 'admin' ? 'admin' : 'catalog');
        setNotice('Bienvenido, ' + (next.user?.name || 'cliente'));
      } else {
        await authModel.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          phone: authForm.phone,
          address: {
            country: authForm.country,
            street: authForm.street,
            codePostal: authForm.codePostal,
            city: authForm.city,
          },
        });
        setAuthMode('login');
        setNotice('Cuenta creada. Revisa el correo para verificarla antes de comprar.');
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await authModel.logout(session?.refreshToken);
    } catch {
      // The local session can still be closed even if the server call fails.
    } finally {
      applySession(null);
      setView('catalog');
      setBusy(false);
      setNotice('Sesión cerrada');
    }
  }

  async function addToCart(product, quantity = 1) {
    if (!session) {
      setView('account');
      setNotice('Inicia sesión para añadir productos al carrito.');
      return;
    }
    if (productModel.getAvailableStock(product, reservedBySku) <= 0) {
      setNotice('No quedan más unidades disponibles de este producto.');
      return;
    }
    setBusy(true);
    try {
      setCart(await cartModel.addItem(request, product, quantity));
      trackAddToCart(product, quantity);
      setCartFeedback({
        id: Date.now(),
        productName: formatNoticeProductName(product.name),
        quantity,
      });
      setCheckoutStep('items');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateCartItem(item, quantity) {
    if (quantity < 1) return removeCartItem(item);
    setBusy(true);
    try {
      setCart(await cartModel.updateItem(request, item, quantity));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeCartItem(item) {
    setBusy(true);
    try {
      setCart(await cartModel.removeItem(request, item));
      trackRemoveFromCart(item);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearCart() {
    if (!window.confirm('¿Vaciar todos los productos de la cesta?')) return;
    setBusy(true);
    try {
      setCart(await cartModel.clear(request));
      setCartFeedback(null);
      setCheckoutStep('items');
      setCheckoutErrors({});
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  const updateShippingForm = (field, value) => {
    setShippingForm((current) => ({ ...current, [field]: value }));
    setCheckoutErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updatePaymentForm = (field, value) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
    setCheckoutErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateReviewForm = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: value }));
  };

  const updateProductContactForm = (field, value) => {
    setProductContactFeedback(null);
    setProductContactForm((current) => ({ ...current, [field]: value }));
  };

  const updateAccountReviewForm = (field, value) => {
    setAccountReviewForm((current) => ({ ...current, [field]: value }));
  };

  const updateSupplierMessageReplyForm = (field, value) => {
    setSupplierMessageReplyForm((current) => ({ ...current, [field]: value }));
  };

  const updateAccountMessageReplyForm = (field, value) => {
    setAccountMessageReplyForm((current) => ({ ...current, [field]: value }));
  };

  async function sendProductContactMessage(event) {
    event.preventDefault();
    const productId = selectedProduct?._id || selectedProduct?.id;
    if (!session) {
      setProductContactFeedback({ type: 'error', message: 'Entra en tu cuenta para contactar con el proveedor.' });
      setView('account');
      return;
    }
    if (session.user?.role === 'supplier') {
      setProductContactFeedback({ type: 'error', message: 'Los proveedores no pueden contactar consigo mismos desde la ficha de producto.' });
      return;
    }
    if (!productId || productContactForm.message.trim().length < 3) {
      setProductContactFeedback({ type: 'error', message: 'Escribe un mensaje de al menos 3 caracteres.' });
      return;
    }

    setBusy(true);
    try {
      await supplierMessageModel.createForProduct(request, productId, productContactForm);
      setProductContactForm({ ...emptySupplierContactForm });
      await loadAccountSupplierMessages();
      setProductContactFeedback({ type: 'success', message: 'Mensaje enviado al proveedor. Podrás ver la respuesta en Mi cuenta.' });
    } catch (error) {
      setProductContactFeedback({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function selectSupplierMessage(thread) {
    const threadId = thread?._id || thread?.id || '';
    setSelectedSupplierMessageId(threadId);
    setSupplierMessageReplyForm({ ...initialMessageReplyForm });
    if (!threadId) return;
    try {
      const updated = await supplierMessageModel.markRead(request, threadId);
      setSupplierMessages((current) => current.map((item) => (
        (item._id || item.id) === threadId ? updated : item
      )));
    } catch {
      // La lectura no debe bloquear la selección del mensaje.
    }
  }

  async function selectAccountSupplierMessage(thread) {
    const threadId = thread?._id || thread?.id || '';
    setSelectedAccountMessageId(threadId);
    setAccountMessageReplyForm({ ...initialMessageReplyForm });
    if (!threadId) return;
    try {
      const updated = await supplierMessageModel.markRead(request, threadId);
      setAccountSupplierMessages((current) => current.map((item) => (
        (item._id || item.id) === threadId ? updated : item
      )));
    } catch {
      // La lectura no debe bloquear la selección del mensaje.
    }
  }

  async function replySupplierMessage(event) {
    event.preventDefault();
    if (!selectedSupplierMessageId || supplierMessageReplyForm.message.trim().length < 3) {
      setNotice('Escribe una respuesta de al menos 3 caracteres.');
      return;
    }

    setBusy(true);
    try {
      const updated = await supplierMessageModel.reply(request, selectedSupplierMessageId, supplierMessageReplyForm.message);
      setSupplierMessageReplyForm({ ...initialMessageReplyForm });
      setSupplierMessages((current) => current.map((item) => (
        (item._id || item.id) === selectedSupplierMessageId ? updated : item
      )));
      setNotice('Respuesta enviada al cliente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function replyAccountSupplierMessage(event) {
    event.preventDefault();
    if (!selectedAccountMessageId || accountMessageReplyForm.message.trim().length < 3) {
      setNotice('Escribe una respuesta de al menos 3 caracteres.');
      return;
    }

    setBusy(true);
    try {
      const updated = await supplierMessageModel.reply(request, selectedAccountMessageId, accountMessageReplyForm.message);
      setAccountMessageReplyForm({ ...initialMessageReplyForm });
      setAccountSupplierMessages((current) => current.map((item) => (
        (item._id || item.id) === selectedAccountMessageId ? updated : item
      )));
      setNotice('Mensaje enviado al proveedor.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

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
    if (!window.confirm('¿Eliminar esta opinión?')) return;

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

  function goToShipping() {
    if (!session) {
      setView('account');
      setNotice('Inicia sesión para completar el pedido.');
      return;
    }
    if (!cartItems.length) {
      setNotice('Añade algún producto antes de continuar.');
      return;
    }
    setCheckoutErrors({});
    setCheckoutStep('shipping');
    trackBeginCheckout(cartItems, cartTotal);
  }

  function goToCartItems() {
    setCheckoutErrors({});
    setCheckoutStep('items');
  }

  function goToPayment(event) {
    event?.preventDefault();
    const errors = validateShippingForm(shippingForm);
    if (Object.keys(errors).length) {
      setCheckoutErrors(errors);
      setNotice('Revisa la dirección de envío.');
      return;
    }
    setCheckoutErrors({});
    setCheckoutStep('payment');
  }

  async function createOrder(event) {
    event?.preventDefault();
    if (!cartItems.length || !session?.user?.email) return;
    const shippingErrors = validateShippingForm(shippingForm);
    const paymentErrors = validatePaymentForm(paymentForm);
    if (Object.keys(shippingErrors).length) {
      setCheckoutErrors(shippingErrors);
      setCheckoutStep('shipping');
      setNotice('Revisa la dirección de envío.');
      return;
    }
    if (Object.keys(paymentErrors).length) {
      setCheckoutErrors(paymentErrors);
      setCheckoutStep('payment');
      setNotice('Revisa los datos de pago.');
      return;
    }
    setBusy(true);
    try {
      const currentItems = [...cartItems];
      const currentTotal = cartTotal;
      const order = await orderModel.createFromCart(request, session.user.email, currentItems, shippingForm, paymentForm.method);
      trackPurchase(order, currentItems, currentTotal);
      setCart(await cartModel.clear(request));
      await loadOrders();
      await loadProducts();
      setCheckoutStep('items');
      setCheckoutErrors({});
      setCartFeedback(null);
      setPaymentForm({ ...initialPaymentForm });
      setView('orders');
      setNotice('Pedido creado correctamente.');
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

  const updateAuthForm = (field, value) => {
    setAuthForm((current) => ({ ...current, [field]: value }));
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

  const updateHomeHero = (field, value) => {
    saveHomeContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [field]: value,
      },
    }));
  };

  async function uploadHomeImage(target, files) {
    const fileList = Array.from(files || []).filter(Boolean);
    if (!fileList.length) {
      setNotice('Elige una imagen para subir.');
      return;
    }

    setBusy(true);
    try {
      const result = await adminModel.uploadHomeImages(request, fileList.slice(0, 1));
      const imageUrl = result?.images?.[0]?.url;
      if (!imageUrl) throw new Error('No se recibió la URL de la imagen.');

      if (target.startsWith('component.')) {
        updateHomeComponentForm(target.replace('component.', ''), imageUrl);
        setNotice('Imagen subida y asignada. Añade el componente para guardarla en la portada.');
        return;
      }

      const nextHomeContent = homeContentModel.save(assignHomeImage(homeContent, target, imageUrl));
      setHomeContent(nextHomeContent);
      const savedHomeContent = await homeContentModel.saveRemote(request, nextHomeContent);
      setHomeContent(savedHomeContent);
      setNotice('Imagen subida, asignada y guardada en Atlas.');
    } catch (error) {
      setNotice(error.message === 'Internal server error'
        ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
        : error.message);
    } finally {
      setBusy(false);
    }
  }

  const updateHomeComponentForm = (field, value) => {
    setHomeComponentForm((current) => ({ ...current, [field]: value }));
  };

  const toggleHomeComponentProduct = (product) => {
    const productId = getProductId(product);
    if (!productId) return;
    setHomeComponentForm((current) => {
      const selected = current.productIds.includes(productId);
      return {
        ...current,
        productIds: selected
          ? current.productIds.filter((id) => id !== productId)
          : [...current.productIds, productId],
      };
    });
  };

  const updateHomeSection = (sectionId, field, value) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId ? { ...section, [field]: value } : section
      )),
    }));
  };

  const updateHomeSectionItem = (sectionId, itemIndex, field, value) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const items = [...(Array.isArray(section.items) ? section.items : [])];
        items[itemIndex] = {
          title: '',
          body: '',
          imageUrl: '',
          mobileImageUrl: '',
          altText: '',
          linkUrl: '',
          ctaLabel: '',
          trackingId: '',
          campaignName: '',
          ...(items[itemIndex] || {}),
          [field]: value,
        };
        return { ...section, items };
      }),
    }));
  };

  const toggleHomeSectionProduct = (sectionId, product) => {
    const productId = getProductId(product);
    if (!productId) return;
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const productIds = Array.isArray(section.productIds) ? section.productIds : [];
        const selected = productIds.includes(productId);
        return {
          ...section,
          productIds: selected
            ? productIds.filter((id) => id !== productId)
            : [...productIds, productId],
        };
      }),
    }));
  };

  const toggleHomeSection = (sectionId) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId ? { ...section, enabled: !section.enabled } : section
      )),
    }));
  };

  const moveHomeSection = (sectionId, direction) => {
    saveHomeContent((current) => {
      const sections = [...current.sections].sort((first, second) => first.order - second.order);
      const index = sections.findIndex((section) => section.id === sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return current;
      const [section] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, section);
      return {
        ...current,
        sections: sections.map((item, order) => ({ ...item, order })),
      };
    });
  };

  const deleteHomeSection = (sectionId) => {
    if (!window.confirm('¿Eliminar este componente de la portada?')) return;
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections
        .filter((section) => section.id !== sectionId)
        .map((section, order) => ({ ...section, order })),
    }));
  };

  const toggleFeaturedProduct = (product) => {
    const productId = getProductId(product);
    if (!productId) return;
    saveHomeContent((current) => {
      const selected = current.featuredProductIds.includes(productId);
      return {
        ...current,
        featuredProductIds: selected
          ? current.featuredProductIds.filter((id) => id !== productId)
          : [...current.featuredProductIds, productId],
      };
    });
  };

  const createHomeComponent = (event) => {
    event.preventDefault();
    const title = homeComponentForm.title.trim();
    if (!title) {
      setNotice('Indica un titulo para el componente.');
      return;
    }
    const bannerItems = [
      {
        title: homeComponentForm.itemOneTitle.trim(),
        body: homeComponentForm.itemOneBody.trim(),
        imageUrl: homeComponentForm.itemOneImageUrl.trim(),
        mobileImageUrl: homeComponentForm.itemOneMobileImageUrl.trim(),
        altText: homeComponentForm.itemOneAltText.trim(),
        linkUrl: homeComponentForm.itemOneLinkUrl.trim(),
        trackingId: homeComponentForm.itemOneTrackingId.trim(),
        campaignName: homeComponentForm.itemOneCampaignName.trim(),
      },
      {
        title: homeComponentForm.itemTwoTitle.trim(),
        body: homeComponentForm.itemTwoBody.trim(),
        imageUrl: homeComponentForm.itemTwoImageUrl.trim(),
        mobileImageUrl: homeComponentForm.itemTwoMobileImageUrl.trim(),
        altText: homeComponentForm.itemTwoAltText.trim(),
        linkUrl: homeComponentForm.itemTwoLinkUrl.trim(),
        trackingId: homeComponentForm.itemTwoTrackingId.trim(),
        campaignName: homeComponentForm.itemTwoCampaignName.trim(),
      },
      {
        title: homeComponentForm.itemThreeTitle.trim(),
        body: homeComponentForm.itemThreeBody.trim(),
        imageUrl: homeComponentForm.itemThreeImageUrl.trim(),
        mobileImageUrl: homeComponentForm.itemThreeMobileImageUrl.trim(),
        altText: homeComponentForm.itemThreeAltText.trim(),
        linkUrl: homeComponentForm.itemThreeLinkUrl.trim(),
        trackingId: homeComponentForm.itemThreeTrackingId.trim(),
        campaignName: homeComponentForm.itemThreeCampaignName.trim(),
      },
    ].filter((item) => item.title || item.body || item.imageUrl || item.mobileImageUrl || item.linkUrl);

    saveHomeContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: 'custom-' + Date.now(),
          type: homeComponentForm.type,
          title,
          subtitle: homeComponentForm.subtitle.trim(),
          body: homeComponentForm.body.trim(),
          ctaLabel: homeComponentForm.ctaLabel.trim(),
          imageUrl: homeComponentForm.imageUrl.trim(),
          mobileImageUrl: homeComponentForm.mobileImageUrl.trim(),
          altText: homeComponentForm.altText.trim(),
          items: bannerItems,
          linkUrl: homeComponentForm.linkUrl.trim(),
          status: homeComponentForm.status || 'published',
          startDate: homeComponentForm.startDate || '',
          endDate: homeComponentForm.endDate || '',
          priority: Number(homeComponentForm.priority || 0),
          trackingId: homeComponentForm.trackingId.trim(),
          campaignName: homeComponentForm.campaignName.trim(),
          productIds: homeComponentForm.productIds,
          enabled: true,
          locked: false,
          order: current.sections.length,
        },
      ],
    }));
    setHomeComponentForm({ ...initialHomeComponentForm });
    setNotice('Componente anadido a la portada.');
  };

  const resetHomeContent = () => {
    saveHomeContent(homeContentModel.getDefault());
    setHomeComponentForm({ ...initialHomeComponentForm });
    setNotice('Portada restablecida.');
  };

  async function saveHomeContentSettings() {
    if (session?.user?.role !== 'admin') return;
    setBusy(true);
    try {
      setHomeContent(await homeContentModel.saveRemote(request, homeContent));
      const result = await adminModel.listHomeContentRevisions(request);
      setHomeContentRevisions(Array.isArray(result?.revisions) ? result.revisions : []);
      setNotice('Portada guardada en Atlas.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function restoreHomeContentRevision(revisionId) {
    if (session?.user?.role !== 'admin' || !revisionId) return;
    if (!window.confirm('¿Restaurar esta versión de la portada? Se guardará una copia del estado actual.')) return;
    setBusy(true);
    try {
      const restored = await adminModel.restoreHomeContentRevision(request, revisionId);
      const normalized = homeContentModel.save(restored);
      setHomeContent(normalized);
      const result = await adminModel.listHomeContentRevisions(request);
      setHomeContentRevisions(Array.isArray(result?.revisions) ? result.revisions : []);
      setNotice('Versión de portada restaurada.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  const updateAdminUserForm = (field, value) => {
    setAdminUserForm((current) => ({ ...current, [field]: value }));
  };

  const setAdminSearch = (key, value) => {
    setAdminSearchState((current) => ({ ...current, [key]: value }));
  };

  function selectAdminCategory(category) {
    setSelectedAdminCategoryId(category?._id || category?.id || '');
    setCategoryForm({
      name: category?.name || '',
      description: category?.description || '',
    });
  }

  function resetCategoryForm() {
    setSelectedAdminCategoryId('');
    setCategoryForm({ ...initialCategoryForm });
  }

  function selectAdminProduct(product) {
    const offer = product?.offer || {};
    setSelectedAdminProductId(product?._id || product?.id || '');
    setProductForm({
      name: product?.name || '',
      sku: product?.sku || '',
      price: product?.price ?? '',
      shortDescription: product?.shortDescription || '',
      description: product?.description || '',
      stock: product?.stock ?? '0',
      category: typeof product?.category === 'object' ? product.category?._id || product.category?.id || '' : product?.category || '',
      supplierId: product?.supplier?.id ?? '1',
      supplierName: product?.supplier?.name || '',
      supplierImages: Array.isArray(product?.supplier?.images) ? product.supplier.images : [],
      images: Array.isArray(product?.images) ? product.images : [],
      offerType: offer.active ? offer.type || 'none' : 'none',
      offerValue: offer.value ?? '',
      offerBundleQuantity: offer.bundleQuantity || '3',
      offerBundlePayQuantity: offer.bundlePayQuantity || '2',
      offerLabel: offer.label || '',
      offerValidFrom: formatDateInput(offer.validFrom),
      offerValidUntil: formatDateInput(offer.validUntil),
    });
    if (product?._id || product?.id) {
      setImageForm((current) => ({ ...current, productId: product._id || product.id }));
    }
  }

  function resetProductForm() {
    setSelectedAdminProductId('');
    setProductForm({ ...initialProductForm });
    setImageForm({ ...initialImageForm });
  }

  function selectAdminUser(user) {
    const userId = user?._id || user?.id || '';
    setSelectedAdminUserId(userId);
    setSelectedAdminOrderId('');
    setAdminUserForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      codePostal: user?.address?.codePostal || '',
      city: user?.address?.city || '',
      country: user?.address?.country || '',
      role: user?.role || 'user',
      password: '',
    });
  }

  function openAdminUserOrders(user) {
    selectAdminUser(user);
    setSelectedAdminOrderId('');
  }

  function openAdminOrder(order) {
    setSelectedAdminOrderId(order?._id || order?.id || '');
  }

  async function saveAdminUser(event) {
    event.preventDefault();
    if (!selectedAdminUserId) {
      setNotice('Selecciona un usuario para editarlo.');
      return;
    }

    setBusy(true);
    try {
      const updated = await adminModel.updateUser(request, selectedAdminUserId, adminUserForm);
      await loadAdminUsers();
      selectAdminUser(updated);
      setNotice('Usuario actualizado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAdminUser(user) {
    const userId = user?._id || user?.id;
    if (!userId) return;
    if (String(userId) === String(session?.user?._id || session?.user?.id)) {
      setNotice('No puedes eliminar tu propio usuario administrador desde aquí.');
      return;
    }
    if (!window.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer desde el panel.')) return;

    setBusy(true);
    try {
      await adminModel.deleteUser(request, userId);
      await loadAdminUsers();
      if (selectedAdminUserId === userId) {
        setSelectedAdminUserId('');
        setSelectedAdminOrderId('');
        setAdminUserForm({ ...initialAdminUserForm });
      }
      setNotice('Usuario eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (selectedAdminCategoryId) {
        await adminModel.updateCategory(request, selectedAdminCategoryId, categoryForm);
        setNotice('Categoría actualizada correctamente.');
      } else {
        await adminModel.createCategory(request, categoryForm);
        setNotice('Categoría creada correctamente.');
      }
      resetCategoryForm();
      await loadCategories();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(category) {
    const categoryId = category?._id || category?.id;
    if (!categoryId) return;
    if (!window.confirm('¿Eliminar esta categoría?')) return;

    setBusy(true);
    try {
      await adminModel.deleteCategory(request, categoryId);
      if (selectedAdminCategoryId === categoryId) resetCategoryForm();
      await loadCategories();
      setNotice('Categoría eliminada correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = selectedAdminProductId
        ? await adminModel.updateProduct(request, selectedAdminProductId, productForm)
        : await adminModel.createProduct(request, productForm);
      setImageForm((current) => ({ ...current, productId: saved._id || saved.id || '' }));
      resetProductForm();
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice(selectedAdminProductId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId) return;
    if (!window.confirm('¿Eliminar este producto del catálogo?')) return;

    setBusy(true);
    try {
      await adminModel.deleteProduct(request, productId);
      if (selectedAdminProductId === productId) resetProductForm();
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice('Producto eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function approveAdminProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'admin') return;

    setBusy(true);
    try {
      await adminModel.approveProduct(request, productId);
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      await loadAdminSuppliers();
      setNotice('Producto aprobado y publicado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function rejectAdminProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'admin') return;
    const reason = window.prompt('Indica el motivo del rechazo para que el proveedor pueda corregirlo:');
    if (reason == null) return;
    if (reason.trim().length < 3) {
      setNotice('Indica un motivo claro para rechazar el producto.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.rejectProduct(request, productId, reason.trim());
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      await loadAdminSuppliers();
      setNotice('Producto rechazado. El proveedor verá el motivo para corregirlo.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadProductImages(event) {
    event.preventDefault();
    if (!imageForm.productId || imageForm.files.length === 0) {
      setNotice('Elige un producto y al menos una imagen.');
      return;
    }

    setBusy(true);
    try {
      const updated = await adminModel.uploadProductImages(request, imageForm.productId, imageForm.files);
      setImageForm({ ...initialImageForm, productId: imageForm.productId });
      setProductForm((current) => ({
        ...current,
        images: Array.isArray(updated?.images) ? updated.images : current.images,
      }));
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice('Imágenes subidas correctamente.');
    } catch (error) {
      setNotice(error.message === 'Internal server error'
        ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
        : error.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadSupplierProductImages(event) {
    event.preventDefault();
    const productId = selectedSupplierProductId || imageForm.productId;
    if (!productId || imageForm.files.length === 0) {
      setNotice('Elige un producto propio y al menos una imagen.');
      return;
    }

    setBusy(true);
    try {
      const updated = await supplierModel.uploadProductImages(request, productId, imageForm.files);
      setImageForm({ ...initialImageForm, productId });
      setProductForm((current) => ({
        ...current,
        images: Array.isArray(updated?.images) ? updated.images : current.images,
      }));
      await loadSupplierPanel();
      await loadProducts();
      await loadFeaturedProducts();
      setNotice('Imágenes subidas correctamente.');
    } catch (error) {
      setNotice(error.message === 'Internal server error'
        ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
        : error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveImageUrl(event) {
    event.preventDefault();
    const product = adminProducts.find((item) => (item._id || item.id) === imageForm.productId);
    if (!product || !imageForm.imageUrl.trim()) {
      setNotice('Elige un producto y pega una URL de imagen válida.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.saveImageUrl(request, product, imageForm.imageUrl, imageForm.imageName);
      setImageForm({ ...initialImageForm, productId: imageForm.productId });
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice('Imagen guardada desde URL.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder(order) {
    const orderId = order._id || order.id;
    if (!orderId || session?.user?.role !== 'admin') return;
    if (!window.confirm('¿Eliminar este pedido? Se repondrá el stock asociado.')) return;

    setBusy(true);
    try {
      await orderModel.delete(request, orderId);
      await loadOrders();
      await loadProducts();
      await loadFeaturedProducts();
      setNotice('Pedido eliminado y stock repuesto.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    state: {
      adminTab,
      adminProducts,
      adminSearch,
      adminReviews,
      accountMessageReplyForm,
      accountReviewForm,
      accountProfileForm,
      accountSupplierMessages,
      adminUserForm,
      adminUsers,
      authForm,
      authMode,
      busy,
      cartCount,
      cartFeedback,
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
      homeContentRevisions,
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
      productContactFeedback,
      productContactForm,
      productReviews,
      products,
      relatedProducts,
      reviewForm,
      reservedBySku,
      selectedProduct,
      selectedAdminOrder,
      selectedAdminOrderId,
      selectedAdminCategoryId,
      selectedAdminProductId,
      selectedAdminUser,
      selectedAdminUserId,
      selectedAdminUserOrders,
      selectedAccountReviewId,
      selectedAccountMessageId,
      session,
      shippingForm,
      view: routeView,
    },
    actions: {
      addToCart,
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
      openAdminUserOrders,
      removeCartItem,
      replyAccountSupplierMessage,
      replySupplierMessage,
      dismissCartFeedback: () => setCartFeedback(null),
      resetFilters,
      resetCategoryForm,
      resetProductForm,
      saveAdminUser,
      saveAccountReview,
      saveAccountProfile,
      saveSupplierProfile,
      selectAdminCategory,
      selectAdminProduct,
      selectAccountReview,
      setAuthMode,
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
      updateAccountMessageReplyForm,
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
      restoreHomeContentRevision,
      saveHomeContentSettings,
      saveImageUrl,
      submitProductReview,
      sendProductContactMessage,
      uploadProductImages,
      uploadSupplierProductImages,
      deleteOrder,
    },
  };
}
