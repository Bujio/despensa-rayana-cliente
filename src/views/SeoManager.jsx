import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { productModel } from '../models/productModel.js';
import { formatProductName } from './viewFormatters.js';

const SITE_NAME = 'La Despensa Rayana';
const DEFAULT_DESCRIPTION = 'Tienda online de productos de origen rayano entre Extremadura y Portugal.';
const DEFAULT_IMAGE = '/despensa-rayana-hero.png';

function ensureMeta(selector, identity, values) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(identity).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  Object.entries(values).forEach(([key, value]) => element.setAttribute(key, value));
}

function ensureCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function setJsonLd(data) {
  let element = document.getElementById('despensa-rayana-jsonld');
  if (!element) {
    element = document.createElement('script');
    element.id = 'despensa-rayana-jsonld';
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

function getCatalogTitle(pathname) {
  const slug = decodeURIComponent(pathname.split('/catalogo/')[1] || '').replace(/-/g, ' ').trim();
  if (!slug) return 'Catálogo';
  return slug.charAt(0).toLocaleUpperCase('es-ES') + slug.slice(1);
}

function buildSeo(state, pathname) {
  if (pathname.startsWith('/producto/') && state.selectedProduct) {
    const product = state.selectedProduct;
    const name = formatProductName(product.name) || 'Producto rayano';
    const description = product.shortDescription || product.description || DEFAULT_DESCRIPTION;
    const image = productModel.getImage(product) || DEFAULT_IMAGE;
    return {
      title: name + ' | ' + SITE_NAME,
      description,
      image,
      type: 'product',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        image,
        sku: product.sku,
        brand: {
          '@type': 'Brand',
          name: product.supplier?.name || product.supplierRef?.name || SITE_NAME,
        },
        offers: {
          '@type': 'Offer',
          price: Number(productModel.getOfferPrice(product) || product.price || 0).toFixed(2),
          priceCurrency: 'EUR',
          availability: Number(product.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      },
    };
  }

  if (pathname.startsWith('/catalogo/')) {
    const category = getCatalogTitle(pathname);
    return {
      title: category + ' | Catálogo | ' + SITE_NAME,
      description: 'Compra ' + category.toLocaleLowerCase('es-ES') + ' de origen rayano con proveedores locales.',
      image: DEFAULT_IMAGE,
      type: 'website',
    };
  }

  const pages = {
    '/': ['Productos de origen rayano', 'Sabores locales de la Raya extremeña y portuguesa, seleccionados por productores de cercanía.'],
    '/catalogo': ['Catálogo', 'Explora productos rayados por categorías, ofertas, proveedores y disponibilidad.'],
    '/cesta': ['Cesta', 'Revisa tu cesta y prepara un pedido seguro en La Despensa Rayana.'],
    '/cuenta': ['Mi cuenta', 'Accede a tus pedidos, perfil, mensajes y valoraciones como cliente.'],
    '/supplier': ['Panel de proveedor', 'Gestiona tus productos, pedidos, ofertas e informes como proveedor.'],
    '/la-rayana': ['La Rayana', 'Una despensa nacida entre Extremadura y Portugal, con identidad rural y productos de origen.'],
    '/aviso-legal': ['Aviso legal', 'Información legal de La Despensa Rayana.'],
    '/privacidad': ['Privacidad', 'Información sobre privacidad y tratamiento de datos.'],
    '/cookies': ['Cookies', 'Información y preferencias de cookies.'],
    '/condiciones': ['Condiciones de contratación', 'Condiciones generales de compra en La Despensa Rayana.'],
    '/devoluciones-envios': ['Envíos y devoluciones', 'Información sobre envíos, devoluciones y desistimiento.'],
  };
  const [title, description] = pages[pathname] || pages['/'];

  return {
    title: title + ' | ' + SITE_NAME,
    description,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: window.location.origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: window.location.origin + '/catalogo?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  };
}

export function SeoManager({ state }) {
  const location = useLocation();

  useEffect(() => {
    const seo = buildSeo(state, location.pathname);
    const canonical = window.location.origin + location.pathname;
    const absoluteImage = new URL(seo.image || DEFAULT_IMAGE, window.location.origin).href;

    document.documentElement.lang = 'es';
    document.title = seo.title;
    ensureMeta('meta[name="description"]', { name: 'description' }, { content: seo.description });
    ensureMeta('meta[property="og:title"]', { property: 'og:title' }, { content: seo.title });
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }, { content: seo.description });
    ensureMeta('meta[property="og:type"]', { property: 'og:type' }, { content: seo.type });
    ensureMeta('meta[property="og:url"]', { property: 'og:url' }, { content: canonical });
    ensureMeta('meta[property="og:image"]', { property: 'og:image' }, { content: absoluteImage });
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, { content: 'summary_large_image' });
    ensureCanonical(canonical);
    setJsonLd(seo.jsonLd || {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: window.location.origin,
    });
  }, [location.pathname, state.selectedProduct]);

  return null;
}
