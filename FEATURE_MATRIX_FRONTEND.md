# Matriz de features del frontend

**Fecha:** 14 de julio de 2026

**Base verificada:** `main` @ `e623d5a2946e47ee91b546821bccad2c12157a8d`

**Estado:** propuesta de Fase 0; requiere aprobación de owners. No autoriza integración, eliminación ni implementación.

## Criterio de clasificación

- **Activa:** alcanzable desde `src/main.jsx` y utilizable en el runtime actual.
- **Activa incompleta:** alcanzable, pero con deuda o capacidades parciales.
- **Activa bloqueada:** alcanzable, pero un defecto impide su objetivo principal.
- **Desconectada:** existe en el repositorio pero no es alcanzable desde el entrypoint.
- **Ausente:** no existe una implementación suficiente en el runtime.
- **Pendiente de decisión:** producto, legal, backend, hosting o terceros deben fijar el alcance.
- **Fuera de alcance provisional:** no se promete ni se conecta hasta nueva decisión.

Los owners son roles responsables de decidir o validar. Para Gate 0 quedan nominados Product Owner, Frontend Lead y Maintainer; Backend, Security, Legal y DevOps deben nominarse antes de la primera fase en la que su aprobación sea necesaria.

## Features y autoridad provisional

| Feature/capacidad | Estado real | Evidencia/autoridad actual | Riesgo o brecha principal | Owner(s) requeridos | Decisión provisional | Fase límite |
| --- | --- | --- | --- | --- | --- | --- |
| Shell y routing público | Activa incompleta | `main.jsx`, `App.jsx`, `AppView.jsx`, `useShopController.js` | Dos fuentes de ruta y navegación por vista | FE Lead, Product | Mantener hasta RFC; unificar después | 4-5 |
| Home editorial/CMS | Activa incompleta | `HomeView.jsx`, `homeContentModel.js`, lógica activa del controller | Acciones alternativas y responsive image desconectados | FE Lead, Product/Admin | Caracterizar; extraer, no sustituir en bloque | 5/7 |
| Catálogo, búsqueda y filtros | Activa incompleta | `CatalogView.jsx`, `catalogModel.js` | Límite 100, filtros cliente, carreras y sin cache | FE Lead, BE Lead | Autoridad activa hasta migración | 5/8 |
| Ficha de producto | Activa incompleta | `ProductView.jsx`, `productModel.js` | Estado no reiniciado, carga duplicada y vista grande | FE Lead | Mantener y caracterizar | 5.2 |
| Reseñas de producto/cuenta | Activa con fallo alto | `ProductView.jsx`, `AccountView.jsx`, `reviewModel.js` | Edición vuelve a crear; error H-04 | FE Lead, BE Lead | Reparar antes de refactor | 2/5.2 |
| Favoritos locales | Activa | `favoritesModel.js`, catálogo/producto activos | Persistencia solo local y contrato de producto implícito | FE Lead, Product | Conservar; decidir sincronización solo si hay necesidad | 5 |
| Carrito | Activa incompleta | `CartView.jsx`, `cartModel.js`, controller | Acoplado al controller y sin tests | FE Lead, BE Lead | Conservar hasta estabilización y tests | 2/5.3 |
| Checkout de pedido pendiente | Activa bloqueada | `CartView.jsx`, `orderModel.js`, controller | UI/validación incompatibles; C-01 | Product, FE Lead, BE Lead | Elegir beta sin cobro o deshabilitar | 2 |
| Cobro real | Ausente y pendiente | No hay SDK, endpoint de pago ni webhook | C-02; riesgo financiero/PCI | Product, BE Lead, Security, Finance, proveedor | No anunciar ni activar hasta Fase 6 | 6 |
| Autenticación | Activa incompleta | `authModel.js`, `sessionModel.js`, controller | Tokens access/refresh en `localStorage` | FE Lead, BE Lead, Security | Mantener contrato actual solo como transición | 5.4/6 |
| Cuenta/perfil | Activa incompleta | `AccountView.jsx`; `userModel.js` está desconectado | Actualización/borrado y guards no canónicos | Product, FE Lead, BE Lead | Fijar alcance; integrar solo contratos probados | 5.4 |
| Pedidos de cliente | Activa con fallo alto | `OrdersView.jsx`, `orderModel.js` | `actions.cancelOrder` no existe; H-03 | Product, FE Lead, BE Lead | Reparar endpoint ya disponible | 2 |
| Administración | Activa incompleta | `AdminView.jsx`, `adminModel.js` | Lista productos incompleta, vista monolítica | Product/Admin, FE Lead, BE Lead | Reparar H-05; dividir tras RFC | 2/5.5 |
| Supplier: alta, panel y operaciones | Desconectada; pendiente | `SupplierView.jsx`, actions/models desconectados | Contratos ausentes/incompletos; H-02 | Product, FE/BE Lead, Ops | Fuera de alcance provisional hasta matriz aprobada | 4/5.6 |
| Mensajería supplier-cliente | Desconectada; pendiente | `supplierMessageModel.js`; vista sin orquestación suficiente | Roles, soporte y estados sin validar | Product, FE/BE Lead, Support | Investigar por endpoint; no prometer | 4/5.6 |
| SEO dinámico | Desconectada | `SeoManager.jsx`; estáticos en `public` | Canonical/datos/rutas pueden divergir | Product/Marketing, FE Lead, Hosting | Resolver tras router y dominio final | 5/7 |
| Páginas legales | Desconectada; bloqueada | `LegalView.jsx` placeholder | C-03; contenido no aprobado | Legal, Product, FE Lead | No publicar placeholders | 6 |
| Consentimiento de cookies | Desconectada; bloqueada | `CookieConsent.jsx` | No controla tags ni retirada completa | Legal/Privacy, Product, FE Lead | Elegir CMP o implementación aprobada | 6 |
| Analytics ecommerce | Desconectada; bloqueada | `utils/analytics.js` | Sin CMP/loader/plan ni gobierno de `purchase` | Product/Analytics, Legal/Privacy, FE Lead | Desactivada hasta consentimiento aprobado | 6 |
| Preview del sistema de diseño | Desconectada; pendiente | `DesignSystemPreview.jsx` | Sin consumidor ni proceso asociado | Design, FE Lead | Investigar; no conectar por defecto | 7 |
| Error Boundaries | Ausente | Sin boundary alcanzable | Un error de render desmonta el árbol | FE Lead | Introducir según arquitectura aprobada | 7 |
| Lazy routes/code splitting | Ausente | Sin `lazy`/`Suspense`; un chunk JS | Admin y librerías en carga pública | FE Lead | Medir e implementar por rutas | 7 |
| Accesibilidad transversal | Activa incompleta | CSS de foco y labels parciales | Diálogos, foco, tabs, links, contraste | FE Lead, Design, QA/a11y | Corregir con baseline y pruebas | 7 |
| Rendimiento de imágenes/canvas | Activa incompleta | Hero PNG y `CanvasBackdrop.jsx` activos | Casi 5 MB en dos hero; canvas continuo | FE Lead, Design, Hosting/CDN | Optimizar tras medición | 7 |
| Cliente HTTP y contratos | Activa incompleta | `apiClient.js` y modelos activos | Sin cancelación, schemas, dedupe ni error normalizado | FE/BE Lead | Consolidar incrementalmente | 8 |
| Observabilidad frontend | Ausente | Sin tracking de errores ni SLI runtime | Incidentes y checkout sin señal operativa | DevOps/SRE, FE Lead, Product | Definir proveedor, privacidad y runbook | 8/9 |
| Seeds y scripts de catálogo | Mantenimiento incompleto | `scripts/*`; un script depende de ruta backend local | Duplicación de datos y frontera de repositorio | BE Lead, Data/Ops, FE Lead | Investigar y mover a capa/repo propietario | 4/8 |

