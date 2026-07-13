import { authModel } from '../models/authModel.js';
import { supplierModel } from '../models/supplierModel.js';
import {
  initialImageForm,
  initialProductForm,
} from './controllerInitialState.js';
import { getProductFormFromProduct } from './controllerHelpers.js';

export function createSupplierControllerActions({
  imageForm,
  loadFeaturedProducts,
  loadProducts,
  productForm,
  request,
  selectedSupplierProductId,
  session,
  setBusy,
  setImageForm,
  setNotice,
  setProductForm,
  setSelectedSupplierProductId,
  setSupplierOrders,
  setSupplierProducts,
  setSupplierProfile,
  setSupplierReports,
  supplierProfile,
}) {
  async function loadSupplierPanel() {
    if (session?.user?.role !== 'supplier') return;
    try {
      const [profile, products, salesReport, productsReport, supplierOrderList] = await Promise.all([
        supplierModel.getProfile(request),
        supplierModel.listProducts(request),
        supplierModel.getSalesReport(request).catch(() => null),
        supplierModel.getProductsReport(request).catch(() => null),
        supplierModel.listOrders(request).catch(() => []),
      ]);
      setSupplierProfile(profile);
      setSupplierProducts(products);
      setSupplierReports({ sales: salesReport, products: productsReport });
      setSupplierOrders(supplierOrderList);
    } catch (error) {
      setNotice(error.message);
      setSupplierProducts([]);
      setSupplierOrders([]);
    }
  }

  async function saveSupplierProfile(form) {
    if (session?.user?.role !== 'supplier') return;

    setBusy(true);
    try {
      const profile = await supplierModel.updateProfile(request, form);
      setSupplierProfile(profile);
      setNotice('Perfil de proveedor actualizado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function registerSupplierProfile(form, media = {}) {
    setBusy(true);
    setNotice('');
    try {
      const result = await supplierModel.register(form);
      const hasMedia = media.logoFile || media.mainImageFile || media.galleryFiles?.length;
      if (hasMedia) {
        const supplierSession = await authModel.login(form.email, form.password);
        if (media.logoFile) await supplierModel.uploadProfileLogo(supplierSession, media.logoFile);
        if (media.mainImageFile) await supplierModel.uploadProfileMainImage(supplierSession, media.mainImageFile);
        if (media.galleryFiles?.length) await supplierModel.uploadProfileGallery(supplierSession, media.galleryFiles);
      }
      setNotice(result?.message || 'Tu solicitud de proveedor se ha registrado correctamente.');
      return result;
    } catch (error) {
      setNotice(error.message);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  function resetSupplierProductForm() {
    setSelectedSupplierProductId('');
    setProductForm({
      ...initialProductForm,
      supplierId: '0',
      supplierName: supplierProfile?.name || session?.user?.name || '',
    });
    setImageForm((current) => ({ ...current, productId: '', files: [], imageUrl: '', imageName: '' }));
  }

  function selectSupplierProduct(product) {
    const productId = product?._id || product?.id || '';
    setSelectedSupplierProductId(productId);
    setProductForm(getProductFormFromProduct(product, {
      id: 0,
      name: supplierProfile?.name || session?.user?.name || '',
      images: [],
    }));
    setImageForm((current) => ({ ...current, productId, files: [], imageUrl: '', imageName: '' }));
  }

  async function saveSupplierProduct(event, routeProductId = '') {
    event.preventDefault();
    if (session?.user?.role !== 'supplier') return;

    setBusy(true);
    try {
      const pendingFiles = imageForm.files;
      const editProductId = routeProductId || selectedSupplierProductId;
      if (editProductId) {
        const updated = await supplierModel.updateProduct(request, editProductId, productForm);
        if (pendingFiles.length) {
          await supplierModel.uploadProductImages(request, editProductId, pendingFiles);
        }
        setSelectedSupplierProductId(editProductId);
        setProductForm(getProductFormFromProduct(updated, {
          id: 0,
          name: supplierProfile?.name || session?.user?.name || '',
          images: [],
        }));
        setImageForm((current) => ({ ...current, productId: editProductId, files: [], imageUrl: '', imageName: '' }));
        setNotice(pendingFiles.length ? 'Producto e imágenes actualizados correctamente.' : 'Producto actualizado correctamente.');
      } else {
        const saved = await supplierModel.createProduct(request, productForm);
        const savedId = saved._id || saved.id || '';
        if (savedId && pendingFiles.length) {
          await supplierModel.uploadProductImages(request, savedId, pendingFiles);
        }
        setImageForm((current) => ({ ...current, productId: savedId }));
        setNotice(pendingFiles.length
          ? 'Producto creado con imágenes. Queda pendiente de revisión.'
          : 'Producto creado correctamente. Queda pendiente de revisión.');
        resetSupplierProductForm();
      }
      await loadSupplierPanel();
      await loadProducts();
      await loadFeaturedProducts();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSupplierProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'supplier') return;

    setBusy(true);
    try {
      await supplierModel.deleteProduct(request, productId);
      if (selectedSupplierProductId === productId) resetSupplierProductForm();
      await loadSupplierPanel();
      await loadProducts();
      await loadFeaturedProducts();
      setNotice('Producto eliminado correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function duplicateSupplierProduct(product) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'supplier') return;

    const baseForm = getProductFormFromProduct(product, {
      id: 0,
      name: supplierProfile?.name || session?.user?.name || '',
      images: [],
    });
    const suffix = String(Date.now()).slice(-5);
    const nextSku = [baseForm.sku || 'SKU', 'COPY', suffix].join('-').slice(0, 54);

    setBusy(true);
    try {
      await supplierModel.createProduct(request, {
        ...baseForm,
        name: (baseForm.name ? baseForm.name + ' copia' : 'Producto copia').slice(0, 120),
        sku: nextSku,
        status: 'draft',
      });
      await loadSupplierPanel();
      setNotice('Producto duplicado como borrador.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSupplierOffer(product, offerFields) {
    const productId = product?._id || product?.id;
    if (!productId || session?.user?.role !== 'supplier') return;

    const baseForm = getProductFormFromProduct(product, {
      id: 0,
      name: supplierProfile?.name || session?.user?.name || '',
      images: [],
    });

    setBusy(true);
    try {
      await supplierModel.updateProduct(request, productId, {
        ...baseForm,
        ...offerFields,
      });
      await loadSupplierPanel();
      await loadProducts();
      await loadFeaturedProducts();
      setNotice('Oferta actualizada correctamente.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeSupplierOffer(product) {
    await saveSupplierOffer(product, {
      offerType: 'none',
      offerValue: '',
      offerBundleQuantity: '3',
      offerBundlePayQuantity: '2',
      offerLabel: '',
      offerValidFrom: '',
      offerValidUntil: '',
    });
  }

  async function uploadSupplierProductImages(event) {
    event.preventDefault();
    const productId = selectedSupplierProductId || imageForm.productId;
    if (!productId || imageForm.files.length === 0) {
      setNotice('Elige un producto propio y al menos una imagen.');
      return;
    }

    setBusy(true);
    try {
      const updated = await supplierModel.uploadProductImages(request, productId, imageForm.files);
      setImageForm({ ...initialImageForm, productId });
      setProductForm((current) => ({
        ...current,
        images: Array.isArray(updated?.images) ? updated.images : current.images,
      }));
      await loadSupplierPanel();
      await loadProducts();
      await loadFeaturedProducts();
      setNotice('Imágenes subidas correctamente.');
    } catch (error) {
      setNotice(error.message === 'Internal server error'
        ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
        : error.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    deleteSupplierProduct,
    duplicateSupplierProduct,
    loadSupplierPanel,
    registerSupplierProfile,
    removeSupplierOffer,
    resetSupplierProductForm,
    saveSupplierOffer,
    saveSupplierProduct,
    saveSupplierProfile,
    selectSupplierProduct,
    uploadSupplierProductImages,
  };
}
