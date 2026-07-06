#!/usr/bin/env node
const API_URL = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const seed = {
  "categories": [
    {
      "name": "Aceites",
      "description": "Aceites de oliva virgen extra producidos en comarcas extremeñas."
    },
    {
      "name": "Ibéricos",
      "description": "Embutidos y piezas de cerdo ibérico criados en dehesa extremeña."
    },
    {
      "name": "Quesos",
      "description": "Quesos tradicionales de oveja y cabra con origen extremeño."
    },
    {
      "name": "Pimentón y condimentos",
      "description": "Condimentos representativos de la cocina de Extremadura."
    },
    {
      "name": "Mieles y dulces",
      "description": "Miel, higos, cerezas y dulces tradicionales de la región."
    },
    {
      "name": "Vinos y bebidas",
      "description": "Vinos, cavas y bebidas elaboradas en Extremadura."
    },
    {
      "name": "Legumbres y cereales",
      "description": "Productos de campo y despensa de las vegas y comarcas extremeñas."
    },
    {
      "name": "Conservas vegetales",
      "description": "Conservas y verduras de la huerta extremeña."
    }
  ],
  "products": [
    {
      "name": "Pimentón de la Vera DOP dulce",
      "sku": "EXT-PIM-VERA-DULCE-75",
      "price": 4.95,
      "description": "Pimentón ahumado tradicional de la Vera, secado con leña de encina. Ideal para guisos, patatas revolconas y embutidos caseros.",
      "stock": 90,
      "categoryName": "Pimentón y condimentos",
      "supplier": {
        "id": 1001,
        "name": "Secaderos de la Vera"
      }
    },
    {
      "name": "Pimentón de la Vera DOP picante",
      "sku": "EXT-PIM-VERA-PIC-75",
      "price": 5.15,
      "description": "Variante picante del pimentón de la Vera, con aroma ahumado intenso y color rojo profundo.",
      "stock": 64,
      "categoryName": "Pimentón y condimentos",
      "supplier": {
        "id": 1001,
        "name": "Secaderos de la Vera"
      }
    },
    {
      "name": "Torta del Casar DOP",
      "sku": "EXT-QUE-TORTA-CASAR-550",
      "price": 18.9,
      "description": "Queso cremoso de oveja merina, elaborado con cuajo vegetal. Un clásico de Cáceres para abrir y untar.",
      "stock": 24,
      "categoryName": "Quesos",
      "supplier": {
        "id": 1002,
        "name": "Quesería Llanos de Cáceres"
      }
    },
    {
      "name": "Queso Ibores DOP semicurado",
      "sku": "EXT-QUE-IBORES-450",
      "price": 13.75,
      "description": "Queso de cabra de la zona de Ibores-Villuercas, de sabor limpio, ligeramente ácido y corteza pimentonada.",
      "stock": 38,
      "categoryName": "Quesos",
      "supplier": {
        "id": 1003,
        "name": "Quesos de las Villuercas"
      }
    },
    {
      "name": "Queso de la Serena DOP",
      "sku": "EXT-QUE-SERENA-600",
      "price": 19.5,
      "description": "Queso de oveja merina de pasta blanda y sabor largo, típico de la comarca de La Serena en Badajoz.",
      "stock": 18,
      "categoryName": "Quesos",
      "supplier": {
        "id": 1004,
        "name": "Quesería La Serena"
      }
    },
    {
      "name": "Jamón ibérico de bellota Dehesa de Extremadura",
      "sku": "EXT-IBE-JAM-BEL-100",
      "price": 22.9,
      "description": "Sobre de jamón ibérico de bellota cortado a cuchillo, procedente de cerdos criados en dehesa extremeña.",
      "stock": 42,
      "categoryName": "Ibéricos",
      "supplier": {
        "id": 1005,
        "name": "Dehesa Sierra Suroeste"
      }
    },
    {
      "name": "Paleta ibérica de bellota loncheada",
      "sku": "EXT-IBE-PAL-BEL-100",
      "price": 16.8,
      "description": "Paleta ibérica de bellota en lonchas finas, curada lentamente en secadero natural.",
      "stock": 50,
      "categoryName": "Ibéricos",
      "supplier": {
        "id": 1005,
        "name": "Dehesa Sierra Suroeste"
      }
    },
    {
      "name": "Lomo doblado ibérico extremeño",
      "sku": "EXT-IBE-LOMO-DOB-350",
      "price": 17.4,
      "description": "Lomo ibérico adobado con pimentón de la Vera y curado al estilo tradicional extremeño.",
      "stock": 34,
      "categoryName": "Ibéricos",
      "supplier": {
        "id": 1006,
        "name": "Ibéricos de Tentudía"
      }
    },
    {
      "name": "Chorizo ibérico de la dehesa",
      "sku": "EXT-IBE-CHOR-400",
      "price": 8.95,
      "description": "Chorizo ibérico curado con pimentón de la Vera, ajo y sal. Sabor intenso y equilibrado.",
      "stock": 72,
      "categoryName": "Ibéricos",
      "supplier": {
        "id": 1006,
        "name": "Ibéricos de Tentudía"
      }
    },
    {
      "name": "Morcilla patatera extremeña",
      "sku": "EXT-IBE-PATATERA-350",
      "price": 6.7,
      "description": "Embutido típico extremeño elaborado con patata, grasa de cerdo ibérico y pimentón. Perfecto para untar o cocinar.",
      "stock": 58,
      "categoryName": "Ibéricos",
      "supplier": {
        "id": 1007,
        "name": "Sabores de Montánchez"
      }
    },
    {
      "name": "AOVE Gata-Hurdes DOP manzanilla cacereña",
      "sku": "EXT-AOV-GATA-500",
      "price": 9.8,
      "description": "Aceite de oliva virgen extra de la Sierra de Gata y Las Hurdes, frutado y con carácter vegetal.",
      "stock": 80,
      "categoryName": "Aceites",
      "supplier": {
        "id": 1008,
        "name": "Almazara Gata-Hurdes"
      }
    },
    {
      "name": "AOVE Monterrubio DOP coupage",
      "sku": "EXT-AOV-MONT-500",
      "price": 8.9,
      "description": "Aceite de oliva virgen extra de Monterrubio de la Serena, equilibrado, aromático y de baja acidez.",
      "stock": 76,
      "categoryName": "Aceites",
      "supplier": {
        "id": 1009,
        "name": "Cooperativa de Monterrubio"
      }
    },
    {
      "name": "Miel Villuercas-Ibores DOP milflores",
      "sku": "EXT-MIE-VILL-500",
      "price": 7.95,
      "description": "Miel de flores de la comarca Villuercas-Ibores, aromática, densa y representativa de la apicultura extremeña.",
      "stock": 67,
      "categoryName": "Mieles y dulces",
      "supplier": {
        "id": 1010,
        "name": "Colmenares de Ibores"
      }
    },
    {
      "name": "Cerezas del Jerte en almíbar",
      "sku": "EXT-DUL-JERTE-ALM-370",
      "price": 6.25,
      "description": "Cerezas del Valle del Jerte conservadas en almíbar ligero, ideales para postres, yogur o repostería.",
      "stock": 45,
      "categoryName": "Mieles y dulces",
      "supplier": {
        "id": 1011,
        "name": "Cooperativa Valle del Jerte"
      }
    },
    {
      "name": "Mermelada de cereza del Jerte",
      "sku": "EXT-DUL-JERTE-MERM-250",
      "price": 4.85,
      "description": "Mermelada artesana de cereza del Jerte, con fruta de temporada y textura natural.",
      "stock": 52,
      "categoryName": "Mieles y dulces",
      "supplier": {
        "id": 1011,
        "name": "Cooperativa Valle del Jerte"
      }
    },
    {
      "name": "Bombón de higo de Almoharín",
      "sku": "EXT-DUL-HIGO-ALM-180",
      "price": 7.4,
      "description": "Dulce típico de Almoharín elaborado con higos secos seleccionados y cobertura de chocolate.",
      "stock": 40,
      "categoryName": "Mieles y dulces",
      "supplier": {
        "id": 1012,
        "name": "Higos de Almoharín"
      }
    },
    {
      "name": "Vino tinto Ribera del Guadiana DO crianza",
      "sku": "EXT-VIN-RG-CRI-750",
      "price": 10.9,
      "description": "Vino tinto de la DO Ribera del Guadiana, con crianza en barrica y uvas de Tierra de Barros.",
      "stock": 60,
      "categoryName": "Vinos y bebidas",
      "supplier": {
        "id": 1013,
        "name": "Bodega Tierra de Barros"
      }
    },
    {
      "name": "Cava de Almendralejo brut",
      "sku": "EXT-CAV-ALM-BRUT-750",
      "price": 12.5,
      "description": "Cava elaborado en Almendralejo, zona extremeña autorizada para la producción de cava, fresco y seco.",
      "stock": 36,
      "categoryName": "Vinos y bebidas",
      "supplier": {
        "id": 1014,
        "name": "Burbujas de Almendralejo"
      }
    },
    {
      "name": "Arroz de las Vegas del Guadiana",
      "sku": "EXT-CER-ARROZ-GUAD-1000",
      "price": 3.6,
      "description": "Arroz cultivado en las Vegas del Guadiana, zona arrocera de Badajoz. Grano versátil para cocina diaria.",
      "stock": 110,
      "categoryName": "Legumbres y cereales",
      "supplier": {
        "id": 1015,
        "name": "Campos del Guadiana"
      }
    },
    {
      "name": "Tomate triturado de las Vegas del Guadiana",
      "sku": "EXT-CON-TOM-GUAD-660",
      "price": 3.95,
      "description": "Tomate de huerta extremeña triturado y embotado, pensado para sofritos, gazpachos y guisos caseros.",
      "stock": 88,
      "categoryName": "Conservas vegetales",
      "supplier": {
        "id": 1016,
        "name": "Huerta Guadiana"
      }
    }
  ]
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function request(path, options = {}, token = ACCESS_TOKEN) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);

  const response = await fetch(API_URL + path, { ...options, headers });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.errors?.map((error) => error.message).join('. ') || response.statusText;
    throw new Error(message);
  }

  return payload;
}

