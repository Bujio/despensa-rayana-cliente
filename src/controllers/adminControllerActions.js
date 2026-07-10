import { adminModel } from '../models/adminModel.js';
import { catalogModel } from '../models/catalogModel.js';
import { orderModel } from '../models/orderModel.js';
import { emptyFilters } from '../models/productModel.js';
import {
  initialAdminUserForm,
  initialCategoryForm,
  initialImageForm,
  initialProductForm,
  initialSupplierForm,
} from './controllerInitialState.js';
import {
  getProductFormFromProduct,
  getSupplierKey,
} from './controllerHelpers.js';

export function createAdminControllerActions({
  adminProducts,
  adminSearch,
  adminUserForm,
  categoryForm,
  imageForm,
  loadCategories,
  loadFeaturedProducts,
  loadOrders,
  loadProducts,
  productForm,
  request,
  selectedAdminCategoryId,
  selectedAdminProductId,
  selectedAdminSupplierId,
  selectedAdminUserId,
  session,
  setAdminProducts,
  setAdminSearchState,
  setAdminSuppliers,
  setAdminUserForm,
  setAdminUsers,
  setBusy,
  setCategoryForm,
  setImageForm,
  setNotice,
  setProductForm,
  setSelectedAdminCategoryId,
  setSelectedAdminOrderId,
  setSelectedAdminProductId,
  setSelectedAdminSupplierId,
  setSelectedAdminSupplierKey,
  setSelectedAdminUserId,
  setSupplierForm,
  supplierForm,
}) {
  async function loadAdminProducts() {
    try {
      if (session?.user?.role === 'admin') {
        setAdminProducts(await adminModel.listProducts(request));
        return;
      }

      const result = await catalogModel.listProducts({
        page: 1,
        filters: { ...emptyFilters, inStock: false },
        limit: 100,
      });
      setAdminProducts(result.products);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadAdminSuppliers() {
    if (session?.user?.role !== 'admin') return;
    try {
      setAdminSuppliers(await adminModel.listSuppliers(request));
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadAdminUsers() {
    try {
      setAdminUsers(await adminModel.listUsers(request));
    } catch (error) {
      setNotice(error.message);
    }
  }

  const updateAdminUserForm = (field, value) => {
    setAdminUserForm((current) => ({ ...current, [field]: value }));
  };

  const updateSupplierForm = (field, value) => {
    setSupplierForm((current) => ({ ...current, [field]: value }));
  };

  const setAdminSearch = (key, value) => {
    setAdminSearchState((current) => ({ ...current, [key]: value }));
  };

  function selectAdminCategory(category) {
    setSelectedAdminCategoryId(category?._id || category?.id || '');
    setCategoryForm({
      name: category?.name || '',
      description: category?.description || '',
    });
  }

  function resetCategoryForm() {
    setSelectedAdminCategoryId('');
    setCategoryForm({ ...initialCategoryForm });
  }

  function selectAdminProduct(product) {
    setSelectedAdminProductId(product?._id || product?.id || '');
    setProductForm(getProductFormFromProduct(product));
    if (product?._id || product?.id) {
      setImageForm((current) => ({ ...current, productId: product._id || product.id }));
    }
  }

  function resetProductForm() {
    setSelectedAdminProductId('');
    setProductForm({ ...initialProductForm });
    setImageForm({ ...initialImageForm });
  }

  async function selectAdminSupplier(supplier) {
    const supplierId = supplier?._id || supplier?.id || '';
    const key = getSupplierKey(supplier);
    setSelectedAdminSupplierId(supplierId);
    setSelectedAdminSupplierKey(key);
    setSupplierForm({
      name: supplier?.name || '',
      legalName: supplier?.legalName || '',
      phone: supplier?.phone || '',
      status: supplier?.status || '',
      featured: Boolean(supplier?.featured),
      internalNotes: supplier?.internalNotes || '',
      rejectionReason: supplier?.rejectionReason || '',
    });

    if (!supplierId) return;
    setBusy(true);
    try {
      const detail = await adminModel.getSupplier(request, supplierId);
      setAdminSuppliers((current) => current.map((item) => (
        (item._id || item.id) === supplierId ? { ...item, ...detail } : item
      )));
      setSupplierForm({
        name: detail?.name || '',
        legalName: detail?.legalName || '',
        phone: detail?.phone || '',
        status: detail?.status || '',
        featured: Boolean(detail?.featured),
        internalNotes: detail?.internalNotes || '',
        rejectionReason: detail?.rejectionReason || '',
      });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function resetSupplierForm() {
    setSelectedAdminSupplierId('');
    setSelectedAdminSupplierKey('');
    setSupplierForm({ ...initialSupplierForm });
  }

  async function refreshSelectedSupplier(supplierId = selectedAdminSupplierId) {
    await loadAdminSuppliers();
    if (!supplierId) return;
    try {
      const detail = await adminModel.getSupplier(request, supplierId);
      setAdminSuppliers((current) => {
        const exists = current.some((item) => (item._id || item.id) === supplierId);
        return exists
          ? current.map((item) => ((item._id || item.id) === supplierId ? { ...item, ...detail } : item))
          : [detail, ...current];
      });
      setSupplierForm({
        name: detail?.name || '',
        legalName: detail?.legalName || '',
        phone: detail?.phone || '',
        status: detail?.status || '',
        featured: Boolean(detail?.featured),
        internalNotes: detail?.internalNotes || '',
        rejectionReason: detail?.rejectionReason || '',
      });
    } catch {
      // La lista ya se ha refrescado; si falla el detalle no bloqueamos la vista.
    }
  }

  async function setAdminSupplierAction(action, options = {}) {
    if (!selectedAdminSupplierId) {
      setNotice('Selecciona un proveedor para gestionarlo.');
      return;
    }

    setBusy(true);
    try {
      if (action === 'approve') await adminModel.approveSupplier(request, selectedAdminSupplierId);
      if (action === 'reject') await adminModel.rejectSupplier(request, selectedAdminSupplierId, options.reason || supplierForm.rejectionReason || '');
      if (action === 'deactivate') await adminModel.deactivateSupplier(request, selectedAdminSupplierId);
      if (action === 'reactivate') await adminModel.reactivateSupplier(request, selectedAdminSupplierId);
      if (action === 'featured') await adminModel.setSupplierFeatured(request, selectedAdminSupplierId, options.featured);
      await refreshSelectedSupplier(selectedAdminSupplierId);
      await loadAdminProducts();
      await loadProducts();
      setNotice('Proveedor actualizado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveAdminSupplier(event) {
    event.preventDefault();
    if (!selectedAdminSupplierId) {
      setNotice('Selecciona un proveedor para editarlo.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.setSupplierInternalNotes(request, selectedAdminSupplierId, supplierForm.internalNotes);
      await adminModel.setSupplierFeatured(request, selectedAdminSupplierId, Boolean(supplierForm.featured));
      await refreshSelectedSupplier(selectedAdminSupplierId);
      setNotice('Notas y destacado del proveedor guardados.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAdminSupplier() {
    if (!selectedAdminSupplierId) {
      setNotice('Selecciona un proveedor para eliminarlo.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.deleteSupplier(request, selectedAdminSupplierId);
      resetSupplierForm();
      await loadAdminSuppliers();
      await loadAdminProducts();
      await loadProducts();
      setNotice('Proveedor eliminado de la base de datos.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function selectAdminUser(user) {
    const userId = user?._id || user?.id || '';
    setSelectedAdminUserId(userId);
    setSelectedAdminOrderId('');
    setAdminUserForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      codePostal: user?.address?.codePostal || '',
      city: user?.address?.city || '',
      country: user?.address?.country || '',
      role: user?.role || 'user',
      password: '',
    });
  }

  function openAdminUserOrders(user) {
    selectAdminUser(user);
    setSelectedAdminOrderId('');
  }

  function openAdminOrder(order) {
    setSelectedAdminOrderId(order?._id || order?.id || '');
  }

  async function saveAdminUser(event) {
    event.preventDefault();
    if (!selectedAdminUserId) {
      setNotice('Selecciona un usuario para editarlo.');
      return;
    }

    setBusy(true);
    try {
      const updated = await adminModel.updateUser(request, selectedAdminUserId, adminUserForm);
      await loadAdminUsers();
      selectAdminUser(updated);
      setNotice('Usuario actualizado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAdminUser(user) {
    const userId = user?._id || user?.id;
    if (!userId) return;
    if (String(userId) === String(session?.user?._id || session?.user?.id)) {
      setNotice('No puedes eliminar tu propio usuario administrador desde aquí.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.deleteUser(request, userId);
      await loadAdminUsers();
      if (selectedAdminUserId === userId) {
        setSelectedAdminUserId('');
        setSelectedAdminOrderId('');
        setAdminUserForm({ ...initialAdminUserForm });
      }
      setNotice('Usuario eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (selectedAdminCategoryId) {
        await adminModel.updateCategory(request, selectedAdminCategoryId, categoryForm);
        setNotice('Categoría actualizada correctamente.');
      } else {
        await adminModel.createCategory(request, categoryForm);
        setNotice('Categoría creada correctamente.');
      }
      resetCategoryForm();
      await loadCategories();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(category) {
    const categoryId = category?._id || category?.id;
    if (!categoryId) return;

    setBusy(true);
    try {
      await adminModel.deleteCategory(request, categoryId);
      if (selectedAdminCategoryId === categoryId) resetCategoryForm();
      await loadCategories();
      setNotice('Categoría eliminada correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = selectedAdminProductId
        ? await adminModel.updateProduct(request, selectedAdminProductId, productForm)
        : await adminModel.createProduct(request, productForm);
      setImageForm((current) => ({ ...current, productId: saved._id || saved.id || '' }));
      resetProductForm();
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice(selectedAdminProductId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId) return;

    setBusy(true);
    try {
      await adminModel.deleteProduct(request, productId);
      if (selectedAdminProductId === productId) resetProductForm();
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice('Producto eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function approveAdminProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'admin') return;

    setBusy(true);
    try {
      await adminModel.approveProduct(request, productId);
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      await loadAdminSuppliers();
      setNotice('Producto aprobado y publicado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function rejectAdminProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'admin') return;
    const reason = window.prompt('Indica el motivo del rechazo para que el proveedor pueda corregirlo:');
    if (reason == null) return;
    if (reason.trim().length < 3) {
      setNotice('Indica un motivo claro para rechazar el producto.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.rejectProduct(request, productId, reason.trim());
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      await loadAdminSuppliers();
      setNotice('Producto rechazado. El proveedor verá el motivo para corregirlo.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadProductImages(event) {
    event.preventDefault();
    if (!imageForm.productId || imageForm.files.length === 0) {
      setNotice('Elige un producto y al menos una imagen.');
      return;
    }

    setBusy(true);
    try {
      const updated = await adminModel.uploadProductImages(request, imageForm.productId, imageForm.files);
      setImageForm({ ...initialImageForm, productId: imageForm.productId });
      setProductForm((current) => ({
        ...current,
        images: Array.isArray(updated?.images) ? updated.images : current.images,
      }));
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice('Imágenes subidas correctamente.');
    } catch (error) {
      setNotice(error.message === 'Internal server error'
        ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
        : error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveImageUrl(event) {
    event.preventDefault();
    const product = adminProducts.find((item) => (item._id || item.id) === imageForm.productId);
    if (!product || !imageForm.imageUrl.trim()) {
      setNotice('Elige un producto y pega una URL de imagen válida.');
      return;
    }

    setBusy(true);
    try {
      await adminModel.saveImageUrl(request, product, imageForm.imageUrl, imageForm.imageName);
      setImageForm({ ...initialImageForm, productId: imageForm.productId });
      await loadProducts();
      await loadFeaturedProducts();
      await loadAdminProducts();
      setNotice('Imagen guardada desde URL.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder(order) {
    const orderId = order._id || order.id;
    if (!orderId || session?.user?.role !== 'admin') return;

    setBusy(true);
    try {
      await orderModel.delete(request, orderId);
      await loadOrders();
      await loadProducts();
      await loadFeaturedProducts();
      setNotice('Pedido eliminado y stock repuesto.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    approveAdminProduct,
    createCategory,
    createProduct,
    deleteAdminSupplier,
    deleteAdminUser,
    deleteCategory,
    deleteOrder,
    deleteProduct,
    loadAdminProducts,
    loadAdminSuppliers,
    loadAdminUsers,
    openAdminOrder,
    openAdminUserOrders,
    rejectAdminProduct,
    resetCategoryForm,
    resetProductForm,
    resetSupplierForm,
    saveAdminSupplier,
    saveAdminUser,
    saveImageUrl,
    selectAdminCategory,
    selectAdminProduct,
    selectAdminSupplier,
    selectAdminUser,
    setAdminSearch,
    setAdminSupplierAction,
    updateAdminUserForm,
    updateSupplierForm,
    uploadProductImages,
  };
}
