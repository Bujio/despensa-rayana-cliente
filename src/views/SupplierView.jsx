import { Edit3, Link, PackagePlus, Percent, RefreshCw, Save, ShieldCheck, Store, Trash2 } from 'lucide-react';
import { productModel } from '../models/productModel.js';
import { formatCurrency } from './viewFormatters.js';

function getSupplierStatusLabel(status) {
  const labels = {
    pending_review: 'Pendiente de revisión',
    active: 'Proveedor activo',
    inactive: 'Proveedor inactivo',
    draft: 'Perfil en borrador',
    rejected: 'Solicitud rechazada',
  };
  return labels[status] || 'Estado no disponible';
}

function getSupplierMessage(status) {
  if (status === 'active') return 'Tu perfil está aprobado. Ya puedes gestionar tus productos y ofertas.';
  if (status === 'rejected') return 'Tu solicitud como proveedor no ha sido aprobada. Si crees que se trata de un error, contacta con La Despensa Rayana.';
  if (status === 'inactive') return 'Tu cuenta de proveedor está desactivada temporalmente. No puedes crear ni activar productos.';
  return 'Tu perfil está pendiente de revisión. Puedes completar tu información y preparar tus productos, pero no serán visibles en la tienda hasta que La Despensa Rayana apruebe tu solicitud.';
}

function getProductStatusLabel(status) {
  const labels = {
    draft: 'Borrador',
    pending_review: 'Pendiente de revisión',
    published: 'Publicado',
    inactive: 'Inactivo',
    rejected: 'Rechazado',
  };
  return labels[status] || 'Publicado';
}

