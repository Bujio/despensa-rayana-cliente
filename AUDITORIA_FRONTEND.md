# Auditoría técnica completa del frontend

**Proyecto:** La Despensa Rayana Client  
**Fecha de auditoría:** 13 de julio de 2026  
**Commit auditado:** `e623d5a` (`main`)  
**Alcance:** todo el repositorio frontend versionado, sus assets, scripts y el contrato HTTP visible contra el backend local.  
**Tipo de revisión:** estática, de arquitectura, código, configuración, UI/UX, accesibilidad, rendimiento, seguridad y preparación para producción. No se ha modificado código de aplicación.

## Resumen ejecutivo

El frontend **compila**, tiene una identidad visual reconocible, usa React moderno, sanitiza el único HTML enriquecido y no presenta vulnerabilidades conocidas en `npm audit`. Sin embargo, **no debe aprobarse para producción en su estado actual**.

El principal bloqueo es funcional: el checkout muestra un flujo de pago externo con `method` y `accepted`, pero el controlador valida campos invisibles de tarjeta (`holder`, `cardNumber`, `expiry`, `cvc`). El usuario no puede completar el pedido desde la interfaz. Además, el botón para anular pedidos llama a una acción inexistente y la supuesta actualización de una reseña vuelve a ejecutar una creación.

La rama contiene dos implementaciones arquitectónicas superpuestas. La aplicación activa conserva un controlador monolítico de 1.569 líneas y 41 estados, mientras que 3.895 líneas de una refactorización por acciones, proveedor, SEO, cookies, legales y analytics están desconectadas del grafo de entrada. En total hay **22 módulos no alcanzables desde `src/main.jsx`**. Esto explica la divergencia entre el README y el producto que realmente se ejecuta.

La calidad automatizada tampoco cumple un gate profesional: `npm run lint` falla con 5 errores y 19 advertencias, no existe ninguna prueba, no hay CI versionada, no hay TypeScript ni contratos runtime de las respuestas HTTP. El bundle principal es razonable para una primera versión (119 KB gzip), pero se entrega como un único chunk y las dos imágenes hero locales pesan casi 5 MB.

**Veredicto:** preparación para producción **2/10**. Recomendación: congelar funcionalidades nuevas, estabilizar el flujo de compra y reconciliar la arquitectura antes de continuar.

## Metodología y evidencia

Se revisaron los 74 archivos versionados: configuración, entrada, 11 archivos de controladores, 15 modelos, 19 vistas JSX, 1 componente CMS, utilidades, CSS, 10 assets públicos, 4 scripts/datasets y lockfile. También se compararon los endpoints consumidos con las rutas del backend local para evitar inferir contratos.

Validaciones ejecutadas:

| Validación | Resultado |
| --- | --- |
| `npm run build` | Correcto; Vite transforma 1.741 módulos |
| `npm run lint` | Fallido: 5 errores, 19 advertencias |
| `npm audit --json` | 0 vulnerabilidades conocidas (0 low/moderate/high/critical) |
| Grafo estático de imports | 0 ciclos; 22 módulos no alcanzables |
| Tests localizados | 0 archivos de test/spec |
| Bundle | JS 391,29 KB / 119,35 KB gzip; CSS 44,22 KB / 9,04 KB gzip |
| Assets hero locales | 2,85 MB + 2,11 MB |
| Métrica adicional ESLint | `AdminView` complejidad 93; `ProductView` 42; `useShopController` 1.238 líneas efectivas |

Limitaciones explícitas: no existe suite E2E, configuración de despliegue ni entorno de staging en el repositorio. Por ello no se afirman tiempos reales de red, compatibilidad de navegador, Core Web Vitals ni cabeceras del proveedor de hosting. Los hallazgos funcionales críticos sí son demostrables por flujo de código.

## Fortalezas

- El build de producción es reproducible mediante `package-lock.json` y termina correctamente.
- `npm audit` no detecta vulnerabilidades conocidas en la instantánea analizada.
- No se detectaron dependencias circulares entre módulos.
- Los modelos separan parte del acceso HTTP de la presentación (`src/models/*`).
- El backend recalcula precios y totales; el frontend solo envía SKU y cantidad (`src/models/orderModel.js:22-31`), una buena frontera de confianza.
- El contenido enriquecido de producto se procesa con DOMPurify y una allowlist estricta (`src/views/ProductView.jsx:8-21`).
- React escapa por defecto el resto del contenido de API/CMS mostrado como texto.
- Existen estados vacíos y mensajes de carga en catálogo, carrito, reseñas, pedidos y administración.
- La mayoría de formularios asocian el texto de etiqueta envolviendo el control.
- Hay estilos globales de foco visible (`src/styles.css:1540-1547`) y varias acciones iconográficas tienen nombre accesible.
- `ProductCard` usa carga diferida para la imagen (`src/views/ProductCard.jsx:34`).
- La interfaz tiene una dirección visual propia: paleta rural, tipografía editorial, jerarquía de producto y dos breakpoints responsive.
- Las rutas principales tienen URLs semánticas para catálogo, producto, cesta, cuenta y pedidos.
- Las operaciones administrativas críticas están protegidas en el backend; `AdminView` también comprueba el rol antes de renderizar (`src/views/AdminView.jsx:196-202`).
- No se encontraron `TODO`, `FIXME`, secretos hardcodeados ni `eval`/`new Function` en el frontend.

## Debilidades y riesgos principales

1. El camino principal de negocio —crear un pedido— está bloqueado.
2. El repositorio mezcla una implementación antigua activa y una refactorización nueva inactiva.
3. README, sitemap y archivos de UI anuncian capacidades que no existen en el grafo ejecutable.
4. No hay red de seguridad automatizada para detectar regresiones de compra, sesión, routing o permisos.
5. La arquitectura central concentra demasiadas responsabilidades y produce acoplamiento global.
6. Accesibilidad, legales, consentimiento y pagos no alcanzan un estándar de ecommerce en producción.
7. La estrategia de datos genera peticiones redundantes, carreras y límites artificiales de 100 registros.
8. La sesión almacena access y refresh token en `localStorage`, ampliando el impacto de cualquier XSS futuro.

## Puntuación profesional