async function getToken() {
  if (ACCESS_TOKEN) return ACCESS_TOKEN;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail('Faltan credenciales. Usa ADMIN_EMAIL y ADMIN_PASSWORD, o ACCESS_TOKEN si ya tienes un token admin.');
  }
  const session = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  }, null);
  return session.accessToken;
}

async function ensureCategories(token) {
  for (const category of seed.categories) {
    try {
      await request('/categories', {
        method: 'POST',
        body: JSON.stringify(category),
      }, token);
      console.log('Categoria creada:', category.name);
    } catch (error) {
      if (!/duplicate|exist|E11000|ya/i.test(error.message)) {
        console.log('Categoria no creada:', category.name, '-', error.message);
      }
    }
  }

  const categories = await request('/categories', {}, null);
  const map = new Map(categories.map((category) => [category.name, category._id || category.id]));

  const missing = seed.categories.filter((category) => !map.has(category.name));
  if (missing.length) {
    fail('No se encontraron estas categorias tras crearlas: ' + missing.map((category) => category.name).join(', '));
  }

  return map;
}

async function createProducts(token, categoryMap) {
  let created = 0;
  let skipped = 0;

  for (const product of seed.products) {
    const { categoryName, ...payload } = product;
    payload.category = categoryMap.get(categoryName);
    payload.shortDescription = payload.description.slice(0, 140);

    try {
      await request('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      created += 1;
      console.log('Producto creado:', payload.sku, '-', payload.name);
    } catch (error) {
      skipped += 1;
      console.log('Producto omitido:', payload.sku, '-', error.message);
    }
  }

  console.log('\nResultado:', created, 'creados,', skipped, 'omitidos.');
}

const token = await getToken();
const categoryMap = await ensureCategories(token);
await createProducts(token, categoryMap);
