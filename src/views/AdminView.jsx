import {
  Eye,
  ImageUp,
  Link,
  MessageSquare,
  PackagePlus,
  Percent,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Tags,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
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

  if (session?.user?.role !== 'admin') {
    return (
      <section className="wide-panel single">
        <div className="empty-state">Necesitas entrar como administrador para gestionar el backoffice.</div>
      </section>
    );
  }

  const updateCategory = (field) => (event) => actions.updateCategoryForm(field, event.target.value);
  const updateProduct = (field) => (event) => actions.updateProductForm(field, event.target.value);
  const updateImage = (field) => (event) => actions.updateImageForm(field, event.target.value);
  const updateFiles = (event) => actions.updateImageForm('files', Array.from(event.target.files || []));
  const updateUser = (field) => (event) => actions.updateAdminUserForm(field, event.target.value);

  const filteredUsers = adminUsers.filter((user) => includesSearch([
    user.name,
    user.email,
    user.phone,
    getRoleLabel(user.role),
  ], adminSearch.users));

  const filteredProducts = adminProducts.filter((product) => includesSearch([
    product.name,
    product.sku,
    product.description,
    productModel.getCategoryName(product.category),
    product.supplier?.name,
  ], adminSearch.products));

  const filteredCategories = categories.filter((category) => includesSearch([
    category.name,
    category.slug,
    category.description,
  ], adminSearch.categories));

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
              {filteredProducts.map((product) => {
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
              <label className="wide-field">Descripción<textarea value={productForm.description} onChange={updateProduct('description')} placeholder="Origen, elaboración, uso recomendado..." /></label>
            </div>

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
              {filteredCategories.map((category) => {
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
