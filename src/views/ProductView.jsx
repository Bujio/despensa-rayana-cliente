import { ArrowLeft, BadgeCheck, Heart, MessageSquare, Minus, PackageSearch, Plus, ShieldCheck, ShoppingCart, Star, Truck } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import { productModel } from '../models/productModel.js';
import { reviewModel } from '../models/reviewModel.js';
import { ProductCard } from './ProductCard.jsx';
import { formatCurrency, formatProductName } from './viewFormatters.js';

function sanitizeRichDescription(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withBreaks = raw.replace(/\n{2,}/g, '\n').replace(/\n/g, '<br>');
  return DOMPurify.sanitize(withBreaks, {
    ALLOWED_TAGS: ['h2', 'h3', 'p', 'strong', 'b', 'u', 'em', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: [],
  });
}

function ProductDescription({ content }) {
  const html = sanitizeRichDescription(content);
  if (!html) return <p>Producto local seleccionado para tu despensa.</p>;
  return <div className="rich-product-description" dangerouslySetInnerHTML={{ __html: html }} />;
}

function getProductId(product) {
  return String(product?._id || product?.id || product?.sku || '');
}

function normalizeSupplierKey(value) {
  return String(value || '').trim().toLowerCase();
}

function getSupplierKeys(product) {
  const supplier = product?.supplier || product?.supplierRef || {};
  if (typeof supplier === 'string') return [normalizeSupplierKey(supplier)].filter(Boolean);
  return [
    supplier?._id
      || product?.supplierRef?._id,
    supplier?.id,
    supplier?.supplierCode,
    product?.supplierId,
    product?.supplierCode,
    supplier?.name,
    product?.supplierName,
  ].map(normalizeSupplierKey).filter(Boolean);
}

function getUniqueRelatedProducts(candidates, selectedProduct) {
  const selectedId = getProductId(selectedProduct);
  const selectedSupplierKeys = new Set(getSupplierKeys(selectedProduct));
  if (!selectedSupplierKeys.size) return [];

  const seen = new Set();
  return candidates
    .filter((product) => {
      const productId = getProductId(product);
      if (!productId || productId === selectedId || seen.has(productId)) return false;
      if (!getSupplierKeys(product).some((key) => selectedSupplierKeys.has(key))) return false;
      seen.add(productId);
      return true;
    })
    .slice(0, 4);
}

export function ProductView({ state, actions }) {
  const { busy, favoriteIds, featuredProducts = [], loadingProductDetail, productContactFeedback, productContactForm, productReviews, products = [], relatedProducts: loadedRelatedProducts = [], reservedBySku, reviewForm, selectedProduct, session } = state;
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
  const descriptionRef = useRef(null);
  const selectedProductDescription = selectedProduct?.description || '';

  const gallery = useMemo(() => {
    return productModel.getImages(selectedProduct);
  }, [selectedProduct]);

  const relatedProducts = useMemo(() => {
    return getUniqueRelatedProducts([...loadedRelatedProducts, ...featuredProducts, ...products], selectedProduct);
  }, [featuredProducts, loadedRelatedProducts, products, selectedProduct]);

  useEffect(() => {
    setImageFailed(false);
    setSelectedImage(gallery[0]?.url || '');
    setIsDescriptionExpanded(false);
  }, [gallery, selectedProduct?._id, selectedProduct?.id, selectedProduct?.sku]);

  useEffect(() => {
    const measureDescription = () => {
      const container = descriptionRef.current;
      if (!container || !selectedProductDescription) {
        setIsDescriptionOverflowing(false);
        return;
      }

      const content = container.querySelector('.rich-product-description') || container;
      const styles = window.getComputedStyle(content);
      const fontSize = Number.parseFloat(styles.fontSize) || 16;
      const lineHeight = Number.parseFloat(styles.lineHeight) || fontSize * 1.7;
      const maxLines = window.matchMedia('(max-width: 680px)').matches ? 5 : 10;
      const collapsedHeight = lineHeight * maxLines;

      container.style.setProperty('--description-collapsed-height', collapsedHeight + 'px');
      setIsDescriptionOverflowing(content.scrollHeight > collapsedHeight + 4);
    };

    const frame = window.requestAnimationFrame(measureDescription);
    window.addEventListener('resize', measureDescription);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureDescription);
    };
  }, [activeTab, selectedProduct?._id, selectedProduct?.id, selectedProduct?.sku, selectedProductDescription]);

  if (!selectedProduct) {
    return (
      <section className="wide-panel single">
        <button className="secondary" type="button" onClick={() => actions.setView('catalog')}>
          <ArrowLeft size={17} /> Volver al catálogo
        </button>
        <div className="empty-state">No hay producto seleccionado.</div>
      </section>
    );
  }

  const image = selectedImage || gallery[0]?.url || productModel.getImage(selectedProduct);
  const categoryName = productModel.getCategoryName(selectedProduct.category);
  const availableStock = productModel.getAvailableStock(selectedProduct, reservedBySku);
  const stockText = availableStock > 0 ? availableStock + ' unidades disponibles' : 'Sin stock';
  const offerLabel = productModel.getOfferLabel(selectedProduct);
  const offerPrice = productModel.getOfferPrice(selectedProduct);
  const hasPriceOffer = offerLabel && offerPrice < Number(selectedProduct.price || 0);
  const safeQuantity = Math.min(quantity, Math.max(availableStock, 1));
  const selectedProductId = String(selectedProduct._id || selectedProduct.id || selectedProduct.sku || '');
  const isFavorite = favoriteIds.includes(selectedProductId);
  const reviewSummary = reviewModel.getSummary(productReviews);
  const ownReview = productReviews.find((review) => String(review.user?._id || review.user?.id || review.user) === String(session?.user?.id || session?.user?._id));
  const shortDescription = selectedProduct.shortDescription || selectedProduct.description || 'Producto local seleccionado para tu despensa.';
  const longDescription = selectedProduct.description || selectedProduct.shortDescription || '';

  const updateQuantity = (nextQuantity) => {
    setQuantity(Math.min(Math.max(nextQuantity, 1), Math.max(availableStock, 1)));
  };

  return (
    <section className="product-detail">
      <button className="secondary back-button" type="button" onClick={() => actions.setView('catalog')}>
        <ArrowLeft size={17} /> Volver al catálogo
      </button>

      <div className="product-detail-layout editorial-product-layout">
        <div className="product-gallery editorial-gallery">
          {gallery.length > 0 && (
            <div className="gallery-strip vertical-gallery" aria-label="Galería de producto">
              {gallery.slice(0, 5).map((item) => (
                <button className={image === item.url ? 'active' : ''} type="button" key={item.url} onClick={() => {
                  setSelectedImage(item.url);
                  setImageFailed(false);
                }}>
                  <img
                    src={item.url}
                    alt={formatProductName(item.name) || selectedProductName}
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          <div className="product-detail-media">
            {image && !imageFailed ? (
              <img src={image} alt={selectedProductName} onError={() => setImageFailed(true)} />
            ) : (
              <PackageSearch size={64} />
            )}
            <span>{categoryName}</span>
          </div>
        </div>

        <article className="product-detail-body">
          <div className="product-detail-kicker">{selectedProduct.sku}</div>
          <div className="detail-title-row">
            <h1>{selectedProductName}</h1>
            <button
              className={'favorite-button detail-favorite' + (isFavorite ? ' active' : '')}
              type="button"
              onClick={() => actions.toggleFavorite(selectedProduct)}
              aria-label={isFavorite ? 'Quitar favorito' : 'Guardar favorito'}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="review-summary-line">
            <span className="stars" aria-label={`${reviewSummary.average.toFixed(1)} estrellas`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star key={value} size={16} fill={value <= Math.round(reviewSummary.average || 0) ? 'currentColor' : 'none'} />
              ))}
            </span>
            <span>({reviewSummary.count} valoraciones)</span>
          </div>
          <p className="short-product-description">{shortDescription}</p>

          <div className="detail-price">
            {hasPriceOffer && <span className="old-price">{formatCurrency(selectedProduct.price)}</span>}
            <strong>{formatCurrency(offerPrice)}</strong>
            {offerLabel && <span className="offer-banner detail-offer">{offerLabel}</span>}
          </div>

          <div className="detail-facts">
            <div><span>Proveedor</span><strong>{supplierName}</strong></div>
            <div><span>Categoría</span><strong>{categoryName}</strong></div>
            <div><span>Stock</span><strong>{stockText}</strong></div>
          </div>

          <div className="purchase-panel">
            <div className="quantity-control" aria-label="Selector de cantidad">
              <button type="button" onClick={() => updateQuantity(safeQuantity - 1)} disabled={safeQuantity <= 1}><Minus size={16} /></button>
              <span>{safeQuantity}</span>
              <button type="button" onClick={() => updateQuantity(safeQuantity + 1)} disabled={safeQuantity >= availableStock}><Plus size={16} /></button>
            </div>
            <button
              className="primary"
              type="button"
              onClick={() => actions.addToCart(selectedProduct, safeQuantity)}
              disabled={busy || availableStock <= 0}
            >
              <ShoppingCart size={18} /> Añadir a la cesta
            </button>
          </div>

          <div className="trust-grid">
            <span><BadgeCheck size={17} /> Producto de origen</span>
            <span><PackageSearch size={17} /> Selección local</span>
            <span><Truck size={17} /> Envío 24/48h</span>
            <span><ShieldCheck size={17} /> Pago seguro</span>
          </div>

          {loadingProductDetail && <div className="soft-note">Actualizando datos del producto...</div>}
        </article>
      </div>

      <section className="product-tabs-panel">
        <div className="product-tabs">
          <button className={activeTab === 'description' ? 'active' : ''} type="button" onClick={() => setActiveTab('description')}>Descripción</button>
          <button className={activeTab === 'info' ? 'active' : ''} type="button" onClick={() => setActiveTab('info')}>Información adicional</button>
          <button className={activeTab === 'contact' ? 'active' : ''} type="button" onClick={() => setActiveTab('contact')}>Contactar proveedor</button>
          <button className={activeTab === 'reviews' ? 'active' : ''} type="button" onClick={() => setActiveTab('reviews')}>Valoraciones ({reviewSummary.count})</button>
        </div>

        {activeTab === 'description' && (
          <div className="tab-content">
            <ProductDescription content={longDescription} />
            <div className="product-origin-facts">
              <span><BadgeCheck size={18} /> Origen seleccionado</span>
              <span><ShieldCheck size={18} /> Calidad contrastada</span>
              <span><Truck size={18} /> Envío 24/48h</span>
              <span><PackageSearch size={18} /> Producto artesanal</span>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="tab-content info-grid">
            <div><span>SKU</span><strong>{selectedProduct.sku}</strong></div>
            <div><span>Proveedor</span><strong>{supplierName}</strong></div>
            <div><span>Categoría</span><strong>{categoryName}</strong></div>
            <div><span>Disponibilidad</span><strong>{stockText}</strong></div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="tab-content product-contact-layout">
            <div className="product-contact-copy">
              <span className="eyebrow">Consulta directa</span>
              <h2>Escribe a {supplierName}</h2>
              <p>Pregunta por origen, preparación, disponibilidad o cualquier detalle del producto. La respuesta aparecerá en tu panel de cliente, dentro de Mi cuenta.</p>
            </div>
            <form className="review-form product-contact-form" onSubmit={actions.sendProductContactMessage}>
              {!session && <p className="soft-note">Entra en tu cuenta para enviar mensajes a proveedores.</p>}
              <label>
                Asunto
                <input
                  value={productContactForm.subject}
                  onChange={(event) => actions.updateProductContactForm('subject', event.target.value)}
                  disabled={!session || busy}
                  placeholder="Consulta sobre este producto"
                />
              </label>
              <label>
                Mensaje
                <textarea
                  required
                  minLength="3"
                  value={productContactForm.message}
                  onChange={(event) => actions.updateProductContactForm('message', event.target.value)}
                  disabled={!session || busy}
                  placeholder="Escribe aquí tu consulta para el proveedor"
                />
              </label>
              <button className="primary full" type="submit" disabled={busy || !session}>
                <MessageSquare size={18} /> Enviar mensaje
              </button>
              {productContactFeedback?.message && (
                <p className={'form-feedback ' + productContactFeedback.type} role={productContactFeedback.type === 'error' ? 'alert' : 'status'}>
                  {productContactFeedback.message}
                </p>
              )}
            </form>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="tab-content reviews-layout">
            <form className="review-form" onSubmit={actions.submitProductReview}>
              <div className="admin-panel-title"><MessageSquare size={18} /> {ownReview ? 'Actualiza tu opinión' : 'Añade tu opinión'}</div>
              {!session && <p className="soft-note">Entra en tu cuenta para escribir una valoración.</p>}
              <label>
                Valoración
                <select value={reviewForm.rating} onChange={(event) => actions.updateReviewForm('rating', event.target.value)} disabled={!session}>
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
                </select>
              </label>
              <label>Título<input value={reviewForm.title} onChange={(event) => actions.updateReviewForm('title', event.target.value)} disabled={!session} /></label>
              <label>Opinión<textarea required minLength="3" value={reviewForm.comment} onChange={(event) => actions.updateReviewForm('comment', event.target.value)} disabled={!session} /></label>
              <button className="primary full" type="submit" disabled={busy || !session}>Guardar opinión</button>
            </form>

            <div className="reviews-list">
              {productReviews.length ? productReviews.map((review) => (
                <article className="review-card" key={review._id || review.id}>
                  <div className="stars">{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} fill={value <= review.rating ? 'currentColor' : 'none'} />)}</div>
                  <strong>{review.title || 'Opinión de cliente'}</strong>
                  <p>{review.comment}</p>
                  <span>{review.user?.name || 'Cliente'}</span>
                </article>
              )) : (
                <div className="empty-state compact-empty">Todavía no hay opiniones para este producto.</div>
              )}
            </div>
          </div>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <div className="section-heading compact">
            <div>
              <h2>Más productos de este proveedor</h2>
              <p>Selección relacionada del mismo origen para completar tu despensa.</p>
            </div>
          </div>
          <div className="related-product-grid">
            {relatedProducts.map((product) => {
              const productId = getProductId(product);
              return (
                <ProductCard
                  key={productId}
                  product={product}
                  busy={busy}
                  isFavorite={favoriteIds.includes(productId)}
                  reservedBySku={reservedBySku}
                  onAdd={actions.addToCart}
                  onOpen={actions.openProduct}
                  onToggleFavorite={actions.toggleFavorite}
                />
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
