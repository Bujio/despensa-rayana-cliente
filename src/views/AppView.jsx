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
        {state.view === 'home' && <HomeView state={state} actions={actions} />}
        {state.view === 'catalog' && <CatalogView state={state} actions={actions} />}
        {state.view === 'cart' && <CartView state={state} actions={actions} />}
        {state.view === 'product' && <ProductView state={state} actions={actions} />}
        {state.view === 'story' && <StoryView actions={actions} />}
        {state.view === 'orders' && <OrdersView state={state} actions={actions} />}
        {state.view === 'account' && <AccountView state={state} actions={actions} />}
        {state.view === 'admin' && <AdminView state={state} actions={actions} />}
      </main>
    </div>
    </>
  );
}
