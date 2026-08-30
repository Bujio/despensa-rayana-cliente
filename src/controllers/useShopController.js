import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import {
  apiRequest,
  beginSessionGeneration,
  invalidateSessionGeneration,
  isSessionGenerationActive,
} from '../models/apiClient.js';
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
  createProductDetailLoadCoordinator,
  getProductDetailNavigationIdentity,
} from './productDetailLoadCoordinator.js';

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
  shortDescription: '',
  description: '',
  stock: '0',
  category: '',
  supplierId: '1',
  supplierName: '',
  supplierImages: [],
  images: [],
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

const ADMIN_PRODUCTS_DEFAULT_LIMIT = 50;
const ADMIN_PRODUCTS_LIMIT_OPTIONS = [10, 50, 100];
const ADMIN_PRODUCTS_SORT_OPTIONS = ['name', 'price', 'stock', 'createdAt'];
const ADMIN_PRODUCTS_ORDER_OPTIONS = ['asc', 'desc'];
const ADMIN_PRODUCTS_LOAD_TIMEOUT_MS = 10000;

const initialAdminProductsFilters = {
  categoryId: '',
  inStock: '',
  minPrice: '',
  maxPrice: '',
  sort: 'createdAt',
  order: 'desc',
};

function normalizeAdminProductsPage(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

function normalizeAdminProductsPrice(value, fieldLabel) {
  if (value === '' || value === undefined || value === null) return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(fieldLabel + ' debe ser un número igual o mayor que cero.');
  }
  return parsed;
}

function normalizeAdminProductsRequest(sessionContext, values = {}) {
  const limit = Number(values.limit);
  const normalizedLimit = ADMIN_PRODUCTS_LIMIT_OPTIONS.includes(limit)
    ? limit
    : ADMIN_PRODUCTS_DEFAULT_LIMIT;
  const minPrice = normalizeAdminProductsPrice(values.minPrice, 'El precio mínimo');
  const maxPrice = normalizeAdminProductsPrice(values.maxPrice, 'El precio máximo');
  if (minPrice !== '' && maxPrice !== '' && minPrice > maxPrice) {
    throw new Error('El precio mínimo no puede superar el precio máximo.');
  }

  return Object.freeze({
    generation: sessionContext?.generation ?? null,
    ownerKey: sessionContext?.ownerKey || '',
    role: 'admin',
    page: normalizeAdminProductsPage(values.page),
    limit: normalizedLimit,
    query: String(values.query || '').trim(),
    categoryId: String(values.categoryId || '').trim(),
    inStock: values.inStock === true || values.inStock === 'true',
    minPrice,
    maxPrice,
    sort: ADMIN_PRODUCTS_SORT_OPTIONS.includes(values.sort) ? values.sort : 'createdAt',
    order: ADMIN_PRODUCTS_ORDER_OPTIONS.includes(values.order) ? values.order : 'desc',
  });
}

function getAdminProductsRequestSignature(context) {
  if (!context) return '';
  return JSON.stringify([
    context.generation,
    context.ownerKey,
    context.role,
    context.page,
    context.limit,
    context.query,
    context.categoryId,
    context.inStock,
    context.minPrice,
    context.maxPrice,
    context.sort,
    context.order,
  ]);
}

function getAdminProductsLoadError(error) {
  if (error?.name === 'AbortError') {
    return 'La carga del inventario ha superado los 10 segundos. Inténtalo de nuevo.';
  }
  if (error?.status === 403) {
    return 'Tu cuenta ya no tiene permiso para consultar el inventario administrativo.';
  }
  if (error?.status >= 500) {
    return 'El servidor no pudo cargar el inventario. Inténtalo de nuevo en unos instantes.';
  }
  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servidor para cargar el inventario.';
  }
  return error?.message || 'No se pudo cargar el inventario administrativo.';
}

const initialImageForm = {
  productId: '',
  files: [],
  imageUrl: '',
  imageName: '',
};