## Inventario de los 22 módulos desconectados

Ningún elemento de esta tabla se integra, mueve o elimina en Fase 0.

| # | Módulo | Propósito aparente | Consumidor esperado | Dependencia/defecto conocido | Valor reutilizable | Riesgo de integración | Decisión provisional | Resolución |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/api.js` | Fachada legacy API/auth | Auth y modelos históricos | Duplica exports y frontera API | Bajo/medio | Medio | Conservar e investigar; probable retirada | F4/F5 auth |
| 2 | `src/components/cms/CmsResponsiveImage.jsx` | Imagen CMS responsive | Home/CMS | Sin dimensiones/lazy/sizes | Medio | Bajo/medio | Investigar e integrar solo con estrategia de imágenes | F7 |
| 3 | `src/controllers/adminControllerActions.js` | Factory admin | Controller/admin futuro | Llama métodos ausentes de `adminModel` | CRUD parcial | Muy alto | Reescribir/extraer selectivamente | F4/F5.5 |
| 4 | `src/controllers/authAccountControllerActions.js` | Auth/cuenta ampliada | Controller/cuenta | `authModel.registerSupplier` no existe | Helpers parciales | Alto | Reescribir sobre contratos verificados | F5.4/F5.6 |
| 5 | `src/controllers/cartCheckoutControllerActions.js` | Carrito/checkout extraído | Controller futuro | Replica tarjeta oculta y validator roto | Carrito parcial | Muy alto | Referencia; reescribir desde C-01 estable | F5.3 |
| 6 | `src/controllers/catalogControllerActions.js` | Catálogo/detalle extraído | Controller futuro | Replica límite, races y doble review load | Medio/alto | Medio/alto | Integrar solo piezas probadas | F5.1/F5.2 |
| 7 | `src/controllers/controllerHelpers.js` | Helpers comunes | Factories | Duplica activos y validator de tarjeta inválido | Por función | Alto | Clasificar función a función | F4/F5 |
| 8 | `src/controllers/controllerInitialState.js` | Estado global alternativo | Factories/controller inexistente | Conserva PAN/CVC y supplier state | Defaults parciales | Muy alto | Reescribir por feature | F4/F5 |
| 9 | `src/controllers/controllerRoutes.js` | Mapa de rutas alternativo | Router/controller futuro | Diverge `/gestion` y `/admin/*` | Inventario | Alto | Input de RFC; no autoridad | F4 |
| 10 | `src/controllers/homeContentControllerActions.js` | Acciones home/CMS | Controller/admin futuro | Duplica lógica activa | Medio | Medio | Investigar tras caracterización | F5 home/admin |
| 11 | `src/controllers/reviewControllerActions.js` | CRUD reseñas | Producto/cuenta | Repite create en edición | Parcial | Alto | Reescribir desde H-04 reparado | F5.2 |
| 12 | `src/controllers/supplierControllerActions.js` | Orquestación supplier | Panel supplier | Mensajería y estados incompletos | Medio | Muy alto | Investigar/rewrite por subfeature | F5.6 |
| 13 | `src/models/supplierMessageModel.js` | API de mensajes | Supplier/cuenta | Falta orquestación; roles por validar | Medio/alto | Medio/alto | Conservar e investigar endpoints | F4/F5.6 |
| 14 | `src/models/supplierModel.js` | API supplier | Supplier actions | Registro usa `fetch` paralelo | Alto parcial | Alto | Mover a cliente canónico tras validar | F5.6/F8 |
| 15 | `src/models/userModel.js` | Perfil update/delete | Cuenta | Ownership/permisos por validar | Medio/alto | Medio | Integrar solo con tests de rol | F5.4 |
| 16 | `src/utils/analytics.js` | Eventos consent-aware | App/features ecommerce | Sin loader/CMP; riesgo de duplicar purchase | Nombres/eventos | Alto legal | Conservar; integrar tras decisión legal | F6 |
| 17 | `src/views/AuthGuards.jsx` | Guards por rol | Router futuro | Rutas supplier inactivas/redirects no probados | Alto conceptual | Medio/alto | Integrar/rewrite con router canónico | F4/F5 |
| 18 | `src/views/CookieConsent.jsx` | Banner de consentimiento | AppShell | No gobierna tags/reapertura/foco completo | Bajo/medio | Muy alto legal | Reescribir o sustituir según legal/CMP | F6 |
| 19 | `src/views/DesignSystemPreview.jsx` | Preview interno | Desarrollo/diseño | No existe consumidor ni Storybook | Incierto | Bajo runtime | Investigar; eliminar o formalizar | F7 |
| 20 | `src/views/LegalView.jsx` | Páginas legales | Router/footer | Contenido placeholder | Estructura | Muy alto legal | Reescribir con textos aprobados | F6 |
| 21 | `src/views/SeoManager.jsx` | Metadata/canonical/JSON-LD | App/router | Rutas y datos divergentes | Medio | Alto SEO | Integrar tras router/estrategia | F5/F7 |
| 22 | `src/views/SupplierView.jsx` | Panel supplier monolítico | Router + supplier state | 21 contratos; mensajes incompletos | Inventario UI | Muy alto | Reescribir por subrutas; no montar | F5.6 al final |

