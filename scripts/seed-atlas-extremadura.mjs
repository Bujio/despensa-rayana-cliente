const backendRoot = 'file:///home/rizzo/dev/backend/despensaRayana';

await import(`${backendRoot}/node_modules/dotenv/config.js`);

const mongoose = (await import(`${backendRoot}/node_modules/mongoose/index.js`)).default;
const { Category } = await import(`${backendRoot}/src/db/models/category.model.js`);
const { Product } = await import(`${backendRoot}/src/db/models/product.model.js`);

const atlasUri = process.env.MONGODB_URI;

if (!atlasUri || !atlasUri.includes('mongodb+srv')) {
  throw new Error('MONGODB_URI must point to Atlas for this seed');
}

const categoryData = [
  ['Aceites', 'Aceites de oliva virgen extra extremeños.'],
  ['Conservas vegetales', 'Conservas de huerta, tomate, pimientos y verduras.'],
  ['Ibéricos', 'Embutidos, patateras y productos ibéricos extremeños.'],
  ['Legumbres y cereales', 'Legumbres, arroz y granos de la despensa local.'],
  ['Mieles y dulces', 'Mieles, mermeladas y dulces tradicionales.'],
  ['Pimentón y condimentos', 'Pimentón de la Vera, especias y aliños.'],
  ['Quesos', 'Quesos de cabra, oveja y tortas extremeñas.'],
  ['Vinos y bebidas', 'Vinos, licores y bebidas de la tierra.'],
  ['Artesanía', 'Piezas artesanas y objetos de despensa tradicional.'],
  ['Packs regalo', 'Selecciones preparadas para regalar.'],
];

const imageByCategory = {
  Aceites: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
  'Conservas vegetales': 'https://images.unsplash.com/photo-1584949602334-4e99f98286a9?auto=format&fit=crop&w=900&q=80',
  Ibéricos: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=80',
  'Legumbres y cereales': 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=80',
  'Mieles y dulces': 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=900&q=80',
  'Pimentón y condimentos': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80',
  Quesos: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=900&q=80',
  'Vinos y bebidas': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80',
  Artesanía: 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&w=900&q=80',
  'Packs regalo': 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80',
};

const imageBySku = {
  'EXT-ACE-GATA-500': 'https://live.staticflickr.com/7052/6970874754_968f8745a0_b.jpg',
  'EXT-ACE-MORISCA-500': 'https://live.staticflickr.com/2548/3887516356_22576341c7_b.jpg',
  'EXT-CON-TOMATE-720': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Norman_Tomato_Sauce_%286817350674%29.jpg',
  'EXT-CON-PIMIENTO-350': 'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?auto=format&fit=crop&w=900&q=80',
  'EXT-IBE-PATATERA-DULCE': 'https://live.staticflickr.com/5250/5293174723_3fc3e70a09_b.jpg',
  'EXT-IBE-CHORIZO-350': 'https://live.staticflickr.com/3173/3079269863_c72174720d_b.jpg',
  'EXT-LEG-ARROZ-1000': 'https://live.staticflickr.com/4562/24971315878_b50ef5b255_b.jpg',
  'EXT-LEG-GARBANZO-1000': 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=80',
  'EXT-MIE-RAYA-500': 'https://live.staticflickr.com/130/411317929_1a62e5343d_b.jpg',
  'EXT-DUL-HIGO-250': 'https://live.staticflickr.com/6124/5944785597_90164ce339_b.jpg',
  'EXT-PIM-VERA-DULCE': 'https://live.staticflickr.com/3102/3227608051_f14d865075_b.jpg',
  'EXT-CON-SALVINO-120': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=900&q=80',
  'EXT-QUE-CABRA-CURADO': 'https://live.staticflickr.com/3378/4638873250_67bd1dc3de.jpg',
  'EXT-QUE-TORTA-OV': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Torta_del_Casar_DOP.jpg',
  'EXT-VIN-RIBERA-CR': 'https://live.staticflickr.com/3510/3212368391_8df6862648_b.jpg',
  'EXT-LIC-CEREZA-500': 'https://live.staticflickr.com/8735/28962963395_bfc65f933b_b.jpg',
  'EXT-ART-CESTA-ESP': 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
  'EXT-ART-CUENCO-CER': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Cork_coaster.jpg',
  'EXT-PACK-DESAYUNO': 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80',
  'EXT-PACK-APERITIVO': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
};