const initialHomeComponentForm = {
  type: 'promoBanner',
  title: '',
  subtitle: '',
  body: '',
  imageUrl: '',
  linkUrl: '',
  ctaLabel: '',
  productIds: [],
  itemOneTitle: '',
  itemOneBody: '',
  itemOneImageUrl: '',
  itemOneLinkUrl: '',
  itemTwoTitle: '',
  itemTwoBody: '',
  itemTwoImageUrl: '',
  itemTwoLinkUrl: '',
  itemThreeTitle: '',
  itemThreeBody: '',
  itemThreeImageUrl: '',
  itemThreeLinkUrl: '',
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
  accepted: false,
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

const validateCheckoutConfirmation = (form) => {
  const errors = {};
  if (!form.accepted) {
    errors.accepted = 'Debes aceptar las condiciones de esta beta para registrar el pedido.';
  }
  return errors;
};

const getFirstErrorField = (errors, fields) => fields.find((field) => errors[field]);

const getCheckoutSubmitError = (error) => {
  const rawMessage = String(error?.message || '').trim();
  const normalizedMessage = rawMessage.toLowerCase();
  const preservedDraft = ' El carrito y los datos de entrega se conservan.';

  if (error?.code === 'INVALID_ORDER_CONFIRMATION') {
    return 'El servidor no confirmó correctamente el pedido. Comprueba «Pedidos» antes de volver a intentarlo para evitar duplicados.' + preservedDraft;
  }
  if (error?.code === 'INVALID_CHECKOUT_CART') {
    return 'El carrito contiene un producto sin una referencia o cantidad válida. Revísalo antes de registrar el pedido.' + preservedDraft;
  }
  if (/failed to fetch|networkerror/.test(normalizedMessage)) {
    return 'Se perdió la conexión y no podemos confirmar si el pedido llegó a registrarse. Comprueba «Pedidos» antes de volver a intentarlo.' + preservedDraft;
  }
  if (normalizedMessage.includes('insufficient stock')) {
    return 'No hay stock suficiente para uno de los productos. Revisa las cantidades del carrito.' + preservedDraft;
  }
  if (normalizedMessage.includes('not found') || normalizedMessage.includes('not available')) {
    return 'Uno de los productos ya no está disponible. Revisa el carrito antes de continuar.' + preservedDraft;
  }
  if (normalizedMessage.includes('no token') || normalizedMessage.includes('invalid token') || normalizedMessage.includes('unauthorized')) {
    return 'La sesión ha caducado. Inicia sesión de nuevo para continuar.' + preservedDraft;
  }
  if (normalizedMessage.includes('forbidden')) {
    return 'No tienes permiso para registrar este pedido con la cuenta actual.' + preservedDraft;
  }
  if (normalizedMessage.includes('too many')) {
    return 'Se han realizado demasiados intentos. Espera unos minutos antes de volver a probar.' + preservedDraft;
  }

  return 'El servidor no pudo confirmar el registro del pedido. Inténtalo de nuevo más tarde.' + preservedDraft;
};

const getOrderId = (order) => String(order?._id || order?.id || '');

const normalizeOrderEmail = (email) => String(email || '').trim().toLowerCase();

const getSessionOwnerKey = (session) => {
  const userId = session?.user?._id || session?.user?.id;
  if (userId) return 'id:' + String(userId);
  const email = normalizeOrderEmail(session?.user?.email);
  return email ? 'email:' + email : '';
};

const getOrderUserId = (order) => {
  const userId = typeof order?.userId === 'object'
    ? order.userId?._id || order.userId?.id
    : order?.userId;
  return userId ? String(userId) : '';
};

const isOrderOwnedBySession = (order, session) => {
  const sessionUserId = String(session?.user?._id || session?.user?.id || '');
  const orderUserId = getOrderUserId(order);
  if (sessionUserId && orderUserId) return sessionUserId === orderUserId;
  return Boolean(
    normalizeOrderEmail(session?.user?.email)
    && normalizeOrderEmail(session?.user?.email) === normalizeOrderEmail(order?.email),
  );
};

const getReviewId = (review) => String(review?._id || review?.id || '');

const getReviewProductId = (review) => String(
  review?.product?._id || review?.product?.id || review?.product || '',
);

const getReviewUserId = (review) => String(
  review?.user?._id || review?.user?.id || review?.user || '',
);

const PRODUCT_REVIEW_SESSION_EXPIRED_MESSAGE = 'Tu sesión ha caducado y la opinión no se ha guardado. Inicia sesión nuevamente para continuar.';
const PRODUCT_REVIEW_SESSION_REFRESH_UNAVAILABLE_MESSAGE = 'No se ha podido comprobar tu sesión temporalmente. La opinión no se ha enviado. Inténtalo de nuevo.';

const isReviewOwnedBySession = (review, session) => Boolean(
  getReviewUserId(review)
  && getReviewUserId(review) === String(session?.user?._id || session?.user?.id || ''),
);

const normalizeReviewForm = (form) => ({
  rating: Number(form?.rating || 0),
  title: String(form?.title || '').trim(),
  comment: String(form?.comment || '').trim(),
});

const validateReviewForm = (form) => {
  const normalized = normalizeReviewForm(form);
  const errors = {};
  if (!Number.isInteger(normalized.rating) || normalized.rating < 1 || normalized.rating > 5) {
    errors.rating = 'Selecciona una valoración entre 1 y 5 estrellas.';
  }
  if (normalized.title.length > 120) {
    errors.title = 'El título no puede superar los 120 caracteres.';
  }
  if (normalized.comment.length < 3) {
    errors.comment = 'La opinión debe tener al menos 3 caracteres.';
  } else if (normalized.comment.length > 2000) {
    errors.comment = 'La opinión no puede superar los 2000 caracteres.';
  }
  return { errors, normalized };
};

const replaceReviewById = (reviews, review) => {
  const reviewId = getReviewId(review);
  const current = Array.isArray(reviews) ? reviews : [];
  const existingIndex = current.findIndex((item) => getReviewId(item) === reviewId);
  if (existingIndex < 0) return [review, ...current];
  return current.map((item, index) => (index === existingIndex ? review : item));
};

const getProductReviewSubmitError = (error) => {
  const message = String(error?.message || '').trim().toLowerCase();
  if (error?.code === 'SESSION_EXPIRED') {
    return PRODUCT_REVIEW_SESSION_EXPIRED_MESSAGE;
  }
  if (error?.code === 'SESSION_REFRESH_UNAVAILABLE') {
    return PRODUCT_REVIEW_SESSION_REFRESH_UNAVAILABLE_MESSAGE;
  }
  if (error?.code === 'INVALID_REVIEW_CONFIRMATION' || error?.code === 'INVALID_REVIEW_CONTEXT') {
    return 'El servidor no confirmó la opinión de forma fiable. Recarga el producto antes de reintentar.';
  }
  if (/failed to fetch|networkerror|timeout|aborted|aborterror/.test(message)) {
    return 'Se perdió la conexión. Conservamos tu texto; comprueba la opinión antes de volver a enviarla.';
  }
  if (message.includes('no token') || message.includes('invalid token') || message.includes('unauthorized')) {
    return PRODUCT_REVIEW_SESSION_EXPIRED_MESSAGE;
  }
  if (message.includes('forbidden')) {
    return 'No tienes permiso para modificar esta opinión.';
  }
  if (message.includes('not found')) {
    return 'La opinión ya no existe o el producto cambió. Conservamos tu texto para que puedas revisarlo.';
  }
  if (message.includes('rating')) {
    return 'La valoración debe estar entre 1 y 5 estrellas.';
  }
  if (message.includes('comment')) {
    return 'La opinión debe tener entre 3 y 2000 caracteres.';
  }
  if (message.includes('too many')) {
    return 'Se han realizado demasiados intentos. Espera unos minutos; tu texto permanece en el formulario.';
  }
  return 'No se pudo guardar la opinión. Conservamos los datos para que puedas revisarlos o reintentar.';
};

const getOrderCancellationError = (error) => {
  const normalizedMessage = String(error?.message || '').trim().toLowerCase();
  const reviewBeforeRetry = ' Actualiza «Pedidos» y comprueba su estado antes de reintentar.';

  if (error?.code === 'INVALID_CANCELLATION_CONFIRMATION' || error?.code === 'INVALID_CANCELLATION_CONTEXT') {
    return 'El servidor no confirmó de forma fiable la cancelación.' + reviewBeforeRetry;
  }
  if (/failed to fetch|networkerror|timeout|aborted|aborterror/.test(normalizedMessage)) {
    return 'Se perdió la conexión y no podemos confirmar si el pedido llegó a cancelarse.' + reviewBeforeRetry;
  }
  if (normalizedMessage.includes('only pending') || normalizedMessage.includes('invalid transition') || normalizedMessage.includes('conflict')) {
    return 'El pedido ya no está en un estado que permita cancelarlo desde la tienda.' + reviewBeforeRetry;
  }
  if (normalizedMessage.includes('not found')) {
    return 'No se encontró el pedido. Puede haber sido eliminado o actualizado en otra sesión.' + reviewBeforeRetry;
  }
  if (normalizedMessage.includes('forbidden') || normalizedMessage.includes('insufficient permissions')) {
    return 'No tienes permiso para cancelar este pedido.';
  }
  if (normalizedMessage.includes('no token') || normalizedMessage.includes('invalid token') || normalizedMessage.includes('unauthorized')) {
    return 'La sesión ha caducado. Inicia sesión de nuevo y revisa el estado del pedido antes de reintentar.';
  }
  if (normalizedMessage.includes('invalid id')) {
    return 'No se pudo identificar el pedido solicitado.';
  }
  if (normalizedMessage.includes('too many')) {
    return 'Se han realizado demasiados intentos. Espera unos minutos y revisa el estado del pedido.';
  }

  return 'No se pudo confirmar la cancelación del pedido.' + reviewBeforeRetry;
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
  admin: '/gestion',
};

function buildRoute(view, { categorySlug = '', productId = '' } = {}) {
  if (view === 'product' && productId) return '/producto/' + encodeURIComponent(productId);
  if (view === 'catalog' && categorySlug) return '/catalogo/' + encodeURIComponent(categorySlug);
  return routeByView[view] || routeByView.home;
}

function assignHomeImage(content, target, imageUrl) {
  if (target === 'hero.imageUrl') {
    return {
      ...content,
      hero: {
        ...content.hero,
        imageUrl,
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
          linkUrl: '',
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
  routeNavigationKey = '',
  routePath = '/',
  routeProductId = '',
  routeView = 'home',
} = {}) {
  const [session, setSession] = useState(() => sessionModel.get());
  const [sessionGeneration, setSessionGeneration] = useState(null);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [productReviewErrors, setProductReviewErrors] = useState({});
  const [productReviewFeedback, setProductReviewFeedback] = useState('');
  const [productReviewSessionAlert, setProductReviewSessionAlert] = useState(null);
  const [productReviewFocusTarget, setProductReviewFocusTarget] = useState(null);
  const [productReviewSubmitting, setProductReviewSubmitting] = useState(false);
  const [productReviewsLoading, setProductReviewsLoading] = useState(false);
  const [productReviewsLoadedFor, setProductReviewsLoadedFor] = useState('');
  const [productReviewsLoadError, setProductReviewsLoadError] = useState('');
  const [accountReviewForm, setAccountReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [selectedAccountReviewId, setSelectedAccountReviewId] = useState('');
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cancellingOrderIds, setCancellingOrderIds] = useState([]);
  const [orderCancellationErrors, setOrderCancellationErrors] = useState({});
  const [orderCancellationFocusTarget, setOrderCancellationFocusTarget] = useState(null);
  const [filters, setFilters] = useState(() => ({ ...emptyFilters }));
  const [favoriteIds, setFavoriteIds] = useState(() => favoritesModel.getAll());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(() => ({ ...initialAuthForm }));
  const [adminTab, setAdminTab] = useState('users');
  const [adminSearch, setAdminSearchState] = useState(() => ({ ...initialAdminSearch }));
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminProductsPage, setAdminProductsPage] = useState(1);
  const [adminProductsLimit, setAdminProductsLimitState] = useState(ADMIN_PRODUCTS_DEFAULT_LIMIT);
  const [adminProductsTotal, setAdminProductsTotal] = useState(0);
  const [adminProductsTotalPages, setAdminProductsTotalPages] = useState(0);
  const [adminProductsLoading, setAdminProductsLoading] = useState(false);
  const [adminProductsError, setAdminProductsError] = useState('');
  const [adminProductsQuery, setAdminProductsQuery] = useState('');
  const [adminProductsFilters, setAdminProductsFilters] = useState(() => ({ ...initialAdminProductsFilters }));
  const [adminProductsDisplayedContext, setAdminProductsDisplayedContext] = useState(null);
  const [adminProductsStale, setAdminProductsStale] = useState(false);
  const [adminProductsFocusTarget, setAdminProductsFocusTarget] = useState(null);
  const [adminProductsFormResetVersion, setAdminProductsFormResetVersion] = useState(0);
  const [adminProductMutationKeys, setAdminProductMutationKeys] = useState([]);
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
  const [checkoutFocusTarget, setCheckoutFocusTarget] = useState(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const checkoutSubmittingRef = useRef(false);
  const checkoutSubmissionContextRef = useRef(null);
  const preserveCheckoutDraftRef = useRef(false);
  const skipCheckoutSessionReloadRef = useRef(false);
  const activeSessionRef = useRef(session);
  const activeSessionGenerationRef = useRef(sessionGeneration);
  const cancellingOrderIdsRef = useRef(new Set());
  const skipOrderSessionReloadRef = useRef(false);
  const activeProductIdRef = useRef(getProductId(selectedProduct));
  const activeRouteViewRef = useRef(routeView);
  const activeRouteProductIdRef = useRef(String(routeProductId || ''));
  const productDetailLoadSequenceRef = useRef(0);
  const activeProductDetailIntentRef = useRef(null);
  const productDetailLoadCoordinatorRef = useRef(null);
  const productReviewsLoadedForRef = useRef('');
  const productReviewFormContextRef = useRef('');
  const productReviewSubmittingKeysRef = useRef(new Set());
  const adminProductsLoadSequenceRef = useRef(0);
  const adminProductsAbortControllerRef = useRef(null);
  const adminProductsContextRef = useRef(null);
  const adminProductsSnapshotRef = useRef(null);
  const adminProductMutationLocksRef = useRef(new Map());

  activeRouteViewRef.current = routeView;
  activeRouteProductIdRef.current = String(routeProductId || '');
  if (!productDetailLoadCoordinatorRef.current) {
    productDetailLoadCoordinatorRef.current = createProductDetailLoadCoordinator();
  }

  useEffect(() => {
    const adminProductMutationLocks = adminProductMutationLocksRef.current;
    if (!activeSessionRef.current) {
      invalidateSessionGeneration();
    } else {
      const initialGeneration = beginSessionGeneration();
      activeSessionGenerationRef.current = initialGeneration;
      setSessionGeneration(initialGeneration);
    }
    return () => {
      const activeGeneration = activeSessionGenerationRef.current;
      if (isSessionGenerationActive(activeGeneration)) invalidateSessionGeneration();
      adminProductsLoadSequenceRef.current += 1;
      adminProductsAbortControllerRef.current?.abort();
      adminProductsAbortControllerRef.current = null;
      adminProductsContextRef.current = null;
      adminProductsSnapshotRef.current = null;
      adminProductMutationLocks.clear();
      activeSessionGenerationRef.current = null;
    };
  }, []);

  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);
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
  const selectedProductId = getProductId(selectedProduct);
  const selectedProductForCurrentRoute = (
    routeView === 'product'
    && routeProductId
    && selectedProductId !== String(routeProductId)
  ) ? null : selectedProduct;
  const productReviewOwnerKey = getSessionOwnerKey(session);
  const productReviewSessionKey = productReviewOwnerKey && sessionGeneration
    ? productReviewOwnerKey + '|generation:' + sessionGeneration
    : '';
  const productDetailNavigationIdentity = getProductDetailNavigationIdentity({
    hasSession: Boolean(session),
    navigationKey: routeNavigationKey || routePath,
    productId: routeProductId,
    routeView,
    sessionGeneration,
    sessionOwnerKey: productReviewOwnerKey,
  });
  const ownProductReview = productReviews.find((review) => isReviewOwnedBySession(review, session));
  const ownProductReviewId = getReviewId(ownProductReview);

  const saveHomeContent = (updater) => {
    setHomeContent((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return homeContentModel.save(next);
    });
  };

  const isSessionContextCurrent = (sessionContext) => Boolean(
    sessionContext
    && sessionContext.generation === activeSessionGenerationRef.current
    && sessionContext.ownerKey === getSessionOwnerKey(activeSessionRef.current)
    && isSessionGenerationActive(sessionContext.generation)
  );

  const isAdminSessionContextCurrent = (sessionContext) => (
    isSessionContextCurrent(sessionContext)
    && activeSessionRef.current?.user?.role === 'admin'
  );

  const captureSessionContext = () => {
    const currentSession = activeSessionRef.current;
    const generation = activeSessionGenerationRef.current;
    const ownerKey = getSessionOwnerKey(currentSession);
    if (!currentSession || !ownerKey || !Number.isSafeInteger(generation)) return null;
    return Object.freeze({ generation, ownerKey });
  };

  const purgeAdministrativeState = () => {
    adminProductsLoadSequenceRef.current += 1;
    adminProductsAbortControllerRef.current?.abort();
    adminProductsAbortControllerRef.current = null;
    adminProductsContextRef.current = null;
    adminProductsSnapshotRef.current = null;
    adminProductMutationLocksRef.current.clear();
    setAdminProducts([]);
    setAdminProductsPage(1);
    setAdminProductsLimitState(ADMIN_PRODUCTS_DEFAULT_LIMIT);
    setAdminProductsTotal(0);
    setAdminProductsTotalPages(0);
    setAdminProductsLoading(false);
    setAdminProductsError('');
    setAdminProductsQuery('');
    setAdminProductsFilters({ ...initialAdminProductsFilters });
    setAdminProductsDisplayedContext(null);
    setAdminProductsStale(false);
    setAdminProductsFocusTarget(null);
    setAdminProductsFormResetVersion((version) => version + 1);
    setAdminProductMutationKeys([]);
    setAdminSearchState({ ...initialAdminSearch });
    setAdminUsers([]);
    setAdminReviews([]);
    setAdminUserForm({ ...initialAdminUserForm });
    setSelectedAdminUserId('');
    setSelectedAdminOrderId('');
    setSelectedAdminProductId('');
    setSelectedAdminCategoryId('');
    setCategoryForm({ ...initialCategoryForm });
    setProductForm({ ...initialProductForm });
    setImageForm({ ...initialImageForm });
    setHomeComponentForm({ ...initialHomeComponentForm });
    setAdminTab('users');
  };

  const applySession = (nextSession, nextGeneration) => {
    const currentOwnerKey = getSessionOwnerKey(activeSessionRef.current);
    const nextOwnerKey = getSessionOwnerKey(nextSession);
    const sessionChanged = (
      currentOwnerKey !== nextOwnerKey
      || activeSessionGenerationRef.current !== nextGeneration
      || activeSessionRef.current?.user?.role !== nextSession?.user?.role
    );
    if (!sessionChanged && checkoutSubmittingRef.current) {
      preserveCheckoutDraftRef.current = true;
      skipCheckoutSessionReloadRef.current = true;
    }
    if (!sessionChanged && cancellingOrderIdsRef.current.size) {
      if (nextOwnerKey && currentOwnerKey === nextOwnerKey) skipOrderSessionReloadRef.current = true;
    }
    if (sessionChanged) {
      productDetailLoadCoordinatorRef.current.cancel();
      checkoutSubmittingRef.current = false;
      checkoutSubmissionContextRef.current = null;
      preserveCheckoutDraftRef.current = false;
      skipCheckoutSessionReloadRef.current = false;
      cancellingOrderIdsRef.current.clear();
      skipOrderSessionReloadRef.current = false;
      productReviewSubmittingKeysRef.current.clear();
      purgeAdministrativeState();
      setCart(null);
      setOrders([]);
      setMyReviews([]);
      setReviewForm({ ...emptyReviewForm });
      setProductReviewErrors({});
      setProductReviewFeedback('');
      setProductReviewSessionAlert(null);
      setProductReviewFocusTarget(null);
      setProductReviewSubmitting(false);
      productReviewFormContextRef.current = '';
      setCancellingOrderIds([]);
      setOrderCancellationErrors({});
      setOrderCancellationFocusTarget(null);
      setSelectedAccountReviewId('');
      setCheckoutSubmitting(false);
      setNotice('');
      setBusy(false);
    }
    activeSessionRef.current = nextSession;
    activeSessionGenerationRef.current = nextGeneration;
    setSession(nextSession);
    setSessionGeneration(nextGeneration);
    if (nextSession) sessionModel.save(nextSession);
    else sessionModel.clear();
  };

  const startLogicalSession = (nextSession) => {
    const nextGeneration = beginSessionGeneration();
    applySession(nextSession, nextGeneration);
    return nextGeneration;
  };

  const endLogicalSession = (expectedContext = null) => {
    if (expectedContext && !isSessionContextCurrent(expectedContext)) return false;
    invalidateSessionGeneration();
    applySession(null, null);
    return true;
  };

  const requestWithSessionContext = (sessionContext, path, options) => {
    if (!sessionContext) return apiRequest(path, options, null);
    const requestSession = activeSessionRef.current;
    return apiRequest(path, options, requestSession, {
      generation: sessionContext.generation,
      ownerKey: sessionContext.ownerKey,
      isCurrent: () => isSessionContextCurrent(sessionContext),
      onSessionChange: (nextSession) => {
        if (!isSessionContextCurrent(sessionContext)) return false;
        if (nextSession) {
          if (getSessionOwnerKey(nextSession) !== sessionContext.ownerKey) return false;
          applySession(nextSession, sessionContext.generation);
        }
        else endLogicalSession(sessionContext);
        return true;
      },
    });
  };

  const createSessionRequest = (sessionContext) => (
    (path, options) => requestWithSessionContext(sessionContext, path, options)
  );

  const setView = (nextView, options = {}) => {
    const nextPath = buildRoute(nextView, {
      categorySlug: options.categorySlug || '',
      productId: options.productId || '',
    });

    if (navigate && routePath !== nextPath) {
      navigate(nextPath, { replace: Boolean(options.replace) });
    }
  };

  const focusProductReviewField = (field) => {
    setProductReviewFocusTarget((current) => ({
      field,
      version: Number(current?.version || 0) + 1,
    }));
  };

  useEffect(() => {
    productReviewFormContextRef.current = '';
    setReviewForm({ ...emptyReviewForm });
    setProductReviewErrors({});
    setProductReviewFeedback('');
    setProductReviewFocusTarget(null);
    setProductReviewSubmitting(false);
  }, [selectedProductId, productReviewSessionKey]);

  useEffect(() => {
    if (
      !selectedProductId
      || !productReviewOwnerKey
      || productReviewsLoading
      || productReviewsLoadedFor !== selectedProductId
    ) return;

    const contextKey = selectedProductId + '|' + productReviewSessionKey;
    if (productReviewFormContextRef.current === contextKey) return;

    productReviewFormContextRef.current = contextKey;
    setReviewForm(ownProductReview ? {
      rating: Number(ownProductReview.rating || 5),
      title: ownProductReview.title || '',
      comment: ownProductReview.comment || '',
    } : { ...emptyReviewForm });
    setProductReviewErrors({});
    setProductReviewFeedback('');
    setProductReviewFocusTarget(null);
  }, [
    ownProductReview,
    ownProductReviewId,
    productReviewOwnerKey,
    productReviewSessionKey,
    productReviewsLoadedFor,
    productReviewsLoading,
    selectedProductId,
  ]);

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
    loadHomeContent();
  }, []);

  useEffect(() => {
    if (routeView !== 'product') {
      productDetailLoadCoordinatorRef.current.cancel();
      activeProductIdRef.current = '';
      productReviewsLoadedForRef.current = '';
      setSelectedProduct(null);
      setProductReviews([]);
      setProductReviewsLoading(false);
      setProductReviewsLoadedFor('');
      setProductReviewsLoadError('');
    }
  }, [routeView]);

  async function loadHomeContent() {
    try {
      setHomeContent(await homeContentModel.loadRemote(apiRequest));
    } catch {
      setHomeContent(homeContentModel.load());
    }
  }

  const loadProductsForEffect = useEffectEvent(() => {
    void loadProducts();
  });

  useEffect(() => {
    loadProductsForEffect();
  }, [page, filters, favoriteIds]);

  const loadRouteProductForEffect = useEffectEvent((productId, navigationIdentity) => {
    return productDetailLoadCoordinatorRef.current.acquire(navigationIdentity, {
      cancel: cancelProductDetailIntent,
      start: () => startProductDetailLoad(productId),
    });
  });

  const releaseRouteProductForEffect = useEffectEvent((lease) => {
    productDetailLoadCoordinatorRef.current.release(lease);
  });

  useEffect(() => {
    if (!productDetailNavigationIdentity) return undefined;
    const lease = loadRouteProductForEffect(routeProductId, productDetailNavigationIdentity);
    return () => releaseRouteProductForEffect(lease);
  }, [productDetailNavigationIdentity, routeProductId]);

  const synchronizeSessionResources = useEffectEvent(() => {
    if (session && !sessionGeneration) return;
    if (session) {
      const preserveCheckoutDraft = checkoutSubmittingRef.current || preserveCheckoutDraftRef.current;
      const skipCheckoutSessionReload = skipCheckoutSessionReloadRef.current;
      const skipOrderSessionReload = skipOrderSessionReloadRef.current;
      if (!preserveCheckoutDraft) setShippingForm(getShippingDefaults(session));
      preserveCheckoutDraftRef.current = false;
      skipCheckoutSessionReloadRef.current = false;
      skipOrderSessionReloadRef.current = false;
      if (session.user?.role !== 'admin') {
        purgeAdministrativeState();
      }
      if (!skipCheckoutSessionReload) {
        loadCart();
        if (!skipOrderSessionReload) loadOrders();
        loadMyReviews();
        if (session.user?.role === 'admin') {
          loadAdminProducts();
          loadAdminUsers();
          loadAdminReviews();
        }
      }
    } else {
      const preserveCheckoutDraft = checkoutSubmittingRef.current || preserveCheckoutDraftRef.current;
      skipCheckoutSessionReloadRef.current = false;
      skipOrderSessionReloadRef.current = false;
      if (!preserveCheckoutDraft) setCart(null);
      setOrders([]);
      setCancellingOrderIds([]);
      setOrderCancellationErrors({});
      setOrderCancellationFocusTarget(null);
      setMyReviews([]);
      setAdminReviews([]);
      setReviewForm({ ...emptyReviewForm });
      setAccountReviewForm({ ...emptyReviewForm });
      setSelectedAccountReviewId('');
      purgeAdministrativeState();
      if (!preserveCheckoutDraft) {
        setCheckoutStep('items');
        setShippingForm(getShippingDefaults(null));
        setPaymentForm({ ...initialPaymentForm });
        setCheckoutErrors({});
        setCheckoutFocusTarget(null);
        setCheckoutSubmitting(false);
        checkoutSubmittingRef.current = false;
      }
    }
  });

  useEffect(() => {
    synchronizeSessionResources();
  }, [session?.accessToken, sessionGeneration]);

  async function loadCategories() {
    try {
      setCategories(await catalogModel.listCategories());
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadProducts({ reportError = true } = {}) {
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
      if (reportError) setNotice(error.message);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadFeaturedProducts({ reportError = true } = {}) {
    try {
      const result = await catalogModel.listProducts({
        page: 1,
        filters: { ...emptyFilters, inStock: false },
        limit: 100,
      });
      setFeaturedProducts(result.products);
    } catch (error) {
      if (reportError) setNotice(error.message);
    }
  }

  function openProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId) return;

    setSelectedProduct(product);
    setView('product', { productId });
  }

  function beginProductDetailIntent(productId) {
    const requestedProductId = String(productId || '');
    if (!requestedProductId) return null;

    const previousIntent = activeProductDetailIntentRef.current;
    previousIntent?.detailController.abort();
    previousIntent?.reviewController.abort();

    const intent = Object.freeze({
      detailController: new AbortController(),
      productId: requestedProductId,
      reviewController: new AbortController(),
      routeView: 'product',
      sequence: productDetailLoadSequenceRef.current + 1,
      sessionGeneration: activeSessionGenerationRef.current,
      sessionOwnerKey: getSessionOwnerKey(activeSessionRef.current),
    });

    productDetailLoadSequenceRef.current = intent.sequence;
    activeProductDetailIntentRef.current = intent;
    activeProductIdRef.current = requestedProductId;
    productReviewsLoadedForRef.current = '';
    setSelectedProduct((current) => (
      getProductId(current) === requestedProductId ? current : null
    ));
    setLoadingProductDetail(true);
    setProductReviews([]);
    setProductReviewsLoading(true);
    setProductReviewsLoadedFor('');
    setProductReviewsLoadError('');
    setNotice('');
    return intent;
  }

  function isProductDetailIntentCurrent(intent) {
    return Boolean(
      intent
      && activeProductDetailIntentRef.current === intent
      && productDetailLoadSequenceRef.current === intent.sequence
      && activeRouteViewRef.current === intent.routeView
      && activeRouteProductIdRef.current === intent.productId
      && activeSessionGenerationRef.current === intent.sessionGeneration
      && getSessionOwnerKey(activeSessionRef.current) === intent.sessionOwnerKey
    );
  }

  function cancelProductDetailIntent(intent) {
    if (!intent || activeProductDetailIntentRef.current !== intent) return;
    activeProductDetailIntentRef.current = null;
    productDetailLoadSequenceRef.current += 1;
    intent.detailController.abort();
    intent.reviewController.abort();
  }

  function isIntentionalProductAbort(error, controller) {
    return controller.signal.aborted && error?.name === 'AbortError';
  }

  function startProductDetailLoad(productId) {
    const intent = beginProductDetailIntent(productId);
    if (!intent) return null;
    void loadProductForIntent(intent);
    void loadProductReviewsForIntent(intent);
    return intent;
  }

  async function loadProductForIntent(intent) {
    try {
      const fullProduct = await catalogModel.getProduct(intent.productId, {
        signal: intent.detailController.signal,
      });
      if (isProductDetailIntentCurrent(intent)) setSelectedProduct(fullProduct);
    } catch (error) {
      if (isIntentionalProductAbort(error, intent.detailController)) return;
      if (!isProductDetailIntentCurrent(intent)) return;
      setNotice(error.message);
      setSelectedProduct(null);
    } finally {
      if (isProductDetailIntentCurrent(intent)) setLoadingProductDetail(false);
    }
  }

  async function loadProductReviewsForIntent(intent) {
    try {
      const nextReviews = await reviewModel.listProduct(intent.productId, {
        signal: intent.reviewController.signal,
      });
      if (isProductDetailIntentCurrent(intent)) {
        productReviewsLoadedForRef.current = intent.productId;
        setProductReviews(nextReviews);
        setProductReviewsLoadedFor(intent.productId);
      }
    } catch (error) {
      if (isIntentionalProductAbort(error, intent.reviewController)) return;
      if (isProductDetailIntentCurrent(intent)) {
        productReviewsLoadedForRef.current = '';
        setNotice(error.message);
        setProductReviews([]);
        setProductReviewsLoadedFor('');
        setProductReviewsLoadError('No se pudieron cargar las opiniones. Recarga el producto para volver a intentarlo.');
      }
    } finally {
      if (isProductDetailIntentCurrent(intent)) {
        setProductReviewsLoading(false);
      }
    }
  }

  async function loadMyReviews(sessionContext = captureSessionContext()) {
    if (!sessionContext) return;
    const sessionRequest = createSessionRequest(sessionContext);
    try {
      const nextReviews = await reviewModel.listMine(sessionRequest);
      if (isSessionContextCurrent(sessionContext)) setMyReviews(nextReviews);
    } catch {
      if (isSessionContextCurrent(sessionContext)) setMyReviews([]);
    }
  }

  async function loadAdminReviews(sessionContext = captureSessionContext()) {
    if (!sessionContext || activeSessionRef.current?.user?.role !== 'admin') return;
    const sessionRequest = createSessionRequest(sessionContext);
    try {
      const nextReviews = await reviewModel.listAll(sessionRequest);
      if (isSessionContextCurrent(sessionContext)) setAdminReviews(nextReviews);
    } catch {
      if (isSessionContextCurrent(sessionContext)) setAdminReviews([]);
    }
  }

  const syncAdminProductsRequestState = (requestContext) => {
    setAdminProductsPage(requestContext.page);
    setAdminProductsLimitState(requestContext.limit);
    setAdminProductsQuery(requestContext.query);
    setAdminProductsFilters({
      categoryId: requestContext.categoryId,
      inStock: requestContext.inStock ? 'true' : '',
      minPrice: requestContext.minPrice,
      maxPrice: requestContext.maxPrice,
      sort: requestContext.sort,
      order: requestContext.order,
    });
  };

  const isAdminProductsRequestCurrent = (sessionContext, requestSignature, loadSequence) => (
    isAdminSessionContextCurrent(sessionContext)
    && adminProductsLoadSequenceRef.current === loadSequence
    && getAdminProductsRequestSignature(adminProductsContextRef.current) === requestSignature
  );

  async function loadAdminProducts(
    sessionContext = captureSessionContext(),
    requestedValues = null,
    { intent = 'refresh' } = {},
  ) {
    if (!isAdminSessionContextCurrent(sessionContext)) return null;

    let requestContext;
    try {
      const currentContext = adminProductsContextRef.current;
      const baseContext = currentContext
        && currentContext.generation === sessionContext.generation
        && currentContext.ownerKey === sessionContext.ownerKey
        ? currentContext
        : {
          page: adminProductsPage,
          limit: adminProductsLimit,
          query: adminProductsQuery,
          ...adminProductsFilters,
        };
      requestContext = normalizeAdminProductsRequest(sessionContext, {
        ...baseContext,
        ...(requestedValues || {}),
      });
    } catch (error) {
      if (isAdminSessionContextCurrent(sessionContext)) {
        setAdminProductsError(error.message);
        setAdminProductsStale(Boolean(adminProductsSnapshotRef.current));
      }
      return null;
    }

    const requestSignature = getAdminProductsRequestSignature(requestContext);
    adminProductsContextRef.current = requestContext;
    syncAdminProductsRequestState(requestContext);

    const loadSequence = adminProductsLoadSequenceRef.current + 1;
    adminProductsLoadSequenceRef.current = loadSequence;
    adminProductsAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    adminProductsAbortControllerRef.current = abortController;
    const timeoutId = setTimeout(
      () => abortController.abort(),
      ADMIN_PRODUCTS_LOAD_TIMEOUT_MS,
    );
    const sessionRequest = createSessionRequest(sessionContext);

    setAdminProductsLoading(true);
    setAdminProductsError('');
    setAdminProductsStale(false);

    try {
      const result = await adminModel.listProducts(sessionRequest, {
        page: requestContext.page,
        limit: requestContext.limit,
        search: requestContext.query,
        categoryId: requestContext.categoryId,
        inStock: requestContext.inStock,
        minPrice: requestContext.minPrice,
        maxPrice: requestContext.maxPrice,
        sort: requestContext.sort,
        order: requestContext.order,
        signal: abortController.signal,
      });
      if (!isAdminProductsRequestCurrent(sessionContext, requestSignature, loadSequence)) return null;

      const snapshot = Object.freeze({
        data: result.data,
        pagination: result.pagination,
        context: requestContext,
        signature: requestSignature,
      });
      adminProductsSnapshotRef.current = snapshot;
      setAdminProducts(result.data);
      setAdminProductsTotal(result.pagination.total);
      setAdminProductsTotalPages(result.pagination.totalPages);
      setAdminProductsDisplayedContext(requestContext);
      setAdminProductsStale(false);
      if (intent === 'pagination') {
        setAdminProductsFocusTarget((current) => ({
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
          total: result.pagination.total,
          version: Number(current?.version || 0) + 1,
        }));
      }
      return result;
    } catch (error) {
      if ((error?.status === 401 || error?.status === 403) && isSessionContextCurrent(sessionContext)) {
        endLogicalSession(sessionContext);
        return null;
      }
      if (isAdminProductsRequestCurrent(sessionContext, requestSignature, loadSequence)) {
        setAdminProductsError(getAdminProductsLoadError(error));
        setAdminProductsStale(Boolean(adminProductsSnapshotRef.current));
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      if (adminProductsAbortControllerRef.current === abortController) {
        adminProductsAbortControllerRef.current = null;
      }
      if (isAdminProductsRequestCurrent(sessionContext, requestSignature, loadSequence)) {
        setAdminProductsLoading(false);
      }
    }
  }

  async function loadAdminUsers(sessionContext = captureSessionContext()) {
    if (!sessionContext) return;
    const sessionRequest = createSessionRequest(sessionContext);
    try {
      const nextUsers = await adminModel.listUsers(sessionRequest);
      if (isSessionContextCurrent(sessionContext)) setAdminUsers(nextUsers);
    } catch (error) {
      if (isSessionContextCurrent(sessionContext)) setNotice(error.message);
    }
  }

  async function loadCart(sessionContext = captureSessionContext()) {
    if (!sessionContext) return;
    const sessionRequest = createSessionRequest(sessionContext);
    try {
      const nextCart = await cartModel.get(sessionRequest);
      if (isSessionContextCurrent(sessionContext)) setCart(nextCart);
    } catch (error) {
      if (isSessionContextCurrent(sessionContext)) setNotice(error.message);
    }
  }

  async function loadOrders(sessionContext = captureSessionContext()) {
    if (!sessionContext) {
      setOrders([]);
      return;
    }
    const sessionRequest = createSessionRequest(sessionContext);
    const requestSession = activeSessionRef.current;
    try {
      const nextOrders = requestSession?.user?.role === 'admin'
        ? await orderModel.listAll(sessionRequest)
        : await orderModel.listByEmail(sessionRequest, requestSession?.user?.email);
      if (isSessionContextCurrent(sessionContext)) setOrders(nextOrders);
    } catch {
      if (isSessionContextCurrent(sessionContext)) setOrders([]);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      if (authMode === 'login') {
        const next = await authModel.login(authForm.email, authForm.password);
        startLogicalSession(next);
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
    const refreshToken = activeSessionRef.current?.refreshToken;
    endLogicalSession();
    setView('catalog');
    setNotice('Sesión cerrada');
    try {
      await authModel.logout(refreshToken);
    } catch {
      // The local session can still be closed even if the server call fails.
    }
  }

  async function addToCart(product, quantity = 1) {
    const operationContext = captureSessionContext();
    if (!operationContext) {
      setView('account');
      setNotice('Inicia sesión para añadir productos al carrito.');
      return;
    }
    if (productModel.getAvailableStock(product, reservedBySku) <= 0) {
      setNotice('No quedan más unidades disponibles de este producto.');
      return;
    }
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const nextCart = await cartModel.addItem(operationRequest, product, quantity);
      if (isSessionContextCurrent(operationContext)) {
        setCart(nextCart);
        setNotice(product.name + ' añadido al carrito');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function updateCartItem(item, quantity) {
    if (quantity < 1) return removeCartItem(item);
    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const nextCart = await cartModel.updateItem(operationRequest, item, quantity);
      if (isSessionContextCurrent(operationContext)) setCart(nextCart);
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function removeCartItem(item) {
    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const nextCart = await cartModel.removeItem(operationRequest, item);
      if (isSessionContextCurrent(operationContext)) setCart(nextCart);
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function clearCart() {
    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const nextCart = await cartModel.clear(operationRequest);
      if (isSessionContextCurrent(operationContext)) {
        setCart(nextCart);
        setCheckoutStep('items');
        setCheckoutErrors({});
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
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
    setProductReviewErrors((current) => ({
      ...current,
      [field]: undefined,
      submit: undefined,
    }));
    setProductReviewFeedback('');
    setProductReviewFocusTarget(null);
  };

  const updateAccountReviewForm = (field, value) => {
    setAccountReviewForm((current) => ({ ...current, [field]: value }));
  };

  async function submitProductReview(event) {
    event.preventDefault();
    const productId = getProductId(selectedProduct);
    const submissionContext = captureSessionContext();
    if (!submissionContext) {
      setNotice('Entra en tu cuenta para dejar una opinión.');
      setView('account');
      return;
    }
    if (!productId) return;
    if (productReviewsLoading || productReviewsLoadedForRef.current !== productId) {
      setProductReviewErrors({
        submit: 'Espera a que comprobemos si ya existe una opinión tuya para este producto.',
      });
      focusProductReviewField('submit');
      return;
    }

    const { errors, normalized } = validateReviewForm(reviewForm);
    if (Object.keys(errors).length) {
      setProductReviewErrors(errors);
      setProductReviewFeedback('');
      focusProductReviewField(['rating', 'title', 'comment'].find((field) => errors[field]));
      return;
    }

    const submissionSession = activeSessionRef.current;
    const reviewToUpdate = productReviews.find((review) => (
      isReviewOwnedBySession(review, submissionSession)
    ));
    const reviewId = getReviewId(reviewToUpdate);
    const submissionKey = 'generation:' + submissionContext.generation
      + '|' + submissionContext.ownerKey
      + '|' + productId
      + '|' + (reviewId || 'create');
    if (productReviewSubmittingKeysRef.current.has(submissionKey)) return;

    const submissionRequest = createSessionRequest(submissionContext);
    productReviewSubmittingKeysRef.current.add(submissionKey);
    setProductReviewSubmitting(true);
    setProductReviewErrors({});
    setProductReviewFeedback('');
    setProductReviewFocusTarget(null);
    try {
      const savedReview = reviewId
        ? await reviewModel.update(submissionRequest, reviewId, normalized)
        : await reviewModel.create(submissionRequest, productId, normalized);

      if (
        !isSessionContextCurrent(submissionContext)
        || activeProductIdRef.current !== productId
      ) return;

      if (
        getReviewProductId(savedReview) !== productId
        || !isReviewOwnedBySession(savedReview, submissionSession)
      ) {
        const error = new Error('La opinión confirmada no corresponde al contexto actual.');
        error.code = 'INVALID_REVIEW_CONTEXT';
        throw error;
      }

      setProductReviews((current) => replaceReviewById(current, savedReview));
      setMyReviews((current) => replaceReviewById(current, savedReview));
      if (submissionSession.user?.role === 'admin') {
        setAdminReviews((current) => replaceReviewById(current, savedReview));
      }
      setReviewForm({
        rating: Number(savedReview.rating),
        title: savedReview.title || '',
        comment: savedReview.comment || '',
      });
      const feedback = reviewId
        ? 'Opinión actualizada correctamente.'
        : 'Opinión publicada correctamente.';
      setProductReviewFeedback(feedback);
      setNotice(feedback);
    } catch (error) {
      if (
        error?.code === 'SESSION_EXPIRED'
        && !activeSessionGenerationRef.current
        && !activeSessionRef.current
        && activeProductIdRef.current === productId
      ) {
        setProductReviewSessionAlert((current) => ({
          message: PRODUCT_REVIEW_SESSION_EXPIRED_MESSAGE,
          version: Number(current?.version || 0) + 1,
        }));
        setNotice('');
        return;
      }
      if (
        isSessionContextCurrent(submissionContext)
        && activeProductIdRef.current === productId
      ) {
        const message = getProductReviewSubmitError(error);
        setProductReviewErrors({ submit: message });
        setProductReviewFeedback('');
        focusProductReviewField('submit');
        setNotice('No se pudo guardar la opinión. Revisa el mensaje del formulario.');
      }
    } finally {
      productReviewSubmittingKeysRef.current.delete(submissionKey);
      if (
        isSessionContextCurrent(submissionContext)
        && activeProductIdRef.current === productId
      ) {
        const activePrefix = 'generation:' + submissionContext.generation
          + '|' + submissionContext.ownerKey
          + '|' + productId
          + '|';
        setProductReviewSubmitting(
          [...productReviewSubmittingKeysRef.current].some((key) => key.startsWith(activePrefix)),
        );
      }
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

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      await reviewModel.update(operationRequest, selectedAccountReviewId, accountReviewForm);
      if (!isSessionContextCurrent(operationContext)) return;
      setSelectedAccountReviewId('');
      setAccountReviewForm({ ...emptyReviewForm });
      await loadMyReviews(operationContext);
      await loadAdminReviews(operationContext);
      if (isSessionContextCurrent(operationContext)) {
        setNotice('Opinión actualizada correctamente.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function deleteReview(review) {
    const reviewId = review?._id || review?.id;
    if (!reviewId) return;

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      await reviewModel.delete(operationRequest, reviewId);
      if (!isSessionContextCurrent(operationContext)) return;
      if (selectedAccountReviewId === reviewId) {
        setSelectedAccountReviewId('');
        setAccountReviewForm({ ...emptyReviewForm });
      }
      await loadMyReviews(operationContext);
      await loadAdminReviews(operationContext);
      if (isSessionContextCurrent(operationContext)) {
        setNotice('Opinión eliminada correctamente.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
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
      setCheckoutFocusTarget({
        field: getFirstErrorField(errors, ['street', 'codePostal', 'city', 'country', 'phone']),
      });
      setNotice('Revisa la dirección de envío.');
      return;
    }
    setCheckoutErrors({});
    setCheckoutFocusTarget(null);
    setCheckoutStep('payment');
  }

  async function createOrder(event) {
    event?.preventDefault();
    const submissionContext = captureSessionContext();
    if (
      !submissionContext
      || checkoutSubmittingRef.current
      || !cartItems.length
      || !activeSessionRef.current?.user?.email
    ) return;
    const shippingErrors = validateShippingForm(shippingForm);
    const confirmationErrors = validateCheckoutConfirmation(paymentForm);
    if (Object.keys(shippingErrors).length) {
      setCheckoutErrors(shippingErrors);
      setCheckoutStep('shipping');
      setCheckoutFocusTarget({
        field: getFirstErrorField(shippingErrors, ['street', 'codePostal', 'city', 'country', 'phone']),
      });
      setNotice('Revisa la dirección de envío.');
      return;
    }
    if (Object.keys(confirmationErrors).length) {
      setCheckoutErrors(confirmationErrors);
      setCheckoutStep('payment');
      setCheckoutFocusTarget({
        field: getFirstErrorField(confirmationErrors, ['accepted']),
      });
      setNotice('Acepta las condiciones de la beta para registrar el pedido.');
      return;
    }

    checkoutSubmittingRef.current = true;
    checkoutSubmissionContextRef.current = submissionContext;
    setCheckoutSubmitting(true);
    setCheckoutErrors({});
    setCheckoutFocusTarget(null);
    const submissionRequest = createSessionRequest(submissionContext);
    const submissionSession = activeSessionRef.current;
    try {
      const createdOrder = await orderModel.createFromCart(
        submissionRequest,
        submissionSession.user.email,
        cartItems,
        shippingForm,
      );
      if (!isSessionContextCurrent(submissionContext)) return;
      setCart((current) => ({ ...(current || {}), items: [] }));
      setOrders((current) => {
        const createdId = createdOrder?._id || createdOrder?.id;
        return [
          createdOrder,
          ...current.filter((order) => (order?._id || order?.id) !== createdId),
        ];
      });
      void loadProducts({ reportError: false });
      setCheckoutStep('items');
      setCheckoutErrors({});
      setPaymentForm({ ...initialPaymentForm });
      setView('orders');
      setNotice('Pedido registrado. Permanece pendiente y el pago real todavía no está integrado.');
    } catch (error) {
      if (
        isSessionContextCurrent(submissionContext)
        || (error?.code === 'SESSION_EXPIRED' && !activeSessionRef.current)
      ) {
        setCheckoutErrors({ submit: getCheckoutSubmitError(error) });
        setCheckoutFocusTarget({ field: 'submit' });
        setNotice('No se pudo confirmar el pedido. Revisa el error mostrado en el checkout.');
      }
    } finally {
      if (
        checkoutSubmissionContextRef.current === submissionContext
        && isSessionContextCurrent(submissionContext)
      ) {
        checkoutSubmittingRef.current = false;
        checkoutSubmissionContextRef.current = null;
        setCheckoutSubmitting(false);
      }
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

  const applyCommerceCategoryFilters = useCallback((label) => {
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
  }, [categories]);

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
  }, [routeView, routeCategorySlug, applyCommerceCategoryFilters]);

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

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const result = await adminModel.uploadHomeImages(operationRequest, fileList.slice(0, 1));
      if (!isSessionContextCurrent(operationContext)) return;
      const imageUrl = result?.images?.[0]?.url;
      if (!imageUrl) throw new Error('No se recibió la URL de la imagen.');

      if (target.startsWith('component.')) {
        updateHomeComponentForm(target.replace('component.', ''), imageUrl);
        setNotice('Imagen subida y asignada. Añade el componente para guardarla en la portada.');
        return;
      }

      const nextHomeContent = homeContentModel.save(assignHomeImage(homeContent, target, imageUrl));
      setHomeContent(nextHomeContent);
      const savedHomeContent = await homeContentModel.saveRemote(operationRequest, nextHomeContent);
      if (isSessionContextCurrent(operationContext)) {
        setHomeContent(savedHomeContent);
        setNotice('Imagen subida, asignada y guardada en Atlas.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) {
        setNotice(error.message === 'Internal server error'
          ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
          : error.message);
      }
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
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
          linkUrl: '',
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
        linkUrl: homeComponentForm.itemOneLinkUrl.trim(),
      },
      {
        title: homeComponentForm.itemTwoTitle.trim(),
        body: homeComponentForm.itemTwoBody.trim(),
        imageUrl: homeComponentForm.itemTwoImageUrl.trim(),
        linkUrl: homeComponentForm.itemTwoLinkUrl.trim(),
      },
      {
        title: homeComponentForm.itemThreeTitle.trim(),
        body: homeComponentForm.itemThreeBody.trim(),
        imageUrl: homeComponentForm.itemThreeImageUrl.trim(),
        linkUrl: homeComponentForm.itemThreeLinkUrl.trim(),
      },
    ].filter((item) => item.title || item.body || item.imageUrl || item.linkUrl);

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
          items: bannerItems,
          linkUrl: homeComponentForm.linkUrl.trim(),
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
    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const savedHomeContent = await homeContentModel.saveRemote(operationRequest, homeContent);
      if (isSessionContextCurrent(operationContext)) {
        setHomeContent(savedHomeContent);
        setNotice('Portada guardada en Atlas.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  const updateAdminUserForm = (field, value) => {
    setAdminUserForm((current) => ({ ...current, [field]: value }));
  };

  const setAdminSearch = (key, value) => {
    setAdminSearchState((current) => ({ ...current, [key]: value }));
  };

  const getCurrentAdminProductsContext = (sessionContext) => {
    const current = adminProductsContextRef.current;
    if (
      current
      && current.generation === sessionContext?.generation
      && current.ownerKey === sessionContext?.ownerKey
    ) return current;
    return normalizeAdminProductsRequest(sessionContext, {
      page: adminProductsPage,
      limit: adminProductsLimit,
      query: adminProductsQuery,
      ...adminProductsFilters,
    });
  };

  const requestAdminProductsChange = (changes, intent = 'query') => {
    const sessionContext = captureSessionContext();
    if (!isAdminSessionContextCurrent(sessionContext)) return;
    let currentContext;
    try {
      currentContext = getCurrentAdminProductsContext(sessionContext);
    } catch (error) {
      setAdminProductsError(error.message);
      return;
    }
    void loadAdminProducts(sessionContext, { ...currentContext, ...changes }, { intent });
  };

  const goToAdminProductsPage = (nextPage) => {
    if (adminProductsTotalPages === 0) return;
    const currentPage = adminProductsContextRef.current?.page || adminProductsPage;
    const normalizedPage = Math.min(
      adminProductsTotalPages,
      normalizeAdminProductsPage(nextPage, currentPage),
    );
    if (normalizedPage === currentPage) return;
    requestAdminProductsChange({ page: normalizedPage }, 'pagination');
  };

  const changeAdminProductsLimit = (value) => {
    const nextLimit = Number(value);
    if (!ADMIN_PRODUCTS_LIMIT_OPTIONS.includes(nextLimit)) {
      setAdminProductsError('El límite solicitado no es válido.');
      return;
    }
    if (nextLimit === (adminProductsContextRef.current?.limit || adminProductsLimit)) return;
    requestAdminProductsChange({ page: 1, limit: nextLimit });
  };

  const applyAdminProductsSearch = (event) => {
    event?.preventDefault();
    const nextQuery = String(adminSearch.products || '').trim();
    requestAdminProductsChange({ page: 1, query: nextQuery });
  };

  const clearAdminProductsSearch = () => {
    setAdminSearchState((current) => ({ ...current, products: '' }));
    requestAdminProductsChange({ page: 1, query: '' });
  };

  const setAdminProductsFilterValue = (field, value) => {
    if (!Object.hasOwn(initialAdminProductsFilters, field)) return;
    setAdminProductsFilters((current) => ({ ...current, [field]: value }));
  };

  const changeAdminProductsFilter = (field, value) => {
    if (!['categoryId', 'inStock', 'sort', 'order'].includes(field)) return;
    if (field === 'categoryId' && value && !categories.some((category) => String(category._id || category.id) === value)) {
      setAdminProductsError('La categoría seleccionada no es válida.');
      return;
    }
    if (field === 'inStock' && !['', 'true'].includes(value)) {
      setAdminProductsError('El filtro de stock no es válido.');
      return;
    }
    if (field === 'sort' && !ADMIN_PRODUCTS_SORT_OPTIONS.includes(value)) {
      setAdminProductsError('El criterio de ordenación no es válido.');
      return;
    }
    if (field === 'order' && !ADMIN_PRODUCTS_ORDER_OPTIONS.includes(value)) {
      setAdminProductsError('La dirección de ordenación no es válida.');
      return;
    }
    setAdminProductsFilters((current) => ({ ...current, [field]: value }));
    requestAdminProductsChange({ page: 1, [field]: value });
  };

  const applyAdminProductsFilters = (event) => {
    event?.preventDefault();
    requestAdminProductsChange({ page: 1, ...adminProductsFilters });
  };

  const clearAdminProductsFilters = () => {
    setAdminProductsFilters({ ...initialAdminProductsFilters });
    requestAdminProductsChange({ page: 1, ...initialAdminProductsFilters });
  };

  const retryAdminProducts = () => {
    const sessionContext = captureSessionContext();
    if (!isAdminSessionContextCurrent(sessionContext)) return;
    void loadAdminProducts(sessionContext, getCurrentAdminProductsContext(sessionContext));
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

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      const updated = await adminModel.updateUser(operationRequest, selectedAdminUserId, adminUserForm);
      if (!isSessionContextCurrent(operationContext)) return;
      await loadAdminUsers(operationContext);
      if (isSessionContextCurrent(operationContext)) {
        selectAdminUser(updated);
        setNotice('Usuario actualizado correctamente.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function deleteAdminUser(user) {
    const userId = user?._id || user?.id;
    if (!userId) return;
    if (String(userId) === String(session?.user?._id || session?.user?.id)) {
      setNotice('No puedes eliminar tu propio usuario administrador desde aquí.');
      return;
    }

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      await adminModel.deleteUser(operationRequest, userId);
      await loadAdminUsers(operationContext);
      if (isSessionContextCurrent(operationContext)) {
        if (selectedAdminUserId === userId) {
          setSelectedAdminUserId('');
          setSelectedAdminOrderId('');
          setAdminUserForm({ ...initialAdminUserForm });
        }
        setNotice('Usuario eliminado correctamente.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      if (selectedAdminCategoryId) {
        await adminModel.updateCategory(operationRequest, selectedAdminCategoryId, categoryForm);
        if (isSessionContextCurrent(operationContext)) {
          setNotice('Categoría actualizada correctamente.');
        }
      } else {
        await adminModel.createCategory(operationRequest, categoryForm);
        if (isSessionContextCurrent(operationContext)) {
          setNotice('Categoría creada correctamente.');
        }
      }
      if (isSessionContextCurrent(operationContext)) {
        resetCategoryForm();
        await loadCategories();
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function deleteCategory(category) {
    const categoryId = category?._id || category?.id;
    if (!categoryId) return;

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      await adminModel.deleteCategory(operationRequest, categoryId);
      if (isSessionContextCurrent(operationContext)) {
        if (selectedAdminCategoryId === categoryId) resetCategoryForm();
        await loadCategories();
        if (isSessionContextCurrent(operationContext)) {
          setNotice('Categoría eliminada correctamente.');
        }
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  async function createProduct(event) {
    event?.preventDefault();
    const operationContext = captureSessionContext();
    if (!isAdminSessionContextCurrent(operationContext)) return;
    const productId = selectedAdminProductId || '';
    const entityKey = productId ? 'product:' + productId : 'create';
    const lockKey = operationContext.generation + '|' + operationContext.ownerKey + '|' + entityKey;
    if (adminProductMutationLocksRef.current.has(lockKey)) return;
    const lockToken = Symbol(entityKey);
    adminProductMutationLocksRef.current.set(lockKey, { token: lockToken, entityKey });
    setAdminProductMutationKeys(Array.from(
      adminProductMutationLocksRef.current.values(),
      (lock) => lock.entityKey,
    ));
    const operationRequest = createSessionRequest(operationContext);
    try {
      await (productId
        ? adminModel.updateProduct(operationRequest, productId, productForm)
        : adminModel.createProduct(operationRequest, productForm));
      if (!isAdminSessionContextCurrent(operationContext)) return;
      resetProductForm();
      const latestContext = adminProductsContextRef.current;
      if (!latestContext || latestContext.generation !== operationContext.generation) return;
      await loadAdminProducts(operationContext, latestContext);
      if (isAdminSessionContextCurrent(operationContext)) {
        setNotice(productId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      }
    } catch (error) {
      if ((error?.status === 401 || error?.status === 403) && isSessionContextCurrent(operationContext)) {
        endLogicalSession(operationContext);
      } else if (isAdminSessionContextCurrent(operationContext)) {
        setNotice(error.message);
      }
    } finally {
      const activeLock = adminProductMutationLocksRef.current.get(lockKey);
      if (activeLock?.token === lockToken) {
        adminProductMutationLocksRef.current.delete(lockKey);
        setAdminProductMutationKeys(Array.from(
          adminProductMutationLocksRef.current.values(),
          (lock) => lock.entityKey,
        ));
      }
    }
  }

  async function deleteProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId) return;

    const operationContext = captureSessionContext();
    if (!isAdminSessionContextCurrent(operationContext)) return;
    const entityKey = 'product:' + productId;
    const lockKey = operationContext.generation + '|' + operationContext.ownerKey + '|' + entityKey;
    if (adminProductMutationLocksRef.current.has(lockKey)) return;
    const lockToken = Symbol(entityKey);
    adminProductMutationLocksRef.current.set(lockKey, { token: lockToken, entityKey });
    setAdminProductMutationKeys(Array.from(
      adminProductMutationLocksRef.current.values(),
      (lock) => lock.entityKey,
    ));
    const operationRequest = createSessionRequest(operationContext);
    try {
      await adminModel.deleteProduct(operationRequest, productId);
      if (!isAdminSessionContextCurrent(operationContext)) return;
      if (selectedAdminProductId === productId) resetProductForm();
      let latestContext = adminProductsContextRef.current;
      const snapshot = adminProductsSnapshotRef.current;
      if (!latestContext || latestContext.generation !== operationContext.generation) return;
      if (
        snapshot
        && snapshot.signature === getAdminProductsRequestSignature(latestContext)
        && snapshot.data.length === 1
        && String(snapshot.data[0]?._id || snapshot.data[0]?.id) === String(productId)
        && latestContext.page > 1
      ) {
        latestContext = normalizeAdminProductsRequest(operationContext, {
          ...latestContext,
          page: latestContext.page - 1,
        });
      }
      await loadAdminProducts(operationContext, latestContext);
      if (isAdminSessionContextCurrent(operationContext)) {
        setNotice('Producto eliminado correctamente.');
      }
    } catch (error) {
      if ((error?.status === 401 || error?.status === 403) && isSessionContextCurrent(operationContext)) {
        endLogicalSession(operationContext);
      } else if (isAdminSessionContextCurrent(operationContext)) {
        setNotice(error.message);
      }
    } finally {
      const activeLock = adminProductMutationLocksRef.current.get(lockKey);
      if (activeLock?.token === lockToken) {
        adminProductMutationLocksRef.current.delete(lockKey);
        setAdminProductMutationKeys(Array.from(
          adminProductMutationLocksRef.current.values(),
          (lock) => lock.entityKey,
        ));
      }
    }
  }

  async function uploadProductImages(event) {
    event.preventDefault();
    if (!imageForm.productId || imageForm.files.length === 0) {
      setNotice('Elige un producto y al menos una imagen.');
      return;
    }

    const productId = imageForm.productId;
    const files = imageForm.files;
    const operationContext = captureSessionContext();
    if (!isAdminSessionContextCurrent(operationContext)) return;
    const entityKey = 'product:' + productId;
    const lockKey = operationContext.generation + '|' + operationContext.ownerKey + '|' + entityKey;
    if (adminProductMutationLocksRef.current.has(lockKey)) return;
    const lockToken = Symbol(entityKey);
    adminProductMutationLocksRef.current.set(lockKey, { token: lockToken, entityKey });
    setAdminProductMutationKeys(Array.from(
      adminProductMutationLocksRef.current.values(),
      (lock) => lock.entityKey,
    ));
    const operationRequest = createSessionRequest(operationContext);
    try {
      const updated = await adminModel.uploadProductImages(operationRequest, productId, files);
      if (!isAdminSessionContextCurrent(operationContext)) return;
      setImageForm({ ...initialImageForm, productId });
      setProductForm((current) => ({
        ...current,
        images: Array.isArray(updated?.images) ? updated.images : current.images,
      }));
      const latestContext = adminProductsContextRef.current;
      if (!latestContext || latestContext.generation !== operationContext.generation) return;
      await loadAdminProducts(operationContext, latestContext);
      if (isAdminSessionContextCurrent(operationContext)) setNotice('Imágenes subidas correctamente.');
    } catch (error) {
      if ((error?.status === 401 || error?.status === 403) && isSessionContextCurrent(operationContext)) {
        endLogicalSession(operationContext);
      } else if (isAdminSessionContextCurrent(operationContext)) {
        setNotice(error.message === 'Internal server error'
          ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
          : error.message);
      }
    } finally {
      const activeLock = adminProductMutationLocksRef.current.get(lockKey);
      if (activeLock?.token === lockToken) {
        adminProductMutationLocksRef.current.delete(lockKey);
        setAdminProductMutationKeys(Array.from(
          adminProductMutationLocksRef.current.values(),
          (lock) => lock.entityKey,
        ));
      }
    }
  }

  async function saveImageUrl(event) {
    event.preventDefault();
    const product = adminProducts.find((item) => (item._id || item.id) === imageForm.productId);
    if (!product || !imageForm.imageUrl.trim()) {
      setNotice('Elige un producto y pega una URL de imagen válida.');
      return;
    }

    const productId = imageForm.productId;
    const imageUrl = imageForm.imageUrl;
    const imageName = imageForm.imageName;
    const operationContext = captureSessionContext();
    if (!isAdminSessionContextCurrent(operationContext)) return;
    const entityKey = 'product:' + productId;
    const lockKey = operationContext.generation + '|' + operationContext.ownerKey + '|' + entityKey;
    if (adminProductMutationLocksRef.current.has(lockKey)) return;
    const lockToken = Symbol(entityKey);
    adminProductMutationLocksRef.current.set(lockKey, { token: lockToken, entityKey });
    setAdminProductMutationKeys(Array.from(
      adminProductMutationLocksRef.current.values(),
      (lock) => lock.entityKey,
    ));
    const operationRequest = createSessionRequest(operationContext);
    try {
      await adminModel.saveImageUrl(operationRequest, product, imageUrl, imageName);
      if (!isAdminSessionContextCurrent(operationContext)) return;
      setImageForm({ ...initialImageForm, productId });
      const latestContext = adminProductsContextRef.current;
      if (!latestContext || latestContext.generation !== operationContext.generation) return;
      await loadAdminProducts(operationContext, latestContext);
      if (isAdminSessionContextCurrent(operationContext)) setNotice('Imagen guardada desde URL.');
    } catch (error) {
      if ((error?.status === 401 || error?.status === 403) && isSessionContextCurrent(operationContext)) {
        endLogicalSession(operationContext);
      } else if (isAdminSessionContextCurrent(operationContext)) {
        setNotice(error.message);
      }
    } finally {
      const activeLock = adminProductMutationLocksRef.current.get(lockKey);
      if (activeLock?.token === lockToken) {
        adminProductMutationLocksRef.current.delete(lockKey);
        setAdminProductMutationKeys(Array.from(
          adminProductMutationLocksRef.current.values(),
          (lock) => lock.entityKey,
        ));
      }
    }
  }

  async function cancelOrder(order) {
    const orderId = getOrderId(order);
    const targetOrder = orders.find((item) => getOrderId(item) === orderId);
    const cancellationContext = captureSessionContext();
    const cancellationSession = activeSessionRef.current;
    const cancellationLockKey = cancellationContext
      ? 'generation:' + cancellationContext.generation + '|order:' + orderId
      : '';
    const setCancellationError = (message) => {
      if (!orderId) {
        setNotice(message);
        return;
      }
      setOrderCancellationErrors((current) => ({ ...current, [orderId]: message }));
      setOrderCancellationFocusTarget({ orderId });
      setNotice(activeSessionRef.current
        ? 'No se pudo confirmar la cancelación. Revisa el pedido indicado.'
        : message);
    };

    if (!orderId || !targetOrder) {
      setCancellationError('No se pudo identificar el pedido en la lista actual. Actualiza «Pedidos» antes de reintentar.');
      return null;
    }
    if (!cancellationContext || !cancellationSession?.user || cancellationSession.user.role === 'admin') {
      setCancellationError('Inicia sesión con la cuenta propietaria para cancelar este pedido.');
      return null;
    }
    if (!isOrderOwnedBySession(targetOrder, cancellationSession)) {
      setCancellationError('No tienes permiso para cancelar este pedido.');
      return null;
    }
    if (targetOrder.status !== 'pending') {
      setCancellationError('Solo los pedidos pendientes pueden cancelarse desde la tienda.');
      return null;
    }
    if (cancellingOrderIdsRef.current.has(cancellationLockKey)) return null;

    const cancellationRequest = createSessionRequest(cancellationContext);
    cancellingOrderIdsRef.current.add(cancellationLockKey);
    setCancellingOrderIds((current) => (
      current.includes(orderId) ? current : [...current, orderId]
    ));
    setOrderCancellationErrors((current) => ({ ...current, [orderId]: undefined }));
    setOrderCancellationFocusTarget(null);

    try {
      const updatedOrder = await orderModel.cancel(cancellationRequest, orderId);
      if (!isSessionContextCurrent(cancellationContext)) return null;
      if (
        !isOrderOwnedBySession(updatedOrder, cancellationSession)
        || updatedOrder.cancellation?.source !== 'client'
      ) {
        const error = new Error('La cancelación no corresponde al pedido solicitado.');
        error.code = 'INVALID_CANCELLATION_CONTEXT';
        throw error;
      }

      setOrders((current) => current.map((item) => (
        getOrderId(item) === orderId ? updatedOrder : item
      )));
      void loadProducts({ reportError: false });
      void loadFeaturedProducts({ reportError: false });
      setNotice('Pedido ' + orderId.slice(-6) + ' cancelado. El servidor ha confirmado la anulación.');
      return updatedOrder;
    } catch (error) {
      if (isSessionContextCurrent(cancellationContext)) {
        setCancellationError(getOrderCancellationError(error));
      }
      return null;
    } finally {
      cancellingOrderIdsRef.current.delete(cancellationLockKey);
      if (isSessionContextCurrent(cancellationContext)) {
        setCancellingOrderIds((current) => current.filter((id) => id !== orderId));
      }
    }
  }

  async function deleteOrder(order) {
    const orderId = order._id || order.id;
    if (!orderId || session?.user?.role !== 'admin') return;

    const operationContext = captureSessionContext();
    if (!operationContext) return;
    const operationRequest = createSessionRequest(operationContext);
    setBusy(true);
    try {
      await orderModel.delete(operationRequest, orderId);
      await loadOrders(operationContext);
      await loadProducts();
      await loadFeaturedProducts();
      if (isSessionContextCurrent(operationContext)) {
        setNotice('Pedido eliminado y stock repuesto.');
      }
    } catch (error) {
      if (isSessionContextCurrent(operationContext)) setNotice(error.message);
    } finally {
      if (isSessionContextCurrent(operationContext)) setBusy(false);
    }
  }

  return {
    state: {
      adminTab,
      adminProducts,
      adminProductsError,
      adminProductsDisplayedContext,
      adminProductsFilters,
      adminProductsFocusTarget,
      adminProductsFormResetVersion,
      adminProductsLimit,
      adminProductsLoading,
      adminProductsPage,
      adminProductsQuery,
      adminProductsStale,
      adminProductsTotal,
      adminProductsTotalPages,
      adminProductMutationKeys,
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
      checkoutFocusTarget,
      checkoutSubmitting,
      checkoutStep,
      cancellingOrderIds,
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
      orderCancellationErrors,
      orderCancellationFocusTarget,
      orders,
      page,
      pagination,
      paymentForm,
      productForm,
      productReviewErrors,
      productReviewFeedback,
      productReviewSessionAlert,
      productReviewFocusTarget,
      productReviewSubmitting,
      productReviews,
      productReviewsLoadedFor,
      productReviewsLoadError,
      productReviewsLoading,
      products,
      reviewForm,
      reservedBySku,
      selectedProduct: selectedProductForCurrentRoute,
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
      view: routeView,
    },
    actions: {
      addToCart,
      applyAdminProductsSearch,
      applyAdminProductsFilters,
      changeAdminProductsLimit,
      changeAdminProductsFilter,
      clearCart,
      clearAdminProductsFilters,
      clearAdminProductsSearch,
      cancelOrder,
      createCategory,
      createProduct,
      createOrder,
      deleteAdminUser,
      deleteCategory,
      deleteProduct,
      deleteReview,
      goToCartItems,
      goToAdminProductsPage,
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
      retryAdminProducts,
      saveAdminUser,
      saveAccountReview,
      selectAdminCategory,
      selectAdminProduct,
      selectAccountReview,
      setAuthMode,
      setAdminTab,
      setAdminSearch,
      setAdminProductsFilterValue,
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
      saveHomeContentSettings,
      saveImageUrl,
      submitProductReview,
      uploadProductImages,
      deleteOrder,
    },
  };
}