| Área | Nota | Justificación resumida |
| --- | ---: | --- |
| Arquitectura | 3/10 | God hook, dos arquitecturas superpuestas y 3.895 LOC desconectadas |
| React | 4/10 | Componentes funcionales, pero 41 estados, efectos frágiles, sin lazy/error boundaries/memo |
| JavaScript | 4/10 | Código legible por zonas; complejidad alta, duplicación, lint fallido y contratos débiles |
| Organización | 4/10 | Capas nominales útiles, pero `views` mezcla páginas/componentes y la refactorización no está conectada |
| Escalabilidad | 3/10 | Filtros locales limitados a 100, estado global monolítico y listados administrativos completos |
| UX | 4/10 | Buenos vacíos y jerarquía ecommerce; checkout roto, errores genéricos y acciones destructivas inmediatas |
| UI | 6/10 | Identidad y responsive razonables; CSS acumulativo, contraste irregular y patrones inconsistentes |
| Accesibilidad | 4/10 | Labels y foco base presentes; lint a11y falla, menús/drawer sin gestión de foco ni semántica completa |
| Rendimiento | 5/10 | Bundle gzip contenido; sin splitting, imágenes pesadas, canvas continuo y peticiones duplicadas |
| Seguridad | 5/10 | DOMPurify y backend autoritativo; tokens persistentes, URLs arbitrarias y sin política CSP en repo |
| Mantenibilidad | 3/10 | Archivos gigantes, 22 módulos muertos, cero tests, sin tipos ni formatter |
| Calidad profesional | 3/10 | Compila, pero no supera lint ni refleja de forma fiable sus capacidades documentadas |
| Preparación para producción | 2/10 | Checkout/pago/legal/consentimiento y cobertura de pruebas bloqueantes |

## Arquitectura actual

Flujo ejecutable real:

```text
main.jsx
  -> BrowserRouter
  -> App.jsx (interpreta manualmente la URL)
  -> useShopController.js (estado, efectos, negocio, navegación, API)
  -> AppView.jsx (Routes)
  -> vistas activas
  -> models/* -> apiClient.js -> REST API
```

El patrón tiene una separación superficial MVC, pero `useShopController` reúne sesión, catálogo, detalle, favoritos, carrito, checkout, pedidos, reseñas, administración, media y CMS. Devuelve dos objetos gigantes (`state` y `actions`) que actúan como service locator. Cualquier actualización reconstruye ambos objetos y vuelve a renderizar el árbol activo.

Existe paralelamente una arquitectura por fábricas de acciones (`adminControllerActions`, `cartCheckoutControllerActions`, etc.), helpers, estado inicial, rutas y vistas nuevas. Ninguna está importada por el entrypoint actual. No es una arquitectura alternativa funcional: por ejemplo, `authAccountControllerActions` llama a `authModel.registerSupplier`, método que no existe (`src/controllers/authAccountControllerActions.js:114-119`; `src/models/authModel.js:3-35`).

### Arquitectura recomendada

```text
src/
  app/
    router/              rutas, guards, 404, lazy boundaries
    providers/           sesión y dependencias transversales mínimas
    layout/              AppShell, Header, Footer, ErrorBoundary
  features/
    auth/
    catalog/
    product/
    cart/
    checkout/
    account/
    reviews/
    home-cms/
    admin/
    supplier/
  entities/
    product/ order/ user/ supplier/
  shared/
    api/                 cliente HTTP, auth refresh, errores, schemas
    ui/                  Button, Field, Dialog, Notice, Skeleton, EmptyState
    lib/                 formatters, analytics, storage
    styles/              tokens, reset, primitives
```

Principios de migración:

- Un único router declarativo como fuente de verdad; eliminar `readRoute`, `routeByView` duplicado y navegación mediante strings de vista.
- Estado de servidor con una capa de caché/query y claves por recurso; estado de UI local junto a cada feature.
- Sesión en un provider pequeño; no introducir Context para todo el catálogo.
- Contratos API tipados y validados en el borde. TypeScript más schemas runtime para datos externos.
- Rutas lazy por dominio: tienda pública, checkout/cuenta, admin y proveedor.
- Componentes de UI accesibles reutilizables; no compartir objetos `state/actions` completos.

**Coste orientativo:** 6-9 semanas de ingeniería para una persona senior, más QA, revisión legal y trabajo de integración del proveedor de pagos. Desglose: estabilización 2-4 días; tests de caracterización 3-5; extracción por features 8-12; contratos/TypeScript 8-15; accesibilidad/CSS/rendimiento 5-8; pago/legal/consentimiento 5-10 o más según terceros.  
**Beneficio:** reduce regresiones, permite despliegues parciales, aísla permisos y datos, habilita pruebas por dominio, reduce renders/peticiones y hace viable que un nuevo desarrollador trabaje sin entender 1.500 líneas de controlador.

## Auditoría React

### Hooks y estado

- `useShopController` declara 41 `useState` (`src/controllers/useShopController.js:218-258`) y mezcla datos remotos, formularios, UI, routing y permisos.
- Seis `useEffect` controlan carga global, catálogo, detalle, sesión y categorías. ESLint marca dependencias incompletas (`src/controllers/useShopController.js:321-385`, `863-884`).
- `cartItems = cart?.items || []` crea un array nuevo cuando no hay carrito; invalida tres `useMemo` en cada render (`src/controllers/useShopController.js:260-274`).
- No existe ningún `useCallback` ni `React.memo`. Las 68 acciones activas se recrean en cada render.
- `ProductView` no reinicia cantidad ni pestaña al cambiar de producto; solo reinicia imagen (`src/views/ProductView.jsx:26-38`).
- Los filtros disparan un efecto por cada tecla sin debounce ni cancelación (`CatalogView.jsx:31-37`; `useShopController.js:342-344`). Una respuesta antigua puede sobrescribir una búsqueda nueva.
- `openProduct` pide reseñas antes y después de cargar el detalle, y el cambio de ruta puede activar otra carga (`useShopController.js:435-470`).

### Composición y responsabilidades