export function SupplierView({ state, actions }) {
  const {
    busy,
    categories,
    imageForm,
    productForm,
    selectedSupplierProductId,
    session,
    supplierProducts,
    supplierProfile,
  } = state;

  if (session?.user?.role !== 'supplier') {
    return (
      <section className="wide-panel single">
        <div className="empty-state">Necesitas entrar como proveedor para acceder a este panel.</div>
      </section>
    );
  }

  const status = supplierProfile?.status || 'pending_review';
  const canManageProducts = !['inactive', 'rejected'].includes(status);
  const updateProduct = (field) => (event) => actions.updateProductForm(field, event.target.value);
  const updateImage = (field) => (event) => actions.updateImageForm(field, event.target.value);
  const getId = (item) => item?._id || item?.id || '';

  return (
    <section className="supplier-panel-view">
      <div className="section-heading compact">
        <div>
          <h1>Gestión de productos</h1>
          <p>{supplierProfile?.name || session.user?.name || session.user?.email}</p>
        </div>
        <button className="secondary" type="button" onClick={actions.loadSupplierPanel} disabled={busy}>
          <RefreshCw size={17} /> Actualizar
        </button>
      </div>

      <section className={'supplier-status-banner ' + status}>
        <span><ShieldCheck size={22} /></span>
        <div>
          <strong>{getSupplierStatusLabel(status)}</strong>
          <p>{getSupplierMessage(status)}</p>
          {supplierProfile?.supplierCode && <small>Código de proveedor: {supplierProfile.supplierCode}</small>}
        </div>
      </section>

      <div className="supplier-products-workspace">
        <section className="admin-panel supplier-own-products-panel">
          <div className="admin-panel-title"><PackagePlus size={19} /> Mis productos</div>
          {supplierProducts.length ? (
            <div className="admin-list supplier-products-list">
              {supplierProducts.map((product) => {
                const image = productModel.getImage(product);
                const productId = product._id || product.id;
                return (
                  <article className={'collection-row with-thumb' + (selectedSupplierProductId === productId ? ' active' : '')} key={productId || product.sku}>
                    <button className="admin-thumb" type="button" onClick={() => actions.selectSupplierProduct(product)}>
                      {image ? <img src={image} alt="" /> : <Store size={18} />}
                    </button>
                    <button className="user-main supplier-product-summary" type="button" onClick={() => actions.selectSupplierProduct(product)}>
                      <strong>{product.name}</strong>
                      <span>{product.sku} · {formatCurrency(product.price)} · Stock {product.stock ?? 0}</span>
                    </button>
                    <span className={'admin-badge ' + (product.status === 'published' ? 'success' : product.status === 'rejected' ? 'danger' : 'warning')}>
                      {getProductStatusLabel(product.status)}
                    </span>
                    <div className="supplier-product-actions">
                      <button className="icon-button" type="button" onClick={() => actions.selectSupplierProduct(product)} disabled={busy} title="Editar producto">
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger-button" type="button" onClick={() => actions.deleteSupplierProduct(product)} disabled={busy || !canManageProducts} title="Eliminar producto">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state compact-empty">Aún no tienes productos creados.</div>
          )}
        </section>

        <form className="admin-panel supplier-product-editor" onSubmit={actions.saveSupplierProduct}>
          <div className="admin-panel-title">
            <PackagePlus size={19} /> {selectedSupplierProductId ? 'Editar producto' : 'Nuevo producto'}
          </div>
          <div className="admin-form-grid">
            <label>Nombre<input required value={productForm.name} onChange={updateProduct('name')} disabled={!canManageProducts} placeholder="Ej. Torta del Casar artesana" /></label>
            <label>SKU<input required value={productForm.sku} onChange={updateProduct('sku')} disabled={!canManageProducts} placeholder="EXT-PRO-001" /></label>
            <label>Precio<input required type="number" min="0.01" step="0.01" value={productForm.price} onChange={updateProduct('price')} disabled={!canManageProducts} /></label>
            <label>Stock<input required type="number" min="0" step="1" value={productForm.stock} onChange={updateProduct('stock')} disabled={!canManageProducts} /></label>
            <label>
              Categoría
              <select value={productForm.category} onChange={updateProduct('category')} disabled={!canManageProducts}>
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={getId(category)} value={getId(category)}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>Estado<input readOnly value={selectedSupplierProductId ? 'Pendiente tras guardar cambios' : 'Pendiente de revisión'} /></label>
            <label className="wide-field">Descripción corta<textarea value={productForm.shortDescription} onChange={updateProduct('shortDescription')} disabled={!canManageProducts} placeholder="Resumen breve para la ficha del producto" /></label>
            <label className="wide-field">Descripción larga<textarea value={productForm.description} onChange={updateProduct('description')} disabled={!canManageProducts} placeholder="Origen, elaboración, formato, conservación y detalles relevantes" /></label>
          </div>

          <section className="product-image-editor">
            <div className="admin-panel-title"><Link size={18} /> Imágenes del producto</div>
            {productForm.images?.length ? (
              <div className="product-image-grid">
                {productForm.images.map((image, index) => (
                  <article className="product-image-item" key={image.url + index}>
                    <img src={image.url} alt={image.name || productForm.name || 'Producto'} />
                    <div>
                      <strong>{index === 0 ? 'Principal' : image.name || 'Imagen del producto'}</strong>
                      <span>{image.name || 'Sin nombre'}</span>
                    </div>
                    <button className="icon-button danger-button" type="button" onClick={() => actions.removeProductFormImage(index)} disabled={busy || !canManageProducts} title="Eliminar imagen">
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact-empty">Añade una imagen real del producto mediante URL.</div>
            )}
            <div className="admin-form-grid image-url-editor">
              <label className="wide-field">URL de imagen<input type="url" value={imageForm.imageUrl} onChange={updateImage('imageUrl')} disabled={!canManageProducts} placeholder="https://..." /></label>
              <label>Nombre de imagen<input value={imageForm.imageName} onChange={updateImage('imageName')} disabled={!canManageProducts} placeholder="Ej. Vista frontal" /></label>
              <button className="secondary form-button" type="button" onClick={actions.addProductImageUrl} disabled={busy || !canManageProducts || !imageForm.imageUrl.trim()}>
                <Link size={17} /> Añadir URL
              </button>
            </div>
          </section>

          <section className="offer-editor">
            <div className="admin-panel-title"><Percent size={18} /> Oferta</div>
            <div className="admin-form-grid">
              <label>
                Tipo
                <select value={productForm.offerType} onChange={updateProduct('offerType')} disabled={!canManageProducts}>
                  <option value="none">Sin oferta</option>
                  <option value="percent">% descuento</option>
                  <option value="amount">€ descuento</option>
                  <option value="bundle">Promoción por unidades</option>
                </select>
              </label>
              {(productForm.offerType === 'percent' || productForm.offerType === 'amount') && (
                <label>Valor<input type="number" min="0" step="0.01" value={productForm.offerValue} onChange={updateProduct('offerValue')} disabled={!canManageProducts} /></label>
              )}
              {productForm.offerType === 'bundle' && (
                <>
                  <label>Unidades oferta<input type="number" min="2" step="1" value={productForm.offerBundleQuantity} onChange={updateProduct('offerBundleQuantity')} disabled={!canManageProducts} /></label>
                  <label>Unidades pagadas<input type="number" min="1" step="1" value={productForm.offerBundlePayQuantity} onChange={updateProduct('offerBundlePayQuantity')} disabled={!canManageProducts} /></label>
                </>
              )}
              <label className="wide-field">Etiqueta<input value={productForm.offerLabel} onChange={updateProduct('offerLabel')} disabled={!canManageProducts} placeholder="Ej. Oferta de temporada" /></label>
              <label>Vigente desde<input type="date" value={productForm.offerValidFrom} onChange={updateProduct('offerValidFrom')} disabled={!canManageProducts} /></label>
              <label>Vigente hasta<input type="date" value={productForm.offerValidUntil} onChange={updateProduct('offerValidUntil')} disabled={!canManageProducts} /></label>
            </div>
          </section>

          <div className="form-actions supplier-editor-actions">
            <button className="secondary" type="button" onClick={actions.resetSupplierProductForm} disabled={busy}>Nuevo</button>
            <button className="primary" type="submit" disabled={busy || !canManageProducts}>
              <Save size={18} /> {selectedSupplierProductId ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
