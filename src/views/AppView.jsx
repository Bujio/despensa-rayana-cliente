import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdminAuth, RequireSupplierAuth, RequireUserAuth } from './AuthGuards.jsx';
import { CanvasBackdrop } from './CanvasBackdrop.jsx';
import { CookieConsent } from './CookieConsent.jsx';
import { Header } from './Header.jsx';
import { Notice } from './Notice.jsx';
import { OrdersView } from './OrdersView.jsx';
import { ProductView } from './ProductView.jsx';
import { StoryView } from './StoryView.jsx';

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
        <Routes>
          <Route path="/" element={<HomeView state={state} actions={actions} />} />
          <Route path="/catalogo" element={<CatalogView state={state} actions={actions} />} />
          <Route path="/catalogo/:categorySlug" element={<CatalogView state={state} actions={actions} />} />
          <Route path="/cesta" element={<CartView state={state} actions={actions} />} />
          <Route path="/producto/:productId" element={<ProductView state={state} actions={actions} />} />
          <Route path="/la-rayana" element={<StoryView actions={actions} />} />
          <Route path="/pedidos" element={<OrdersView state={state} actions={actions} />} />
          <Route path="/cuenta" element={<AccountView state={state} actions={actions} />} />
          <Route path="/gestion" element={<AdminView state={state} actions={actions} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