- `AdminView` tiene 961 líneas y complejidad estática 93; `SupplierView`, aunque inactivo, 1.083 líneas; `HomeView` 390; `ProductView` 233.
- `AppView` pasa `state/actions` completos a todas las páginas, ocultando dependencias y dificultando pruebas aisladas.
- No hay Context API. Esto evita contextos globales arbitrarios, pero la alternativa actual es un contenedor global aún más acoplado.
- No hay Error Boundary. Un error como `actions.cancelOrder is not a function` desmontará el árbol React.
- No hay `lazy`, `Suspense` ni splitting por ruta; admin y DOMPurify forman parte del chunk inicial.
- Las keys de entidades suelen ser estables. En editores de imágenes/banners se combina URL/título con índice (`AdminView.jsx:716-717`; `HomeView.jsx:348-350`), frágil al reordenar o duplicar entradas.

## JavaScript, legibilidad y Clean Code

- `useShopController` tiene 1.238 líneas efectivas dentro de una función; viola responsabilidad única, dificulta test y aumenta closures obsoletos.
- `AdminView` y `ProductView` exceden ampliamente una complejidad 15 (93 y 42 en la medición auxiliar).
- `homeContentModel.normalizeSection` define `items` y `productIds` dos veces en el mismo objeto; ESLint lo bloquea (`src/models/homeContentModel.js:76-88`).
- Las estructuras iniciales y helpers están duplicados entre `useShopController.js:15-215` y `controllerInitialState.js`/`controllerHelpers.js`.
- La lógica de categorías y sus URLs está duplicada en `categoryVisualModel.js` y `homeContentModel.js`.
- Hay 3.895 LOC no alcanzables; es código muerto o una migración incompleta, no reutilización.
- La nomenclatura mezcla inglés y español (`supplier`, `cart`, `gestion`, `cuenta`) y dos esquemas de ruta admin (`/gestion` activo frente a `/admin/*` inactivo).
- Se muestran textos sin tildes (`extremeno`, `tradicion`, `anadida`) desde defaults y notificaciones.
- No hay TypeScript, PropTypes ni schemas runtime de respuesta. `react/prop-types` está desactivado (`eslint.config.js:58`).
- No hay Prettier ni `.editorconfig`; el formato depende del autor.
- No se detectaron dependencias circulares, comentarios obsoletos masivos ni logs de depuración en `src`.

## Routing y navegación

- `App.jsx` interpreta la URL y `AppView.jsx` vuelve a declarar las rutas: dos fuentes de verdad (`src/App.jsx:5-38`; `src/views/AppView.jsx:38-49`).
- `controllerRoutes.js` declara rutas de proveedor, registro y `/admin/*`, pero no es alcanzable.
- Las rutas de supplier, legales, privacidad, cookies y condiciones no existen en `AppView`, pese a existir vistas y sitemap.
- El wildcard redirige silenciosamente a home; no existe página 404 ni preservación del destino (`AppView.jsx:48`).
- Navegar se implementa mayoritariamente con botones y strings de vista, no con links. Se pierde abrir en nueva pestaña, copiar destino y semántica de enlace.
- Filtros, orden, búsqueda y página no se serializan en la URL. Back/forward y compartir resultados no funcionan de forma fiable.
- El Header recibe `view` pero no lo usa (`Header.jsx:16`); no hay estado activo de navegación.
- `/pedidos` no usa el `RequireUserAuth` existente; muestra un vacío a visitantes. `/gestion` se protege dentro de la vista, no a nivel de ruta.
- No hay restauración de scroll ni gestión de foco después de navegar.

## Servicios, HTTP y gestión de datos

### Aspectos correctos

- El cliente centraliza JSON, Authorization y refresh (`src/models/apiClient.js`).
- `FormData` evita forzar `Content-Type`, permitiendo que el navegador añada boundary.
- Los endpoints activos principales existen en el backend local.
- Precios, stock y total del pedido se resuelven en backend; el frontend no debe ser autoridad.

### Problemas confirmados

- El checkout activo valida el esquema antiguo de tarjeta (`useShopController.js:128-138`, `776-792`), mientras la vista solo ofrece `method` y `accepted` (`CartView.jsx:135-160`). Los errores quedan asociados a campos que no existen y el pedido nunca se envía.
- `OrdersView` invoca `actions.cancelOrder`, pero el controlador no la devuelve. `orderModel.cancel` y el endpoint backend sí existen (`OrdersView.jsx:47-50`; `orderModel.js:36-40`).
- Si existe una reseña propia, la UI promete “Actualiza tu opinión”, pero submit siempre llama a `reviewModel.create` (`ProductView.jsx:62,198-213`; `useShopController.js:662-685`).
- Admin carga `/products?limit=100`, no `/products/admin/all`; el backend filtra la ruta pública a publicados. Borradores y pendientes pueden quedar invisibles (`useShopController.js:499-506`; backend `products.routes.js:94-109`).
- Los filtros client-side fuerzan `limit: 100`; con más de 100 productos producen resultados incompletos (`useShopController.js:395-414`).
- En el arranque se solicitan por separado 9 productos de catálogo y 100 destacados; no hay caché ni deduplicación.
- No hay `AbortController`, timeout, retry controlado, debounce, cache, revalidación ni política de errores por código.
- Varias cargas capturan errores y sustituyen silenciosamente por `[]`, confundiendo “sin datos” con “fallo de red” (`useShopController.js:481-497`, `528-537`).
- El refresh no usa single-flight. Varias respuestas 401 simultáneas pueden rotar el mismo refresh token en paralelo (`apiClient.js:22-38`, `58-63`).
- `VITE_API_URL` cae a `http://localhost:3000/api` si falta en build; un despliegue mal configurado compilará y fallará en producción (`apiClient.js:3`).
- `supplierModel.register` implementa una segunda estrategia HTTP distinta al cliente común (`supplierModel.js:51-61`).
- El script `seed-atlas-extremadura.mjs` depende de una ruta absoluta local y accede directamente a modelos y credenciales del backend (`scripts/seed-atlas-extremadura.mjs:1-12`). No es portable ni pertenece a la frontera del frontend.

## CSS y sistema visual

