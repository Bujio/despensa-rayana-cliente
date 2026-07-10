import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  Edit3,
  FileText,
  Home,
  ImageUp,
  Link as LinkIcon,
  LogOut,
  MessageSquare,
  PackagePlus,
  Percent,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { productModel } from '../models/productModel.js';
import { formatCurrency, formatProductName } from './viewFormatters.js';

const emptySupplierRegisterForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  legalName: '',
  slug: '',
  shortDescription: '',
  description: '',
  story: '',
  specialties: '',
  origin: '',
  country: 'España',
  region: 'Extremadura',
  province: '',
  comarca: '',
  town: '',
  postalCode: '',
  address: '',
  lat: '',
  lng: '',
  contactPerson: '',
  contactEmail: '',
  phone: '',
  website: '',
  instagram: '',
  facebook: '',
  taxName: '',
  taxId: '',
  invoiceEmail: '',
  logoUrl: '',
  logoAlt: '',
  mainImageUrl: '',
  mainImageAlt: '',
  galleryUrls: '',
  artisan: false,
  ecological: false,
  dop: false,
  igp: false,
  localProduct: true,
  familyProduction: false,
  noIntermediaries: false,
};

const rayanaZonesByCountry = {
  España: [
    'Cáceres',
    'Badajoz',
    'Sierra de Gata',
    'Tajo-Salor',
    'Sierra de San Pedro',
    'Olivenza',
    'Vegas del Guadiana',
    'Tierra de Barros',
    'La Serena',
    'La Siberia',
    'Tentudía',
    'Sierra Suroeste',
    'Campiña Sur',
  ],
  Portugal: [
    'Alto Alentejo',
    'Portalegre',
    'Marvão',
    'Castelo de Vide',
    'Nisa',
    'Elvas',
    'Campo Maior',
    'Arronches',
    'Alentejo Central',
    'Évora',
    'Estremoz',
    'Vila Viçosa',
    'Borba',
    'Reguengos de Monsaraz',
    'Mourão',
    'Baixo Alentejo',
    'Moura',
    'Serpa',
    'Beja',
  ],
};

function getSupplierStatusLabel(status) {
  const labels = {
    pending_review: 'Pendiente de revisión',
    active: 'Proveedor activo',
    inactive: 'Proveedor inactivo',
    draft: 'Perfil en borrador',
    rejected: 'Solicitud rechazada',
  };
  return labels[status] || 'Estado no disponible';
}

function getSupplierMessage(status) {
  if (status === 'active') return 'Tu perfil está aprobado. Puedes preparar productos y ofertas; las publicaciones finales siguen pasando por revisión.';
  if (status === 'rejected') return 'Tu solicitud no ha sido aprobada. Puedes revisar la información y contactar con La Despensa Rayana.';
  if (status === 'inactive') return 'Tu cuenta de proveedor está inactiva temporalmente. No puedes crear productos nuevos.';
  return 'Tu perfil está pendiente de revisión. Puedes completar tu información y preparar productos, pero no serán visibles hasta la aprobación.';
}

function getSupplierStatusNoticeKey(profile, sessionUser, status) {
  const supplierKey = profile?._id || profile?.id || profile?.supplierCode || sessionUser?._id || sessionUser?.id || sessionUser?.email;
  if (!supplierKey) return '';
  return 'despensa-supplier-status-notice-seen:' + supplierKey + ':' + status;
}

function hasSeenSupplierStatusNotice(profile, sessionUser, status) {
  if (typeof window === 'undefined') return false;
  const key = getSupplierStatusNoticeKey(profile, sessionUser, status);
  return Boolean(key && window.localStorage.getItem(key));
}

function markSupplierStatusNoticeSeen(profile, sessionUser, status) {
  if (typeof window === 'undefined') return;
  const key = getSupplierStatusNoticeKey(profile, sessionUser, status);
  if (key) window.localStorage.setItem(key, 'true');
}

