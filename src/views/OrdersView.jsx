import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { orderModel } from '../models/orderModel.js';
import { formatCurrency } from './viewFormatters.js';

export function OrdersView({ state, actions }) {
  const { busy, orders, session } = state;
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const isAdmin = session?.user?.role === 'admin';
  const getOrderId = (order) => order._id || order.id || '';

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
          {orders.map((order) => {
            const orderId = getOrderId(order);
            const isSelected = selectedOrderId === orderId;
            const isPending = (order.status || 'pending') === 'pending';
            return (
              <article className={'order-card' + (isSelected ? ' expanded' : '')} key={orderId}>
                <div>
                  <h2>Pedido {String(orderId).slice(-6)}</h2>
                  <p>{order.email}</p>
                  {getShippingText(order) && <p className="order-address">{getShippingText(order)}</p>}
                </div>
                <span className={'status ' + (order.status || 'pending')}>{order.status || 'pending'}</span>
                <strong>{formatCurrency(orderModel.getTotal(order))}</strong>
                <div className="order-card-actions">
                  <button className="icon-button" type="button" onClick={() => setSelectedOrderId(isSelected ? '' : orderId)} title="Ver detalle">
                    <Eye size={17} />
                  </button>
                  {!isAdmin && isPending && (
                    <button className="icon-button danger-button" type="button" onClick={() => actions.cancelOrder(order)} disabled={busy} title="Anular pedido">
                      <RotateCcw size={17} />
                    </button>
                  )}
                  {isAdmin && (
                    <button className="icon-button danger-button" type="button" onClick={() => actions.deleteOrder(order)} disabled={busy} title="Eliminar pedido">
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
                {isSelected && (
                  <div className="order-detail-inline">
                    <div className="order-lines">
                      {(order.products || []).map((line) => (
                        <div className="order-line" key={line.sku}>
                          <span>{line.sku}</span>
                          <span>{line.count || 1} uds.</span>
                          <strong>{formatCurrency(Number(line.total || line.price * (line.count || 1) || 0))}</strong>
                        </div>
                      ))}
                    </div>
                    {order.cancellation?.cancelledAt && (
                      <div className="order-cancellation-note">
                        <strong>Anulación registrada</strong>
                        <span>{new Date(order.cancellation.cancelledAt).toLocaleString('es-ES')}</span>
                        <span>Abono previsto: {formatCurrency(order.refund?.amount || order.cancellation.amount || 0)}</span>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">Todavía no hay pedidos para mostrar.</div>
      )}
    </section>
  );
}
