import { adminModel } from '../models/adminModel.js';
import { apiRequest } from '../models/apiClient.js';
import { homeContentModel } from '../models/homeContentModel.js';
import { initialHomeComponentForm } from './controllerInitialState.js';
import {
  assignHomeImage,
  getProductId,
} from './controllerHelpers.js';

export function createHomeContentControllerActions({
  homeComponentForm,
  homeContent,
  request,
  session,
  setBusy,
  setHomeComponentForm,
  setHomeContent,
  setNotice,
}) {
  const saveHomeContent = (updater) => {
    setHomeContent((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return homeContentModel.save(next);
    });
  };

  async function loadHomeContent() {
    try {
      setHomeContent(await homeContentModel.loadRemote(apiRequest));
    } catch {
      setHomeContent(homeContentModel.load());
    }
  }

  const updateHomeHero = (field, value) => {
    saveHomeContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [field]: value,
      },
    }));
  };

  async function uploadHomeImage(target, files) {
    const fileList = Array.from(files || []).filter(Boolean);
    if (!fileList.length) {
      setNotice('Elige una imagen para subir.');
      return;
    }

    setBusy(true);
    try {
      const result = await adminModel.uploadHomeImages(request, fileList.slice(0, 1));
      const imageUrl = result?.images?.[0]?.url;
      if (!imageUrl) throw new Error('No se recibió la URL de la imagen.');

      if (target.startsWith('component.')) {
        updateHomeComponentForm(target.replace('component.', ''), imageUrl);
        setNotice('Imagen subida y asignada. Añade el componente para guardarla en la portada.');
        return;
      }

      const nextHomeContent = homeContentModel.save(assignHomeImage(homeContent, target, imageUrl));
      setHomeContent(nextHomeContent);
      const savedHomeContent = await homeContentModel.saveRemote(request, nextHomeContent);
      setHomeContent(savedHomeContent);
      setNotice('Imagen subida, asignada y guardada en Atlas.');
    } catch (error) {
      setNotice(error.message === 'Internal server error'
        ? 'No se pudo subir el archivo. Revisa Cloudinary en el backend o usa una URL de imagen.'
        : error.message);
    } finally {
      setBusy(false);
    }
  }

  const updateHomeComponentForm = (field, value) => {
    setHomeComponentForm((current) => ({ ...current, [field]: value }));
  };

  const toggleHomeComponentProduct = (product) => {
    const productId = getProductId(product);
    if (!productId) return;
    setHomeComponentForm((current) => {
      const selected = current.productIds.includes(productId);
      return {
        ...current,
        productIds: selected
          ? current.productIds.filter((id) => id !== productId)
          : [...current.productIds, productId],
      };
    });
  };

  const updateHomeSection = (sectionId, field, value) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId ? { ...section, [field]: value } : section
      )),
    }));
  };

  const updateHomeSectionItem = (sectionId, itemIndex, field, value) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const items = [...(Array.isArray(section.items) ? section.items : [])];
        items[itemIndex] = {
          title: '',
          body: '',
          imageUrl: '',
          linkUrl: '',
          ...(items[itemIndex] || {}),
          [field]: value,
        };
        return { ...section, items };
      }),
    }));
  };

  const toggleHomeSectionProduct = (sectionId, product) => {
    const productId = getProductId(product);
    if (!productId) return;
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const productIds = Array.isArray(section.productIds) ? section.productIds : [];
        const selected = productIds.includes(productId);
        return {
          ...section,
          productIds: selected
            ? productIds.filter((id) => id !== productId)
            : [...productIds, productId],
        };
      }),
    }));
  };

  const toggleHomeSection = (sectionId) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === sectionId ? { ...section, enabled: !section.enabled } : section
      )),
    }));
  };

  const moveHomeSection = (sectionId, direction) => {
    saveHomeContent((current) => {
      const sections = [...current.sections].sort((first, second) => first.order - second.order);
      const index = sections.findIndex((section) => section.id === sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return current;
      const [section] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, section);
      return {
        ...current,
        sections: sections.map((item, order) => ({ ...item, order })),
      };
    });
  };

  const deleteHomeSection = (sectionId) => {
    saveHomeContent((current) => ({
      ...current,
      sections: current.sections
        .filter((section) => section.id !== sectionId)
        .map((section, order) => ({ ...section, order })),
    }));
  };

  const toggleFeaturedProduct = (product) => {
    const productId = getProductId(product);
    if (!productId) return;
    saveHomeContent((current) => {
      const selected = current.featuredProductIds.includes(productId);
      return {
        ...current,
        featuredProductIds: selected
          ? current.featuredProductIds.filter((id) => id !== productId)
          : [...current.featuredProductIds, productId],
      };
    });
  };

  const createHomeComponent = (event) => {
    event.preventDefault();
    const title = homeComponentForm.title.trim();
    if (!title) {
      setNotice('Indica un titulo para el componente.');
      return;
    }
    const bannerItems = [
      {
        title: homeComponentForm.itemOneTitle.trim(),
        body: homeComponentForm.itemOneBody.trim(),
        imageUrl: homeComponentForm.itemOneImageUrl.trim(),
        linkUrl: homeComponentForm.itemOneLinkUrl.trim(),
      },
      {
        title: homeComponentForm.itemTwoTitle.trim(),
        body: homeComponentForm.itemTwoBody.trim(),
        imageUrl: homeComponentForm.itemTwoImageUrl.trim(),
        linkUrl: homeComponentForm.itemTwoLinkUrl.trim(),
      },
      {
        title: homeComponentForm.itemThreeTitle.trim(),
        body: homeComponentForm.itemThreeBody.trim(),
        imageUrl: homeComponentForm.itemThreeImageUrl.trim(),
        linkUrl: homeComponentForm.itemThreeLinkUrl.trim(),
      },
    ].filter((item) => item.title || item.body || item.imageUrl || item.linkUrl);

    saveHomeContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: 'custom-' + Date.now(),
          type: homeComponentForm.type,
          title,
          subtitle: homeComponentForm.subtitle.trim(),
          body: homeComponentForm.body.trim(),
          ctaLabel: homeComponentForm.ctaLabel.trim(),
          imageUrl: homeComponentForm.imageUrl.trim(),
          items: bannerItems,
          linkUrl: homeComponentForm.linkUrl.trim(),
          productIds: homeComponentForm.productIds,
          enabled: true,
          locked: false,
          order: current.sections.length,
        },
      ],
    }));
    setHomeComponentForm({ ...initialHomeComponentForm });
    setNotice('Componente anadido a la portada.');
  };

  const resetHomeContent = () => {
    saveHomeContent(homeContentModel.getDefault());
    setHomeComponentForm({ ...initialHomeComponentForm });
    setNotice('Portada restablecida.');
  };

  async function saveHomeContentSettings() {
    if (session?.user?.role !== 'admin') return;
    setBusy(true);
    try {
      setHomeContent(await homeContentModel.saveRemote(request, homeContent));
      setNotice('Portada guardada en Atlas.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    createHomeComponent,
    deleteHomeSection,
    loadHomeContent,
    moveHomeSection,
    resetHomeContent,
    saveHomeContentSettings,
    toggleFeaturedProduct,
    toggleHomeComponentProduct,
    toggleHomeSection,
    toggleHomeSectionProduct,
    updateHomeComponentForm,
    updateHomeHero,
    updateHomeSection,
    updateHomeSectionItem,
    uploadHomeImage,
  };
}