const products = [
  ['Aceites', 'Aceite de oliva virgen extra Gata-Hurdes', 'EXT-ACE-GATA-500', 14.9, 64, 'Aceite de oliva virgen extra de aceituna manzanilla cacereña, equilibrado y frutado.'],
  ['Aceites', 'AOVE monovarietal Morisca', 'EXT-ACE-MORISCA-500', 12.8, 48, 'Aceite suave de variedad morisca, ideal para desayunos, ensaladas y cocina diaria.'],
  ['Conservas vegetales', 'Tomate triturado de las Vegas del Guadiana', 'EXT-CON-TOMATE-720', 3.95, 85, 'Tomate de huerta extremeña triturado y embotado para sofritos, gazpachos y guisos.'],
  ['Conservas vegetales', 'Pimientos asados de la Vera', 'EXT-CON-PIMIENTO-350', 5.7, 42, 'Pimientos asados lentamente y conservados en su jugo, con sabor dulce y ahumado.'],
  ['Ibéricos', 'Patatera extremeña dulce', 'EXT-IBE-PATATERA-DULCE', 5.5, 39, 'Patatera tradicional extremeña elaborada con patata, pimentón y grasa ibérica.'],
  ['Ibéricos', 'Jamón ibérico de bellota loncheado', 'EXT-IBE-CHORIZO-350', 16.8, 33, 'Jamón ibérico de bellota en lonchas finas, curado lentamente en secadero natural de dehesa.'],
  ['Legumbres y cereales', 'Arroz de las Vegas del Guadiana', 'EXT-LEG-ARROZ-1000', 3.4, 75, 'Arroz cultivado en las Vegas del Guadiana, de grano versátil para recetas de cuchara.'],
  ['Legumbres y cereales', 'Garbanzo pedrosillano de Tierra de Barros', 'EXT-LEG-GARBANZO-1000', 4.8, 57, 'Garbanzo pequeño, mantecoso y perfecto para cocidos y guisos tradicionales.'],
  ['Mieles y dulces', 'Miel de la Raya de flores silvestres', 'EXT-MIE-RAYA-500', 8.9, 68, 'Miel multifloral de monte y dehesa, aromática y de cristalización natural.'],
  ['Mieles y dulces', 'Mermelada de higo extremeño', 'EXT-DUL-HIGO-250', 4.8, 44, 'Mermelada artesanal de higos maduros, cocida a fuego lento.'],
  ['Pimentón y condimentos', 'Pimentón de la Vera dulce', 'EXT-PIM-VERA-DULCE', 4.2, 92, 'Pimentón ahumado de la Vera con molienda fina y color intenso.'],
  ['Pimentón y condimentos', 'Sal de vino tinto extremeño', 'EXT-CON-SALVINO-120', 3.6, 51, 'Sal marina aromatizada con vino tinto, pensada para carnes, quesos y verduras.'],
  ['Quesos', 'Queso curado de cabra artesano', 'EXT-QUE-CABRA-CURADO', 24.5, 22, 'Queso curado de cabra con corteza natural y sabor persistente.'],
  ['Quesos', 'Torta cremosa de oveja', 'EXT-QUE-TORTA-OV', 18.75, 18, 'Torta de oveja de textura cremosa, elaborada con leche de proximidad.'],
  ['Vinos y bebidas', 'Vino tinto Ribera del Guadiana crianza', 'EXT-VIN-RIBERA-CR', 9.8, 60, 'Vino tinto crianza con carácter mediterráneo y notas de fruta madura.'],
  ['Vinos y bebidas', 'Licor de cereza del Jerte', 'EXT-LIC-CEREZA-500', 11.5, 34, 'Licor dulce de cereza del Jerte, suave y aromático.'],
  ['Artesanía', 'Cesta artesana de esparto para despensa', 'EXT-ART-CESTA-ESP', 19.9, 16, 'Cesta trenzada de inspiración tradicional para presentar o conservar productos.'],
  ['Artesanía', 'Posavasos de corcho de San Vicente de Alcántara', 'EXT-ART-CUENCO-CER', 16.4, 20, 'Set de posavasos de corcho natural, inspirado en la artesanía corchera de la Raya extremeña.'],
  ['Packs regalo', 'Pack desayuno rayano', 'EXT-PACK-DESAYUNO', 29.9, 24, 'Selección de aceite, miel y dulce tradicional para desayuno de origen extremeño.'],
  ['Packs regalo', 'Pack aperitivo de La Raya', 'EXT-PACK-APERITIVO', 34.5, 21, 'Caja con ibéricos, pimentón, conserva vegetal y vino de la tierra.'],
];

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

await mongoose.connect(atlasUri);

const categoryByName = new Map();
for (const [name, description] of categoryData) {
  let category = await Category.findOne({ name });
  if (!category) {
    category = new Category({ name });
  }
  category.description = description;
  category.slug = category.slug || slugify(name);
  await category.save();
  categoryByName.set(name, category);
}

let upserted = 0;
for (const [categoryName, name, sku, price, stock, description] of products) {
  const category = categoryByName.get(categoryName);
  await Product.findOneAndUpdate(
    { sku },
    {
      name,
      sku,
      price,
      description,
      stock,
      category: category?._id,
      offer: sku.includes('PACK') || sku.includes('PATATERA')
        ? { type: 'percent', value: 8, label: 'Oferta rayana', active: true }
        : { type: 'none', value: 0, active: false },
      supplier: {
        id: 1000 + upserted,
        name: categoryName === 'Artesanía' ? 'Talleres de La Raya' : 'Productores de La Raya',
        images: [{ url: imageBySku[sku] || imageByCategory[categoryName], name }],
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true },
  );
  upserted += 1;
}

const counts = {
  categories: await Category.countDocuments(),
  products: await Product.countDocuments(),
  upserted,
};

await mongoose.disconnect();

console.log(JSON.stringify(counts));
