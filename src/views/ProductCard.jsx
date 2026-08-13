import { Heart, PackageSearch, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { productModel } from '../models/productModel.js';
import { formatCurrency } from './viewFormatters.js';

export function ProductCard({ product, busy, isFavorite = false, reservedBySku = {}, onAdd, onOpen, onToggleFavorite }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = productModel.getImage(product);
  const categoryName = productModel.getCategoryName(product?.category);
  const availableStock = productModel.getAvailableStock(product, reservedBySku);
  const offerLabel = productModel.getOfferLabel(product);
  const offerPrice = productModel.getOfferPrice(product);
  const hasPriceOffer = offerLabel && offerPrice < Number(product?.price || 0);
  const supplierName = product?.supplier?.name || 'La Despensa Rayana';
  const cardDescription = product?.shortDescription || product?.description || 'Producto de origen rayano pendiente de completar.';
  const productId = product?._id || product?.id || '';

  const openProduct = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen?.(product);
  };

  return (
    <article className="product-card ecommerce-card">
      <Link
        className="product-card-link"
        to={'/producto/' + encodeURIComponent(productId)}
        onClick={openProduct}
        aria-label={'Ver producto ' + product.name}
      >
        <div className="product-media">
          {image && !imageFailed ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError handles a resource failure, not user interaction. */}
              <img src={image} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
            </>
          ) : (
            <PackageSearch size={44} />
          )}
          <span>{categoryName}</span>
          {offerLabel && <strong className="floating-badge offer-badge">{offerLabel}</strong>}
          {availableStock <= 0 && <strong className="floating-badge soldout-badge">Agotado</strong>}
        </div>

        <div className="product-body">
          <div>
            <p className="product-supplier">{supplierName}</p>
            <h2>{product.name}</h2>
            <p>{cardDescription}</p>
          </div>

          <div className="product-meta">
            <strong>
              {hasPriceOffer && <span className="old-price">{formatCurrency(product.price)}</span>}
              {formatCurrency(offerPrice)}
            </strong>
            <span>{availableStock > 0 ? availableStock + ' uds.' : 'Sin stock'}</span>
          </div>

          <div className="product-card-footer">
            <span className="product-card-origin">{categoryName}</span>
          </div>
        </div>
      </Link>

      <button
        className={'favorite-button' + (isFavorite ? ' active' : '')}
        type="button"
        title={isFavorite ? 'Quitar favorito' : 'Guardar favorito'}
        aria-label={(isFavorite ? 'Quitar ' : 'Guardar ') + product.name + ' como favorito'}
        onClick={() => onToggleFavorite?.(product)}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button
        className="quick-add-button"
        type="button"
        title={availableStock > 0 ? 'Añadir a la cesta' : 'Agotado'}
        aria-label={availableStock > 0 ? 'Añadir ' + product.name + ' a la cesta' : product.name + ' agotado'}
        onClick={() => onAdd?.(product)}
        disabled={busy || availableStock <= 0}
      >
        <ShoppingCart size={16} />
      </button>
    </article>
  );
}
