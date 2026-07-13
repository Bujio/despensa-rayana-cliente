import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import { ProductCard } from './ProductCard.jsx';
import { formatCurrency } from './viewFormatters.js';

export function CatalogView({ state, actions }) {
  const {
    busy,
    cartCount,
    cartTotal,
    categories,
    favoriteIds,
    filters,
    loadingProducts,
    page,
    pagination,
    products,
    reservedBySku,
  } = state;

  return (
    <section className="catalog-layout">
      <aside className="filters-panel">
        <div className="panel-title"><SlidersHorizontal size={18} /> Filtros</div>
        <label className="input-wrap search-wrap">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) => actions.setFilter('search', event.target.value)}
            placeholder="Buscar aceite, miel, queso..."
          />
        </label>
        <label>
          Categoría
          <select value={filters.categoryId} onChange={(event) => actions.setFilter('categoryId', event.target.value)}>
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <div className="range-grid">
          <label>
            Mínimo
            <input type="number" min="0" value={filters.minPrice} onChange={(event) => actions.setFilter('minPrice', event.target.value)} />
          </label>
          <label>
            Máximo
            <input type="number" min="0" value={filters.maxPrice} onChange={(event) => actions.setFilter('maxPrice', event.target.value)} />
          </label>
        </div>
        <label>
          Ordenar
          <select value={filters.sort + ':' + filters.order} onChange={(event) => actions.setSort(event.target.value)}>
            <option value="createdAt:desc">Relevancia</option>
            <option value="name:asc">Nombre A-Z</option>
            <option value="price:asc">Precio menor</option>
            <option value="price:desc">Precio mayor</option>
            <option value="createdAt:desc">Novedades</option>
          </select>
        </label>
        <label>
          Origen
          <select value={filters.origin} onChange={(event) => actions.setFilter('origin', event.target.value)}>
            <option value="">Todos</option>
            <option value="rayano">La Raya / Extremadura</option>
            <option value="dehesa">Dehesa</option>
            <option value="sierra">Sierra y comarca</option>
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={filters.inStock} onChange={(event) => actions.setFilter('inStock', event.target.checked)} />
          Solo disponibles
        </label>
        <label className="check-row">
          <input type="checkbox" checked={filters.onlyOffers} onChange={(event) => actions.setFilter('onlyOffers', event.target.checked)} />
          Solo ofertas
        </label>
        <label className="check-row">
          <input type="checkbox" checked={filters.favoritesOnly} onChange={(event) => actions.setFilter('favoritesOnly', event.target.checked)} />
          Favoritos
        </label>
        <button className="secondary" type="button" onClick={actions.resetFilters}>
          <ArrowDownAZ size={16} /> Limpiar
        </button>
      </aside>

      <section className="products-area">
        <div className="section-heading">
          <div>
            <h1>Compra local para tu despensa</h1>
            <p>Productos de origen rayano, seleccionados con mirada rayana y listos para llenar tu cocina de territorio.</p>
          </div>
          <button className="cart-summary" type="button" onClick={() => actions.setView('cart')}>
            <ShoppingBag size={20} />
            <span>{cartCount} productos</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </button>
        </div>

        {loadingProducts ? (
          <div className="empty-state">Cargando productos...</div>
        ) : products.length ? (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id || product.id || product.sku}
                  product={product}
                  busy={busy}
                  isFavorite={favoriteIds.includes(String(product._id || product.id || product.sku))}
                  reservedBySku={reservedBySku}
                  onAdd={actions.addToCart}
                  onOpen={actions.openProduct}
                  onToggleFavorite={actions.toggleFavorite}
                />
              ))}
            </div>
            <div className="pager">
              <button className="icon-button" type="button" disabled={page <= 1} onClick={() => actions.setPage((value) => value - 1)} title="Página anterior">
                <ChevronLeft size={18} />
              </button>
              <span>Página {pagination?.page || page} de {pagination?.totalPages || 1}</span>
              <button className="icon-button" type="button" disabled={pagination && page >= pagination.totalPages} onClick={() => actions.setPage((value) => value + 1)} title="Página siguiente">
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">No hay productos con esos filtros.</div>
        )}
      </section>
    </section>
  );
}