`src/styles.css` sí es activo y entrega reglas para supplier, legal, consentimiento y preview aunque sus JSX estén desconectados. Esas reglas no demuestran que las features existan y se revisarán como CSS potencialmente muerto, sin borrado automático.

## Decisiones y aprobaciones necesarias

| Decisión | Owner de decisión | Fecha límite | Bloquea |
| --- | --- | --- | --- |
| Beta con pedido pendiente o checkout deshabilitado | Product Owner + FE/BE Lead | Antes de F2/C-01 | Gate 2 |
| Incluir o excluir supplier y cada subfeature | Product Owner + Ops + BE Lead | Antes de RFC F4 | F4/F5.6 |
| Alcance real de cuenta/perfil | Product Owner + BE Lead | Antes de F5.4 | F5.4 |
| Proveedor y modelo de pago | Product + Finance + BE/Security | Antes de F6 | Producción cobrable |
| Sesión HttpOnly/access en memoria | Security + FE/BE Lead | Antes de F6 | F6/F8 |
| Legales, CMP, analytics y retención | Legal/Privacy + Product | Antes de F6 | Gate 6 |
| Hosting, headers y observabilidad | DevOps/SRE + Security | Antes de F6/F8 | Gates 6, 8 y 9 |

## Acta de aprobación

