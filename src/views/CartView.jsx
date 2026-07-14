import { useEffect } from 'react';
import { MapPin, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatCurrency, formatProductName } from './viewFormatters.js';

function FieldError({ field, message }) {
  if (!message) return null;
  return <span className="field-error" id={'checkout-' + field + '-error'}>{message}</span>;
}

function CheckoutSteps({ current }) {
  const steps = [
    ['items', 'Productos'],
    ['shipping', 'Envío'],
    ['payment', 'Confirmación'],
  ];

  return (
    <div className="checkout-steps" aria-label="Pasos del pedido">
      {steps.map(([key, label], index) => (
        <div className={current === key ? 'active' : ''} key={key}>
          <span>{index + 1}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}

export function CartView({ state, actions }) {
  const {
    cartCount,
    cartItems,
    cartTotal,
    checkoutErrors,
    checkoutFocusTarget,
    checkoutSubmitting,
    checkoutStep,
    paymentForm,
    session,
    shippingForm,
  } = state;

  useEffect(() => {
    if (!checkoutFocusTarget?.field || typeof document === 'undefined') return;
    document.getElementById('checkout-' + checkoutFocusTarget.field)?.focus();
  }, [checkoutFocusTarget]);

  const getErrorDescription = (field) => (
    checkoutErrors[field] ? 'checkout-' + field + '-error' : undefined
  );

  return (
    <section className="cart-drawer-view" aria-label="Cesta">
      <button className="cart-drawer-backdrop" type="button" onClick={() => actions.setView('catalog')} aria-label="Cerrar cesta" />
      <div className="cart-drawer-panel">
        <button className="icon-button drawer-close" type="button" onClick={() => actions.setView('catalog')} title="Cerrar cesta">
          <X size={18} />
        </button>
      <div className="wide-panel">
        <div className="section-heading compact">
          <div>
            <h1>Carrito</h1>
            <p>{session ? 'Completa los pasos para crear el pedido.' : 'Inicia sesión para usar el carrito.'}</p>
          </div>
          {cartItems.length > 0 && checkoutStep === 'items' && (
            <button className="secondary" type="button" onClick={actions.clearCart}>
              <Trash2 size={16} /> Vaciar
            </button>
          )}
        </div>

        <CheckoutSteps current={checkoutStep} />

        {checkoutStep === 'items' && (
          cartItems.length ? (
            <div className="cart-list">
              {cartItems.map((item) => (
                <article className="cart-row" key={item.sku}>
                  <div>
                    <h2>{formatProductName(item.name) || item.sku}</h2>
                    <p>{item.sku}</p>
                  </div>
                  <strong>{formatCurrency(item.price)}</strong>
                  <div className="stepper">
                    <button type="button" onClick={() => actions.updateCartItem(item, Number(item.quantity || item.count) - 1)}><Minus size={16} /></button>
                    <span>{item.quantity || item.count}</span>
                    <button type="button" onClick={() => actions.updateCartItem(item, Number(item.quantity || item.count) + 1)}><Plus size={16} /></button>
                  </div>
                  <button className="icon-button" type="button" onClick={() => actions.removeCartItem(item)} title="Quitar producto"><Trash2 size={17} /></button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state refined-empty">
              <ShoppingBag size={36} />
              <strong>Tu cesta está vacía</strong>
              <span>Explora productos de origen rayano y añade tus favoritos.</span>
              <button className="primary" type="button" onClick={() => actions.setView('catalog')}>Ver productos</button>
            </div>
          )
        )}

        {checkoutStep === 'shipping' && (
          <form className="checkout-form" onSubmit={actions.goToPayment} noValidate>
            <div className="form-section-title"><MapPin size={18} /> Dirección de envío</div>
            <label htmlFor="checkout-street">
              Calle
              <input id="checkout-street" name="street" value={shippingForm.street} onChange={(event) => actions.updateShippingForm('street', event.target.value)} autoComplete="street-address" aria-invalid={Boolean(checkoutErrors.street)} aria-describedby={getErrorDescription('street')} />
              <FieldError field="street" message={checkoutErrors.street} />
            </label>
            <div className="checkout-grid">
              <label htmlFor="checkout-codePostal">
                Código postal
                <input id="checkout-codePostal" name="codePostal" value={shippingForm.codePostal} onChange={(event) => actions.updateShippingForm('codePostal', event.target.value)} inputMode="numeric" autoComplete="postal-code" aria-invalid={Boolean(checkoutErrors.codePostal)} aria-describedby={getErrorDescription('codePostal')} />
                <FieldError field="codePostal" message={checkoutErrors.codePostal} />
              </label>
              <label htmlFor="checkout-city">
                Ciudad
                <input id="checkout-city" name="city" value={shippingForm.city} onChange={(event) => actions.updateShippingForm('city', event.target.value)} autoComplete="address-level2" aria-invalid={Boolean(checkoutErrors.city)} aria-describedby={getErrorDescription('city')} />
                <FieldError field="city" message={checkoutErrors.city} />
              </label>
            </div>
            <div className="checkout-grid">
              <label htmlFor="checkout-country">
                País
                <input id="checkout-country" name="country" value={shippingForm.country} onChange={(event) => actions.updateShippingForm('country', event.target.value)} autoComplete="country-name" aria-invalid={Boolean(checkoutErrors.country)} aria-describedby={getErrorDescription('country')} />
                <FieldError field="country" message={checkoutErrors.country} />
              </label>
              <label htmlFor="checkout-phone">
                Teléfono
                <input id="checkout-phone" name="phone" value={shippingForm.phone} onChange={(event) => actions.updateShippingForm('phone', event.target.value)} inputMode="tel" autoComplete="tel" aria-invalid={Boolean(checkoutErrors.phone)} aria-describedby={getErrorDescription('phone')} />
                <FieldError field="phone" message={checkoutErrors.phone} />
              </label>
            </div>
            <div className="checkout-actions">
              <button className="secondary" type="button" onClick={actions.goToCartItems}>
                Volver
              </button>
              <button className="primary" type="submit">
                Continuar a confirmación
              </button>
            </div>
          </form>
        )}

        {checkoutStep === 'payment' && (
          <form className="checkout-form" onSubmit={actions.createOrder} noValidate aria-busy={checkoutSubmitting}>
            <div className="form-section-title"><ShoppingBag size={18} /> Confirmar pedido pendiente</div>
            <div className="checkout-beta-notice" role="note">
              <strong>Beta sin cobro real</strong>
              <p id="checkout-beta-description">
                Registraremos el pedido como pendiente. No se realizará ningún cargo y el pago real todavía no está integrado.
                No solicitamos ni almacenamos datos de tarjeta.
              </p>
              <dl className="checkout-beta-facts">
                <div><dt>Estado inicial</dt><dd>Pendiente</dd></div>
                <div><dt>Método provisional</dt><dd>Registro externo pendiente</dd></div>
              </dl>
              <label className="check-row payment-acceptance" htmlFor="checkout-accepted">
                <input
                  id="checkout-accepted"
                  name="accepted"
                  type="checkbox"
                  checked={Boolean(paymentForm.accepted)}
                  onChange={(event) => actions.updatePaymentForm('accepted', event.target.checked)}
                  aria-invalid={Boolean(checkoutErrors.accepted)}
                  aria-describedby={[
                    'checkout-beta-description',
                    getErrorDescription('accepted'),
                  ].filter(Boolean).join(' ')}
                />
                Acepto las condiciones de esta beta: el pedido se registrará como pendiente y no se realizará ningún cargo.
              </label>
              <FieldError field="accepted" message={checkoutErrors.accepted} />
            </div>
            {checkoutErrors.submit && (
              <div className="checkout-feedback error" id="checkout-submit" role="alert" tabIndex={-1}>
                <strong>No se pudo confirmar el pedido</strong>
                <span>{checkoutErrors.submit}</span>
              </div>
            )}
            {checkoutSubmitting && (
              <p className="checkout-operation-status" role="status" aria-live="polite">
                Registrando el pedido pendiente. No cierres este panel.
              </p>
            )}
            <div className="checkout-actions">
              <button className="secondary" type="button" onClick={() => actions.goToShipping()} disabled={checkoutSubmitting}>
                Volver al envío
              </button>
              <button className="primary" type="submit" disabled={checkoutSubmitting || !session || !cartItems.length}>
                <ShoppingBag size={18} /> {checkoutSubmitting ? 'Registrando pedido…' : 'Registrar pedido pendiente'}
              </button>
            </div>
          </form>
        )}
      </div>

      <aside className="checkout-panel">
        <h2>Resumen</h2>
        <div className="total-line"><span>Productos</span><strong>{cartCount}</strong></div>
        <div className="total-line grand"><span>Total</span><strong>{formatCurrency(cartTotal)}</strong></div>
        {checkoutStep === 'items' && (
          <button className="primary full" type="button" onClick={actions.goToShipping} disabled={!session || !cartItems.length}>
            <ShoppingBag size={18} /> Continuar
          </button>
        )}
        {checkoutStep === 'shipping' && (
          <button className="primary full" type="button" onClick={actions.goToPayment} disabled={!session || !cartItems.length}>
            <ShoppingBag size={18} /> Revisar pedido
          </button>
        )}
        {checkoutStep === 'payment' && (
          <button className="primary full" type="button" onClick={actions.createOrder} disabled={!session || !cartItems.length || checkoutSubmitting}>
            <ShoppingBag size={18} /> {checkoutSubmitting ? 'Registrando pedido…' : 'Registrar pedido pendiente'}
          </button>
        )}
      </aside>
      </div>
    </section>
  );
}
