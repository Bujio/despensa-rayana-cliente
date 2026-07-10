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
import { isPublicHomeSection } from '../models/homeContentModel.js';
import { CmsResponsiveImage } from '../components/cms/CmsResponsiveImage.jsx';

const categoryIcons = [Leaf, BadgeCheck, HandHeart, Gift];
const trustIcons = {
  'map-pin': MapPin,
  'hand-heart': HandHeart,
  'shield-check': ShieldCheck,
  truck: Truck,
};
const defaultHeroImage = '/camino-extremadura.png';

function cmsAttrs(section, item = null) {
  return {
    'data-cms-section-id': section?.id || '',
    'data-cms-section-type': section?.type || '',
    'data-cms-tracking-id': item?.trackingId || section?.trackingId || '',
    'data-cms-campaign': item?.campaignName || section?.campaignName || '',
  };
}

function getProductId(product) {
  return String(product?._id || product?.id || product?.sku || '');
}

function ProductCarouselSection({
  actions,
  busy,
  favoriteIds,
  products,
  reservedBySku,
  section,
}) {
  const carouselRef = useRef(null);
  const sectionProducts = products
    .filter((product) => productModel.getImage(product))
    .filter((product) => !section.productIds?.length || section.productIds.includes(getProductId(product)));

  const scroll = (direction) => {
    const carousel = carouselRef.current;
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
    carousel.scrollTo({ left: Math.max(0, Math.min(maxScroll, nextLeft)), behavior: 'smooth' });
  };

  return (
    <section className="home-section" {...cmsAttrs(section)}>
      <div className="section-heading compact">
        <div>
          {section.subtitle && <span className="eyebrow">{section.subtitle}</span>}
          <h1>{section.title}</h1>
          {section.body && <p>{section.body}</p>}
        </div>
        <button className="secondary" type="button" onClick={() => actions.setView('catalog')}>Ver catálogo</button>
      </div>
      {sectionProducts.length ? (
        <div className="featured-carousel-shell">
          <button className="carousel-control" type="button" onClick={() => scroll(-1)} aria-label="Ver productos anteriores">
            <ChevronLeft size={18} />
          </button>
          <div className="featured-carousel" ref={carouselRef} aria-label={section.title}>
            {sectionProducts.map((product) => (
              <ProductCard
                key={product._id || product.id || product.sku}
                product={product}
                busy={busy}
                isFavorite={favoriteIds.includes(getProductId(product))}
                reservedBySku={reservedBySku}
                onAdd={actions.addToCart}
                onOpen={actions.openProduct}
                onToggleFavorite={actions.toggleFavorite}
              />
            ))}
          </div>
          <button className="carousel-control" type="button" onClick={() => scroll(1)} aria-label="Ver más productos">
            <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="empty-state compact-empty">Selecciona productos para este carrusel desde Gestión.</div>
      )}
    </section>
  );
}

