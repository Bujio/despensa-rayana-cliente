const legalPages = {
  'aviso-legal': {
    title: 'Aviso legal',
    intro: 'Información identificativa y condiciones de uso de La Despensa Rayana.',
    sections: [
      ['Titularidad', 'Esta página debe completarse con la razón social, NIF/CIF, domicilio, email de contacto y datos registrales del titular de la tienda.'],
      ['Uso del sitio', 'El usuario se compromete a utilizar la web de forma lícita y respetuosa con la actividad comercial de la plataforma.'],
      ['Propiedad intelectual', 'La marca, diseño, textos e imágenes deben usarse solo con autorización del titular o de sus proveedores legítimos.'],
    ],
  },
  privacidad: {
    title: 'Política de privacidad',
    intro: 'Tratamiento de datos personales de clientes, proveedores y usuarios registrados.',
    sections: [
      ['Responsable', 'Debe indicarse el responsable del tratamiento y sus datos de contacto.'],
      ['Finalidades', 'Gestión de cuentas, pedidos, atención al cliente, proveedores, mensajes, valoraciones y comunicaciones necesarias del servicio.'],
      ['Derechos', 'Los usuarios deben poder ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad cuando aplique.'],
    ],
  },
  cookies: {
    title: 'Política de cookies',
    intro: 'Uso de cookies técnicas y, cuando se configuren, analíticas o publicitarias.',
    sections: [
      ['Cookies técnicas', 'Son necesarias para recordar sesión, cesta o preferencias esenciales de funcionamiento.'],
      ['Cookies no técnicas', 'No deben cargarse cookies analíticas o de marketing antes de recibir consentimiento válido.'],
      ['Retirada del consentimiento', 'El usuario debe poder cambiar o retirar su consentimiento desde esta página o desde el banner de cookies.'],
    ],
  },
  condiciones: {
    title: 'Condiciones de contratación',
    intro: 'Condiciones generales aplicables al proceso de compra.',
    sections: [
      ['Proceso de compra', 'El cliente debe revisar productos, dirección, método de pago y resumen antes de confirmar el pedido.'],
      ['Precios e impuestos', 'Debe indicarse si los precios incluyen IVA y cualquier gasto adicional antes de confirmar la compra.'],
      ['Confirmación', 'Tras el pedido, el cliente debe recibir confirmación con número de pedido y resumen de la operación.'],
    ],
  },
  'devoluciones-envios': {
    title: 'Envíos y devoluciones',
    intro: 'Información sobre entrega, incidencias y derecho de desistimiento cuando aplique.',
    sections: [
      ['Envíos', 'Debe indicarse plazo estimado, ámbito geográfico, coste, transportista y gestión de incidencias.'],
      ['Devoluciones', 'Debe definirse el procedimiento de devolución y excepciones para productos perecederos o personalizados.'],
      ['Abonos', 'Los abonos deben quedar trazados y vinculados al pedido correspondiente.'],
    ],
  },
};

export function LegalView({ page = 'aviso-legal' }) {
  const content = legalPages[page] || legalPages['aviso-legal'];
  const resetCookieConsent = () => {
    localStorage.removeItem('despensa-cookie-consent');
    window.location.reload();
  };

  return (
    <section className="legal-page wide-panel single">
      <div className="section-heading compact">
        <div>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </div>
      <div className="legal-notice">
        Estos textos son una base técnica y funcional para completar la tienda. Deben ser revisados y adaptados por un profesional legal antes de vender.
      </div>
      <div className="legal-sections">
        {content.sections.map(([title, body]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      {page === 'cookies' && (
        <button className="secondary" type="button" onClick={resetCookieConsent}>
          Cambiar consentimiento de cookies
        </button>
      )}
    </section>
  );
}
