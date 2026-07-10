import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdminAuth, RequireSupplierAuth, RequireUserAuth } from './AuthGuards.jsx';
import { CanvasBackdrop } from './CanvasBackdrop.jsx';
import { CookieConsent } from './CookieConsent.jsx';
import { Header } from './Header.jsx';
import { Notice } from './Notice.jsx';
import { SeoManager } from './SeoManager.jsx';

const AccountView = lazy(() => import('./AccountView.jsx').then((module) => ({ default: module.AccountView })));
const AdminView = lazy(() => import('./AdminView.jsx').then((module) => ({ default: module.AdminView })));
const CartView = lazy(() => import('./CartView.jsx').then((module) => ({ default: module.CartView })));
const CatalogView = lazy(() => import('./CatalogView.jsx').then((module) => ({ default: module.CatalogView })));
const HomeView = lazy(() => import('./HomeView.jsx').then((module) => ({ default: module.HomeView })));
const LegalView = lazy(() => import('./LegalView.jsx').then((module) => ({ default: module.LegalView })));
const OrdersView = lazy(() => import('./OrdersView.jsx').then((module) => ({ default: module.OrdersView })));
const ProductView = lazy(() => import('./ProductView.jsx').then((module) => ({ default: module.ProductView })));
const StoryView = lazy(() => import('./StoryView.jsx').then((module) => ({ default: module.StoryView })));
const SupplierView = lazy(() => import('./SupplierView.jsx').then((module) => ({ default: module.SupplierView })));

function RouteLoading() {
  return <div className="route-loading" role="status">Cargando contenido...</div>;
}

export function AppView({ state, actions }) {
  return (
    <>
    <SeoManager state={state} />
    <CanvasBackdrop />
    <div className="app-shell">
      <Header
        cartCount={state.cartCount}
        cartFeedback={state.cartFeedback}
        busy={state.busy}
        filters={state.filters}
        session={state.session}
        onLogout={actions.handleLogout}
        onFavorites={actions.showFavorites}
        onCommerceCategory={actions.openCommerceCategory}
        onSearch={(value) => {
          actions.setFilter('search', value);
          actions.setView('catalog');
        }}
        onViewChange={actions.setView}
        onDismissCartFeedback={actions.dismissCartFeedback}
      />

      <Notice message={state.notice} onClose={() => actions.setNotice('')} />

      <main>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<HomeView state={state} actions={actions} />} />
            <Route path="/catalogo" element={<CatalogView state={state} actions={actions} />} />
            <Route path="/catalogo/:categorySlug" element={<CatalogView state={state} actions={actions} />} />
            <Route path="/cesta" element={<CartView state={state} actions={actions} />} />
            <Route path="/producto/:productId" element={<ProductView state={state} actions={actions} />} />
            <Route path="/la-rayana" element={<StoryView actions={actions} />} />
            <Route path="/aviso-legal" element={<LegalView page="aviso-legal" />} />
            <Route path="/privacidad" element={<LegalView page="privacidad" />} />
            <Route path="/cookies" element={<LegalView page="cookies" />} />
            <Route path="/condiciones" element={<LegalView page="condiciones" />} />
            <Route path="/devoluciones-envios" element={<LegalView page="devoluciones-envios" />} />
            <Route path="/pedidos" element={<RequireUserAuth state={state}><OrdersView state={state} actions={actions} /></RequireUserAuth>} />
            <Route path="/cuenta" element={<AccountView state={state} actions={actions} />} />
            <Route path="/cuenta/registro" element={<AccountView state={state} actions={actions} forceRegister />} />
            <Route path="/supplier/*" element={<RequireSupplierAuth state={state} actions={actions}><SupplierView state={state} actions={actions} /></RequireSupplierAuth>} />
            <Route path="/gestion" element={<RequireAdminAuth state={state} actions={actions}><AdminView state={state} actions={actions} /></RequireAdminAuth>} />
            <Route path="/admin" element={<RequireAdminAuth state={state} actions={actions}><AdminView state={state} actions={actions} /></RequireAdminAuth>} />
            <Route path="/admin/:adminSection" element={<RequireAdminAuth state={state} actions={actions}><AdminView state={state} actions={actions} /></RequireAdminAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer">
        <strong>La Despensa Rayana</strong>
        <nav aria-label="Información legal">
          <Link to="/aviso-legal">Aviso legal</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/condiciones">Condiciones</Link>
          <Link to="/devoluciones-envios">Envíos y devoluciones</Link>
        </nav>
      </footer>
    </div>
    <CookieConsent />
    </>
  );
}
