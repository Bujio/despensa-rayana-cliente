import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Gift,
  HandHeart,
  Leaf,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useRef } from 'react';
import { ProductCard } from './ProductCard.jsx';
import { productModel } from '../models/productModel.js';
import { categoryVisualModel } from '../models/categoryVisualModel.js';

const baseCategories = [
  'Alimentación',
  'Ibéricos',
  'Quesos',
  'Dulces y miel',
  'Bebidas',
  'Artesanía',
  'Packs regalo',
  'Ofertas',
];

const categoryIcons = [Leaf, BadgeCheck, HandHeart, Gift];

export function HomeView({ state, actions }) {
  const featuredCarouselRef = useRef(null);
  const {
    busy,
    categories,
    favoriteIds,
    featuredProducts,
    loadingProducts,
    reservedBySku,
  } = state;

  const visibleCategories = categoryVisualModel.list().filter((visual) => visual.label !== 'Ofertas').map((visual) => ({
    id: categories.find((category) => categoryVisualModel.matches(category, visual))?._id
      || categories.find((category) => categoryVisualModel.matches(category, visual))?.id
      || '',
    name: visual.label,
    caption: visual.caption,
    image: visual.image,
    description: visual.description,
  }));
  const carouselProducts = featuredProducts.filter((product) => productModel.getImage(product));

  const scrollFeatured = (direction) => {
    const carousel = featuredCarouselRef.current;
    if (!carousel) return;

    const firstCard = carousel.querySelector('.product-card');
    if (!firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap || getComputedStyle(carousel).gap || '0') || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    const atStart = carousel.scrollLeft <= 2;
    const atEnd = carousel.scrollLeft >= maxScroll - 2;
    let nextLeft = carousel.scrollLeft + direction * step;

    if (direction < 0 && atStart) nextLeft = maxScroll;
    if (direction > 0 && atEnd) nextLeft = 0;

    carousel.scrollTo({
      left: Math.max(0, Math.min(maxScroll, nextLeft)),
      behavior: 'smooth',
    });
  };

  return (
    <section className="home-view">
      <div className="brand-hero">
        <div className="hero-copy">
          <span className="eyebrow">Origen extremeño · Espíritu rayano</span>
          <h1>Sabores que cruzan fronteras, tradición que nos une.</h1>
          <p>Productos de origen extremeño de la zona de La Raya, donde Extremadura se encuentra con Portugal.</p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => actions.setView('catalog')}>
              Descubre productos <ArrowRight size={18} />
            </button>
            <button className="secondary" type="button" onClick={() => actions.setView('story')}>
              Nuestra historia
            </button>
          </div>
        </div>
      </div>

      <section className="home-band trust-band" aria-label="Confianza">
        <article><MapPin size={20} /><strong>Origen local</strong><span>Productos de la zona rayana</span></article>
        <article><HandHeart size={20} /><strong>Artesanía y tradición</strong><span>Elaborados como siempre se hizo</span></article>
        <article><ShieldCheck size={20} /><strong>Calidad garantizada</strong><span>Seleccionamos lo mejor de nuestra tierra</span></article>
        <article><Truck size={20} /><strong>Envío rápido</strong><span>En 24/48h en toda la península</span></article>
      </section>

      <section className="home-section">
        <div className="section-heading compact">
          <div>
            <h1>Explora nuestras categorías</h1>
          </div>
          <button className="text-link-button" type="button" onClick={() => actions.setView('catalog')}>
            Ver todas las categorías
          </button>
        </div>
        <div className="category-showcase">
          {visibleCategories.slice(0, 7).map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            return (
              <button
                className="category-tile"
                type="button"
                key={category.name}
                onClick={() => actions.openCommerceCategory(category.name)}
              >
                {category.image ? (
                  <img src={category.image} alt="" />
                ) : (
                  <Icon size={21} />
                )}
                <strong>{category.caption || category.name}</strong>
                <span>{category.description || 'Ver selección'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading compact">
          <div>
            <h1>Productos destacados</h1>
            <p>Mostramos productos reales de la API cuando están disponibles.</p>
          </div>
          <button className="secondary" type="button" onClick={() => actions.setView('catalog')}>
            Ver catálogo
          </button>
        </div>

        {loadingProducts ? (
          <div className="empty-state">Cargando productos...</div>
        ) : carouselProducts.length ? (
          <div className="featured-carousel-shell">
            <button className="carousel-control" type="button" onClick={() => scrollFeatured(-1)} aria-label="Ver productos anteriores">
              <ChevronLeft size={18} />
            </button>
            <div className="featured-carousel" ref={featuredCarouselRef} tabIndex={0} aria-label="Productos destacados">
              {carouselProducts.map((product) => (
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
            <button className="carousel-control" type="button" onClick={() => scrollFeatured(1)} aria-label="Ver más productos">
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="empty-state refined-empty">
            <PackageSearch size={34} />
            <strong>Producto local pendiente de cargar</strong>
            <span>La interfaz queda preparada para consumir el catálogo real desde la API.</span>
          </div>
        )}
      </section>
    </section>
  );
}
