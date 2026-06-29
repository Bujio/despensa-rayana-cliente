import { Navigate, Route, Routes } from 'react-router-dom';
import { AccountView } from './AccountView.jsx';
import { AdminView } from './AdminView.jsx';
import { CanvasBackdrop } from './CanvasBackdrop.jsx';
import { CartView } from './CartView.jsx';
import { CatalogView } from './CatalogView.jsx';
import { Header } from './Header.jsx';
import { HomeView } from './HomeView.jsx';
import { Notice } from './Notice.jsx';
import { OrdersView } from './OrdersView.jsx';
import { ProductView } from './ProductView.jsx';
import { StoryView } from './StoryView.jsx';

export function AppView({ state, actions }) {
  return (
    <>
    <CanvasBackdrop />
    <div className="app-shell">
      <Header
        cartCount={state.cartCount}
        busy={state.busy}
        filters={state.filters}
        session={state.session}
        view={state.view}
        onLogout={actions.handleLogout}
        onFavorites={actions.showFavorites}
        onCommerceCategory={actions.openCommerceCategory}
        onSearch={(value) => {
          actions.setFilter('search', value);
          actions.setView('catalog');
        }}
        onViewChange={actions.setView}
      />

      <Notice message={state.notice} onClose={() => actions.setNotice('')} />

      <main>
        <Routes>
          <Route path="/" element={<HomeView state={state} actions={actions} />} />
          <Route path="/catalogo" element={<CatalogView state={state} actions={actions} />} />
          <Route path="/cesta" element={<CartView state={state} actions={actions} />} />
          <Route path="/producto/:productId" element={<ProductView state={state} actions={actions} />} />
          <Route path="/la-rayana" element={<StoryView actions={actions} />} />
          <Route path="/pedidos" element={<OrdersView state={state} actions={actions} />} />
          <Route path="/cuenta" element={<AccountView state={state} actions={actions} />} />
          <Route path="/gestion" element={<AdminView state={state} actions={actions} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
    </>
  );
}
