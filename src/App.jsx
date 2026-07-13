import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useShopController } from './controllers/useShopController.js';
import { AppView } from './views/AppView.jsx';

function readRoute(location) {
  const catalogCategoryMatch = matchPath('/catalogo/:categorySlug', location.pathname);
  const productMatch = matchPath('/producto/:productId', location.pathname);
  if (catalogCategoryMatch) {
    return {
      categorySlug: catalogCategoryMatch.params.categorySlug || '',
      productId: '',
      view: 'catalog',
    };
  }

  if (productMatch) {
    return {
      categorySlug: '',
      productId: productMatch.params.productId || '',
      view: 'product',
    };
  }

  const routeViews = {
    '/': 'home',
    '/catalogo': 'catalog',
    '/cesta': 'cart',
    '/la-rayana': 'story',
    '/pedidos': 'orders',
    '/cuenta': 'account',
    '/gestion': 'admin',
  };

  return {
    categorySlug: '',
    productId: '',
    view: routeViews[location.pathname] || 'home',
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = readRoute(location);
  const controller = useShopController({
    routeCategorySlug: route.categorySlug,
    navigate,
    routePath: location.pathname,
    routeProductId: route.productId,
    routeView: route.view,
  });
  return <AppView {...controller} />;
}