- `styles.css` tiene 2.985 líneas, 459 reglas y 395 selectores únicos.
- Hay dos capas completas concatenadas: estilos base, “Modern visual layer” (`styles.css:1183`) y otro “visual refresh” con un segundo `:root` (`styles.css:1513-1531`).
- Se detectaron 46 bloques de selector duplicados. El orden de aparición, no una intención explícita, decide el resultado.
- Hay 130 valores de color literales y 94 valores `px` distintos. Los tokens existen solo en la última mitad y no gobiernan el sistema entero.
- No hay `prefers-reduced-motion`, pese al scroll suave, transiciones y canvas animado.
- Los breakpoints 1.060 y 680 px cubren desktop/tablet/móvil y reorganizan grids; es una base responsive útil.
- En móvil los filtros se muestran completos antes de productos, sin drawer/accordion. En catálogos grandes aumenta mucho el desplazamiento antes del resultado.
- El CSS global incluye estilos de proveedor, legales, consentimiento y preview aunque esas vistas no se importan. Al ser global, ese código sí se entrega aunque el JSX esté muerto.
- La tipografía declara Inter y Playfair Display sin cargar fuentes; el resultado depende del fallback local (`styles.css:3`, `2674`).
- Hay contraste insuficiente en combinaciones reales de tokens: `--color-muted` sobre cream da 4,27:1 y el contador clay/white da 4,05:1, por debajo de 4,5:1 para texto normal (`styles.css:1518-1523`, `1696-1705`). `#9a958b` sobre blanco da 2,98:1 (`styles.css:2239-2241`).

## UX/UI

### Lo que funciona

- La jerarquía de producto prioriza imagen, nombre, proveedor, precio, stock y CTA.
- Hay feedback global, loaders textuales, estados vacíos y disabled en operaciones.
- El catálogo tiene búsqueda, categoría, rango de precio, orden, origen, stock, ofertas y favoritos.
- Producto incluye galería, cantidad, stock, oferta, tabs y reseñas.
- El backoffice ofrece formularios y estados vacíos razonablemente organizados.

### Fricciones y fallos

- Checkout imposible y sin pasarela real. El propio texto indica “pendiente de integración” (`CartView.jsx:139-159`).
- No hay confirmación dedicada de pedido; solo aviso global y redirección.
- Las acciones eliminar usuario/producto/categoría/reseña/pedido se ejecutan sin confirmación, undo ni pantalla de impacto.
- Un único `busy` bloquea acciones no relacionadas y no identifica qué operación está en curso.
- `Notice` no distingue éxito/error/advertencia y persiste hasta cierre; los fallos remotos compiten con mensajes positivos.
- No hay skeletons; el cambio de resultados puede saltar visualmente.
- No existe un estado de error persistente con retry. Un fallo suele parecer una lista vacía.
- La búsqueda de catálogo hace una petición por pulsación y carece de botón aplicar/debounce.
- “Relevancia” y “Novedades” comparten exactamente `createdAt:desc` (`CatalogView.jsx:61-65`).
- El menú de cuenta no cierra al clicar fuera ni con Escape y no mueve foco.
- El drawer de cesta no bloquea scroll/foco ni devuelve el foco al disparador.
- No hay footer ni accesos a contacto, legales, privacidad, cookies, condiciones o devoluciones.
- Cuenta autenticada solo muestra reseñas. Gestión de perfil, mensajes y eliminación de cuenta existen únicamente en código desconectado.
- Falta recuperación de contraseña, reenvío de verificación y feedback inline de autenticación, aunque el backend ofrece endpoints.
- Las afirmaciones “Envío 24/48h”, “Pago seguro” y “Calidad garantizada” son texto fijo sin fuente de configuración (`Header.jsx:35-38`; `ProductView.jsx:157-162`). Deben validarse comercialmente antes de producción.

## Accesibilidad

Estado estimado: **no conforme con WCAG 2.2 AA**.

- ESLint bloquea por `tabIndex` en contenedores no interactivos (`HomeView.jsx:70`, `271`) y por convertir un `article` en link mediante role (`ProductCard.jsx:24-30`).
- `ProductCard` contiene botones interactivos dentro de un contenedor que simula enlace. La interacción y el árbol semántico son confusos; debe existir un enlace real para el detalle.
- El backdrop móvil es un `div` con click y sin teclado (`Header.jsx:100`), hallazgo también marcado por lint.
- El menú móvil usa `aria-hidden`, pero sus controles siguen en el DOM y pueden recibir foco cuando está cerrado (`Header.jsx:101-129`). Falta `inert`, desmontaje o gestión de foco.
- Cesta visualmente modal no usa `role="dialog"`, `aria-modal`, focus trap, Escape ni retorno de foco (`CartView.jsx:41-195`).
- Tabs de producto son botones visuales sin `tablist`, `tab`, `tabpanel`, `aria-selected` ni navegación por flechas (`ProductView.jsx:168-229`).
- Carousels reciben `tabIndex=0` sin implementar interacción de teclado; los botones desaparecen en móvil (`HomeView.jsx:66-87`, `267-288`).
- Los errores de checkout no están asociados por `aria-describedby`, y los inputs no exponen `aria-invalid` (`CartView.jsx:93-160`).
- El buscador lateral depende del placeholder como nombre visible (`CatalogView.jsx:31-38`).
- Botones solo icono dependen en varios casos de `title`, menos robusto que `aria-label` visible para tecnología asistiva.
- El banner de cookies inactivo declara `role=dialog`, pero no `aria-modal`, foco inicial ni trap (`CookieConsent.jsx:35-67`).
- Hay múltiples `h1` en la home (hero, categorías, destacados y secciones custom), debilitando la jerarquía documental (`HomeView.jsx:155-177`, `216-263`, `299-309`).
- No se respeta `prefers-reduced-motion`; el canvas corre siempre a `requestAnimationFrame` (`CanvasBackdrop.jsx:21-63`).
- Varias imágenes carecen de dimensiones intrínsecas, lo que puede provocar cambios de layout.
- Puntos positivos: idioma `es`, labels envolventes en la mayoría de campos, `role=status` en Notice, alt de producto y foco visible global.

## Rendimiento

