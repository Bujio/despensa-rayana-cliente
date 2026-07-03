import { ArrowLeft, MessageSquare, Save, Star, Store, Trash2, UserRound } from 'lucide-react';

export function AccountView({ state, actions }) {
  const { accountReviewForm, authFeedback, authForm, authMode, busy, myReviews, selectedAccountReviewId, session } = state;

  const update = (field) => (event) => actions.updateAuthForm(field, event.target.value);
  const updateReview = (field) => (event) => actions.updateAccountReviewForm(field, event.target.value);

  if (session) {
    return (
      <section className="account-view account-dashboard">
        <div className="section-heading compact">
          <div>
            <h1>Mi cuenta</h1>
            <p>{session.user?.name || session.user?.email}</p>
          </div>
        </div>

        <section className="wide-panel account-reviews-panel">
          <div className="admin-panel-title"><MessageSquare size={19} /> Mis opiniones</div>
          {myReviews.length ? (
            <div className="account-review-list">
              {myReviews.map((review) => (
                <article className={'review-card editable-review' + (selectedAccountReviewId === (review._id || review.id) ? ' active' : '')} key={review._id || review.id}>
                  <button type="button" className="review-main-button" onClick={() => actions.selectAccountReview(review)}>
                    <span className="stars">{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={14} fill={value <= review.rating ? 'currentColor' : 'none'} />)}</span>
                    <strong>{review.product?.name || 'Producto'}</strong>
                    <span>{review.title || review.comment}</span>
                  </button>
                  <button className="icon-button danger-button" type="button" onClick={() => actions.deleteReview(review)} disabled={busy} title="Eliminar opinión">
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">Aún no has publicado opiniones.</div>
          )}
        </section>

        <form className="wide-panel account-review-editor" onSubmit={actions.saveAccountReview}>
          <div className="admin-panel-title"><Save size={19} /> Editar opinión</div>
          {selectedAccountReviewId ? (
            <>
              <label>
                Valoración
                <select value={accountReviewForm.rating} onChange={updateReview('rating')}>
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
                </select>
              </label>
              <label>Título<input value={accountReviewForm.title} onChange={updateReview('title')} /></label>
              <label>Opinión<textarea required minLength="3" value={accountReviewForm.comment} onChange={updateReview('comment')} /></label>
              <button className="primary full" type="submit" disabled={busy}><Save size={18} /> Guardar opinión</button>
            </>
          ) : (
            <div className="empty-state compact-empty">Selecciona una opinión para modificarla.</div>
          )}
        </form>
      </section>
    );
  }

  const isRegister = authMode === 'register';
  const selectedType = authForm.accountType;
  const isSupplierRegister = isRegister && selectedType === 'supplier';
  const isCustomerRegister = isRegister && selectedType === 'customer';

  return (
    <section className="account-view">
      <form className="auth-card account-auth-card" onSubmit={actions.handleAuth}>
        <div className="auth-card-top">
          <div className="segmented">
            <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => actions.setAuthMode('login')}>Entrar</button>
            <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => actions.setAuthMode('register')}>Crear cuenta</button>
          </div>
          <div className="auth-heading-block">
            <h1>{authMode === 'login' ? 'Accede a tu cuenta' : 'Nueva cuenta'}</h1>
            {isRegister && (
              <p>{selectedType ? 'Completa los datos para finalizar el alta.' : 'Elige primero cómo quieres darte de alta.'}</p>
            )}
          </div>
        </div>

        {isRegister && !selectedType && (
          <div className="account-type-step" aria-label="Tipo de cuenta">
            <button type="button" className="account-type-card" onClick={() => actions.chooseAccountType('customer')}>
              <span><UserRound size={22} /></span>
              <strong>Cliente</strong>
              <small>Compra productos, guarda favoritos y consulta tus pedidos.</small>
            </button>
            <button type="button" className="account-type-card" onClick={() => actions.chooseAccountType('supplier')}>
              <span><Store size={22} /></span>
              <strong>Proveedor</strong>
              <small>Solicita vender productos locales y prepara tu catálogo para revisión.</small>
            </button>
          </div>
        )}

        {isRegister && selectedType && (
          <button className="text-link-button auth-back-button" type="button" onClick={() => actions.chooseAccountType('')}>
            <ArrowLeft size={16} /> Cambiar tipo de alta
          </button>
        )}

        {(authMode === 'login' || isCustomerRegister || isSupplierRegister) && (
          <div className="auth-form-fields">
            {isRegister && (
              <>
                <label>{isSupplierRegister ? 'Nombre comercial' : 'Nombre'}<input required value={authForm.name} onChange={update('name')} /></label>
                {isSupplierRegister && (
                  <>
                    <label>Razón social<input value={authForm.legalName} onChange={update('legalName')} placeholder="Opcional" /></label>
                    <label className="wide-auth-field">Descripción del proyecto<textarea value={authForm.description} onChange={update('description')} placeholder="Cuéntanos qué produces y dónde está tu origen" /></label>
                  </>
                )}
                <label>Teléfono<input value={authForm.phone} onChange={update('phone')} /></label>
                <label>Calle<input value={authForm.street} onChange={update('street')} /></label>
                <div className="range-grid">
                  <label>Código postal<input value={authForm.codePostal} onChange={update('codePostal')} /></label>
                  <label>Ciudad<input value={authForm.city} onChange={update('city')} /></label>
                </div>
                <label>País<input value={authForm.country} onChange={update('country')} /></label>
              </>
            )}
            <label>Email<input type="email" required value={authForm.email} onChange={update('email')} /></label>
            <label>Contraseña<input type="password" required value={authForm.password} onChange={update('password')} /></label>
            <button className="primary full" type="submit" disabled={busy}>
              {isSupplierRegister ? <Store size={18} /> : <UserRound size={18} />} {authMode === 'login' ? 'Entrar' : isSupplierRegister ? 'Solicitar alta como proveedor' : 'Crear cuenta'}
            </button>
            {authFeedback?.message && (
              <p className={'form-feedback ' + authFeedback.type} role={authFeedback.type === 'error' ? 'alert' : 'status'}>
                {authFeedback.message}
              </p>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
