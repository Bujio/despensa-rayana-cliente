import { MessageSquare, Save, Star, Trash2, UserRound } from 'lucide-react';

export function AccountView({ state, actions }) {
  const { accountReviewForm, authForm, authMode, busy, myReviews, selectedAccountReviewId, session } = state;

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

  return (
    <section className="account-view">
      <form className="auth-card" onSubmit={actions.handleAuth}>
        <div className="segmented">
          <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => actions.setAuthMode('login')}>Entrar</button>
          <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => actions.setAuthMode('register')}>Crear cuenta</button>
        </div>
        <h1>{authMode === 'login' ? 'Accede a tu cuenta' : 'Nueva cuenta'}</h1>
        {authMode === 'register' && (
          <>
            <label>Nombre<input required value={authForm.name} onChange={update('name')} /></label>
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
          <UserRound size={18} /> {authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </section>
  );
}
