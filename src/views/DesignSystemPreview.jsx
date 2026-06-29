import { ProductCard } from './ProductCard.jsx';

const previewProduct = {
  id: 'placeholder-1',
  name: 'Producto local',
  sku: 'LOCAL-001',
  price: 0,
  description: 'Producto de origen rayano pendiente de cargar.',
  stock: 0,
  offer: { active: false, type: 'none' },
  category: null,
  supplier: { name: 'La Despensa Rayana' },
  image: null,
};

export function DesignSystemPreview() {
  return (
    <section className="design-system-preview" aria-label="Referencia visual interna">
      <div className="token-row">
        {['forest', 'olive', 'cream', 'sand', 'clay', 'paprika'].map((token) => (
          <span className={'swatch ' + token} key={token}>{token}</span>
        ))}
      </div>
      <div className="control-row">
        <button className="primary" type="button">Botón principal</button>
        <button className="secondary" type="button">Botón secundario</button>
        <span className="offer-banner">Oferta</span>
        <span className="status">Normal</span>
      </div>
      <ProductCard product={previewProduct} busy={false} onAdd={() => {}} onOpen={() => {}} />
    </section>
  );
}
