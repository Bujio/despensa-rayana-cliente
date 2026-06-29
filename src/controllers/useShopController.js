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

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
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
  description: '',
  stock: '0',
  category: '',
  supplierId: '1',
  supplierName: '',
  supplierImages: [],
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

const initialHomeComponentForm = {
  title: '',
  subtitle: '',
  body: '',
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

const initialPaymentForm = {
  holder: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

const getShippingDefaults = (session) => ({
  street: session?.user?.address?.street || '',
  codePostal: session?.user?.address?.codePostal || '',
  city: session?.user?.address?.city || '',
  country: session?.user?.address?.country || 'España',
  phone: session?.user?.phone || '',
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
  const cardNumber = form.cardNumber.replace(/\s/g, '');
  const cvc = form.cvc.trim();
  const expiry = form.expiry.trim();

  if (form.holder.trim().length < 3) errors.holder = 'Indica el titular de la tarjeta.';
  if (!/^\d{13,19}$/.test(cardNumber)) errors.cardNumber = 'La tarjeta debe tener entre 13 y 19 números.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) errors.expiry = 'Usa el formato MM/AA.';
  if (!/^\d{3,4}$/.test(cvc)) errors.cvc = 'El CVC debe tener 3 o 4 números.';
  return errors;
};

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getProductId = (product) => String(product?._id || product?.id || product?.sku || '');

const hasClientSideFilters = (filters) => Boolean(
  filters.onlyOffers ||
  filters.origin ||
  filters.favoritesOnly ||
  filters.categoryGroupIds?.length,
);

export function useShopController() {
  const [session, setSession] = useState(() => sessionModel.get());
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [accountReviewForm, setAccountReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [selectedAccountReviewId, setSelectedAccountReviewId] = useState('');
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...emptyFilters }));
  const [favoriteIds, setFavoriteIds] = useState(() => favoritesModel.getAll());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [view, setView] = useState('home');
  const [busy, setBusy] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notice, setNotice] = useState('');
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

  const request = (path, options) => apiRequest(path, options, session, applySession);

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, filters, favoriteIds]);

  useEffect(() => {
    if (session) {
      setShippingForm(getShippingDefaults(session));
      loadCart();
      loadOrders();
      loadMyReviews();
      if (session.user?.role === 'admin') {
        loadAdminProducts();
        loadAdminUsers();
        loadAdminReviews();
      }
    } else {
      setCart(null);
      setOrders([]);
      setMyReviews([]);
      setAdminReviews([]);
      setReviewForm({ ...emptyReviewForm });
      setAccountReviewForm({ ...emptyReviewForm });
      setSelectedAccountReviewId('');
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
    setView('product');
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

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
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
      setNotice(product.name + ' añadido al carrito');
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
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearCart() {
    setBusy(true);
    try {
      setCart(await cartModel.clear(request));
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
      await orderModel.createFromCart(request, session.user.email, cartItems, shippingForm);
      setCart(await cartModel.clear(request));
      await loadOrders();
      await loadProducts();
      setCheckoutStep('items');
      setCheckoutErrors({});
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

  const openCommerceCategory = (label) => {
    if (label === 'La Rayana') {
      setView('story');
      return;
    }

    if (label === 'Ofertas') {
      setPage(1);
      setFilters({ ...emptyFilters, onlyOffers: true, inStock: true });
      setView('catalog');
      return;
    }

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
    setView('catalog');
  };

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

  const updateHomeHero = (field, value) => {
    saveHomeContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [field]: value,
      },
    }));
  };

  const updateHomeComponentForm = (field, value) => {
    setHomeComponentForm((current) => ({ ...current, [field]: value }));
  };

  const updateHomeSection = (sectionId, field, value) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId ? { ...section, [field]: value } : section
      )),
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
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections
        .filter((section) => section.locked || section.id !== sectionId)
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
    saveHomeContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: 'custom-' + Date.now(),
          type: 'custom',
          title,
          subtitle: homeComponentForm.subtitle.trim(),
          body: homeComponentForm.body.trim(),
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
      description: product?.description || '',
      stock: product?.stock ?? '0',
      category: typeof product?.category === 'object' ? product.category?._id || product.category?.id || '' : product?.category || '',
      supplierId: product?.supplier?.id ?? '1',
      supplierName: product?.supplier?.name || '',
      supplierImages: Array.isArray(product?.supplier?.images) ? product.supplier.images : [],
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

  async function uploadProductImages(event) {
    event.preventDefault();
    if (!imageForm.productId || imageForm.files.length === 0) {
      setNotice('Elige un producto y al menos una imagen.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.uploadProductImages(request, imageForm.productId, imageForm.files);
      setImageForm({ ...initialImageForm, productId: imageForm.productId });
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
      accountReviewForm,
      adminUserForm,
      adminUsers,
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
      selectedAdminUser,
      selectedAdminUserId,
      selectedAdminUserOrders,
      selectedAccountReviewId,
      session,
      shippingForm,
      view,
    },
    actions: {
      addToCart,
      clearCart,
      createCategory,
      createProduct,
      createOrder,
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
      resetFilters,
      resetCategoryForm,
      resetProductForm,
      saveAdminUser,
      saveAccountReview,
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
      updateCartItem,
      updateCategoryForm,
      updateHomeComponentForm,
      updateHomeHero,
      updateHomeSection,
      updateImageForm,
      updatePaymentForm,
      updateProductForm,
      updateReviewForm,
      updateShippingForm,
      toggleFavorite,
      toggleFeaturedProduct,
      toggleHomeSection,
      moveHomeSection,
      deleteHomeSection,
      createHomeComponent,
      resetHomeContent,
      saveImageUrl,
      submitProductReview,
      uploadProductImages,
      deleteOrder,
    },
  };
}