function getProductStatusLabel(status) {
  const labels = {
    draft: 'Borrador',
    pending_review: 'Pendiente',
    published: 'Publicado',
    inactive: 'Inactivo',
    rejected: 'Rechazado',
  };
  return labels[status] || 'Publicado';
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

function splitList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function getSupplierSection(pathname) {
  if (pathname === '/supplier/register') return 'register';
  if (pathname === '/supplier/login') return 'login';
  if (pathname.includes('/profile')) return 'profile';
  if (pathname.includes('/products/new')) return 'product-new';
  if (pathname.includes('/products/') && pathname.includes('/edit')) return 'product-edit';
  if (pathname.includes('/products')) return 'products';
  if (pathname.includes('/offers')) return 'offers';
  if (pathname.includes('/messages')) return 'messages';
  if (pathname.includes('/reports')) return 'reports';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/settings')) return 'settings';
  return 'dashboard';
}

function buildSupplierPayload(form) {
  const gallery = splitList(form.galleryUrls).map((url, index) => ({
    url,
    name: 'Imagen de proveedor ' + (index + 1),
    alt: form.name,
    isMain: index === 0,
  }));

  return {
    name: form.legalName || form.name,
    email: form.email,
    password: form.password,
    legalName: form.legalName,
    slug: form.slug,
    shortDescription: form.shortDescription,
    description: form.description,
    story: form.story,
    specialties: splitList(form.specialties),
    origin: form.origin,
    phone: form.phone,
    location: {
      country: form.country,
      region: form.region,
      province: form.province,
      comarca: form.comarca,
      town: form.town,
      postalCode: form.postalCode,
      address: form.address,
      coordinates: {
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
      },
    },
    contact: {
      contactPerson: form.contactPerson || form.name,
      email: form.contactEmail || form.email,
      phone: form.phone,
      website: form.website,
      instagram: form.instagram,
      facebook: form.facebook,
    },
    business: {
      taxName: form.taxName,
      taxId: form.taxId,
      invoiceEmail: form.invoiceEmail || form.email,
    },
    logo: form.logoUrl ? { url: form.logoUrl, alt: form.logoAlt || form.name } : undefined,
    mainImage: form.mainImageUrl ? { url: form.mainImageUrl, alt: form.mainImageAlt || form.name } : undefined,
    gallery,
    certifications: {
      artisan: form.artisan,
      ecological: form.ecological,
      dop: form.dop,
      igp: form.igp,
      localProduct: form.localProduct,
      familyProduction: form.familyProduction,
      noIntermediaries: form.noIntermediaries,
    },
  };
}

function AccessDeniedSupplier({ actions }) {
  return (
    <section className="wide-panel single supplier-access-denied">
      <div className="empty-state">
        <strong>Acceso reservado a proveedores</strong>
        <span>Entra con una cuenta de proveedor o solicita el alta para gestionar tus productos.</span>
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={() => actions.setView('supplierLogin')}>Entrar como proveedor</button>
        <button type="button" className="primary" onClick={() => actions.setView('supplierRegister')}>Solicitar alta</button>
      </div>
    </section>
  );
}

function SupplierPublicAuth({ state, actions, mode }) {
  const isLogin = mode === 'login';
  return (
    <section className="supplier-public-auth">
      <div className="supplier-auth-copy">
        <span>La Despensa Rayana</span>
        <h1>{isLogin ? 'Acceso para proveedores' : 'Alta profesional de proveedor'}</h1>
        <p>Un espacio privado para productores, obradores y artesanos que quieren vender con una identidad cuidada y control sobre su catálogo.</p>
      </div>
      {isLogin ? (
        <form className="account-card supplier-auth-card" onSubmit={actions.handleAuth}>
          <h2>Entrar</h2>
          <label>Email<input type="email" value={state.authForm.email} onChange={(event) => actions.updateAuthForm('email', event.target.value)} required /></label>
          <label>Contraseña<input type="password" value={state.authForm.password} onChange={(event) => actions.updateAuthForm('password', event.target.value)} required /></label>
          <button className="primary full" type="submit" disabled={state.busy}>Entrar al panel</button>
          <button className="secondary full" type="button" onClick={() => actions.setView('supplierRegister')}>Solicitar alta como proveedor</button>
        </form>
      ) : (
        <SupplierRegisterWizard actions={actions} busy={state.busy} />
      )}
    </section>
  );
}

function SupplierRegisterWizard({ actions, busy }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptySupplierRegisterForm);
  const [media, setMedia] = useState({ logoFile: null, mainImageFile: null, galleryFiles: [] });
  const [message, setMessage] = useState(null);
  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setMessage(null);
    setForm((current) => {
      if (field === 'country') {
        return {
          ...current,
          country: value,
          region: '',
          province: '',
          comarca: '',
        };
      }
      return { ...current, [field]: value };
    });
  };
  const updateMedia = (field) => (event) => {
    const files = Array.from(event.target.files || []);
    setMessage(null);
    setMedia((current) => ({
      ...current,
      [field]: field === 'galleryFiles' ? files : files[0] || null,
    }));
  };
  const getFileSummary = (value, fallback) => {
    if (Array.isArray(value) && value.length) return value.map((file) => file.name).join(', ');
    if (value?.name) return value.name;
    return fallback;
  };
  const availableZones = rayanaZonesByCountry[form.country] || rayanaZonesByCountry.España;
  const steps = ['Cuenta', 'Básica', 'Origen', 'Contacto', 'Fiscal', 'Imágenes', 'Certificaciones'];

  async function submit(event) {
    event.preventDefault();
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    try {
      const result = await actions.registerSupplierProfile(buildSupplierPayload(form), media);
      setMessage({
        type: 'success',
        text: result?.supplier?.supplierCode
          ? 'Solicitud registrada correctamente. Código proveedor: ' + result.supplier.supplierCode
          : 'Tu solicitud de proveedor se ha registrado correctamente.',
      });
      setForm(emptySupplierRegisterForm);
      setMedia({ logoFile: null, mainImageFile: null, galleryFiles: [] });
      setStep(0);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  return (
    <form className="account-card supplier-wizard-card" onSubmit={submit}>
      <div className="wizard-steps">
        {steps.map((label, index) => (
          <button key={label} className={step === index ? 'active' : ''} type="button" onClick={() => setStep(index)}>{index + 1}</button>
        ))}
      </div>
      <h2>{steps[step]}</h2>
      {step === 0 && (
        <div className="admin-form-grid">
          <label>Nombre contacto<input required value={form.name} onChange={update('name')} /></label>
          <label>Email<input required type="email" value={form.email} onChange={update('email')} /></label>
          <label>Contraseña<input required type="password" value={form.password} onChange={update('password')} /></label>
          <label>Confirmar contraseña<input required type="password" value={form.confirmPassword} onChange={update('confirmPassword')} /></label>
        </div>
      )}
      {step === 1 && (
        <div className="admin-form-grid">
          <label>Nombre proveedor<input required value={form.legalName} onChange={update('legalName')} /></label>
          <label>Slug<input value={form.slug} onChange={update('slug')} placeholder="queseria-raya" /></label>
          <label className="wide-field">Descripción corta<textarea value={form.shortDescription} onChange={update('shortDescription')} /></label>
          <label className="wide-field">Descripción larga<textarea value={form.description} onChange={update('description')} /></label>
          <label className="wide-field">Historia<textarea value={form.story} onChange={update('story')} /></label>
          <label className="wide-field">Especialidades<input value={form.specialties} onChange={update('specialties')} placeholder="quesos, miel, ibéricos" /></label>
        </div>
      )}
      {step === 2 && (
        <div className="admin-form-grid">
          <label>
            País
            <select value={form.country} onChange={update('country')}>
              <option value="España">España</option>
              <option value="Portugal">Portugal</option>
            </select>
          </label>
          <label>
            Zona rayana
            <select value={form.region} onChange={update('region')}>
              <option value="">Selecciona una zona</option>
              {availableZones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </label>
          <label>{form.country === 'Portugal' ? 'Distrito / región' : 'Provincia'}<input value={form.province} onChange={update('province')} placeholder={form.country === 'Portugal' ? 'Ej. Portalegre' : 'Ej. Cáceres'} /></label>
          <label>Comarca o entorno<input value={form.comarca} onChange={update('comarca')} placeholder="Ej. Sierra de San Pedro" /></label>
          <label>Localidad<input value={form.town} onChange={update('town')} /></label>
          <label>Código postal<input value={form.postalCode} onChange={update('postalCode')} /></label>
          <label className="wide-field">Dirección<input value={form.address} onChange={update('address')} /></label>
          <label>Latitud<input value={form.lat} onChange={update('lat')} /></label>
          <label>Longitud<input value={form.lng} onChange={update('lng')} /></label>
        </div>
      )}
      {step === 3 && (
        <div className="admin-form-grid">
          <label>Persona contacto<input value={form.contactPerson} onChange={update('contactPerson')} /></label>
          <label>Email contacto<input type="email" value={form.contactEmail} onChange={update('contactEmail')} /></label>
          <label>Teléfono<input value={form.phone} onChange={update('phone')} /></label>
          <label>Web<input value={form.website} onChange={update('website')} /></label>
          <label>Instagram<input value={form.instagram} onChange={update('instagram')} /></label>
          <label>Facebook<input value={form.facebook} onChange={update('facebook')} /></label>
        </div>
      )}
      {step === 4 && (
        <div className="admin-form-grid">
          <label>Razón social<input value={form.taxName} onChange={update('taxName')} /></label>
          <label>NIF/CIF<input value={form.taxId} onChange={update('taxId')} /></label>
          <label className="wide-field">Email facturación<input type="email" value={form.invoiceEmail} onChange={update('invoiceEmail')} /></label>
        </div>
      )}
      {step === 5 && (
        <div className="admin-form-grid">
          <div className="wide-field supplier-register-file-field">
            <label>Logo del proveedor<input type="file" accept="image/*" onChange={updateMedia('logoFile')} /></label>
            <span>{getFileSummary(media.logoFile, 'Selecciona una imagen cuadrada o marca del productor.')}</span>
          </div>
          <div className="wide-field supplier-register-file-field">
            <label>Imagen principal<input type="file" accept="image/*" onChange={updateMedia('mainImageFile')} /></label>
            <span>{getFileSummary(media.mainImageFile, 'Imagen ambiental, obrador, finca o producto principal.')}</span>
          </div>
          <div className="wide-field supplier-register-file-field">
            <label>Galería<input type="file" accept="image/*" multiple onChange={updateMedia('galleryFiles')} /></label>
            <span>{getFileSummary(media.galleryFiles, 'Puedes seleccionar hasta 5 imágenes reales del proveedor.')}</span>
          </div>
          <label className="wide-field">Logo URL<input type="url" value={form.logoUrl} onChange={update('logoUrl')} placeholder="Opcional si subes archivo" /></label>
          <label className="wide-field">Alt logo<input value={form.logoAlt} onChange={update('logoAlt')} /></label>
          <label className="wide-field">Imagen principal URL<input type="url" value={form.mainImageUrl} onChange={update('mainImageUrl')} placeholder="Opcional si subes archivo" /></label>
          <label className="wide-field">Alt imagen principal<input value={form.mainImageAlt} onChange={update('mainImageAlt')} /></label>
          <label className="wide-field">Galería URLs separadas por coma<textarea value={form.galleryUrls} onChange={update('galleryUrls')} placeholder="Opcional si subes archivos" /></label>
        </div>
      )}
      {step === 6 && (
        <div className="supplier-cert-grid">
          {[
            ['artisan', 'Artesano'],
            ['ecological', 'Ecológico'],
            ['dop', 'D.O.P.'],
            ['igp', 'I.G.P.'],
            ['localProduct', 'Producto local'],
            ['familyProduction', 'Producción familiar'],
            ['noIntermediaries', 'Sin intermediarios'],
          ].map(([field, label]) => (
            <label key={field} className="checkbox-field"><input type="checkbox" checked={form[field]} onChange={update(field)} /> {label}</label>
          ))}
        </div>
      )}
      {message && <p className={'form-message ' + message.type}>{message.text}</p>}
      <div className="form-actions">
        {step > 0 && <button className="secondary" type="button" onClick={() => setStep((current) => current - 1)}>Atrás</button>}
        <button className="primary" type="submit" disabled={busy}>{step === steps.length - 1 ? 'Enviar solicitud' : 'Continuar'}</button>
      </div>
    </form>
  );
}

function SupplierLayout({ state, actions, children }) {
  const navigate = useNavigate();
  const status = state.supplierProfile?.status || 'pending_review';
  const unreadMessages = (state.supplierMessages || []).filter((thread) => thread.supplierUnread).length;
  const nav = [
    ['/supplier', Home, 'Dashboard'],
    ['/supplier/profile', UserRound, 'Mi perfil'],
    ['/supplier/products', ShoppingBag, 'Mis productos'],
    ['/supplier/products/new', PackagePlus, 'Nuevo producto'],
    ['/supplier/offers', Percent, 'Ofertas'],
    ['/supplier/messages', MessageSquare, 'Mensajes'],
    ['/supplier/reports', BarChart3, 'Informes'],
    ['/supplier/orders', FileText, 'Pedidos'],
    ['/supplier/settings', Settings, 'Configuración'],
  ];

  return (
    <section className="supplier-shell">
      <aside className="supplier-sidebar">
        <div>
          <strong>{state.supplierProfile?.name || state.session?.user?.name || 'Proveedor'}</strong>
          <span>{state.supplierProfile?.supplierCode || 'Sin código'}</span>
          <small>{getSupplierStatusLabel(status)}</small>
        </div>
        <nav>
          {nav.map(([to, Icon, label]) => (
            <Link key={to} to={to}>
              <Icon size={17} /> {label}
              {label === 'Mensajes' && unreadMessages > 0 && <span className="supplier-nav-badge">{unreadMessages}</span>}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={actions.handleLogout}><LogOut size={17} /> Cerrar sesión</button>
      </aside>
      <div className="supplier-main">
        <header className="supplier-topbar">
          <div>
            <span>Panel proveedor</span>
            <strong>{state.supplierProfile?.name || state.session?.user?.email}</strong>
          </div>
          <div className={'admin-badge ' + (status === 'active' ? 'success' : status === 'rejected' ? 'danger' : 'warning')}>{getSupplierStatusLabel(status)}</div>
          <button className="secondary" type="button" onClick={() => navigate('/')}>Volver a tienda</button>
        </header>
        {children}
      </div>
    </section>
  );
}

function SupplierDashboard({ state, actions }) {
  const status = state.supplierProfile?.status || 'pending_review';
  const productReport = state.supplierReports.products || {};
  const salesReport = state.supplierReports.sales || {};
  const products = state.supplierProducts || [];
  const [showStatusNotice, setShowStatusNotice] = useState(() => !hasSeenSupplierStatusNotice(state.supplierProfile, state.session?.user, status));
  const pending = products.filter((product) => product.status === 'pending_review').length;
  const active = products.filter((product) => product.status === 'published').length;
  const out = products.filter((product) => Number(product.stock || 0) === 0).length;

  useEffect(() => {
    setShowStatusNotice(!hasSeenSupplierStatusNotice(state.supplierProfile, state.session?.user, status));
  }, [
    state.supplierProfile?._id,
    state.supplierProfile?.id,
    state.supplierProfile?.supplierCode,
    state.session?.user?._id,
    state.session?.user?.id,
    state.session?.user?.email,
    status,
  ]);

  const dismissStatusNotice = () => {
    markSupplierStatusNoticeSeen(state.supplierProfile, state.session?.user, status);
    setShowStatusNotice(false);
  };

  return (
    <div className="supplier-panel-view">
      <div className="section-heading compact">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen operativo de tu actividad en La Despensa Rayana</p>
        </div>
        <button className="secondary" type="button" onClick={actions.loadSupplierPanel} disabled={state.busy}><RefreshCw size={17} /> Actualizar</button>
      </div>
      {showStatusNotice && (
        <section className={'supplier-status-banner ' + status}>
          <span><ShieldCheck size={22} /></span>
          <div>
            <strong>{getSupplierStatusLabel(status)}</strong>
            <p>{getSupplierMessage(status)}</p>
            {state.supplierProfile?.supplierCode && <small>Código de proveedor: {state.supplierProfile.supplierCode}</small>}
          </div>
          <button className="icon-button" type="button" onClick={dismissStatusNotice} title="No volver a mostrar este aviso">
            <X size={16} />
          </button>
        </section>
      )}
      <div className="supplier-kpi-grid">
        <article><span>Mis productos</span><strong>{products.length}</strong></article>
        <article><span>Activos</span><strong>{productReport.activeProducts ?? active}</strong></article>
        <article><span>Agotados</span><strong>{productReport.outOfStockProducts ?? out}</strong></article>
        <article><span>Pendientes</span><strong>{productReport.pendingProducts ?? pending}</strong></article>
        <article><span>Ventas asociadas</span><strong>{formatCurrency(salesReport.totalRevenueFromOwnProducts || 0)}</strong></article>
        <article><span>Pedidos propios</span><strong>{salesReport.ordersWithOwnProducts || state.supplierOrders.length}</strong></article>
      </div>
    </div>
  );
}

function SupplierProfile({ state, actions }) {
  const [form, setForm] = useState(null);
  const profile = state.supplierProfile;
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      legalName: profile.legalName || '',
      slug: profile.slug || '',
      shortDescription: profile.shortDescription || '',
      description: profile.description || '',
      story: profile.story || '',
      specialties: normalizeList(profile.specialties),
      origin: profile.origin || '',
      location: profile.location || { country: 'España', region: 'Extremadura' },
      contact: profile.contact || {},
      business: profile.business || {},
      logo: profile.logo || {},
      mainImage: profile.mainImage || {},
      certifications: profile.certifications || {},
    });
  }, [profile]);

  if (!form) return <div className="empty-state compact-empty">Cargando perfil...</div>;
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateNested = (group, field) => (event) => setForm((current) => ({
    ...current,
    [group]: { ...(current[group] || {}), [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value },
  }));
  const submit = (event) => {
    event.preventDefault();
    actions.saveSupplierProfile({
      ...form,
      specialties: splitList(form.specialties),
    });
  };

  return (
    <form className="supplier-profile-form" onSubmit={submit}>
      <div className="section-heading compact"><h1>Mi perfil</h1></div>
      <section className="admin-panel">
        <div className="admin-panel-title"><Store size={18} /> Información básica</div>
        <div className="admin-form-grid">
          <label>Código proveedor<input readOnly value={profile.supplierCode || ''} /></label>
          <label>Estado<input readOnly value={getSupplierStatusLabel(profile.status)} /></label>
          <label>Nombre<input value={form.name} onChange={update('name')} /></label>
          <label>Razón social<input value={form.legalName} onChange={update('legalName')} /></label>
          <label>Slug<input value={form.slug} onChange={update('slug')} /></label>
          <label className="wide-field">Especialidades<input value={form.specialties} onChange={update('specialties')} /></label>
          <label className="wide-field">Descripción corta<textarea value={form.shortDescription} onChange={update('shortDescription')} /></label>
          <label className="wide-field">Descripción larga<textarea value={form.description} onChange={update('description')} /></label>
          <label className="wide-field">Historia<textarea value={form.story} onChange={update('story')} /></label>
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title"><UserRound size={18} /> Origen y contacto</div>
        <div className="admin-form-grid">
          <label>País<input value={form.location.country || ''} onChange={updateNested('location', 'country')} /></label>
          <label>Región<input value={form.location.region || ''} onChange={updateNested('location', 'region')} /></label>
          <label>Provincia<input value={form.location.province || ''} onChange={updateNested('location', 'province')} /></label>
          <label>Localidad<input value={form.location.town || ''} onChange={updateNested('location', 'town')} /></label>
          <label>Contacto<input value={form.contact.contactPerson || ''} onChange={updateNested('contact', 'contactPerson')} /></label>
          <label>Teléfono<input value={form.contact.phone || ''} onChange={updateNested('contact', 'phone')} /></label>
          <label>Email<input value={form.contact.email || ''} onChange={updateNested('contact', 'email')} /></label>
          <label>Web<input value={form.contact.website || ''} onChange={updateNested('contact', 'website')} /></label>
          <label>Instagram<input value={form.contact.instagram || ''} onChange={updateNested('contact', 'instagram')} /></label>
          <label>Facebook<input value={form.contact.facebook || ''} onChange={updateNested('contact', 'facebook')} /></label>
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title"><ImageUp size={18} /> Imágenes y certificaciones</div>
        <div className="admin-form-grid">
          <label className="wide-field">Logo URL<input value={form.logo.url || ''} onChange={updateNested('logo', 'url')} /></label>
          <label className="wide-field">Imagen principal URL<input value={form.mainImage.url || ''} onChange={updateNested('mainImage', 'url')} /></label>
          <label>Nombre fiscal<input value={form.business.taxName || ''} onChange={updateNested('business', 'taxName')} /></label>
          <label>NIF/CIF<input value={form.business.taxId || ''} onChange={updateNested('business', 'taxId')} /></label>
          {['artisan', 'ecological', 'dop', 'igp', 'localProduct', 'familyProduction', 'noIntermediaries'].map((field) => (
            <label key={field} className="checkbox-field"><input type="checkbox" checked={Boolean(form.certifications[field])} onChange={updateNested('certifications', field)} /> {field}</label>
          ))}
        </div>
      </section>
      <button className="primary full" type="submit" disabled={state.busy}><Save size={18} /> Guardar perfil</button>
    </form>
  );
}

function SupplierProducts({ state, actions }) {
  const navigate = useNavigate();
  const products = state.supplierProducts || [];
  const editProduct = (product) => {
    const productId = product._id || product.id;
    actions.selectSupplierProduct(product);
    navigate('/supplier/products/' + productId + '/edit');
  };

  return (
    <section className="admin-panel supplier-own-products-panel">
      <div className="admin-panel-title"><ShoppingBag size={19} /> Mis productos</div>
      {products.length ? (
        <div className="admin-list supplier-products-list">
          {products.map((product) => {
            const image = productModel.getImage(product);
            const productId = product._id || product.id;
            return (
              <article className="collection-row with-thumb" key={productId || product.sku}>
                <button className="admin-thumb" type="button" onClick={() => editProduct(product)}>
                  {image ? <img src={image} alt="" /> : <Store size={18} />}
                </button>
                <button className="user-main supplier-product-summary" type="button" onClick={() => editProduct(product)}>
                  <strong>{formatProductName(product.name)}</strong>
                  <span>{product.sku} · {product.category?.name || 'Sin categoría'} · {formatCurrency(product.price)} · Stock {product.stock ?? 0}</span>
                  {product.status === 'rejected' && product.rejectionReason && (
                    <small className="supplier-rejection-text">Motivo: {product.rejectionReason}</small>
                  )}
                </button>
                <span className={'admin-badge ' + (product.status === 'published' ? 'success' : product.status === 'rejected' ? 'danger' : 'warning')}>{getProductStatusLabel(product.status)}</span>
                <div className="supplier-product-actions">
                  <button className="icon-button" type="button" onClick={() => navigate('/producto/' + productId)} title="Ver"><ShoppingBag size={16} /></button>
                  <button className="icon-button" type="button" onClick={() => editProduct(product)} title="Editar"><Edit3 size={16} /></button>
                  <button className="icon-button" type="button" onClick={() => actions.duplicateSupplierProduct(product)} title="Duplicar"><PackagePlus size={16} /></button>
                  <button className="icon-button" type="button" onClick={() => navigate('/supplier/offers?product=' + productId)} title="Oferta"><Percent size={16} /></button>
                  <button className="icon-button danger-button" type="button" onClick={() => window.confirm('¿Eliminar este producto?') && actions.deleteSupplierProduct(product)} title="Eliminar"><Trash2 size={16} /></button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state compact-empty">Aún no tienes productos. Crea el primero desde “Nuevo producto”.</div>
      )}
    </section>
  );
}

function SupplierProductForm({ state, actions }) {
  const params = useParams();
  const navigate = useNavigate();
  const supplierRoute = params['*'] || '';
  const productId = supplierRoute.match(/^products\/([^/]+)\/edit$/)?.[1] || '';
  const isEdit = Boolean(productId);
  const status = state.supplierProfile?.status || 'pending_review';
  const canManageProducts = !['inactive', 'rejected'].includes(status);
  const product = useMemo(() => state.supplierProducts.find((item) => String(item._id || item.id) === String(productId)), [state.supplierProducts, productId]);

  useEffect(() => {
    if (isEdit && product) {
      actions.selectSupplierProduct(product);
      return;
    }
    if (isEdit && !product && state.session?.user?.role === 'supplier') {
      actions.loadSupplierPanel();
      return;
    }
    if (!isEdit) actions.resetSupplierProductForm();
  }, [isEdit, productId, product, state.session?.user?.role]);

  const updateProduct = (field) => (event) => actions.updateProductForm(field, event.target.value);
  const updateImage = (field) => (event) => actions.updateImageForm(field, event.target.value);
  const updateFiles = (event) => actions.updateImageForm('files', Array.from(event.target.files || []));
  const getId = (item) => item?._id || item?.id || '';

  return (
    <form className="admin-panel supplier-product-editor" onSubmit={(event) => actions.saveSupplierProduct(event, productId)}>
      <div className="admin-panel-title"><PackagePlus size={19} /> {isEdit ? 'Editar producto' : 'Nuevo producto'}</div>
      {isEdit && product?.status === 'rejected' && product?.rejectionReason && (
        <div className="supplier-rejection-alert">
          <strong>Producto rechazado</strong>
          <span>{product.rejectionReason}</span>
          <small>Corrige el contenido y cambia el estado a “Enviar a revisión” para que el admin pueda revisarlo de nuevo.</small>
        </div>
      )}
      <div className="admin-form-grid">
        <label>Nombre<input required value={state.productForm.name} onChange={updateProduct('name')} disabled={!canManageProducts} /></label>
        <label>SKU<input value={state.productForm.sku} onChange={updateProduct('sku')} disabled={!canManageProducts} placeholder="Se genera automáticamente: LDR-CAT-PROV-PROD-XXXX" /></label>
        <label>Precio<input required type="number" min="0.01" step="0.01" value={state.productForm.price} onChange={updateProduct('price')} disabled={!canManageProducts} /></label>
        <label>Stock<input required type="number" min="0" step="1" value={state.productForm.stock} onChange={updateProduct('stock')} disabled={!canManageProducts} /></label>
        <label>Categoría<select required value={state.productForm.category} onChange={updateProduct('category')} disabled={!canManageProducts}><option value="">Sin categoría</option>{state.categories.map((category) => <option key={getId(category)} value={getId(category)}>{category.name}</option>)}</select></label>
        <label>Estado<select value={state.productForm.status || 'pending_review'} onChange={updateProduct('status')} disabled={!canManageProducts}><option value="draft">Borrador</option><option value="pending_review">Enviar a revisión</option></select></label>
        <label className="wide-field">Descripción corta<textarea required value={state.productForm.shortDescription} onChange={updateProduct('shortDescription')} disabled={!canManageProducts} /></label>
        <label className="wide-field">Descripción larga<textarea value={state.productForm.description} onChange={updateProduct('description')} disabled={!canManageProducts} /></label>
      </div>
      <section className="product-image-editor">
        <div className="admin-panel-title"><ImageUp size={18} /> Imágenes</div>
        {state.productForm.images?.length ? (
          <div className="product-image-grid">
            {state.productForm.images.map((image, index) => (
              <article className="product-image-item" key={image.url + index}>
                <img src={image.url} alt={image.name || formatProductName(state.productForm.name) || 'Producto'} />
                <div><strong>{index === 0 ? 'Principal' : image.name || 'Imagen'}</strong><span>{image.name || 'Sin nombre'}</span></div>
                <button className="icon-button danger-button" type="button" onClick={() => actions.removeProductFormImage(index)} disabled={state.busy || !canManageProducts}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        ) : <div className="empty-state compact-empty">Añade imágenes reales del producto.</div>}
        <div className="admin-form-grid image-url-editor">
          <label className="wide-field">URL de imagen<input type="url" value={state.imageForm.imageUrl} onChange={updateImage('imageUrl')} disabled={!canManageProducts} /></label>
          <label>Nombre imagen<input value={state.imageForm.imageName} onChange={updateImage('imageName')} disabled={!canManageProducts} /></label>
          <button className="secondary form-button" type="button" onClick={actions.addProductImageUrl} disabled={state.busy || !canManageProducts || !state.imageForm.imageUrl.trim()}><LinkIcon size={17} /> Añadir URL</button>
        </div>
        <div className="file-image-editor">
          <label>Subir archivo<input type="file" accept="image/*" multiple onChange={updateFiles} disabled={!canManageProducts} /></label>
          <div className="file-summary">
            {state.imageForm.files.length
              ? state.imageForm.files.map((file) => file.name).join(', ')
              : isEdit ? 'Máximo 5 imágenes' : 'Puedes elegir imágenes ahora; se subirán al guardar el producto.'}
          </div>
          <button className="primary full" type="button" onClick={actions.uploadSupplierProductImages} disabled={state.busy || !isEdit || !canManageProducts || state.imageForm.files.length === 0}><ImageUp size={18} /> {isEdit ? 'Subir archivo' : 'Se sube al guardar'}</button>
        </div>
      </section>
      <section className="offer-editor">
        <div className="admin-panel-title"><Percent size={18} /> Oferta</div>
        <div className="admin-form-grid">
          <label>Tipo<select value={state.productForm.offerType} onChange={updateProduct('offerType')} disabled={!canManageProducts}><option value="none">Sin oferta</option><option value="percent">% descuento</option><option value="amount">€ descuento</option><option value="bundle">Promoción por unidades</option></select></label>
          {(state.productForm.offerType === 'percent' || state.productForm.offerType === 'amount') && <label>Valor<input type="number" min="0" step="0.01" value={state.productForm.offerValue} onChange={updateProduct('offerValue')} /></label>}
          {state.productForm.offerType === 'bundle' && <><label>Unidades oferta<input type="number" min="2" step="1" value={state.productForm.offerBundleQuantity} onChange={updateProduct('offerBundleQuantity')} /></label><label>Unidades pagadas<input type="number" min="1" step="1" value={state.productForm.offerBundlePayQuantity} onChange={updateProduct('offerBundlePayQuantity')} /></label></>}
          <label className="wide-field">Etiqueta<input value={state.productForm.offerLabel} onChange={updateProduct('offerLabel')} /></label>
          <label>Vigente desde<input type="date" value={state.productForm.offerValidFrom} onChange={updateProduct('offerValidFrom')} /></label>
          <label>Vigente hasta<input type="date" value={state.productForm.offerValidUntil} onChange={updateProduct('offerValidUntil')} /></label>
        </div>
      </section>
      <div className="form-actions supplier-editor-actions">
        <button className="secondary" type="button" onClick={() => navigate('/supplier/products')}>Cancelar</button>
        <button className="primary" type="submit" disabled={state.busy || !canManageProducts}><Save size={18} /> {isEdit ? 'Guardar cambios' : 'Crear producto'}</button>
      </div>
    </form>
  );
}

function SupplierOffers({ state, actions }) {
  const location = useLocation();
  const navigate = useNavigate();
  const products = state.supplierProducts || [];
  const selectedFromUrl = new URLSearchParams(location.search).get('product') || '';
  const [selectedId, setSelectedId] = useState(selectedFromUrl);
  const selectedProduct = products.find((product) => (product._id || product.id) === selectedId) || products[0] || null;
  const [offerForm, setOfferForm] = useState({
    offerType: 'none',
    offerValue: '',
    offerBundleQuantity: '3',
    offerBundlePayQuantity: '2',
    offerLabel: '',
    offerValidFrom: '',
    offerValidUntil: '',
  });

  useEffect(() => {
    if (!selectedProduct) return;
    const offer = selectedProduct.offer || {};
    setSelectedId(selectedProduct._id || selectedProduct.id || '');
    setOfferForm({
      offerType: offer.active ? offer.type || 'none' : 'none',
      offerValue: offer.value ?? '',
      offerBundleQuantity: offer.bundleQuantity || '3',
      offerBundlePayQuantity: offer.bundlePayQuantity || '2',
      offerLabel: offer.label || '',
      offerValidFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().slice(0, 10) : '',
      offerValidUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 10) : '',
    });
  }, [selectedProduct?._id, selectedProduct?.id]);

  const updateOffer = (field) => (event) => setOfferForm((current) => ({ ...current, [field]: event.target.value }));
  const selectProduct = (product) => {
    const productId = product._id || product.id;
    setSelectedId(productId);
    navigate('/supplier/offers?product=' + productId);
  };
  const submit = (event) => {
    event.preventDefault();
    if (selectedProduct) actions.saveSupplierOffer(selectedProduct, offerForm);
  };

  return (
    <section className="supplier-offers-workspace">
      <div className="admin-panel">
        <div className="admin-panel-title"><Percent size={19} /> Ofertas propias</div>
        {products.length ? products.map((product) => {
          const productId = product._id || product.id;
          const hasOffer = product.offer?.active || (product.offer?.type && product.offer.type !== 'none');
          return (
            <article className={'collection-row supplier-offer-row' + (productId === selectedId ? ' active' : '')} key={productId || product.sku}>
              <button className="user-main" type="button" onClick={() => selectProduct(product)}>
                <strong>{formatProductName(product.name)}</strong>
                <span>{product.sku} · {formatCurrency(product.price)} · {product.offer?.label || product.offer?.type || 'Sin oferta'}</span>
              </button>
              <span className={'admin-badge ' + (hasOffer ? 'warning' : '')}>{hasOffer ? 'Preparada' : 'Sin oferta'}</span>
              {hasOffer && <button className="secondary mini-button" type="button" onClick={() => actions.removeSupplierOffer(product)} disabled={state.busy}>Quitar</button>}
            </article>
          );
        }) : <div className="empty-state compact-empty">Crea productos propios antes de preparar ofertas.</div>}
      </div>

      <form className="admin-panel supplier-offer-editor" onSubmit={submit}>
        <div className="admin-panel-title"><Edit3 size={19} /> Editar oferta</div>
        {selectedProduct ? (
          <>
            <div className="selected-offer-product">
              <strong>{formatProductName(selectedProduct.name)}</strong>
              <span>{selectedProduct.sku} · {formatCurrency(selectedProduct.price)}</span>
            </div>
            <div className="admin-form-grid">
              <label>Tipo<select value={offerForm.offerType} onChange={updateOffer('offerType')}><option value="none">Sin oferta</option><option value="percent">% descuento</option><option value="amount">€ descuento</option><option value="bundle">Promoción por unidades</option></select></label>
              {(offerForm.offerType === 'percent' || offerForm.offerType === 'amount') && <label>Valor<input type="number" min="0" step="0.01" value={offerForm.offerValue} onChange={updateOffer('offerValue')} /></label>}
              {offerForm.offerType === 'bundle' && <><label>Unidades oferta<input type="number" min="2" step="1" value={offerForm.offerBundleQuantity} onChange={updateOffer('offerBundleQuantity')} /></label><label>Unidades pagadas<input type="number" min="1" step="1" value={offerForm.offerBundlePayQuantity} onChange={updateOffer('offerBundlePayQuantity')} /></label></>}
              <label className="wide-field">Etiqueta<input value={offerForm.offerLabel} onChange={updateOffer('offerLabel')} placeholder="Oferta de temporada" /></label>
              <label>Vigente desde<input type="date" value={offerForm.offerValidFrom} onChange={updateOffer('offerValidFrom')} /></label>
              <label>Vigente hasta<input type="date" value={offerForm.offerValidUntil} onChange={updateOffer('offerValidUntil')} /></label>
            </div>
            <div className="form-actions supplier-editor-actions">
              <button className="secondary" type="button" onClick={() => navigate('/supplier/products/' + (selectedProduct._id || selectedProduct.id) + '/edit')}>Editar producto</button>
              <button className="primary" type="submit" disabled={state.busy}><Save size={18} /> Guardar oferta</button>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty">Selecciona un producto para gestionar su oferta.</div>
        )}
      </form>
    </section>
  );
}

function SupplierReports({ state }) {
  const sales = state.supplierReports.sales || {};
  const products = state.supplierReports.products || {};
  const revenueByProduct = products.revenueByProduct || sales.revenueByProduct || [];
  const revenueByDate = sales.revenueByDate || [];
  const bestSelling = sales.bestSellingOwnProducts || products.bestSellingOwnProducts || [];
  const maxProductRevenue = Math.max(...revenueByProduct.map((item) => Number(item.revenue || 0)), 1);
  const maxDateRevenue = Math.max(...revenueByDate.map((item) => Number(item.revenue || 0)), 1);

  return (
    <section className="supplier-panel-view">
      <div className="section-heading compact"><h1>Informes</h1><p>Solo datos de tus propios productos</p></div>
      <div className="supplier-kpi-grid">
        <article><span>Ingresos propios</span><strong>{formatCurrency(sales.totalRevenueFromOwnProducts || 0)}</strong></article>
        <article><span>Unidades vendidas</span><strong>{sales.totalUnitsSoldFromOwnProducts || 0}</strong></article>
        <article><span>Pedidos</span><strong>{sales.ordersWithOwnProducts || 0}</strong></article>
        <article><span>Pendientes</span><strong>{sales.pendingOrdersContainingOwnProducts || 0}</strong></article>
        <article><span>Anulaciones</span><strong>{sales.cancelledOrdersWithOwnProducts || 0}</strong></article>
        <article><span>Abonos propios</span><strong>{formatCurrency(sales.refundsAmountFromOwnProducts || 0)}</strong></article>
      </div>
      <section className="admin-panel supplier-report-panel">
        <div className="admin-panel-title"><BarChart3 size={19} /> Ventas por producto</div>
        {revenueByProduct.length ? revenueByProduct.map((item) => (
          <article className="supplier-report-bar" key={item.sku || item.productName}>
            <div className="supplier-report-bar-top"><strong>{item.productName}</strong><span>{formatCurrency(item.revenue)}</span></div>
            <div className="supplier-report-meter"><span style={{ width: Math.max(6, (Number(item.revenue || 0) / maxProductRevenue) * 100) + '%' }} /></div>
            <small>{item.sku} · {item.units || 0} unidades</small>
          </article>
        )) : <div className="empty-state compact-empty">Aún no hay ventas asociadas a tus productos.</div>}
      </section>
      <div className="supplier-report-grid">
        <section className="admin-panel supplier-report-panel">
          <div className="admin-panel-title"><ShoppingBag size={19} /> Más vendidos</div>
          {bestSelling.length ? bestSelling.slice(0, 5).map((item) => (
            <article className="collection-row compact-row" key={item.sku || item.productName}>
              <div className="user-main"><strong>{item.productName}</strong><span>{item.sku}</span></div>
              <strong>{item.units || item.totalUnits || 0}</strong>
            </article>
          )) : <div className="empty-state compact-empty">Todavía no hay productos destacados por ventas.</div>}
        </section>
        <section className="admin-panel supplier-report-panel">
          <div className="admin-panel-title"><BarChart3 size={19} /> Ventas por fecha</div>
          {revenueByDate.length ? revenueByDate.slice(-8).map((item) => (
            <article className="supplier-report-bar compact" key={item.date}>
              <div className="supplier-report-bar-top"><strong>{item.date}</strong><span>{formatCurrency(item.revenue)}</span></div>
              <div className="supplier-report-meter"><span style={{ width: Math.max(6, (Number(item.revenue || 0) / maxDateRevenue) * 100) + '%' }} /></div>
            </article>
          )) : <div className="empty-state compact-empty">Sin datos de ventas por fecha.</div>}
        </section>
      </div>
    </section>
  );
}

function SupplierOrders({ state }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-title"><FileText size={19} /> Pedidos con mis productos</div>
      {state.supplierOrders.length ? state.supplierOrders.map((order) => (
        <article className="collection-row supplier-order-row" key={order.orderId}>
          <div className="user-main"><strong>{new Date(order.date).toLocaleDateString('es-ES')} · {order.status}</strong><span>{order.lines.map((line) => line.productName + ' x' + line.units).join(', ')}</span></div>
          <strong>{formatCurrency(order.ownRevenue)}</strong>
        </article>
      )) : <div className="empty-state compact-empty">Todavía no hay pedidos con productos tuyos.</div>}
    </section>
  );
}

function getMessageThreadId(thread) {
  return thread?._id || thread?.id || '';
}

function getMessageProductName(thread) {
  return formatProductName(thread?.product?.name) || 'Producto';
}

function getLastMessage(thread) {
  const messages = thread?.messages || [];
  return thread?.lastMessage || messages[messages.length - 1] || null;
}

function SupplierMessages({ state, actions }) {
  const messages = state.supplierMessages || [];
  const selectedThread = messages.find((thread) => getMessageThreadId(thread) === state.selectedSupplierMessageId) || messages[0] || null;

  useEffect(() => {
    if (!state.selectedSupplierMessageId && selectedThread) {
      actions.selectSupplierMessage(selectedThread);
    }
  }, [state.selectedSupplierMessageId, selectedThread?._id, selectedThread?.id]);

  return (
    <section className="supplier-messages-workspace">
      <div className="section-heading compact">
        <div>
          <h1>Mensajes de clientes</h1>
          <p>Consultas recibidas desde las fichas de producto</p>
        </div>
        <button className="secondary" type="button" onClick={actions.loadSupplierPanel} disabled={state.busy}><RefreshCw size={17} /> Actualizar</button>
      </div>
      <div className="supplier-message-grid">
        <section className="admin-panel supplier-message-list">
          <div className="admin-panel-title"><MessageSquare size={19} /> Bandeja</div>
          {messages.length ? messages.map((thread) => {
            const threadId = getMessageThreadId(thread);
            const lastMessage = getLastMessage(thread);
            return (
              <button
                className={'message-thread-row' + (threadId === getMessageThreadId(selectedThread) ? ' active' : '')}
                type="button"
                key={threadId}
                onClick={() => actions.selectSupplierMessage(thread)}
              >
                <span>
                  <strong>{getMessageProductName(thread)}</strong>
                  <small>{thread.customer?.name || thread.customer?.email || 'Cliente'}</small>
                </span>
                <span>{lastMessage?.body || thread.subject || 'Consulta recibida'}</span>
                {thread.supplierUnread && <em>Nuevo</em>}
              </button>
            );
          }) : (
            <div className="empty-state compact-empty">Aún no tienes mensajes de clientes.</div>
          )}
        </section>

        <form className="admin-panel message-thread-detail" onSubmit={actions.replySupplierMessage}>
          <div className="admin-panel-title"><Send size={19} /> Responder</div>
          {selectedThread ? (
            <>
              <div className="message-thread-heading">
                <strong>{selectedThread.subject || getMessageProductName(selectedThread)}</strong>
                <span>{selectedThread.customer?.name || selectedThread.customer?.email || 'Cliente'} · {getMessageProductName(selectedThread)}</span>
              </div>
              <div className="message-bubble-list">
                {(selectedThread.messages || []).map((message) => (
                  <article className={'message-bubble ' + (message.senderRole === 'supplier' ? 'own' : 'other')} key={message._id || message.createdAt}>
                    <strong>{message.senderRole === 'supplier' ? 'Tú' : selectedThread.customer?.name || 'Cliente'}</strong>
                    <p>{message.body}</p>
                    {message.createdAt && <small>{new Date(message.createdAt).toLocaleString('es-ES')}</small>}
                  </article>
                ))}
              </div>
              <label>
                Respuesta
                <textarea
                  required
                  minLength="3"
                  value={state.supplierMessageReplyForm.message}
                  onChange={(event) => actions.updateSupplierMessageReplyForm('message', event.target.value)}
                  placeholder="Escribe tu respuesta para el cliente"
                />
              </label>
              <button className="primary full" type="submit" disabled={state.busy}><Send size={18} /> Enviar respuesta</button>
            </>
          ) : (
            <div className="empty-state compact-empty">Selecciona una conversación para responder.</div>
          )}
        </form>
      </div>
    </section>
  );
}

export function SupplierView({ state, actions }) {
  const location = useLocation();
  const section = getSupplierSection(location.pathname);

  if (section === 'register') return <SupplierPublicAuth state={state} actions={actions} mode="register" />;
  if (section === 'login') return <SupplierPublicAuth state={state} actions={actions} mode="login" />;
  if (state.session?.user?.role !== 'supplier') return <AccessDeniedSupplier actions={actions} />;

  return (
    <SupplierLayout state={state} actions={actions}>
      {section === 'dashboard' && <SupplierDashboard state={state} actions={actions} />}
      {section === 'profile' && <SupplierProfile state={state} actions={actions} />}
      {section === 'products' && <SupplierProducts state={state} actions={actions} />}
      {(section === 'product-new' || section === 'product-edit') && <SupplierProductForm state={state} actions={actions} />}
      {section === 'offers' && <SupplierOffers state={state} actions={actions} />}
      {section === 'messages' && <SupplierMessages state={state} actions={actions} />}
      {section === 'reports' && <SupplierReports state={state} />}
      {section === 'orders' && <SupplierOrders state={state} />}
      {section === 'settings' && <SupplierProfile state={state} actions={actions} />}
    </SupplierLayout>
  );
}
