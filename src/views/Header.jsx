import { Heart, LogOut, Menu, PackageCheck, Search, Settings, ShoppingBag, UserRound, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const commerceSections = [
  'Alimentación',
  'Ibéricos',
  'Quesos',
  'Dulces y miel',
  'Bebidas',
  'Artesanía',
  'Packs regalo',
  'Ofertas',
  'La Rayana',
];

export function Header({ cartCount, busy, filters, session, onCommerceCategory, onFavorites, onLogout, onSearch, onViewChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const menuCloseRef = useRef(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (menuTriggerRef.current?.isConnected) menuTriggerRef.current.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    menuCloseRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMenu, menuOpen]);

  const goTo = (nextView) => {
    onViewChange(nextView);
    if (menuOpen) closeMenu();
    setAccountOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('search') || '';
    onSearch(value.toString());
    if (menuOpen) closeMenu();
  };

  return (
    <header className="site-header">
      <div className="announcement-bar">
        <span>Envíos a toda España peninsular en 24/48h</span>
        <span>Productos de origen extremeño</span>
      </div>

      <div className="topbar">
        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          ref={menuTriggerRef}
        >
          <Menu size={21} />
        </button>

        <button className="brand" type="button" onClick={() => goTo('home')}>
          <span className="brand-mark">DR</span>
          <span>
            <strong>La Despensa Rayana</strong>
            <small>Sabores de nuestra tierra</small>
          </span>
        </button>

        <form className="header-search" onSubmit={submitSearch} role="search">
          <label className="sr-only" htmlFor="global-search">Buscar productos</label>
          <Search size={18} />
          <input id="global-search" name="search" defaultValue={filters?.search || ''} placeholder="Buscar aceite, miel, queso..." />
        </form>

        <div className="top-actions">
          {session ? (
            <>
              <button className="user-chip" type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen}>
                <UserRound size={16} /> Mi cuenta
              </button>
              {accountOpen && (
                <div className="account-menu">
                  <strong>{session.user?.name || session.user?.email}</strong>
                  <button type="button" onClick={() => {
                    onFavorites();
                    setAccountOpen(false);
                  }}><Heart size={16} /> Favoritos</button>
                  <button type="button" onClick={() => goTo('orders')}><PackageCheck size={16} /> Pedidos</button>
                  {session.user?.role === 'admin' && (
                    <button type="button" onClick={() => goTo('admin')}><Settings size={16} /> Gestión</button>
                  )}
                  <button type="button" onClick={onLogout} disabled={busy}><LogOut size={16} /> Cerrar sesión</button>
                </div>
              )}
            </>
          ) : (
            <button className="secondary small" type="button" onClick={() => goTo('account')}>
              <UserRound size={16} /> Cuenta
            </button>
          )}
          <button className="cart-pill" type="button" onClick={() => goTo('cart')} aria-label="Abrir cesta">
            <ShoppingBag size={18} />
            <span>{cartCount}</span>
          </button>
        </div>
      </div>

      <nav className="commerce-nav" aria-label="Categorías principales">
        {commerceSections.map((section) => (
          <button key={section} type="button" onClick={() => onCommerceCategory(section)}>
            {section}
          </button>
        ))}
      </nav>

      {menuOpen && (
        <>
          <button
            aria-label="Cerrar menú"
            className="mobile-menu-backdrop open"
            onClick={closeMenu}
            type="button"
          />
          <aside
            className="mobile-menu open"
            id="mobile-menu"
            aria-label="Menú principal"
          >
            <div className="mobile-menu-head">
              <strong>La Despensa Rayana</strong>
              <button className="icon-button" type="button" onClick={closeMenu} aria-label="Cerrar menú" ref={menuCloseRef}>
                <X size={18} />
              </button>
            </div>
            <form className="header-search mobile-search" onSubmit={submitSearch} role="search">
              <Search size={18} />
              <input name="search" defaultValue={filters?.search || ''} placeholder="Buscar productos..." />
            </form>
            <div className="mobile-links">
              {commerceSections.map((section) => (
                <button key={section} type="button" onClick={() => {
                  onCommerceCategory(section);
                  closeMenu();
                }}>{section}</button>
              ))}
            </div>
            <div className="mobile-access">
              <button type="button" onClick={() => goTo('account')}>Mi cuenta</button>
              <button type="button" onClick={() => goTo('orders')}>Mis pedidos</button>
              <button type="button" onClick={() => {
                onFavorites();
                closeMenu();
              }}>Favoritos</button>
              <button type="button" onClick={() => goTo('cart')}>Cesta</button>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