Estado actual: **APROBADA PARA GATE 0**. Javier Vivas Ávila asume provisionalmente durante Fases 0 y 1 Product Owner, Frontend Lead, Maintainer y revisor principal. La revisión técnica independiente de Codex está completada. Los roles posteriores permanecen pendientes hasta su fase propietaria.

| Rol | Persona | Decisión | Fecha |
| --- | --- | --- | --- |
| Product Owner provisional F0-F1 | Javier Vivas Ávila | Aprueba alcance, freeze y clasificación de features de Gate 0 | 14-07-2026 |
| Frontend Lead provisional F0-F1 | Javier Vivas Ávila | Aprueba autoridad provisional, reglas técnicas y DoD de Gate 0 | 14-07-2026 |
| Maintainer provisional F0-F1 | Javier Vivas Ávila | Aprueba rama, versionado y protección del worktree de Gate 0 | 14-07-2026 |
| Revisor principal | Javier Vivas Ávila | Acepta la revisión técnica independiente y aprueba el cierre documental | 14-07-2026 |
| Revisión técnica independiente | Codex | Completada; 51 módulos, 29 alcanzables y 22 desconectados verificados | 14-07-2026 |
| Backend Lead | Pendiente | Nominar antes de decisiones cross-stack o contratos backend de Fase 2 en adelante | — |
| Security | Pendiente | Nominar antes de autenticación, seguridad y pagos de Fase 6 | — |
| Legal/Privacy | Pendiente | Nominar antes de cumplimiento, cookies y analytics de Fase 6 | — |
| DevOps/Hosting | Pendiente | Nominar antes de CI/branch protection operativa, staging o release en Fases 3, 6 y 9 | — |