export function HomeView({ state, actions }) {
  const featuredCarouselRef = useRef(null);
  const {
    busy,
    categories,
    favoriteIds,
    featuredProducts,
    homeContent,
    loadingProducts,
    reservedBySku,
  } = state;
  const hero = homeContent?.hero || {};
  const activeSections = (homeContent?.sections || [])
    .filter((section) => isPublicHomeSection(section))
    .sort((first, second) => first.order - second.order);
  const selectedFeaturedIds = homeContent?.featuredProductIds || [];

  const defaultVisibleCategories = categoryVisualModel.list().filter((visual) => visual.label !== 'Ofertas').map((visual) => {
    const matchedCategory = categories.find((category) => categoryVisualModel.matches(category, visual));
    return {
      id: matchedCategory?._id || matchedCategory?.id || '',
      name: visual.label,
      caption: visual.caption,
      image: visual.image,
      description: visual.description,
      linkUrl: visual.label,
    };
  });
  const carouselProducts = featuredProducts
    .filter((product) => productModel.getImage(product))
    .filter((product) => !selectedFeaturedIds.length || selectedFeaturedIds.includes(getProductId(product)));
  const heroEyebrow = hero.eyebrow ?? 'Origen extremeno - Espiritu rayano';
  const heroTitle = hero.title ?? 'Sabores que cruzan fronteras, tradicion que nos une.';
  const heroDescription = hero.description ?? 'Productos de origen rayano de la zona de La Raya.';
  const heroPrimaryLabel = hero.primaryLabel ?? 'Descubre productos';
  const heroSecondaryLabel = hero.secondaryLabel ?? 'Nuestra historia';

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

  const renderHero = () => (
    <div
      className="brand-hero"
      style={{
        '--hero-image': `url("${hero.imageUrl || defaultHeroImage}")`,
        '--hero-mobile-image': `url("${hero.mobileImageUrl || hero.imageUrl || defaultHeroImage}")`,
      }}
      {...cmsAttrs({ id: 'hero', type: 'hero', ...hero })}
    >
        <div className="hero-copy">
          {heroEyebrow !== '' && <span className="eyebrow">{heroEyebrow}</span>}
          {heroTitle !== '' && <h1>{heroTitle}</h1>}
          {heroDescription !== '' && <p>{heroDescription}</p>}
          <div className="hero-actions">
            {heroPrimaryLabel !== '' && (
              <button className="primary" type="button" onClick={() => actions.setView('catalog')}>
                {heroPrimaryLabel} <ArrowRight size={18} />
              </button>
            )}
            {heroSecondaryLabel !== '' && (
              <button className="secondary" type="button" onClick={() => actions.setView('story')}>
                {heroSecondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
  );

  const renderTrust = (section) => {
    const fallbackItems = [
      { icon: 'map-pin', title: 'Origen local', body: 'Productos de la zona rayana' },
      { icon: 'hand-heart', title: 'Artesanía y tradición', body: 'Elaborados como siempre se hizo' },
      { icon: 'shield-check', title: 'Calidad garantizada', body: 'Seleccionamos lo mejor de nuestra tierra' },
      { icon: 'truck', title: 'Envío rápido', body: 'En 24/48h en toda la península' },
    ];
    const trustItems = Array.isArray(section?.items) && section.items.length ? section.items : fallbackItems;

    return (
      <section className="home-band trust-band" aria-label="Confianza" {...cmsAttrs(section)}>
        {trustItems.map((item, index) => {
          const Icon = trustIcons[item.icon] || trustIcons[fallbackItems[index]?.icon] || ShieldCheck;
          return (
            <article key={(item.title || 'confianza') + index} {...cmsAttrs(section, item)}>
              <Icon size={20} />
              <strong>{item.title || fallbackItems[index]?.title || 'Mensaje de confianza'}</strong>
              <span>{item.body || fallbackItems[index]?.body || 'Información de confianza'}</span>
            </article>
          );
        })}
      </section>
    );
  };

  const openCategoryTile = (category) => {
    const linkUrl = category.linkUrl || category.name;
    if (!linkUrl || linkUrl === category.name) {
      actions.openCommerceCategory(category.name);
      return;
    }
    if (categoryVisualModel.findVisual(linkUrl)) {
      actions.openCommerceCategory(linkUrl);
      return;
    }
    openSectionLink(linkUrl);
  };

  const renderCategories = (section) => {
    const visibleCategories = (Array.isArray(section.items) && section.items.length ? section.items : defaultVisibleCategories)
      .filter((item) => item.title || item.body || item.imageUrl)
      .map((item, index) => {
        const fallback = defaultVisibleCategories[index] || {};
        return {
          name: item.title || fallback.name || 'Categoría',
          caption: item.title || fallback.caption || fallback.name,
          description: item.body || fallback.description || 'Ver selección',
          image: item.imageUrl || fallback.image || '',
          mobileImage: item.mobileImageUrl || fallback.mobileImageUrl || item.imageUrl || fallback.image || '',
          altText: item.altText || fallback.altText || item.title || fallback.name || 'Categoría',
          linkUrl: item.linkUrl || fallback.linkUrl || item.title || fallback.name,
          trackingId: item.trackingId || '',
          campaignName: item.campaignName || '',
        };
      });

    return (
      <section className="home-section" {...cmsAttrs(section)}>
        <div className="section-heading compact">
          <div>
            <h1>{section.title || 'Explora nuestras categorías'}</h1>
            {section.body && <p>{section.body}</p>}
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
                onClick={() => openCategoryTile(category)}
                {...cmsAttrs(section, category)}
              >
                {category.image ? (
                  <picture>
                    {category.mobileImage && <source media="(max-width: 720px)" srcSet={category.mobileImage} />}
                    <img src={category.image} alt={category.altText || category.name} />
                  </picture>
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
    );
  };

  const renderFeatured = (section) => (
      <section className="home-section" {...cmsAttrs(section)}>
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
            <div className="featured-carousel" ref={featuredCarouselRef} aria-label="Productos destacados">
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
  );

  const renderCustomSection = (section) => (
    <section className="home-section custom-home-band" {...cmsAttrs(section)}>
      <div>
        {section.subtitle && <span className="eyebrow">{section.subtitle}</span>}
        <h1>{section.title}</h1>
        {section.body && <p>{section.body}</p>}
      </div>
      <button className="secondary" type="button" onClick={() => actions.setView('catalog')}>
        Ver catálogo
      </button>
    </section>
  );

  const openSectionLink = (linkUrl) => {
    if (!linkUrl) {
      actions.setView('catalog');
      return;
    }
    if (linkUrl.startsWith('http')) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    actions.setView(linkUrl.replace('#', '') || 'catalog');
  };

  const renderPromoBanner = (section) => (
    <section className="promo-banner-section" {...cmsAttrs(section)}>
      <CmsResponsiveImage source={section} fallbackAlt={section.title || 'Banner promocional'} />
      <div>
        {section.subtitle && <span className="eyebrow">{section.subtitle}</span>}
        <h1>{section.title}</h1>
        {section.body && <p>{section.body}</p>}
        <button className="primary" type="button" onClick={() => openSectionLink(section.linkUrl)}>
          {section.ctaLabel || 'Ver selección'} <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );

  const renderPromoBannerGrid = (section) => (
    <section className="home-section" {...cmsAttrs(section)}>
      <div className="section-heading compact">
        <div>
          {section.subtitle && <span className="eyebrow">{section.subtitle}</span>}
          <h1>{section.title}</h1>
          {section.body && <p>{section.body}</p>}
        </div>
      </div>
      <div className="promo-banner-grid">
        {(section.items || []).map((item, index) => (
          <button
            className="promo-banner-card"
            type="button"
            key={(item.title || 'banner') + index}
            onClick={() => openSectionLink(item.linkUrl)}
            {...cmsAttrs(section, item)}
          >
            <CmsResponsiveImage source={item} fallbackAlt={item.title || 'Promoción'} />
            <span>
              <strong>{item.title || 'Promoción'}</strong>
              {item.body && <small>{item.body}</small>}
            </span>
          </button>
        ))}
      </div>
    </section>
  );

  const renderSection = (section) => {
    if (section.type === 'hero') return renderHero();
    if (section.type === 'trust') return renderTrust(section);
    if (section.type === 'categories') return renderCategories(section);
    if (section.type === 'featured') return renderFeatured(section);
    if (section.type === 'productCarousel') return (
      <ProductCarouselSection
        actions={actions}
        busy={busy}
        favoriteIds={favoriteIds}
        products={featuredProducts}
        reservedBySku={reservedBySku}
        section={section}
      />
    );
    if (section.type === 'promoBanner') return renderPromoBanner(section);
    if (section.type === 'promoBannerGrid') return renderPromoBannerGrid(section);
    return renderCustomSection(section);
  };

  return (
    <section className="home-view">
      {activeSections.map((section) => (
        <div className="home-component-slot" key={section.id}>
          {renderSection(section)}
        </div>
      ))}
    </section>
  );
}
