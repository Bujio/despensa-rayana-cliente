export const routeByView = {
  home: '/',
  catalog: '/catalogo',
  cart: '/cesta',
  story: '/la-rayana',
  orders: '/pedidos',
  account: '/cuenta',
  accountRegister: '/cuenta/registro',
  admin: '/gestion',
  supplier: '/supplier',
  supplierRegister: '/supplier/register',
  supplierLogin: '/supplier/login',
};

export const adminRouteByTab = {
  dashboard: '/admin',
  homepage: '/admin/home',
  products: '/admin/products',
  categories: '/admin/categories',
  orders: '/admin/orders',
  users: '/admin/users',
  suppliers: '/admin/suppliers',
  offers: '/admin/offers',
  content: '/admin/content',
  messages: '/admin/messages',
  reports: '/admin/reports',
  settings: '/admin/settings',
  reviews: '/admin/reviews',
  media: '/admin/media',
};

export const adminTabByRoute = Object.fromEntries(
  Object.entries(adminRouteByTab).map(([tab, path]) => [path, tab]),
);

export function buildRoute(view, { categorySlug = '', productId = '' } = {}) {
  if (view === 'product' && productId) return '/producto/' + encodeURIComponent(productId);
  if (view === 'catalog' && categorySlug) return '/catalogo/' + encodeURIComponent(categorySlug);
  return routeByView[view] || routeByView.home;
}