- Todo el código activo sale en un único JS de 391,29 KB (119,35 KB gzip). No hay chunks por ruta.
- `AdminView`, controller completo y librerías de rutas/sanitización se descargan para un visitante anónimo.
- `camino-extremadura.png` pesa 2,85 MB y es hero above-the-fold; `despensa-rayana-hero.png`, 2,11 MB. No hay WebP/AVIF ni variantes responsive.
- Imágenes CMS/categoría son de terceros, sin `srcset`, sizes, ancho/alto ni política homogénea de lazy loading.
- El fondo CSS referencia Unsplash a 1.800 px, aunque luego otra regla de body lo cubre; sigue siendo deuda y puede reaparecer por cascada.
- `CanvasBackdrop` repinta todo el viewport en cada frame y calcula una cuadrícula animada permanentemente. Consume CPU/GPU incluso sin interacción.
- Peticiones duplicadas de catálogo/destacados/reseñas y búsquedas sin debounce empeoran TTI percibido y carga de API.
- Los filtros locales descargan hasta 100 productos para filtrar en el navegador, patrón no escalable.
- No hay presupuestos de bundle, medición Lighthouse, prefetch, service worker ni estrategia de cache explícita.
- La carga lazy de imágenes de cards y el tamaño gzip del JS son puntos positivos.

## Seguridad del frontend

- `sessionModel` persiste access y refresh token completos en `localStorage` (`src/models/sessionModel.js:1-14`). Cualquier XSS futuro podría exfiltrarlos. Preferible refresh token en cookie HttpOnly/Secure/SameSite y access token de vida corta en memoria.
- El formulario de autenticación conserva contraseña en estado después de login/registro; no se limpia (`useShopController.js:540-571`).
- El CMS/admin acepta URLs arbitrarias de imagen y enlaces externos. `window.open` solo comprueba `startsWith('http')`, no usa parser ni allowlist (`HomeView.jsx:312-321`). Esto facilita tracking de terceros, contenido mixto o destinos no aprobados.
- No hay CSP, Permissions-Policy ni configuración de headers en el repositorio. Pueden existir en hosting, pero no son verificables aquí.
- `vite.config.js` expone dev server en `0.0.0.0`; `VITE_ALLOW_EXTERNAL_HOSTS=true` desactiva la allowlist y el proxy usa `secure:false` (`vite.config.js:10-18`). Es riesgo de entorno de desarrollo, no del bundle.
- Las subidas solo declaran `accept=image/*` y un texto “5 MB”; el frontend no valida tamaño/tipo real antes de enviar. La seguridad debe seguir siendo del backend.
- El único `dangerouslySetInnerHTML` está sanitizado con allowlist estricta: fortaleza relevante.
- No hay secretos en variables `VITE_*`; `.env.example` advierte correctamente que son públicas.
- `npm audit` está limpio, pero no hay automatización que lo ejecute en cada cambio.

## Mantenibilidad y escalabilidad

Un desarrollador nuevo podría entender la entrada y las vistas pequeñas, pero necesitaría reconstruir mentalmente dos arquitecturas y 68 acciones para cambiar un flujo transversal. El README no sirve como mapa fiable porque describe SEO, cookies, supplier, analytics, perfil y legales que no se montan.

Datos objetivos:

- 1 controlador activo de 1.569 líneas y 41 estados.
- 2 vistas de 961 y 1.083 líneas.
- 3.895 líneas no alcanzables (aprox. 44 % del código JS/JSX revisado).
- 22 módulos desconectados.
- 0 tests, 0 configuración CI, 0 tipos estáticos.
- 46 selectores CSS duplicados.
- Datos de catálogo duplicados entre JSON, el seed JS y el seed directo Atlas.
- Script Atlas ligado a `/home/rizzo/dev/backend/despensaRayana`.
- Dependencias de build (`vite`, `@vitejs/plugin-react`) están en `dependencies` en vez de `devDependencies` (`package.json:14-29`).
- `.gitignore` no cubre `.codex*` ni `Zone.Identifier`; el worktree ya muestra esos artefactos sin seguimiento.

## Código y componentes innecesarios o desconectados

El análisis de alcanzabilidad desde `src/main.jsx` identifica:

- `src/api.js`
- `src/components/cms/CmsResponsiveImage.jsx`
- Los siete factories `*ControllerActions.js`
- `controllerHelpers.js`, `controllerInitialState.js`, `controllerRoutes.js`
- `supplierMessageModel.js`, `supplierModel.js`, `userModel.js`
- `utils/analytics.js`
- `AuthGuards.jsx`, `CookieConsent.jsx`, `DesignSystemPreview.jsx`, `LegalView.jsx`, `SeoManager.jsx`, `SupplierView.jsx`

No deben borrarse automáticamente. Primero hay que decidir cuál implementación es canónica. Parte de este código representa funcionalidades reales pendientes de conectar; otra parte está desalineada con modelos activos y no funcionaría solo con importarla.

## Deuda técnica priorizada

### 🔴 Crítico

| ID | Problema e impacto | Dificultad / tiempo | Archivos afectados | Propuesta concreta |
| --- | --- | --- | --- | --- |
| C-01 | Checkout incompatible: valida tarjeta oculta y no permite crear pedidos. Bloquea ingresos y conversión. | Media · 4-8 h, más integración de pago | `useShopController.js:128-138,776-809`, `CartView.jsx:135-190`, `controllerHelpers.js:73-84` | Elegir contrato único: pedido pendiente sin tarjeta o SDK PCI. Alinear estado, validación, UI, payload y tests E2E. |
| C-02 | No existe pasarela de pago real; la UI lo declara pendiente. No es un ecommerce cobrable. | Alta · 5-15 días según proveedor | `CartView.jsx`, `orderModel.js`, backend de pagos | Integrar Stripe/Redsys/PayPal con PaymentIntent/redirect/webhook y estados verificables; nunca manejar PAN/CVC manualmente. |
| C-03 | Legales, privacidad, cookies, condiciones y devoluciones no tienen ruta; los textos existentes son placeholders. Riesgo regulatorio y contractual. | Media + legal · 2-5 días técnicos | `AppView.jsx`, `LegalView.jsx`, `CookieConsent.jsx`, `sitemap.xml` | Completar textos con asesoría, montar rutas/footer, consentimiento verificable y retirada; probar bloqueo previo de tags no esenciales. |

### 🟠 Alto

