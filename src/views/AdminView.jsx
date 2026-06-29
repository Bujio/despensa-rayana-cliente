import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heading2,
  Heading3,
  ImageUp,
  LayoutDashboard,
  Link,
  List,
  MessageSquare,
  MoveDown,
  MoveUp,
  PackagePlus,
  Percent,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShoppingBag,
  Tags,
  Trash2,
  Type,
  Underline,
  UserCog,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { productModel } from '../models/productModel.js';
import { orderModel } from '../models/orderModel.js';
import { formatCurrency } from './viewFormatters.js';

function getId(item) {
  return item?._id || item?.id || '';
}

function getOrderAddress(order) {
  const address = order?.shippingAddress;
  if (!address) return 'Sin dirección guardada';
  return [address.street, address.codePostal, address.city, address.country, address.phone]
    .filter(Boolean)
    .join(' · ') || 'Sin dirección guardada';
}

function formatOrderDate(order) {
  const value = order?.createdAt || order?.date;
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function includesSearch(values, query) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) return true;
  return values
    .filter((value) => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

function getRoleLabel(role) {
  return role === 'admin' ? 'Admin' : 'Cliente';
}

function getHomeSectionTypeLabel(type) {
  const labels = {
    custom: 'Bloque editorial',
    productCarousel: 'Carrusel de productos',
    promoBanner: 'Banner promocional',
    promoBannerGrid: 'Bloque de banners',
  };
  return labels[type] || 'Componente base';
}

function OrderDetail({ order }) {
  if (!order) return <div className="empty-state compact-empty">Selecciona un pedido para ver todos sus detalles.</div>;

  return (
    <div className="admin-order-detail">
      <div className="detail-line"><span>ID</span><strong>{getId(order)}</strong></div>
      <div className="detail-line"><span>Cliente</span><strong>{order.email}</strong></div>
      <div className="detail-line"><span>Fecha</span><strong>{formatOrderDate(order)}</strong></div>
      <div className="detail-line"><span>Estado</span><strong>{order.status || 'pending'}</strong></div>
      <div className="detail-line"><span>Envío</span><strong>{getOrderAddress(order)}</strong></div>
      <div className="detail-line"><span>Total</span><strong>{formatCurrency(orderModel.getTotal(order))}</strong></div>
      <div className="order-lines">
        {(order.products || []).map((line) => (
          <div className="order-line" key={line.sku}>
            <span>{line.sku}</span>
            <strong>{line.count || 1} × {formatCurrency(line.price)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminTabs({ active, actions }) {
  const tabs = [
    ['homepage', LayoutDashboard, 'Portada'],
    ['users', Users, 'Clientes'],
    ['products', PackagePlus, 'Productos'],
    ['categories', Tags, 'Categorías'],
    ['orders', ShoppingBag, 'Pedidos'],
    ['reviews', MessageSquare, 'Opiniones'],
    ['media', ImageUp, 'Imágenes'],
  ];

  return (
    <div className="admin-tabs">
      {tabs.map(([key, Icon, label]) => (
        <button className={active === key ? 'active' : ''} type="button" key={key} onClick={() => actions.setAdminTab(key)}>
          <Icon size={17} /> {label}
        </button>
      ))}
    </div>
  );
}

export function AdminView({ state, actions }) {
  const productsPerPage = 5;
  const categoriesPerPage = 5;
  const [adminProductsPage, setAdminProductsPage] = useState(1);
  const [adminCategoriesPage, setAdminCategoriesPage] = useState(1);
  const [selectedHomeSectionId, setSelectedHomeSectionId] = useState('');
  const {
    adminProducts,
    adminReviews,
    adminSearch,
    adminTab,
    adminUserForm,
    adminUsers,
    busy,
    categories,
    categoryForm,
    homeComponentForm,
    homeContent,
    imageForm,
    orders,
    productForm,
    selectedAdminCategoryId,
    selectedAdminOrder,
    selectedAdminOrderId,
    selectedAdminProductId,
    selectedAdminUser,
    selectedAdminUserId,
    selectedAdminUserOrders,
    session,
  } = state;

  const filteredProducts = adminProducts.filter((product) => includesSearch([
    product.name,
    product.sku,
    product.description,
    productModel.getCategoryName(product.category),
    product.supplier?.name,
  ], adminSearch.products));
  const productTotalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (adminProductsPage - 1) * productsPerPage,
    adminProductsPage * productsPerPage,
  );

  useEffect(() => {
    setAdminProductsPage(1);
  }, [adminSearch.products, adminProducts.length]);

  useEffect(() => {
    if (adminProductsPage > productTotalPages) {
      setAdminProductsPage(productTotalPages);
    }
  }, [adminProductsPage, productTotalPages]);

  const filteredCategories = categories.filter((category) => includesSearch([
    category.name,
    category.slug,
    category.description,
  ], adminSearch.categories));
  const categoryTotalPages = Math.max(1, Math.ceil(filteredCategories.length / categoriesPerPage));
  const paginatedCategories = filteredCategories.slice(
    (adminCategoriesPage - 1) * categoriesPerPage,
    adminCategoriesPage * categoriesPerPage,
  );

  useEffect(() => {
    setAdminCategoriesPage(1);
  }, [adminSearch.categories, categories.length]);

  useEffect(() => {
    if (adminCategoriesPage > categoryTotalPages) {
      setAdminCategoriesPage(categoryTotalPages);
    }
  }, [adminCategoriesPage, categoryTotalPages]);

  if (session?.user?.role !== 'admin') {
    return (
      <section className="wide-panel single">
        <div className="empty-state">Necesitas entrar como administrador para gestionar el backoffice.</div>
      </section>
    );
  }

  const updateCategory = (field) => (event) => actions.updateCategoryForm(field, event.target.value);
  const updateProduct = (field) => (event) => actions.updateProductForm(field, event.target.value);
  const insertProductDescriptionBlock = (block) => {
    const snippets = {
      title: '<h2>Título de sección</h2>',
      subtitle: '<h3>Subtítulo</h3>',
      text: '<p>Texto descriptivo del producto.</p>',
      bold: '<strong>texto destacado</strong>',
      underline: '<u>texto subrayado</u>',
      list: '<ul>\n  <li>Punto destacado</li>\n</ul>',
    };
    const currentDescription = productForm.description || '';
    const separator = currentDescription.trim() ? '\n' : '';
    actions.updateProductForm('description', currentDescription + separator + snippets[block]);
  };
  const updateImage = (field) => (event) => actions.updateImageForm(field, event.target.value);
  const updateFiles = (event) => actions.updateImageForm('files', Array.from(event.target.files || []));
  const updateUser = (field) => (event) => actions.updateAdminUserForm(field, event.target.value);
  const updateHero = (field) => (event) => actions.updateHomeHero(field, event.target.value);
  const updateComponentForm = (field) => (event) => actions.updateHomeComponentForm(field, event.target.value);
  const uploadHomeImage = (target) => (event) => actions.uploadHomeImage(target, Array.from(event.target.files || []));
  const sortedHomeSections = [...(homeContent?.sections || [])].sort((first, second) => first.order - second.order);
  const selectedHomeSection = sortedHomeSections.find((section) => section.id === selectedHomeSectionId)
    || sortedHomeSections[0]
    || null;
  const selectedFeaturedIds = homeContent?.featuredProductIds || [];

  const filteredUsers = adminUsers.filter((user) => includesSearch([
    user.name,
    user.email,
    user.phone,
    getRoleLabel(user.role),
  ], adminSearch.users));

  const filteredOrders = orders.filter((order) => includesSearch([
    getId(order),
    order.email,
    order.status,
    formatOrderDate(order),
    getOrderAddress(order),
  ], adminSearch.orders));

  const filteredReviews = adminReviews.filter((review) => includesSearch([
    review.product?.name,
    review.user?.name,
    review.user?.email,
    review.title,
    review.comment,
    review.rating,
  ], adminSearch.reviews));

  const filteredMediaProducts = adminProducts.filter((product) => includesSearch([
    product.name,
    product.sku,
    product.supplier?.name,
  ], adminSearch.media));

  return (
    <section className="admin-view">
      <div className="section-heading compact admin-heading">
        <div>
          <h1>Backoffice</h1>
          <p>Gestión por colección con clientes, productos, categorías, pedidos e imágenes.</p>
        </div>
      </div>

      <AdminTabs active={adminTab} actions={actions} />

      {adminTab === 'homepage' && (
        <div className="homepage-admin-layout">
          <section className="admin-panel component-library">
            <div className="admin-panel-title"><LayoutDashboard size={19} /> Componentes de portada</div>
            <div className="component-list">
              {sortedHomeSections.map((section, index) => (
                <article className={'component-row' + (section.enabled ? '' : ' muted') + (selectedHomeSection?.id === section.id ? ' active' : '')} key={section.id}>
                  <button className="component-main" type="button" onClick={() => setSelectedHomeSectionId(section.id)}>
                    <strong>{section.title}</strong>
                    <span>{getHomeSectionTypeLabel(section.type)} · {section.enabled ? 'Visible' : 'Oculto'} · Editar</span>
                  </button>
                  <div className="component-actions">
                    <button className="icon-button" type="button" onClick={() => actions.toggleHomeSection(section.id)} title={section.enabled ? 'Ocultar componente' : 'Mostrar componente'}>
                      <Eye size={16} />
                    </button>
                    <button className="icon-button" type="button" onClick={() => actions.moveHomeSection(section.id, -1)} disabled={index === 0} title="Subir">
                      <MoveUp size={16} />
                    </button>
                    <button className="icon-button" type="button" onClick={() => actions.moveHomeSection(section.id, 1)} disabled={index === sortedHomeSections.length - 1} title="Bajar">
                      <MoveDown size={16} />
                    </button>
                    <button className="icon-button danger-button" type="button" onClick={() => actions.deleteHomeSection(section.id)} title="Eliminar componente">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <button className="secondary full" type="button" onClick={actions.resetHomeContent}>
              <RotateCcw size={17} /> Restablecer portada
            </button>
            <button className="primary full" type="button" onClick={actions.saveHomeContentSettings} disabled={busy}>
              <Save size={17} /> Guardar en Atlas
            </button>
          </section>

          <form className="admin-panel component-builder-panel" onSubmit={actions.createHomeComponent}>
            <div className="admin-panel-title"><Plus size={19} /> Nuevo componente</div>
            <div className="admin-form-grid">
              <label>
                Tipo de componente
                <select value={homeComponentForm.type} onChange={updateComponentForm('type')}>
                  <option value="promoBanner">Banner promocional ancho</option>
                  <option value="promoBannerGrid">Bloque de banners promocionales</option>
                  <option value="productCarousel">Carrusel de productos</option>
                  <option value="custom">Bloque editorial simple</option>
                </select>
              </label>
              <label>Título<input required value={homeComponentForm.title} onChange={updateComponentForm('title')} placeholder="Ej. Temporada de la dehesa" /></label>
              <label>Subtítulo<input value={homeComponentForm.subtitle} onChange={updateComponentForm('subtitle')} placeholder="Ej. Selección editorial" /></label>
              <label className="wide-field">Texto<textarea value={homeComponentForm.body} onChange={updateComponentForm('body')} placeholder="Mensaje para la portada manteniendo el tono de Despensa Rayana" /></label>
              {(homeComponentForm.type === 'promoBanner' || homeComponentForm.type === 'custom') && (
                <>
                  <label className="wide-field">Imagen<input value={homeComponentForm.imageUrl} onChange={updateComponentForm('imageUrl')} placeholder="Se rellena al subir imagen o puedes pegar una URL" /></label>
                  <label className="wide-field">Subir imagen al servidor<input type="file" accept="image/*" onChange={uploadHomeImage('component.imageUrl')} disabled={busy} /></label>
                  <label>Enlace<input value={homeComponentForm.linkUrl} onChange={updateComponentForm('linkUrl')} placeholder="catalog, story o https://..." /></label>
                  <label>Texto del botón<input value={homeComponentForm.ctaLabel} onChange={updateComponentForm('ctaLabel')} placeholder="Ej. Ver selección" /></label>
                </>
              )}
            </div>
            {homeComponentForm.type === 'productCarousel' && (
              <div className="component-product-picker">
                {adminProducts.map((product) => {
                  const productId = String(getId(product) || product.sku);
                  const image = productModel.getImage(product);
                  return (
                    <label className="featured-selector-row" key={productId}>
                      <input
                        type="checkbox"
                        checked={homeComponentForm.productIds.includes(productId)}
                        onChange={() => actions.toggleHomeComponentProduct(product)}
                      />
                      <span className="admin-thumb small-thumb">
                        {image ? <img src={image} alt="" /> : <ShoppingBag size={16} />}
                      </span>
                      <span>
                        <strong>{product.name}</strong>
                        <small>{product.sku} · {formatCurrency(product.price)}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {homeComponentForm.type === 'promoBannerGrid' && (
              <div className="banner-piece-editor">
                {[1, 2, 3].map((itemNumber) => {
                  const prefix = itemNumber === 1 ? 'itemOne' : itemNumber === 2 ? 'itemTwo' : 'itemThree';
                  return (
                    <div className="custom-component-editor" key={prefix}>
                      <strong>Pieza {itemNumber}</strong>
                      <label>Título<input value={homeComponentForm[prefix + 'Title']} onChange={updateComponentForm(prefix + 'Title')} /></label>
                      <label>Texto<textarea value={homeComponentForm[prefix + 'Body']} onChange={updateComponentForm(prefix + 'Body')} /></label>
                      <label>Imagen<input value={homeComponentForm[prefix + 'ImageUrl']} onChange={updateComponentForm(prefix + 'ImageUrl')} placeholder="Se rellena al subir imagen o puedes pegar una URL" /></label>
                      <label>Subir imagen al servidor<input type="file" accept="image/*" onChange={uploadHomeImage('component.' + prefix + 'ImageUrl')} disabled={busy} /></label>
                      <label>Enlace<input value={homeComponentForm[prefix + 'LinkUrl']} onChange={updateComponentForm(prefix + 'LinkUrl')} placeholder="catalog, story o https://..." /></label>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="primary full" type="submit" disabled={busy}>
              <Save size={18} /> Añadir componente
            </button>
          </form>

          <section className="admin-panel custom-component-panel">
            <div className="admin-panel-title"><LayoutDashboard size={19} /> Editor del componente seleccionado</div>
            {selectedHomeSection ? (
              <div className="selected-component-editor" key={selectedHomeSection.id}>
                <div className="selected-component-heading">
                  <span className="eyebrow">{getHomeSectionTypeLabel(selectedHomeSection.type)}</span>
                  <h2>{selectedHomeSection.title}</h2>
                  <p>Modifica este bloque de portada desde aquí. Los cambios se guardan al pulsar Guardar en Atlas.</p>
                </div>

                {selectedHomeSection.type === 'hero' ? (
                  <div className="admin-form-grid selected-component-fields">
                    <label className="wide-field">Imagen principal<input value={homeContent?.hero?.imageUrl || ''} onChange={updateHero('imageUrl')} placeholder="Se rellena al subir imagen o puedes pegar una URL" /></label>
                    <label className="wide-field">Subir imagen al servidor<input type="file" accept="image/*" onChange={uploadHomeImage('hero.imageUrl')} disabled={busy} /></label>
                    <label>Etiqueta<input value={homeContent?.hero?.eyebrow || ''} onChange={updateHero('eyebrow')} /></label>
                    <label>Título<input value={homeContent?.hero?.title || ''} onChange={updateHero('title')} /></label>
                    <label className="wide-field">Descripción<textarea value={homeContent?.hero?.description || ''} onChange={updateHero('description')} /></label>
                    <label>Botón principal<input value={homeContent?.hero?.primaryLabel || ''} onChange={updateHero('primaryLabel')} /></label>
                    <label>Botón secundario<input value={homeContent?.hero?.secondaryLabel || ''} onChange={updateHero('secondaryLabel')} /></label>
                  </div>
                ) : (
                  <div className="admin-form-grid selected-component-fields">
                    <label>Título<input value={selectedHomeSection.title || ''} onChange={(event) => actions.updateHomeSection(selectedHomeSection.id, 'title', event.target.value)} /></label>
                    <label>Subtítulo<input value={selectedHomeSection.subtitle || ''} onChange={(event) => actions.updateHomeSection(selectedHomeSection.id, 'subtitle', event.target.value)} /></label>
                    <label className="wide-field">Texto<textarea value={selectedHomeSection.body || ''} onChange={(event) => actions.updateHomeSection(selectedHomeSection.id, 'body', event.target.value)} /></label>
                  </div>
                )}

                {(selectedHomeSection.type === 'promoBanner' || selectedHomeSection.type === 'custom') && (
                  <div className="admin-form-grid selected-component-fields">
                    <label className="wide-field">Imagen<input value={selectedHomeSection.imageUrl || ''} onChange={(event) => actions.updateHomeSection(selectedHomeSection.id, 'imageUrl', event.target.value)} placeholder="Se rellena al subir imagen o puedes pegar una URL" /></label>
                    <label className="wide-field">Subir imagen al servidor<input type="file" accept="image/*" onChange={uploadHomeImage('section.' + selectedHomeSection.id + '.imageUrl')} disabled={busy} /></label>
                    <label>Enlace<input value={selectedHomeSection.linkUrl || ''} onChange={(event) => actions.updateHomeSection(selectedHomeSection.id, 'linkUrl', event.target.value)} /></label>
                    <label>Texto del botón<input value={selectedHomeSection.ctaLabel || ''} onChange={(event) => actions.updateHomeSection(selectedHomeSection.id, 'ctaLabel', event.target.value)} /></label>
                  </div>
                )}

                {selectedHomeSection.type === 'hero' && homeContent?.hero?.imageUrl && (
                  <div className="hero-admin-preview">
                    <img src={homeContent.hero.imageUrl} alt="" />
                    <div>
                      <strong>{homeContent.hero.title}</strong>
                      <span>{homeContent.hero.description}</span>
                    </div>
                  </div>
                )}

                {(selectedHomeSection.type === 'promoBanner' || selectedHomeSection.type === 'custom') && selectedHomeSection.imageUrl && (
                  <div className="hero-admin-preview">
                    <img src={selectedHomeSection.imageUrl} alt="" />
                    <div>
                      <strong>{selectedHomeSection.title}</strong>
                      <span>{selectedHomeSection.body || selectedHomeSection.subtitle}</span>
                    </div>
                  </div>
                )}

                {(selectedHomeSection.type === 'featured' || selectedHomeSection.type === 'productCarousel') && (
                  <>
                  <div className="soft-note">Seleccionados: {(selectedHomeSection.type === 'featured' ? selectedFeaturedIds : selectedHomeSection.productIds || []).length || 'todos los productos con imagen'}</div>
                  <div className="component-product-picker">
                    {adminProducts.map((product) => {
                      const productId = String(getId(product) || product.sku);
                      const image = productModel.getImage(product);
                      const selectedIds = selectedHomeSection.type === 'featured' ? selectedFeaturedIds : selectedHomeSection.productIds || [];
                      return (
                        <label className="featured-selector-row" key={selectedHomeSection.id + productId}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(productId)}
                            onChange={() => (
                              selectedHomeSection.type === 'featured'
                                ? actions.toggleFeaturedProduct(product)
                                : actions.toggleHomeSectionProduct(selectedHomeSection.id, product)
                            )}
                          />
                          <span className="admin-thumb small-thumb">
                            {image ? <img src={image} alt="" /> : <ShoppingBag size={16} />}
                          </span>
                          <span>
                            <strong>{product.name}</strong>
                            <small>{product.sku} · {formatCurrency(product.price)}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  </>
                )}

                {selectedHomeSection.type === 'categories' && (
                  <div className="category-piece-editor">
                    {(selectedHomeSection.items || []).map((item, itemIndex) => (
                      <div className="custom-component-editor" key={selectedHomeSection.id + itemIndex}>
                        <strong>Categoría {itemIndex + 1}</strong>
                        <label>Título<input value={item.title || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'title', event.target.value)} /></label>
                        <label>Texto<input value={item.body || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'body', event.target.value)} /></label>
                        <label>Imagen<input value={item.imageUrl || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'imageUrl', event.target.value)} placeholder="Se rellena al subir imagen o puedes pegar una URL" /></label>
                        <label>Subir imagen al servidor<input type="file" accept="image/*" onChange={uploadHomeImage('sectionItem.' + selectedHomeSection.id + '.' + itemIndex + '.imageUrl')} disabled={busy} /></label>
                        <label>Enlace<input value={item.linkUrl || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'linkUrl', event.target.value)} placeholder="Alimentación, catalog, story o https://..." /></label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedHomeSection.type === 'promoBannerGrid' && (
                  <div className="banner-piece-editor">
                    {[0, 1, 2].map((itemIndex) => {
                      const item = selectedHomeSection.items?.[itemIndex] || {};
                      return (
                        <div className="custom-component-editor" key={selectedHomeSection.id + itemIndex}>
                          <strong>Pieza {itemIndex + 1}</strong>
                          <label>Título<input value={item.title || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'title', event.target.value)} /></label>
                          <label>Texto<textarea value={item.body || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'body', event.target.value)} /></label>
                          <label>Imagen<input value={item.imageUrl || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'imageUrl', event.target.value)} /></label>
                          <label>Subir imagen al servidor<input type="file" accept="image/*" onChange={uploadHomeImage('sectionItem.' + selectedHomeSection.id + '.' + itemIndex + '.imageUrl')} disabled={busy} /></label>
                          <label>Enlace<input value={item.linkUrl || ''} onChange={(event) => actions.updateHomeSectionItem(selectedHomeSection.id, itemIndex, 'linkUrl', event.target.value)} /></label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state compact-empty">Selecciona un componente de la lista.</div>
            )}
          </section>
        </div>
      )}

      {adminTab === 'users' && (
        <div className="admin-users-layout">
          <section className="admin-panel users-panel">
            <div className="admin-panel-title"><Users size={19} /> Clientes</div>
            <label className="input-wrap admin-search">
              <Search size={17} />
              <input value={adminSearch.users} onChange={(event) => actions.setAdminSearch('users', event.target.value)} placeholder="Buscar cliente..." />
            </label>
            {filteredUsers.length ? (
              <div className="users-table">
                {filteredUsers.map((user) => {
                  const userId = getId(user);
                  const isSelected = userId === selectedAdminUserId;
                  const isCurrentUser = userId === (session.user?._id || session.user?.id);
                  const orderCount = Number(user.orderCount ?? 0);

                  return (
                    <article className={'user-row' + (isSelected ? ' active' : '')} key={userId}>
                      <button className="user-main" type="button" onClick={() => actions.selectAdminUser(user)}>
                        <strong>{user.name || 'Cliente sin nombre'}</strong>
                        <span>{user.email}</span>
                      </button>
                      <span className={'status ' + (user.role === 'admin' ? 'shipped' : '')}>{getRoleLabel(user.role)}</span>
                      <button className="metric-button" type="button" onClick={() => actions.openAdminUserOrders(user)}>
                        <ShoppingBag size={16} />
                        <span>{orderCount}</span>
                      </button>
                      <button className="icon-button" type="button" onClick={() => actions.selectAdminUser(user)} title="Editar cliente">
                        <Eye size={17} />
                      </button>
                      <button className="icon-button danger-button" type="button" onClick={() => actions.deleteAdminUser(user)} disabled={busy || isCurrentUser} title="Eliminar cliente">
                        <Trash2 size={17} />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state compact-empty">No hay clientes para mostrar.</div>
            )}
          </section>

          <form className="admin-panel user-editor-panel" onSubmit={actions.saveAdminUser}>
            <div className="admin-panel-title"><UserCog size={19} /> Editar cliente</div>
            {selectedAdminUser ? (
              <>
                <div className="admin-form-grid">
                  <label>Nombre<input required value={adminUserForm.name} onChange={updateUser('name')} /></label>
                  <label>Email<input required type="email" value={adminUserForm.email} onChange={updateUser('email')} /></label>
                  <label>Teléfono<input value={adminUserForm.phone} onChange={updateUser('phone')} /></label>
                  <label>
                    Rol
                    <select value={adminUserForm.role} onChange={updateUser('role')}>
                      <option value="user">Cliente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label>Calle<input value={adminUserForm.street} onChange={updateUser('street')} /></label>
                  <label>Código postal<input value={adminUserForm.codePostal} onChange={updateUser('codePostal')} /></label>
                  <label>Ciudad<input value={adminUserForm.city} onChange={updateUser('city')} /></label>
                  <label>País<input value={adminUserForm.country} onChange={updateUser('country')} /></label>
                  <label className="wide-field">Nueva contraseña<input type="password" value={adminUserForm.password} onChange={updateUser('password')} placeholder="Dejar vacío para mantener la actual" /></label>
                </div>
                <button className="primary full" type="submit" disabled={busy}><Save size={18} /> Guardar cliente</button>
              </>
            ) : (
              <div className="empty-state compact-empty">Selecciona un cliente para modificarlo.</div>
            )}
          </form>

          <section className="admin-panel user-orders-panel">
            <div className="admin-panel-title"><ShoppingBag size={19} /> Pedidos del cliente</div>
            {selectedAdminUser ? (
              <>
                <div className="user-order-summary">
                  <strong>{selectedAdminUser.name || selectedAdminUser.email}</strong>
                  <span>{Number(selectedAdminUser.orderCount ?? selectedAdminUserOrders.length)} pedidos realizados</span>
                </div>
                {selectedAdminUserOrders.length ? (
                  <div className="admin-order-list">
                    {selectedAdminUserOrders.map((order) => {
                      const orderId = getId(order);
                      return (
                        <button className={'admin-order-row' + (selectedAdminOrderId === orderId ? ' active' : '')} type="button" key={orderId} onClick={() => actions.openAdminOrder(order)}>
                          <span>Pedido {String(orderId).slice(-6)}</span>
                          <strong>{formatCurrency(orderModel.getTotal(order))}</strong>
                          <small>{order.status || 'pending'}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state compact-empty">Este cliente todavía no tiene pedidos.</div>
                )}
              </>
            ) : (
              <div className="empty-state compact-empty">Pulsa el total de pedidos de un cliente.</div>
            )}
          </section>

          <section className="admin-panel order-detail-panel">
            <div className="admin-panel-title"><ShoppingBag size={19} /> Detalle de pedido</div>
            <OrderDetail order={selectedAdminOrder} />
          </section>
        </div>
      )}

      {adminTab === 'products' && (
        <div className="admin-products-layout">
          <section className="admin-panel products-list-panel">
            <div className="admin-panel-title"><PackagePlus size={19} /> Productos</div>
            <label className="input-wrap admin-search">
              <Search size={17} />
              <input value={adminSearch.products} onChange={(event) => actions.setAdminSearch('products', event.target.value)} placeholder="Buscar producto..." />
            </label>
            <button className="secondary full" type="button" onClick={actions.resetProductForm}>
              <Plus size={17} /> Nuevo producto
            </button>
            <div className="admin-list">
              {paginatedProducts.map((product) => {
                const productId = getId(product);
                const offerLabel = productModel.getOfferLabel(product);
                const image = productModel.getImage(product);
                return (
                  <article className={'collection-row with-thumb' + (selectedAdminProductId === productId ? ' active' : '')} key={productId}>
                    <div className="admin-thumb">
                      {image ? <img src={image} alt={product.name} /> : <PackagePlus size={22} />}
                    </div>
                    <button className="user-main" type="button" onClick={() => actions.selectAdminProduct(product)}>
                      <strong>{product.name}</strong>
                      <span>{product.sku} · {formatCurrency(product.price)} · {product.stock} uds.</span>
                    </button>
                    {offerLabel && <span className="offer-pill">{offerLabel}</span>}
                    <button className="icon-button" type="button" onClick={() => actions.selectAdminProduct(product)} title="Editar producto"><Eye size={17} /></button>
                    <button className="icon-button danger-button" type="button" onClick={() => actions.deleteProduct(product)} disabled={busy} title="Eliminar producto"><Trash2 size={17} /></button>
                  </article>
                );
              })}
            </div>
            {filteredProducts.length ? (
              <div className="pager admin-pager">
                <button
                  className="icon-button"
                  type="button"
                  disabled={adminProductsPage <= 1}
                  onClick={() => setAdminProductsPage((value) => Math.max(1, value - 1))}
                  title="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span>Página {adminProductsPage} de {productTotalPages} · {filteredProducts.length} productos</span>
                <button
                  className="icon-button"
                  type="button"
                  disabled={adminProductsPage >= productTotalPages}
                  onClick={() => setAdminProductsPage((value) => Math.min(productTotalPages, value + 1))}
                  title="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div className="empty-state compact-empty">No hay productos para mostrar.</div>
            )}
          </section>

          <form className="admin-panel product-editor-panel" onSubmit={actions.createProduct}>
            <div className="admin-panel-title"><PackagePlus size={19} /> {selectedAdminProductId ? 'Editar producto' : 'Nuevo producto'}</div>
            <div className="admin-form-grid">
              <label>Nombre<input required value={productForm.name} onChange={updateProduct('name')} placeholder="Ej. Miel Villuercas-Ibores" /></label>
              <label>SKU<input required value={productForm.sku} onChange={updateProduct('sku')} placeholder="EXT-MIE-NUEVA-500" /></label>
              <label>Precio<input required type="number" min="0.01" step="0.01" value={productForm.price} onChange={updateProduct('price')} /></label>
              <label>Stock<input required type="number" min="0" step="1" value={productForm.stock} onChange={updateProduct('stock')} /></label>
              <label>
                Categoría
                <select value={productForm.category} onChange={updateProduct('category')}>
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={getId(category)} value={getId(category)}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>ID proveedor<input required type="number" min="0" step="1" value={productForm.supplierId} onChange={updateProduct('supplierId')} /></label>
              <label className="wide-field">Proveedor<input value={productForm.supplierName} onChange={updateProduct('supplierName')} placeholder="Ej. Cooperativa local" /></label>
              <label className="wide-field">Descripción corta<input value={productForm.shortDescription} onChange={updateProduct('shortDescription')} placeholder="Resumen breve que aparece junto a la valoración y antes del precio" /></label>
              <div className="wide-field rich-description-editor">
                <div className="rich-editor-header">
                  <span>Descripción larga</span>
                  <div className="rich-editor-toolbar" aria-label="Herramientas de formato">
                    <button type="button" onClick={() => insertProductDescriptionBlock('title')} title="Título"><Heading2 size={16} /></button>
                    <button type="button" onClick={() => insertProductDescriptionBlock('subtitle')} title="Subtítulo"><Heading3 size={16} /></button>
                    <button type="button" onClick={() => insertProductDescriptionBlock('text')} title="Texto"><Type size={16} /></button>
                    <button type="button" onClick={() => insertProductDescriptionBlock('bold')} title="Negrita"><Bold size={16} /></button>
                    <button type="button" onClick={() => insertProductDescriptionBlock('underline')} title="Subrayado"><Underline size={16} /></button>
                    <button type="button" onClick={() => insertProductDescriptionBlock('list')} title="Lista"><List size={16} /></button>
                  </div>
                </div>
                <textarea value={productForm.description} onChange={updateProduct('description')} placeholder="Usa la barra para añadir títulos, subtítulos, texto destacado o listas. Esta descripción aparece en la pestaña Descripción." />
              </div>
            </div>

            <section className="product-image-editor">
              <div className="admin-panel-title"><ImageUp size={18} /> Imágenes del producto</div>
              {productForm.images?.length ? (
                <div className="product-image-grid">
                  {productForm.images.map((image, index) => (
                    <article className="product-image-item" key={image.url + index}>
                      <img src={image.url} alt={image.name || productForm.name || 'Producto'} />
                      <div>
                        <strong>{index === 0 ? 'Principal' : image.name || 'Imagen del producto'}</strong>
                        <span>{image.name || 'Sin nombre'}</span>
                      </div>
                      <button
                        className="icon-button danger-button"
                        type="button"
                        onClick={() => actions.removeProductFormImage(index)}
                        disabled={busy}
                        title="Eliminar imagen"
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">Este producto todavía no tiene imágenes.</div>
              )}

              <div className="admin-form-grid image-url-editor">
                <label className="wide-field">URL de imagen<input type="url" value={imageForm.imageUrl} onChange={updateImage('imageUrl')} placeholder="https://..." /></label>
                <label>Nombre de imagen<input value={imageForm.imageName} onChange={updateImage('imageName')} placeholder="Ej. Vista frontal" /></label>
                <button className="secondary form-button" type="button" onClick={actions.addProductImageUrl} disabled={busy || !imageForm.imageUrl.trim()}>
                  <Link size={17} /> Añadir URL
                </button>
              </div>

              <div className="file-image-editor">
                <label>Subir archivo<input type="file" accept="image/*" multiple onChange={updateFiles} disabled={!selectedAdminProductId} /></label>
                <div className="file-summary">
                  {selectedAdminProductId
                    ? (imageForm.files.length ? imageForm.files.map((file) => file.name).join(', ') : 'Subida vía Cloudinary. Máximo 5 imágenes, 5 MB cada una.')
                    : 'Guarda primero el producto para poder subir archivos.'}
                </div>
                <button className="primary full" type="button" onClick={actions.uploadProductImages} disabled={busy || !selectedAdminProductId || imageForm.files.length === 0}>
                  <ImageUp size={18} /> Subir archivo
                </button>
              </div>
            </section>

            <div className="offer-editor">
              <div className="admin-panel-title"><Percent size={18} /> Oferta</div>
              <div className="admin-form-grid">
                <label>
                  Tipo
                  <select value={productForm.offerType} onChange={updateProduct('offerType')}>
                    <option value="none">Sin oferta</option>
                    <option value="percent">% descuento</option>
                    <option value="amount">€ descuento</option>
                    <option value="bundle">Promoción por unidades</option>
                  </select>
                </label>
                {(productForm.offerType === 'percent' || productForm.offerType === 'amount') && (
                  <label>
                    Valor
                    <input type="number" min="0" step="0.01" value={productForm.offerValue} onChange={updateProduct('offerValue')} />
                  </label>
                )}
                {productForm.offerType === 'bundle' && (
                  <>
                    <label>Unidades oferta<input type="number" min="2" step="1" value={productForm.offerBundleQuantity} onChange={updateProduct('offerBundleQuantity')} /></label>
                    <label>Unidades pagadas<input type="number" min="1" step="1" value={productForm.offerBundlePayQuantity} onChange={updateProduct('offerBundlePayQuantity')} /></label>
                  </>
                )}
                <label className="wide-field">Etiqueta<input value={productForm.offerLabel} onChange={updateProduct('offerLabel')} placeholder="Ej. Oferta de verano, 3x2, -10%" /></label>
                <label>Vigente desde<input type="date" value={productForm.offerValidFrom} onChange={updateProduct('offerValidFrom')} /></label>
                <label>Vigente hasta<input type="date" value={productForm.offerValidUntil} onChange={updateProduct('offerValidUntil')} /></label>
              </div>
            </div>

            <button className="primary full" type="submit" disabled={busy}>
              <Save size={18} /> {selectedAdminProductId ? 'Guardar producto' : 'Crear producto'}
            </button>
          </form>
        </div>
      )}

      {adminTab === 'categories' && (
        <div className="admin-products-layout">
          <section className="admin-panel">
            <div className="admin-panel-title"><Tags size={19} /> Categorías</div>
            <label className="input-wrap admin-search">
              <Search size={17} />
              <input value={adminSearch.categories} onChange={(event) => actions.setAdminSearch('categories', event.target.value)} placeholder="Buscar categoría..." />
            </label>
            <button className="secondary full" type="button" onClick={actions.resetCategoryForm}>
              <Plus size={17} /> Nueva categoría
            </button>
            <div className="admin-list">
              {paginatedCategories.map((category) => {
                const categoryId = getId(category);
                return (
                  <article className={'collection-row' + (selectedAdminCategoryId === categoryId ? ' active' : '')} key={categoryId}>
                    <button className="user-main" type="button" onClick={() => actions.selectAdminCategory(category)}>
                      <strong>{category.name}</strong>
                      <span>{category.slug || 'Sin slug'}</span>
                    </button>
                    <button className="icon-button" type="button" onClick={() => actions.selectAdminCategory(category)} title="Editar categoría"><Eye size={17} /></button>
                    <button className="icon-button danger-button" type="button" onClick={() => actions.deleteCategory(category)} disabled={busy} title="Eliminar categoría"><Trash2 size={17} /></button>
                  </article>
                );
              })}
            </div>
            {filteredCategories.length ? (
              <div className="pager admin-pager">
                <button
                  className="icon-button"
                  type="button"
                  disabled={adminCategoriesPage <= 1}
                  onClick={() => setAdminCategoriesPage((value) => Math.max(1, value - 1))}
                  title="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span>Página {adminCategoriesPage} de {categoryTotalPages} · {filteredCategories.length} categorías</span>
                <button
                  className="icon-button"
                  type="button"
                  disabled={adminCategoriesPage >= categoryTotalPages}
                  onClick={() => setAdminCategoriesPage((value) => Math.min(categoryTotalPages, value + 1))}
                  title="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div className="empty-state compact-empty">No hay categorías para mostrar.</div>
            )}
          </section>

          <form className="admin-panel" onSubmit={actions.createCategory}>
            <div className="admin-panel-title"><Tags size={19} /> {selectedAdminCategoryId ? 'Editar categoría' : 'Nueva categoría'}</div>
            <label>Nombre<input required value={categoryForm.name} onChange={updateCategory('name')} placeholder="Ej. Conservas vegetales" /></label>
            <label>Descripción<textarea value={categoryForm.description} onChange={updateCategory('description')} placeholder="Breve descripción para organizar el catálogo" /></label>
            <button className="primary full" type="submit" disabled={busy}>
              <Save size={18} /> {selectedAdminCategoryId ? 'Guardar categoría' : 'Crear categoría'}
            </button>
          </form>
        </div>
      )}

      {adminTab === 'orders' && (
        <div className="admin-products-layout">
          <section className="admin-panel">
            <div className="admin-panel-title"><ShoppingBag size={19} /> Pedidos</div>
            <label className="input-wrap admin-search">
              <Search size={17} />
              <input value={adminSearch.orders} onChange={(event) => actions.setAdminSearch('orders', event.target.value)} placeholder="Buscar pedido..." />
            </label>
            <div className="admin-order-list">
              {filteredOrders.map((order) => {
                const orderId = getId(order);
                return (
                  <article className={'collection-row' + (selectedAdminOrderId === orderId ? ' active' : '')} key={orderId}>
                    <button className="user-main" type="button" onClick={() => actions.openAdminOrder(order)}>
                      <strong>Pedido {String(orderId).slice(-6)}</strong>
                      <span>{order.email} · {formatOrderDate(order)}</span>
                    </button>
                    <strong>{formatCurrency(orderModel.getTotal(order))}</strong>
                    <span className={'status ' + (order.status || 'pending')}>{order.status || 'pending'}</span>
                    <button className="icon-button danger-button" type="button" onClick={() => actions.deleteOrder(order)} disabled={busy} title="Eliminar pedido"><Trash2 size={17} /></button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-title"><ShoppingBag size={19} /> Detalle de pedido</div>
            <OrderDetail order={selectedAdminOrder} />
          </section>
        </div>
      )}

      {adminTab === 'reviews' && (
        <div className="admin-products-layout">
          <section className="admin-panel">
            <div className="admin-panel-title"><MessageSquare size={19} /> Opiniones</div>
            <label className="input-wrap admin-search">
              <Search size={17} />
              <input value={adminSearch.reviews} onChange={(event) => actions.setAdminSearch('reviews', event.target.value)} placeholder="Buscar opinión..." />
            </label>
            <div className="admin-list">
              {filteredReviews.length ? filteredReviews.map((review) => (
                <article className="collection-row" key={review._id || review.id}>
                  <button className="user-main" type="button">
                    <strong>{review.product?.name || 'Producto'}</strong>
                    <span>{review.user?.email || review.user?.name || 'Cliente'} · {review.rating}/5 · {review.title || review.comment}</span>
                  </button>
                  <button className="icon-button danger-button" type="button" onClick={() => actions.deleteReview(review)} disabled={busy} title="Eliminar opinión">
                    <Trash2 size={17} />
                  </button>
                </article>
              )) : (
                <div className="empty-state compact-empty">No hay opiniones para mostrar.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {adminTab === 'media' && (
        <div className="admin-products-layout">
          <section className="admin-panel media-admin-panel">
            <div className="admin-panel-title"><ImageUp size={19} /> Imágenes</div>
            <label className="input-wrap admin-search">
              <Search size={17} />
              <input value={adminSearch.media} onChange={(event) => actions.setAdminSearch('media', event.target.value)} placeholder="Buscar producto..." />
            </label>
            <label>
              Producto
              <select required value={imageForm.productId} onChange={updateImage('productId')}>
                <option value="">Selecciona un producto</option>
                {filteredMediaProducts.map((product) => (
                  <option key={getId(product)} value={getId(product)}>{product.name} · {product.sku}</option>
                ))}
              </select>
            </label>

            <form className="nested-admin-form" onSubmit={actions.uploadProductImages}>
              <label>Archivo<input type="file" accept="image/*" multiple onChange={updateFiles} /></label>
              <div className="file-summary">
                {imageForm.files.length ? imageForm.files.map((file) => file.name).join(', ') : 'Subida vía Cloudinary. Máximo 5 imágenes, 5 MB cada una.'}
              </div>
              <button className="primary full" type="submit" disabled={busy || !imageForm.productId || imageForm.files.length === 0}>
                <ImageUp size={18} /> Subir archivo
              </button>
            </form>

            <form className="nested-admin-form url-image-form" onSubmit={actions.saveImageUrl}>
              <label>URL de imagen<input type="url" value={imageForm.imageUrl} onChange={updateImage('imageUrl')} placeholder="https://..." /></label>
              <label>Nombre de imagen<input value={imageForm.imageName} onChange={updateImage('imageName')} placeholder="Ej. Foto principal del producto" /></label>
              <button className="secondary full" type="submit" disabled={busy || !imageForm.productId || !imageForm.imageUrl.trim()}>
                <Link size={18} /> Guardar URL
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
