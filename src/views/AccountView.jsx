import { MessageSquare, Save, Star, Trash2, UserRound } from 'lucide-react';

export function AccountView({ state, actions }) {
  const { accountReviewForm, authForm, authMode, busy, myReviews, selectedAccountReviewId, session } = state;

  return (
    <section className="wide-panel account-orders-panel">
      <div className="admin-panel-title"><ShoppingBag size={19} /> Mis pedidos</div>
      {orders.length ? (
        <div className="orders-list account-orders-list">
          {orders.map((order) => {
            const orderId = getOrderId(order);
            const isSelected = selectedOrderId === orderId;
            const isPending = (order.status || 'pending') === 'pending';
            return (
              <article className={'order-card' + (isSelected ? ' expanded' : '')} key={orderId}>
                <div>
                  <h2>Pedido {String(orderId).slice(-6)}</h2>
                  <p>{getShippingText(order) || order.email}</p>
                </div>
                <span className={'status ' + (order.status || 'pending')}>{order.status || 'pending'}</span>
                <strong>{formatCurrency(orderModel.getTotal(order))}</strong>
                <div className="order-card-actions">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setSelectedOrderId(isSelected ? '' : orderId)}
                    title="Ver detalle"
                  >
                    <Eye size={17} />
                  </button>
                  {isPending && (
                    <button
                      className="icon-button danger-button"
                      type="button"
                      onClick={() => actions.cancelOrder(order)}
                      disabled={busy}
                      title="Anular pedido"
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                </div>
                {isSelected && (
                  <div className="order-detail-inline">
                    <div className="order-lines">
                      {(order.products || []).map((line) => (
                        <div className="order-line" key={line.sku}>
                          <span>{formatProductName(line.name) || line.sku}</span>
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
        <div className="empty-state compact-empty">Todavía no tienes pedidos.</div>
      )}
    </section>
  );
}

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
            <label>
              Responder
              <textarea
                required
                minLength="3"
                value={replyForm.message}
                onChange={(event) => actions.updateAccountMessageReplyForm('message', event.target.value)}
                placeholder="Escribe una respuesta para el proveedor"
              />
            </label>
            <button className="primary full" type="submit" disabled={busy}><Send size={18} /> Enviar respuesta</button>
          </>
        ) : (
          <div className="empty-state compact-empty">Selecciona una conversación.</div>
        )}
      </form>
    </section>
  );
}

export function AccountView({ state, actions, forceRegister = false }) {
  const {
    accountProfileForm,
    accountMessageReplyForm,
    accountSupplierMessages = [],
    accountReviewForm,
    authFeedback,
    authForm,
    authMode,
    busy,
    myReviews = [],
    orders = [],
    selectedAccountReviewId,
    selectedAccountMessageId,
    session,
  } = state;
  const [accountSection, setAccountSection] = useState('profile');

  const update = (field) => (event) => actions.updateAuthForm(field, event.target.value);
  const updateProfile = (field) => (event) => actions.updateAccountProfileForm(field, event.target.value);
  const updateReview = (field) => (event) => actions.updateAccountReviewForm(field, event.target.value);

  useEffect(() => {
    if (!forceRegister || session) return;
    if (authMode !== 'register') actions.setAuthMode('register');
    if (authForm.accountType !== 'customer') actions.chooseAccountType('customer');
  }, [forceRegister, session, authMode, authForm.accountType, actions]);

  if (session) {
    const pendingOrdersCount = orders.filter((order) => (order.status || 'pending') === 'pending').length;
    const accountNav = [
      ['profile', UserRound, 'Mi perfil', 'Datos personales y dirección'],
      ['orders', ShoppingBag, 'Mis pedidos', orders.length + ' pedidos'],
      ['messages', MessageSquare, 'Mensajes', accountSupplierMessages.length + ' conversaciones'],
      ['reviews', MessageSquare, 'Mis valoraciones', myReviews.length + ' opiniones'],
    ];

    return (
      <section className="account-view account-dashboard account-panel">
        <aside className="account-panel-sidebar">
          <div className="account-panel-id">
            <span><UserRound size={20} /></span>
            <strong>{session.user?.name || 'Cliente'}</strong>
            <small>{session.user?.email}</small>
          </div>
          <nav className="account-panel-nav" aria-label="Secciones de mi cuenta">
            {accountNav.map(([key, Icon, label, meta]) => (
              <button className={accountSection === key ? 'active' : ''} type="button" key={key} onClick={() => setAccountSection(key)}>
                <Icon size={17} />
                <span>
                  <strong>{label}</strong>
                  <small>{meta}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="account-panel-kpis">
            <article><span>Pedidos</span><strong>{orders.length}</strong></article>
            <article><span>Pendientes</span><strong>{pendingOrdersCount}</strong></article>
            <article><span>Valoraciones</span><strong>{myReviews.length}</strong></article>
          </div>
          {session.user?.role === 'supplier' && (
            <section className="supplier-account-link compact">
              <strong>Panel de proveedor</strong>
              <button className="primary" type="button" onClick={() => actions.setView('supplier')}>
                <PackagePlus size={18} /> Gestionar productos
              </button>
            </section>
          )}
        </aside>

        <div className="account-panel-main">
          <div className="section-heading compact account-panel-heading">
            <div>
              <h1>{accountSection === 'profile' ? 'Mi perfil' : accountSection === 'orders' ? 'Mis pedidos' : accountSection === 'messages' ? 'Mensajes' : 'Mis valoraciones'}</h1>
              <p>
                {accountSection === 'profile'
                  ? 'Consulta y modifica tus datos de cliente.'
                  : accountSection === 'orders'
                    ? 'Revisa tus compras y anula pedidos pendientes.'
                    : accountSection === 'messages'
                      ? 'Consulta y responde los mensajes que has enviado a proveedores.'
                      : 'Gestiona las opiniones que has publicado.'}
              </p>
            </div>
          </div>

          {accountSection === 'profile' && (
            <form className="wide-panel account-profile-panel" onSubmit={actions.saveAccountProfile}>
              <div className="admin-panel-title"><UserRound size={19} /> Datos de cliente</div>
              <div className="admin-form-grid">
                <label>Nombre<input required value={accountProfileForm.name} onChange={updateProfile('name')} /></label>
                <label>Email<input required type="email" value={accountProfileForm.email} onChange={updateProfile('email')} /></label>
                <label>Teléfono<input value={accountProfileForm.phone} onChange={updateProfile('phone')} /></label>
                <label>País<input value={accountProfileForm.country} onChange={updateProfile('country')} /></label>
                <label className="wide-field">Calle<input value={accountProfileForm.street} onChange={updateProfile('street')} /></label>
                <label>Código postal<input value={accountProfileForm.codePostal} onChange={updateProfile('codePostal')} /></label>
                <label>Ciudad<input value={accountProfileForm.city} onChange={updateProfile('city')} /></label>
                <label className="wide-field">
                  Nueva contraseña
                  <input
                    type="password"
                    value={accountProfileForm.password}
                    onChange={updateProfile('password')}
                    placeholder="Déjala vacía para mantener la actual"
                  />
                </label>
              </div>
              <div className="form-actions account-profile-actions">
                <button className="primary" type="submit" disabled={busy}><Save size={18} /> Guardar datos</button>
                <button className="secondary danger-text-button" type="button" onClick={actions.deleteOwnAccount} disabled={busy}>
                  <Trash2 size={17} /> Eliminar cuenta
                </button>
              </div>
            </form>
          )}

          {accountSection === 'orders' && (
            <AccountOrdersPanel busy={busy} orders={orders} actions={actions} />
          )}

          {accountSection === 'messages' && (
            <AccountMessagesPanel
              busy={busy}
              messages={accountSupplierMessages}
              replyForm={accountMessageReplyForm}
              selectedId={selectedAccountMessageId}
              actions={actions}
            />
          )}

          {accountSection === 'reviews' && (
            <div className="account-reviews-workspace">
              <section className="wide-panel account-reviews-panel">
                <div className="admin-panel-title"><MessageSquare size={19} /> Mis opiniones</div>
                {myReviews.length ? (
                  <div className="account-review-list">
                    {myReviews.map((review) => (
                      <article
                        className={'review-card editable-review' + (selectedAccountReviewId === (review._id || review.id) ? ' active' : '')}
                        key={review._id || review.id}
                      >
                        <button type="button" className="review-main-button" onClick={() => actions.selectAccountReview(review)}>
                          <span className="stars">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Star key={value} size={14} fill={value <= review.rating ? 'currentColor' : 'none'} />
                            ))}
                          </span>
                          <strong>{formatProductName(review.product?.name) || 'Producto'}</strong>
                          <span>{review.title || review.comment}</span>
                        </button>
                        <button
                          className="icon-button danger-button"
                          type="button"
                          onClick={() => actions.deleteReview(review)}
                          disabled={busy}
                          title="Eliminar opinión"
                        >
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
            </div>
          )}
        </div>
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