| ID | Problema e impacto | Dificultad / tiempo | Archivos afectados | Propuesta concreta |
| --- | --- | --- | --- | --- |
| H-01 | 22 módulos y 3.895 LOC desconectadas; supplier, SEO, analytics, guards y cuenta no existen en runtime. Alto riesgo de falsa confianza y merge defects. | Alta · 5-10 días | entrypoint, controllers, views y models listados arriba | Definir implementación canónica, añadir tests de caracterización y conectar o eliminar por feature en PRs pequeños. |
| H-02 | Panel supplier anunciado pero inaccesible; además requiere acciones que el controlador activo no expone. | Alta · 4-8 días | `AppView.jsx`, `SupplierView.jsx`, `supplierControllerActions.js`, `useShopController.js` | Integrar como ruta lazy con guard y controller propio; validar todos sus estados y contratos. |
| H-03 | `cancelOrder` inexistente causa error runtime al pulsar. | Baja · <1 h + test | `OrdersView.jsx:47-50`, `useShopController.js`, `orderModel.js` | Exponer acción que llame a `orderModel.cancel`, refresque pedidos/stock y maneje confirmación/error. |
| H-04 | UI promete actualizar reseña pero crea otra. Puede producir 409 o contenido duplicado. | Baja · 1-3 h | `ProductView.jsx:62,198-213`, `useShopController.js:662-685` | Si existe `ownReview`, usar update; precargar formulario y cubrir create/update/delete con tests. |
| H-05 | Admin usa listado público y no ve borradores/pendientes. Gestión de catálogo incompleta. | Baja · 1-2 h | `useShopController.js:499-506`, `catalogModel.js` | Añadir método admin autenticado contra `/products/admin/all`; separar cache pública/admin. |
| H-06 | Controlador monolítico y vistas gigantes. Cambios locales provocan regresiones globales. | Alta · 8-12 días | `useShopController.js`, `AdminView.jsx`, `SupplierView.jsx`, `HomeView.jsx` | Extraer por feature con interfaces estrechas; reducers locales y queries por recurso. |
| H-07 | Cero tests y cero CI. Los tres fallos funcionales anteriores pasan build. | Alta · 5-8 días iniciales | repositorio completo, `package.json` | Vitest + Testing Library + MSW; Playwright para compra/login/admin; CI con lint, test, build, audit y budgets. |
| H-08 | Tokens bearer y refresh persistidos en localStorage. Impacto alto ante XSS. | Alta y cross-stack · 3-6 días | `sessionModel.js`, `apiClient.js`, auth backend | Refresh en cookie HttpOnly/Secure/SameSite; access en memoria; rotación single-flight y logout/revocación. |
| H-09 | Peticiones sin debounce/cancelación/caché; hay carreras y duplicados. Resultados pueden retroceder. | Media · 3-5 días | `useShopController.js`, `catalogModel.js`, `apiClient.js` | Query layer con AbortSignal, debounce, keys estables, stale time y estados error/retry. |
| H-10 | Incumplimientos de teclado, dialogs, tabs, errores de formulario y contraste. Excluye usuarios y aumenta riesgo WCAG. | Media · 4-7 días | Header, Cart, Home, ProductCard, ProductView, CSS | Componentes accesibles, focus management, semántica nativa, `aria-describedby/invalid`, auditoría axe y teclado. |
| H-11 | Assets hero de casi 5 MB y canvas permanente. Penaliza LCP, datos y batería. | Media · 1-3 días | `public/*.png`, `HomeView.jsx`, `CanvasBackdrop.jsx`, CSS | AVIF/WebP responsive, preload solo del hero real, dimensiones; detener/eliminar canvas y respetar reduced motion. |
| H-12 | Lint falla; no existe gate de release. | Baja · 2-4 h para actuales | `homeContentModel.js`, Home, ProductCard, hooks | Corregir 5 errores/19 warnings justificadamente y hacer lint obligatorio en CI. |

### 🟡 Medio

| ID | Problema e impacto | Dificultad / tiempo | Archivos afectados | Propuesta concreta |
| --- | --- | --- | --- | --- |
| M-01 | CSS con tres capas, 46 selectores duplicados y tokens parciales. Cascada frágil. | Alta · 4-7 días | `styles.css` | Inventario visual, eliminar capas antiguas, tokens semánticos y CSS por feature/componentes. |
| M-02 | Un solo chunk y sin Error Boundary. Mayor coste inicial y caída total ante error. | Media · 1-2 días | router/AppView | Lazy routes con Suspense por dominio y boundaries global/de ruta con logging. |
| M-03 | Filtros/página no viven en URL. Mala navegación, compartir y analítica. | Media · 1-2 días | App, controller, Catalog | Usar search params tipados y navegación declarativa. |
| M-04 | `busy` y Notice son globales y sin tipo. Feedback ambiguo y bloqueos cruzados. | Media · 2-4 días | controller, Notice, todas las vistas | Estado async por operación; toast/status tipado y errores inline persistentes. |
| M-05 | Acciones destructivas sin confirmación/undo. Riesgo de pérdida accidental. | Baja · 1-2 días | Admin, Account, Orders | Dialog accesible con descripción del impacto, loading y confirmación explícita. |
| M-06 | Validación de auth pobre y errores backend en inglés. Aumenta abandono. | Media · 1-2 días | Account, controller, authModel | Reglas visibles, feedback por campo, reset de password en estado y flujos verify/reset. |
| M-07 | API client sin timeout, single-flight refresh ni error tipado. Difícil recuperación/observabilidad. | Media · 2-4 días | `apiClient.js` | Cliente con AbortSignal, timeout, error normalizado, request ID y refresh coordinado. |
| M-08 | JS sin tipos ni validación de respuestas. Cambios backend fallan tarde. | Alta · 8-15 días incremental | todo `src` | TypeScript strict por features y schemas runtime en el borde HTTP. |
| M-09 | CMS permite URLs externas arbitrarias e imágenes sin optimizar. Tracking, mixed content y layout shift. | Media · 2-4 días | Admin, Home, homeContentModel | Validador URL HTTPS, allowlist/proxy de imágenes, metadata alt/dimensiones y CDN. |
| M-10 | Jerarquía de headings, tabs y carousels no semánticos. SEO/a11y pobres. | Baja · 1-2 días | Home, ProductView | Un H1 por página; h2/h3 por sección; patrón ARIA de tabs/carrusel probado. |
| M-11 | Admin y filtros descargan como máximo 100 y filtran local. No escala. | Media · 2-4 días | controller, models, Admin/Catalog | Paginación/filter server-side, total fiable y virtualización solo si se mide necesaria. |
| M-12 | Sin 404, footer, scroll restoration ni foco tras navegación. Navegación incompleta. | Media · 1-3 días | AppView, layout/router | AppShell común con Footer, NotFound, ScrollRestoration y focus heading. |
| M-13 | Datos de categorías/seed duplicados. Drift silencioso. | Baja · 2-4 h | modelos y `scripts/*` | Una fuente JSON/schema; generar seeds/adaptadores desde ella. |
| M-14 | Script Atlas acoplado a ruta local y backend interno. No portable. | Baja · 1-2 h | `seed-atlas-extremadura.mjs` | Mover al backend o usar API/CLI configurada; eliminar ruta absoluta. |
| M-15 | No hay monitorización frontend, source maps ni reporting de errores verificable. | Media · 1-2 días | Vite/App | Integrar observabilidad con consentimiento, release tags y scrub de PII. |

