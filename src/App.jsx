import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useShopController } from './controllers/useShopController.js';
import { AppView } from './views/AppView.jsx';

function readRoute(location) {
  const productMatch = matchPath('/producto/:productId', location.pathname);
  if (productMatch) {
    return {
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
    productId: '',
    view: routeViews[location.pathname] || 'home',
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = readRoute(location);
  const controller = useShopController({
    navigate,
    routePath: location.pathname,
    routeProductId: route.productId,
    routeView: route.view,
  });
  return <AppView {...controller} />;
}
