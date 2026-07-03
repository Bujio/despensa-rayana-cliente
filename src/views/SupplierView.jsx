import { PackagePlus, RefreshCw, ShieldCheck, Store } from 'lucide-react';
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
  const { busy, session, supplierProducts, supplierProfile } = state;

  if (session?.user?.role !== 'supplier') {
    return (
      <section className="wide-panel single">
        <div className="empty-state">Necesitas entrar como proveedor para acceder a este panel.</div>
      </section>
    );
  }

  const status = supplierProfile?.status || 'pending_review';

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

      <section className="admin-panel supplier-own-products-panel">
        <div className="admin-panel-title"><PackagePlus size={19} /> Mis productos</div>
        {supplierProducts.length ? (
          <div className="admin-list supplier-products-list">
            {supplierProducts.map((product) => {
              const image = productModel.getImage(product);
              return (
                <article className="collection-row with-thumb" key={product._id || product.id || product.sku}>
                  <div className="admin-thumb">{image ? <img src={image} alt="" /> : <Store size={18} />}</div>
                  <div className="user-main supplier-product-summary">
                    <strong>{product.name}</strong>
                    <span>{product.sku} · {formatCurrency(product.price)} · Stock {product.stock ?? 0}</span>
                  </div>
                  <span className={'admin-badge ' + (product.status === 'published' ? 'success' : product.status === 'rejected' ? 'danger' : 'warning')}>
                    {getProductStatusLabel(product.status)}
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state compact-empty">Aún no tienes productos creados.</div>
        )}
      </section>
    </section>
  );
}
