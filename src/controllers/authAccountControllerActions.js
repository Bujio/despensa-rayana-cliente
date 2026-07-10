import { authModel } from '../models/authModel.js';
import { userModel } from '../models/userModel.js';
import {
  initialAuthForm,
} from './controllerInitialState.js';
import {
  getAccountProfileDefaults,
  shouldShowSupplierLoginWelcome,
  translateAuthMessage,
} from './controllerHelpers.js';

export function createAuthAccountControllerActions({
  accountProfileForm,
  applySession,
  authForm,
  authMode,
  request,
  session,
  setAuthFeedback,
  setAuthForm,
  setAuthMode,
  setBusy,
  setCart,
  setNotice,
  setOrders,
  setAccountProfileForm,
  setView,
}) {
  const updateAccountProfileForm = (field, value) => {
    setAccountProfileForm((current) => ({ ...current, [field]: value }));
  };

  async function saveAccountProfile(event) {
    event.preventDefault();
    const userId = session?.user?._id || session?.user?.id;
    if (!userId) return;

    setBusy(true);
    try {
      const updated = await userModel.update(request, userId, accountProfileForm);
      const nextSession = {
        ...session,
        user: {
          ...session.user,
          ...updated,
        },
      };
      applySession(nextSession);
      setAccountProfileForm(getAccountProfileDefaults(nextSession));
      setNotice('Datos de perfil actualizados correctamente.');
    } catch (error) {
      setNotice(translateAuthMessage(error.message));
    } finally {
      setBusy(false);
    }
  }

  async function deleteOwnAccount() {
    const userId = session?.user?._id || session?.user?.id;
    if (!userId) return;
    if (!window.confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción cerrará tu sesión.')) return;

    setBusy(true);
    try {
      await userModel.delete(request, userId);
      applySession(null);
      setOrders([]);
      setCart(null);
      setView('home');
      setNotice('Tu cuenta se ha eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setAuthFeedback(null);
    try {
      if (authMode === 'login') {
        const next = await authModel.login(authForm.email, authForm.password);
        applySession(next);
        setView(next.user?.role === 'admin' ? 'admin' : next.user?.role === 'supplier' ? 'supplier' : 'catalog');
        if (next.user?.role === 'supplier') {
          if (shouldShowSupplierLoginWelcome(next.user)) {
            setNotice('Hola, ' + (next.user?.name || 'proveedor') + '. Ya tienes tu panel de proveedor preparado.');
          }
        } else {
          setNotice('Hola, ' + (next.user?.name || 'cliente') + '. Todo listo en Mi cuenta.');
        }
      } else {
        if (!authForm.accountType) {
          setAuthFeedback({ type: 'error', message: 'Elige si quieres darte de alta como cliente o proveedor.' });
          return;
        }

        const payload = {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          phone: authForm.phone,
          address: {
            country: authForm.country,
            street: authForm.street,
            codePostal: authForm.codePostal,
            city: authForm.city,
          },
        };

        if (authForm.accountType === 'supplier') {
          const result = await authModel.registerSupplier({
            ...payload,
            legalName: authForm.legalName,
            description: authForm.description,
          });
          setAuthMode('login');
          setAuthForm({ ...initialAuthForm, email: authForm.email });
          setAuthFeedback({
            type: 'success',
            message: result?.message || 'Solicitud de proveedor registrada correctamente. Tu perfil queda pendiente de revisión.',
          });
          return;
        }

        await authModel.register(payload);
        setAuthMode('login');
        setAuthForm({ ...initialAuthForm, email: authForm.email });
        setAuthFeedback({
          type: 'success',
          message: 'Cuenta creada correctamente. Revisa el correo para verificarla antes de comprar.',
        });
      }
    } catch (error) {
      setAuthFeedback({ type: 'error', message: translateAuthMessage(error.message) });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await authModel.logout(session?.refreshToken);
    } catch {
      // The local session can still be closed even if the server call fails.
    } finally {
      applySession(null);
      setView('catalog');
      setBusy(false);
      setNotice('Sesión cerrada');
    }
  }

  const updateAuthForm = (field, value) => {
    setAuthFeedback(null);
    setAuthForm((current) => ({ ...current, [field]: value }));
  };

  const chooseAccountType = (accountType) => {
    setAuthFeedback(null);
    if (accountType === 'supplier') {
      setAuthForm((current) => ({ ...current, accountType }));
      setView('supplierRegister');
      return;
    }
    setAuthForm((current) => ({ ...current, accountType }));
  };

  const changeAuthMode = (mode) => {
    setAuthFeedback(null);
    setAuthMode(mode);
  };

  return {
    changeAuthMode,
    chooseAccountType,
    deleteOwnAccount,
    handleAuth,
    handleLogout,
    saveAccountProfile,
    updateAccountProfileForm,
    updateAuthForm,
  };
}
