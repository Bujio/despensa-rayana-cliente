import { CreditCard, MapPin, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatCurrency, formatProductName } from './viewFormatters.js';

function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

function CheckoutSteps({ current }) {
  const steps = [
    ['items', 'Productos'],
    ['shipping', 'Envío'],
    ['payment', 'Pago'],
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
    busy,
    cartCount,
    cartItems,
    cartTotal,
    checkoutErrors,
    checkoutStep,
    paymentForm,
    session,
    shippingForm,
  } = state;

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
            <label>
              Calle
              <input value={shippingForm.street} onChange={(event) => actions.updateShippingForm('street', event.target.value)} autoComplete="street-address" />
              <FieldError message={checkoutErrors.street} />
            </label>
            <div className="checkout-grid">
              <label>
                Código postal
                <input value={shippingForm.codePostal} onChange={(event) => actions.updateShippingForm('codePostal', event.target.value)} inputMode="numeric" autoComplete="postal-code" />
                <FieldError message={checkoutErrors.codePostal} />
              </label>
              <label>
                Ciudad
                <input value={shippingForm.city} onChange={(event) => actions.updateShippingForm('city', event.target.value)} autoComplete="address-level2" />
                <FieldError message={checkoutErrors.city} />
              </label>
            </div>
            <div className="checkout-grid">
              <label>
                País
                <input value={shippingForm.country} onChange={(event) => actions.updateShippingForm('country', event.target.value)} autoComplete="country-name" />
                <FieldError message={checkoutErrors.country} />
              </label>
              <label>
                Teléfono
                <input value={shippingForm.phone} onChange={(event) => actions.updateShippingForm('phone', event.target.value)} inputMode="tel" autoComplete="tel" />
                <FieldError message={checkoutErrors.phone} />
              </label>
            </div>
            <div className="checkout-actions">
              <button className="secondary" type="button" onClick={actions.goToCartItems}>
                Volver
              </button>
              <button className="primary" type="submit" disabled={busy}>
                Continuar al pago
              </button>
            </div>
          </form>
        )}

        {checkoutStep === 'payment' && (
          <form className="checkout-form" onSubmit={actions.createOrder} noValidate>
            <div className="form-section-title"><CreditCard size={18} /> Pago</div>
            <label>
              Titular
              <input value={paymentForm.holder} onChange={(event) => actions.updatePaymentForm('holder', event.target.value)} autoComplete="cc-name" />
              <FieldError message={checkoutErrors.holder} />
            </label>
            <label>
              Número de tarjeta
              <input value={paymentForm.cardNumber} onChange={(event) => actions.updatePaymentForm('cardNumber', event.target.value)} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" />
              <FieldError message={checkoutErrors.cardNumber} />
            </label>
            <div className="checkout-grid">
              <label>
                Caducidad
                <input value={paymentForm.expiry} onChange={(event) => actions.updatePaymentForm('expiry', event.target.value)} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" />
                <FieldError message={checkoutErrors.expiry} />
              </label>
              <label>
                CVC
                <input value={paymentForm.cvc} onChange={(event) => actions.updatePaymentForm('cvc', event.target.value)} inputMode="numeric" autoComplete="cc-csc" />
                <FieldError message={checkoutErrors.cvc} />
              </label>
            </div>
            <div className="checkout-actions">
              <button className="secondary" type="button" onClick={() => actions.goToShipping()}>
                Volver al envío
              </button>
              <button className="primary" type="submit" disabled={busy || !session || !cartItems.length}>
                <ShoppingBag size={18} /> Crear pedido
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
          <button className="primary full" type="button" onClick={actions.goToShipping} disabled={!session || !cartItems.length || busy}>
            <ShoppingBag size={18} /> Continuar
          </button>
        )}
        {checkoutStep === 'shipping' && (
          <button className="primary full" type="button" onClick={actions.goToPayment} disabled={!session || !cartItems.length || busy}>
            <CreditCard size={18} /> Ir a pago
          </button>
        )}
        {checkoutStep === 'payment' && (
          <button className="primary full" type="button" onClick={actions.createOrder} disabled={!session || !cartItems.length || busy}>
            <ShoppingBag size={18} /> Crear pedido
          </button>
        )}
      </aside>
      </div>
    </section>
  );
}
