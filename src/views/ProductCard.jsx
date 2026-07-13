import { Heart, PackageSearch, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
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

  const openProduct = (event) => {
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpen?.(product);
  };

  return (
    <article
      className="product-card ecommerce-card"
      onClick={openProduct}
      onKeyDown={openProduct}
      role="link"
      tabIndex={0}
      aria-label={'Ver producto ' + product.name}
    >
      <div className="product-media">
        {image && !imageFailed ? (
          <img src={image} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <PackageSearch size={44} />
        )}
        <span>{categoryName}</span>
        <button
          className={'favorite-button' + (isFavorite ? ' active' : '')}
          type="button"
          title={isFavorite ? 'Quitar favorito' : 'Guardar favorito'}
          aria-label={(isFavorite ? 'Quitar ' : 'Guardar ') + product.name + ' como favorito'}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite?.(product);
          }}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
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
          <button
            className="quick-add-button"
            type="button"
            title={availableStock > 0 ? 'Añadir a la cesta' : 'Agotado'}
            aria-label={availableStock > 0 ? 'Añadir ' + product.name + ' a la cesta' : product.name + ' agotado'}
            onClick={(event) => {
              event.stopPropagation();
              onAdd?.(product);
            }}
            disabled={busy || availableStock <= 0}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
