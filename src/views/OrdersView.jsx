import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { orderModel } from '../models/orderModel.js';
import { formatCurrency } from './viewFormatters.js';

export function OrdersView({ state, actions }) {
  const {
    busy,
    cancellingOrderIds,
    orderCancellationErrors,
    orderCancellationFocusTarget,
    orders,
    session,
  } = state;
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [focusAfterConfirmationId, setFocusAfterConfirmationId] = useState('');
  const [cancelDialogFallback, setCancelDialogFallback] = useState(false);
  const cancelDialogRef = useRef(null);
  const cancelDialogInitialFocusRef = useRef(null);
  const cancelTriggerRef = useRef(null);
  const restoreCancelTriggerFocusRef = useRef(false);
  const isAdmin = session?.user?.role === 'admin';
  const getOrderId = (order) => order?._id || order?.id || '';
  const sessionOwnerKey = String(
    session?.user?._id || session?.user?.id || session?.user?.email || '',
  ).toLowerCase();
  const orderToCancelId = getOrderId(orderToCancel);

  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (!dialog) return;
    let focusFrame;

    if (orderToCancel) {
      let fallbackActive = dialog.dataset.cancelFallback === 'true';
      if (!dialog.open) {
        try {
          if (typeof dialog.showModal !== 'function') throw new Error('Dialog API unavailable');
          dialog.showModal();
          delete dialog.dataset.cancelFallback;
          fallbackActive = false;
        } catch {
          dialog.setAttribute('open', '');
          dialog.dataset.cancelFallback = 'true';
          fallbackActive = true;
        }
      }
      setCancelDialogFallback(fallbackActive);
      focusFrame = window.requestAnimationFrame(() => cancelDialogInitialFocusRef.current?.focus());
    } else {
      if (dialog.open) {
        try {
          dialog.close();
        } catch {
          dialog.removeAttribute('open');
        }
      }
      delete dialog.dataset.cancelFallback;
      setCancelDialogFallback(false);
    }

    return () => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
    };
  }, [orderToCancel]);

  useEffect(() => {
    setSelectedOrderId('');
    setFocusAfterConfirmationId('');
    restoreCancelTriggerFocusRef.current = false;
    setOrderToCancel(null);
  }, [sessionOwnerKey]);

  useEffect(() => {
    if (!orderToCancelId) return;
    const remainsAvailable = orders.some((order) => getOrderId(order) === orderToCancelId);
    if (!remainsAvailable) {
      restoreCancelTriggerFocusRef.current = false;
      setOrderToCancel(null);
    }
  }, [orderToCancelId, orders]);

  useEffect(() => {
    if (!orderToCancel && restoreCancelTriggerFocusRef.current) {
      cancelTriggerRef.current?.focus();
      restoreCancelTriggerFocusRef.current = false;
    }
  }, [orderToCancel]);

  useEffect(() => {
    if (!focusAfterConfirmationId) return;
    document.getElementById('order-detail-toggle-' + focusAfterConfirmationId)?.focus();
    setFocusAfterConfirmationId('');
  }, [focusAfterConfirmationId]);

  useEffect(() => {
    const orderId = orderCancellationFocusTarget?.orderId;
    if (!orderId) return;
    document.getElementById('order-cancel-error-' + orderId)?.focus();
  }, [orderCancellationFocusTarget]);

  useEffect(() => {
    if (!cancelDialogFallback) return;
    const closeFallbackOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      restoreCancelTriggerFocusRef.current = true;
      setOrderToCancel(null);
    };
    document.addEventListener('keydown', closeFallbackOnEscape);
    return () => document.removeEventListener('keydown', closeFallbackOnEscape);
  }, [cancelDialogFallback]);

  const openCancelConfirmation = (order) => {
    cancelTriggerRef.current = document.activeElement;
    restoreCancelTriggerFocusRef.current = false;
    setOrderToCancel(order);
  };

  const closeCancelConfirmation = () => {
    restoreCancelTriggerFocusRef.current = true;
    setOrderToCancel(null);
  };

  const confirmOrderCancellation = () => {
    if (!orderToCancel) return;
    const order = orderToCancel;
    const orderId = getOrderId(order);
    restoreCancelTriggerFocusRef.current = false;
    setOrderToCancel(null);
    setFocusAfterConfirmationId(orderId);
    void actions.cancelOrder(order);
  };

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
      {session && orders.length ? (
        <div className="orders-list">
          {orders.map((order) => {
            const orderId = getOrderId(order);
            const isSelected = selectedOrderId === orderId;
            const isPending = order.status === 'pending';
            const isCancelling = cancellingOrderIds.includes(orderId);
            const cancellationError = orderCancellationErrors[orderId];
            const cancellationDescriptionId = cancellationError
              ? 'order-cancel-error-' + orderId
              : isCancelling
                ? 'order-cancel-progress-' + orderId
                : undefined;
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
                  <button
                    aria-expanded={isSelected}
                    aria-label={(isSelected ? 'Ocultar' : 'Ver') + ' detalle del pedido ' + orderId}
                    className="icon-button"
                    id={'order-detail-toggle-' + orderId}
                    type="button"
                    onClick={() => setSelectedOrderId(isSelected ? '' : orderId)}
                    title="Ver detalle"
                  >
                    <Eye size={17} />
                  </button>
                  {session && !isAdmin && isPending && (
                    <button
                      aria-describedby={cancellationDescriptionId}
                      aria-label={'Cancelar pedido ' + orderId}
                      className="icon-button danger-button"
                      type="button"
                      onClick={() => openCancelConfirmation(order)}
                      disabled={isCancelling}
                      title="Cancelar pedido"
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                  {isAdmin && (
                    <button className="icon-button danger-button" type="button" onClick={() => actions.deleteOrder(order)} disabled={busy} title="Eliminar pedido">
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
                {!isAdmin && isCancelling && (
                  <p className="order-cancel-progress" id={'order-cancel-progress-' + orderId} role="status">
                    Cancelando este pedido…
                  </p>
                )}
                {!isAdmin && cancellationError && (
                  <p
                    className="order-cancel-error"
                    id={'order-cancel-error-' + orderId}
                    role="alert"
                    tabIndex="-1"
                  >
                    {cancellationError}
                  </p>
                )}
                {!isAdmin && session && !isPending && (
                  <p className="order-cancel-unavailable">
                    {(order.status || '') === 'cancelled'
                      ? 'Este pedido ya está cancelado.'
                      : 'Solo los pedidos pendientes pueden cancelarse desde la tienda.'}
                  </p>
                )}
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
        <div className="empty-state">
          {session ? 'Todavía no hay pedidos para mostrar.' : 'Inicia sesión para ver tus pedidos.'}
        </div>
      )}
      <dialog
        aria-describedby="cancel-order-description"
        aria-labelledby="cancel-order-title"
        aria-modal={cancelDialogFallback ? undefined : 'true'}
        className="order-cancel-dialog"
        ref={cancelDialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeCancelConfirmation();
        }}
      >
        <div className="order-cancel-dialog-content">
          <h2 id="cancel-order-title">Cancelar pedido</h2>
          <div className="order-cancel-dialog-copy" id="cancel-order-description">
            <p>Vas a cancelar el pedido {String(getOrderId(orderToCancel)).slice(-6)}.</p>
            <p>La cancelación no podrá revertirse desde esta interfaz.</p>
            {cancelDialogFallback && (
              <p className="order-cancel-unavailable" role="status">
                El navegador no pudo activar el modo modal. Puedes confirmar o conservar el pedido en este panel.
              </p>
            )}
          </div>
          <div className="order-cancel-dialog-actions">
            <button
              className="secondary"
              ref={cancelDialogInitialFocusRef}
              type="button"
              onClick={closeCancelConfirmation}
            >
              Conservar pedido
            </button>
            <button className="secondary danger-button" type="button" onClick={confirmOrderCancellation}>
              Confirmar cancelación
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
