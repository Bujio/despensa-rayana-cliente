import { cartModel } from '../models/cartModel.js';
import { orderModel } from '../models/orderModel.js';
import { productModel } from '../models/productModel.js';
import { initialPaymentForm } from './controllerInitialState.js';
import {
  formatNoticeProductName,
  validateCheckoutConfirmation,
  validateShippingForm,
} from './controllerHelpers.js';

export function createCartCheckoutControllerActions({
  cartItems,
  loadOrders,
  loadProducts,
  paymentForm,
  request,
  reservedBySku,
  session,
  setBusy,
  setCart,
  setCheckoutErrors,
  setCheckoutStep,
  setNotice,
  setPaymentForm,
  setShippingForm,
  setView,
  shippingForm,
}) {
  async function loadCart() {
    try {
      setCart(await cartModel.get(request));
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addToCart(product, quantity = 1) {
    if (!session) {
      setView('account');
      setNotice('Inicia sesión para añadir productos al carrito.');
      return;
    }
    if (productModel.getAvailableStock(product, reservedBySku) <= 0) {
      setNotice('No quedan más unidades disponibles de este producto.');
      return;
    }
    setBusy(true);
    try {
      setCart(await cartModel.addItem(request, product, quantity));
      setNotice(formatNoticeProductName(product.name) + ' añadido al carrito');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateCartItem(item, quantity) {
    if (quantity < 1) return removeCartItem(item);
    setBusy(true);
    try {
      setCart(await cartModel.updateItem(request, item, quantity));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeCartItem(item) {
    setBusy(true);
    try {
      setCart(await cartModel.removeItem(request, item));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearCart() {
    setBusy(true);
    try {
      setCart(await cartModel.clear(request));
      setCheckoutStep('items');
      setCheckoutErrors({});
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  const updateShippingForm = (field, value) => {
    setShippingForm((current) => ({ ...current, [field]: value }));
    setCheckoutErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updatePaymentForm = (field, value) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
    setCheckoutErrors((current) => ({ ...current, [field]: undefined }));
  };

  function goToShipping() {
    if (!session) {
      setView('account');
      setNotice('Inicia sesión para completar el pedido.');
      return;
    }
    if (!cartItems.length) {
      setNotice('Añade algún producto antes de continuar.');
      return;
    }
    setCheckoutErrors({});
    setCheckoutStep('shipping');
  }

  function goToCartItems() {
    setCheckoutErrors({});
    setCheckoutStep('items');
  }

  function goToPayment(event) {
    event?.preventDefault();
    const errors = validateShippingForm(shippingForm);
    if (Object.keys(errors).length) {
      setCheckoutErrors(errors);
      setNotice('Revisa la dirección de envío.');
      return;
    }
    setCheckoutErrors({});
    setCheckoutStep('payment');
  }

  async function createOrder(event) {
    event?.preventDefault();
    if (!cartItems.length || !session?.user?.email) return;
    const shippingErrors = validateShippingForm(shippingForm);
    const confirmationErrors = validateCheckoutConfirmation(paymentForm);
    if (Object.keys(shippingErrors).length) {
      setCheckoutErrors(shippingErrors);
      setCheckoutStep('shipping');
      setNotice('Revisa la dirección de envío.');
      return;
    }
    if (Object.keys(confirmationErrors).length) {
      setCheckoutErrors(confirmationErrors);
      setCheckoutStep('payment');
      setNotice('Acepta las condiciones de la beta para registrar el pedido.');
      return;
    }
    setBusy(true);
    try {
      await orderModel.createFromCart(request, session.user.email, cartItems, shippingForm);
      setCart(await cartModel.clear(request));
      await loadOrders();
      await loadProducts();
      setCheckoutStep('items');
      setCheckoutErrors({});
      setPaymentForm({ ...initialPaymentForm });
      setView('orders');
      setNotice('Pedido registrado. Permanece pendiente y el pago real todavía no está integrado.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    addToCart,
    clearCart,
    createOrder,
    goToCartItems,
    goToPayment,
    goToShipping,
    loadCart,
    removeCartItem,
    updateCartItem,
    updatePaymentForm,
    updateShippingForm,
  };
}