### 🟢 Bajo

| ID | Problema e impacto | Dificultad / tiempo | Archivos afectados | Propuesta concreta |
| --- | --- | --- | --- | --- |
| L-01 | `vite` y plugin React están en dependencias de producción. Instalación menos limpia. | Baja · <1 h | `package.json`, lockfile | Mover a `devDependencies` y regenerar lock. |
| L-02 | Sin Prettier/EditorConfig. Formato inconsistente a futuro. | Baja · <1 h | raíz | Añadir configuración mínima y check en CI. |
| L-03 | README describe funciones desconectadas y asegura un lint no bloqueante que hoy falla. | Baja · 1-2 h | `README.md` | Documentar estado real, feature flags y checks exactos. |
| L-04 | `.gitignore` no cubre artefactos ya presentes. Ruido y riesgo de commit accidental. | Baja · <1 h | `.gitignore` | Ignorar `.codex*`, backups y `*:Zone.Identifier`; limpiar fuera de Git con cuidado. |
| L-05 | Textos sin tildes y nombres de rutas inconsistentes. Baja pulcritud profesional. | Baja · 1-2 h | defaults, controller, rutas | Catálogo de copy y convención única de rutas/nombres. |
| L-06 | Dos opciones de orden idénticas y prop `view` sin uso. Confusión menor. | Baja · <1 h | Catalog, Header, AppView | Corregir contrato de sort; eliminar o usar `view` para estado activo. |
| L-07 | `DesignSystemPreview` y estilos asociados no tienen ruta ni Storybook. Deuda sin utilidad actual. | Baja · <1 h | preview/CSS | Convertir en Storybook/test visual o eliminar tras decidir arquitectura. |

## Checklist completo

### Arquitectura y organización

- [x] Entry point y flujo de render identificados.
- [x] Capas, imports y ciclos revisados; no hay ciclos.
- [ ] Una sola fuente de verdad para routing.
- [ ] Separación efectiva por feature.
- [ ] Estado remoto separado del estado de UI.
- [ ] Código muerto resuelto.
- [ ] Contratos de módulos estrechos y tipados.

### React

- [x] Componentes funcionales y StrictMode.
- [ ] Efectos con dependencias correctas.
- [ ] Cancelación de efectos async.
- [ ] Memoización medida y referencias estables.
- [ ] Lazy loading y Suspense por ruta.
- [ ] Error Boundaries.
- [ ] Componentes grandes divididos.
- [ ] Estado derivado sin duplicaciones.

### Routing

- [x] URLs semánticas para rutas públicas principales.
- [ ] Guards montados a nivel de ruta.
- [ ] Supplier y legales alcanzables.
- [ ] 404 real.
- [ ] Search params para filtros/página.
- [ ] Scroll/focus restoration.
- [ ] Links reales para navegación.

### Datos y HTTP

- [x] Cliente HTTP central activo.
- [x] Backend autoritativo para precios/totales.
- [ ] Checkout coherente de extremo a extremo.
- [ ] Cache/deduplicación/retry/abort.
- [ ] Refresh single-flight.
- [ ] Errores tipados y observables.
- [ ] Paginación server-side completa.
- [ ] Validación runtime de respuestas.

### UX/UI

- [x] Identidad visual y responsive básicos.
- [x] Estados vacíos y disabled presentes.
- [ ] Pago real y confirmación de pedido.
- [ ] Errores inline y retry.
- [ ] Skeletons sin layout shift.
- [ ] Confirmación de acciones destructivas.
- [ ] Footer y soporte/contacto/legal.
- [ ] Flujos de contraseña/verificación.

### Accesibilidad WCAG

- [x] Idioma del documento.
- [x] Foco visible global.
- [x] Labels en la mayoría de formularios.
- [ ] Lint a11y limpio.
- [ ] Navegación completa por teclado.
- [ ] Dialogs con foco, Escape y retorno.
- [ ] Tabs y carousels semánticos.
- [ ] Errores asociados a controles.
- [ ] Contraste AA.
- [ ] `prefers-reduced-motion`.
- [ ] Auditoría axe y lector de pantalla.

### Rendimiento

- [x] Build minificado y bundle gzip moderado.
- [x] Lazy loading en cards de producto.
- [ ] Code splitting por ruta.
- [ ] Hero responsive AVIF/WebP.
- [ ] Dimensiones y `srcset` de imágenes.
- [ ] Peticiones deduplicadas.
- [ ] Canvas/animaciones adaptados a reduced motion.
- [ ] Presupuesto Lighthouse/Core Web Vitals.

### Seguridad y privacidad

- [x] HTML enriquecido sanitizado.
- [x] Sin secretos en variables Vite.
- [x] `npm audit` limpio en esta revisión.
- [ ] Refresh token fuera de localStorage.
- [ ] CSP y headers documentados/verificados.
- [ ] URLs CMS validadas.
- [ ] Consentimiento realmente montado.
- [ ] Pago mediante proveedor PCI.
- [ ] Automatización de auditoría de dependencias.

### Calidad y entrega

- [x] Build pasa.
- [ ] Lint pasa.
- [ ] Tests unitarios/integración.
- [ ] E2E de caminos críticos.
- [ ] CI obligatoria.
- [ ] Formatter y convenciones.
- [ ] README fiel al runtime.
- [ ] Worktree sin artefactos locales.

## Quick wins — menos de una hora cada uno

