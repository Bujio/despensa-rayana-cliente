import { Trash2 } from 'lucide-react';
import { orderModel } from '../models/orderModel.js';
import { formatCurrency } from './viewFormatters.js';

export function OrdersView({ state, actions }) {
  const { busy, orders, session } = state;
  const isAdmin = session?.user?.role === 'admin';

  const getShippingText = (order) => {
    const address = order.shippingAddress;
    if (!address) return '';
    return [address.street, address.codePostal, address.city, address.country, address.phone]
      .filter(Boolean)
      .join(' · ');
  };

  return (
    <section className="wide-panel single">
      <div className="section-heading compact">
        <div>
          <h1>Pedidos</h1>
          <p>{isAdmin ? 'Gestión de todos los pedidos.' : session ? 'Historial asociado a tu correo.' : 'Inicia sesión para ver tus pedidos.'}</p>
        </div>
      </div>
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id || order.id}>
              <div>
                <h2>Pedido {String(order._id || order.id).slice(-6)}</h2>
                <p>{order.email}</p>
                {getShippingText(order) && <p className="order-address">{getShippingText(order)}</p>}
              </div>
              <span className={'status ' + (order.status || 'pending')}>{order.status || 'pending'}</span>
              <strong>{formatCurrency(orderModel.getTotal(order))}</strong>
              {isAdmin && (
                <button className="icon-button danger-button" type="button" onClick={() => actions.deleteOrder(order)} disabled={busy} title="Eliminar pedido">
                  <Trash2 size={17} />
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">Todavía no hay pedidos para mostrar.</div>
      )}
    </section>
  );
}
