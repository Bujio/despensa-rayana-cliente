import { ArrowRight, HandHeart, Leaf, MapPinned, ShieldCheck, Sprout, Store, Truck } from 'lucide-react';

export function StoryView({ actions }) {
  return (
    <section className="story-view">
      <div className="story-hero">
        <span className="eyebrow">La Rayana</span>
        <h1>Una despensa nacida entre Extremadura y Portugal.</h1>
        <p>
          La Despensa Rayana reúne productos con origen, productores cercanos y sabores que hablan de frontera,
          dehesa, olivar, sierra y cocina compartida.
        </p>
        <button className="primary" type="button" onClick={() => actions.setView('catalog')}>
          Explorar productos <ArrowRight size={18} />
        </button>
      </div>

      <div className="story-grid">
        <article>
          <MapPinned size={24} />
          <h2>Territorio</h2>
          <p>La Raya no es solo una línea en el mapa: es una forma de comprar, cocinar y compartir producto local.</p>
        </article>
        <article>
          <Leaf size={24} />
          <h2>Origen</h2>
          <p>Priorizamos alimentos y elaboraciones conectadas con Extremadura, sus comarcas y su cultura de despensa.</p>
        </article>
        <article>
          <HandHeart size={24} />
          <h2>Cercanía</h2>
          <p>Una selección cuidada para que el catálogo tenga identidad, claridad y confianza.</p>
        </article>
        <article>
          <ShieldCheck size={24} />
          <h2>Calidad</h2>
          <p>El objetivo es vender menos ruido y más producto: fichas claras, stock visible y compra sencilla.</p>
        </article>
      </div>

      <section className="story-identity-section">
        <div className="section-heading compact">
          <div>
            <h1>Identidad del proyecto</h1>
            <p>Una tienda pensada para acercar la despensa extremeña a quien busca producto honesto, trazable y con carácter local.</p>
          </div>
        </div>

        <div className="identity-panel">
          <div>
            <span className="eyebrow">Nuestra forma de elegir</span>
            <h2>Producto local, mirada rayana y compra sencilla.</h2>
            <p>
              La Despensa Rayana nace para ordenar y poner en valor productos de Extremadura y de su frontera cultural
              con Portugal: ibéricos, quesos, aceites, mieles, dulces, conservas, bebidas y piezas artesanas.
            </p>
          </div>
          <div className="identity-list">
            <article><Sprout size={20} /><strong>Origen reconocible</strong><span>Cada producto debe contar de dónde viene y por qué pertenece a esta despensa.</span></article>
            <article><Store size={20} /><strong>Productores cercanos</strong><span>El catálogo prioriza obradores, talleres y proveedores vinculados al territorio.</span></article>
            <article><Truck size={20} /><strong>Venta clara</strong><span>Precio, stock, ofertas, envío y pedidos deben entenderse sin esfuerzo.</span></article>
          </div>
        </div>
      </section>
    </section>
  );
}
