import { LockKeyhole, Store, UserRound } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

export function AccessDeniedView({
  actions,
  title = 'Acceso restringido',
  message = 'No tienes permiso para entrar en esta sección con la cuenta actual.',
  primaryLabel = 'Volver al catálogo',
  primaryView = 'catalog',
  secondaryLabel = 'Ir a mi cuenta',
  secondaryView = 'account',
}) {
  return (
    <section className="wide-panel single access-denied-view">
      <div className="empty-state">
        <span className="access-denied-icon"><LockKeyhole size={24} /></span>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      <div className="form-actions">
        <button className="secondary" type="button" onClick={() => actions.setView(secondaryView)}>
          <UserRound size={17} /> {secondaryLabel}
        </button>
        <button className="primary" type="button" onClick={() => actions.setView(primaryView)}>
          <Store size={17} /> {primaryLabel}
        </button>
      </div>
    </section>
  );
}

export function RequireAdminAuth({ state, actions, children }) {
  if (!state.session) return <Navigate to="/cuenta" replace />;
  if (state.session.user?.role !== 'admin') {
    return (
      <AccessDeniedView
        actions={actions}
        title="Gestión reservada"
        message="Solo una cuenta administradora puede acceder al backoffice."
      />
    );
  }

  return children;
}

export function RequireSupplierAuth({ state, actions, children }) {
  const location = useLocation();
  const isPublicSupplierRoute = location.pathname === '/supplier/register' || location.pathname === '/supplier/login';

  if (isPublicSupplierRoute) return children;
  if (!state.session) return <Navigate to="/supplier/login" replace />;
  if (state.session.user?.role !== 'supplier') {
    return (
      <AccessDeniedView
        actions={actions}
        title="Panel reservado a proveedores"
        message="Entra con una cuenta de proveedor o solicita el alta para gestionar productos."
        primaryLabel="Solicitar alta"
        primaryView="supplierRegister"
      />
    );
  }

  return children;
}

export function RequireUserAuth({ state, children }) {
  if (!state.session) return <Navigate to="/cuenta" replace />;
  return children;
}