1. Corregir las claves duplicadas de `homeContentModel` y recuperar un lint más útil.
2. Exponer `cancelOrder` usando el modelo ya existente y añadir confirmación básica.
3. Eliminar la opción de orden duplicada o implementar relevancia real.
4. Quitar la prop `view` no usada o mostrar la navegación activa.
5. Ampliar `.gitignore` para artefactos Codex/Windows.
6. Mover Vite y su plugin a `devDependencies`.
7. Añadir labels accesibles al buscador móvil y botones icon-only que dependen de `title`.
8. Añadir `aria-invalid`/`aria-describedby` a errores de checkout.
9. Añadir `prefers-reduced-motion` para desactivar smooth scroll/transiciones y el canvas.
10. Corregir copy sin tildes y la afirmación del README sobre lint.

Estos quick wins no convierten el producto en production-ready; solo reducen ruido y fallos evidentes.

## Mejoras de alto impacto

1. Reparar y probar checkout/pago de extremo a extremo.
2. Elegir y completar una sola arquitectura, empezando por eliminar la bifurcación activa/inactiva.
3. Añadir E2E para: registro/login, búsqueda, producto, carrito, checkout, cancelación, reseñas y permisos admin/supplier.
4. Sacar auth refresh de localStorage y coordinar rotación.
5. Comprimir imágenes hero y retirar el canvas permanente.
6. Hacer server-side todos los listados/filtros que hoy se limitan a 100.
7. Montar legales, consentimiento, SEO y footer solo después de completar sus contenidos.
8. Dividir admin y supplier en rutas lazy independientes.

## Refactorizaciones recomendadas

### 1. Estabilización antes de mover código

- Tests de caracterización sobre el comportamiento actual válido.
- Resolver checkout, cancelación y reseñas.
- Hacer lint verde.
- Crear una matriz de features: activa, desconectada, incompleta o descartada.

### 2. Reconciliar la refactorización incompleta

- No mezclar de nuevo archivos completos de las dos ramas arquitectónicas.
- Extraer primero catálogo, cart/checkout y auth con APIs internas explícitas.
- Eliminar duplicados de `controllerInitialState`/helpers solo cuando sus consumidores migren.
- Conectar supplier/admin como dominios independientes, no como más estado del controlador global.

### 3. Frontera de datos

- Cliente HTTP único con errores normalizados, AbortSignal, refresh single-flight y observabilidad.
- Query/cache para recursos remotos; formularios y selección permanecen locales.
- Schemas de entrada para API/CMS/localStorage y migración de versiones de storage.

### 4. Sistema de UI

- Consolidar tokens semánticos: fondo, superficie, texto, muted, primary, danger, success, border, focus.
- Primitivas Button, IconButton, Field, Select, Dialog, Tabs, Toast, EmptyState y Skeleton.
- CSS por feature o módulos; eliminar la cascada histórica tras pruebas visuales.
- Storybook o preview accesible solo si se mantiene como herramienta real.

### 5. Calidad continua

- CI: install reproducible, lint, typecheck, unit/integration, build, E2E smoke, audit y budget.
- Renovate/Dependabot con PRs agrupadas y tests.
- Lighthouse CI y axe en rutas representativas.
- Definition of Done que incluya loading, empty, error, success, disabled, teclado y móvil.

## Roadmap priorizado

| Fase | Objetivo | Entregables | Tiempo orientativo | Criterio de salida |
| --- | --- | --- | ---: | --- |
| 0. Congelación | Evitar más divergencia | Branch policy, matriz de features, issue list | 0,5-1 día | Alcance canónico aprobado |
| 1. Estabilización | Recuperar camino de compra | Checkout, cancel, review update, lint verde | 2-4 días | Compra pendiente funcional y smoke manual |
| 2. Red de seguridad | Detectar regresiones | Vitest/RTL/MSW + Playwright + CI | 5-8 días | Gates obligatorios en PR |
| 3. Arquitectura | Eliminar god hook y código bifurcado | Features auth/catalog/cart primero | 8-12 días | No duplicación de controllers/helpers |
| 4. Producción ecommerce | Pago, legal, cookies, errores | Proveedor PCI, footer/legal/consent, observabilidad | 5-15 días + terceros | Flujo legal/pago validado en staging |
| 5. Calidad de experiencia | WCAG y rendimiento | axe/teclado, imágenes, reduced motion, lazy routes | 5-8 días | WCAG AA objetivo y budgets aprobados |
| 6. Escala | Datos y tipos | server pagination, cache, TypeScript/schemas | 8-15 días incremental | Contratos tipados y listas sin límite 100 |
| 7. Supplier/admin | Completar dominios privados | rutas lazy, guards, workflows y E2E | 5-10 días | Matriz de permisos probada |

## Criterios mínimos antes de producción

No aprobar release hasta que se cumplan todos:

1. Checkout y pago probados E2E en staging con estados success/failure/cancel.
2. Lint, tests, build y audit pasan en CI.
3. Supplier se completa o se retira de UI/README/scope.
4. Rutas legales, privacidad, cookies, condiciones y devoluciones tienen contenido aprobado.
5. Consentimiento bloquea cualquier analytics/marketing previo.
6. Sesión y refresh tienen modelo de amenaza aceptado; preferiblemente refresh HttpOnly.
7. Admin usa endpoints completos y permisos probados.
8. Teclado, foco, contraste y formularios superan axe más revisión manual.
9. Hero optimizado y budgets de LCP/bundle definidos.
10. Error Boundary, observabilidad y runbook de incidentes disponibles.

## Conclusión final

El proyecto tiene una base visual y de dominio prometedora, pero el estado actual refleja una integración incompleta entre dos líneas de desarrollo. El problema no es solo “deuda técnica”: ya produce fallos directos en checkout, pedidos, reseñas y disponibilidad de features documentadas.

La decisión más rentable no es reescribir desde cero ni seguir añadiendo pantallas. Es **estabilizar, caracterizar con tests y reconciliar de forma incremental una única arquitectura**. Con 2-4 días se pueden eliminar los bloqueos más visibles; alcanzar un estándar comparable al exigido por una organización madura requiere varias semanas, integración de pagos, revisión legal y disciplina de CI.

Hasta completar las fases 1, 2 y los criterios de pago/legal, la recomendación formal de esta auditoría es: **NO GO para producción**.
