# Plan de remediación frontend — La Despensa Rayana

**Fecha de planificación:** 14 de julio de 2026  
**Repositorio frontend verificado:** `/home/rizzo/dev/react/Frontend DespensaRayana`  
**Repositorio abierto inicialmente por el entorno:** `/home/rizzo/dev/backend/despensaRayana`  
**Base técnica:** `main` en `e623d5a2946e47ee91b546821bccad2c12157a8d`  
**Documento de origen:** `AUDITORIA_FRONTEND.md`  
**Estado de este documento:** plan; no autoriza por sí mismo implementación, commit, push ni despliegue.

## 1. Resumen ejecutivo

### Estado actual y veredicto

La aplicación frontend compila, pero no está preparada para producción. El commit auditado y el actual son el mismo (`e623d5a`), por lo que no existe evolución versionada posterior que invalide los hallazgos. La verificación reproducible mantiene el veredicto **NO GO**: el checkout activo no puede superar su validación, no existe cobro real, cancelación y actualización de reseñas contienen fallos demostrables, el listado administrativo omite estados no públicos, lint falla y no existe red de seguridad frontend ni CI.

El repositorio contiene dos líneas arquitectónicas superpuestas: el runtime depende de `useShopController.js` y de rutas declaradas parcialmente en `App.jsx` y `AppView.jsx`, mientras 22 módulos no son alcanzables desde `src/main.jsx`. Esa segunda línea no es una sustitución lista para activar: replica defectos del checkout y contiene contratos inexistentes, entre ellos `authModel.registerSupplier`, múltiples métodos ausentes de `adminModel` y acciones de mensajería requeridas por `SupplierView` que no están implementadas.

### Riesgos principales

1. **Ingresos y datos de pedido:** checkout bloqueado y ausencia de pasarela real.
2. **Integridad funcional:** cancelación, edición de reseñas y catálogo administrativo fallan o están incompletos.
3. **Regresión:** cero tests frontend, cero CI y lint con 5 errores/19 warnings.
4. **Arquitectura:** controlador de 1.569 líneas, 41 estados, vistas de hasta 1.083 líneas y dos fuentes de verdad de routing.
5. **Seguridad y cumplimiento:** access y refresh token en `localStorage`, ausencia de flujo de pago PCI, legales placeholder y consentimiento fuera del runtime.
6. **Escala y fiabilidad:** límites artificiales de 100, carreras de red, refresh concurrente, errores silenciosos y ausencia de contratos runtime.
7. **Accesibilidad y rendimiento:** patrones interactivos no semánticos, foco no gestionado, contraste insuficiente, un único chunk, casi 5 MB en dos hero y canvas continuo.
8. **Riesgo operativo nuevo:** el workspace inicial apunta al backend, no al frontend; ejecutar prompts sin verificar `pwd`, remoto y commit puede modificar el repositorio equivocado.

### Objetivo y enfoque

El objetivo es recuperar una tienda local estable, después una beta sin cobro, y solo entonces una producción cobrable y madura. Se aplicará una recuperación incremental con gates: gobierno, baseline, reparación funcional, red de seguridad, decisión arquitectónica, extracción por features, pago/cumplimiento, calidad de experiencia, contratos/escalabilidad y revisión independiente.

No se recomienda una reescritura. La arquitectura provisional es una **migración híbrida incremental (opción C)**: conservar temporalmente el controlador activo como carcasa de compatibilidad, reparar primero el comportamiento crítico, extraer features una a una y reutilizar exclusivamente piezas desconectadas que superen revisión de contratos y tests. No se conectará la refactorización existente en bloque.

### Arquitectura provisional y camino crítico

```text
runtime actual estable
  -> tests/CI de comportamiento crítico
  -> router canónico + shell/proveedores mínimos
  -> extracción por feature con adaptadores temporales
  -> frontera HTTP/contratos/auth segura
  -> pago + legal + consentimiento en staging
  -> accesibilidad/rendimiento/observabilidad
  -> revisión independiente y decisión GO
```

El camino mínimo a producción cobrable pasa por los gates 0 a 7 y exige, además del frontend, proveedor de pago, backend de intents/redirect y webhooks, idempotencia, autenticación revisada, contenido legal aprobado, configuración de hosting, staging y soporte operativo. Compilar no es un criterio de producción.

## 2. Estado de partida

### Identificación y Git

| Campo | Evidencia verificada |
| --- | --- |
| Proyecto | `frontend-despensa-rayana@0.1.0`, React 19 + Vite 7 |
| Ruta correcta | `/home/rizzo/dev/react/Frontend DespensaRayana` |
| Ruta inicial del entorno | `/home/rizzo/dev/backend/despensaRayana` (repositorio distinto, Express/Mongoose) |
| Rama frontend | `main`, alineada con `origin/main` (`0 0` commits de diferencia) |
| Commit auditado | `e623d5a` según `AUDITORIA_FRONTEND.md` |
| Commit actual | `e623d5a2946e47ee91b546821bccad2c12157a8d` |
| Cambios versionados posteriores | Ninguno; `git log e623d5a..HEAD` vacío y `git diff`/`git diff --cached` vacíos |
| Worktree | Sin cambios tracked; con archivos/directorios untracked preexistentes |
| Untracked | `.codex-upload/`, `.codex/`, `.git-codex-backup/`, `AUDITORIA_FRONTEND.md`, `public/camino-extremadura.png:Zone.Identifier` |
| Protección aplicada | No se editó, limpió, añadió ni ocultó ninguno de esos elementos |

No hay hallazgos obsoletos por cambios posteriores. Solo se actualizan dos métricas de compresión de baseline: el build actual produce 119,65 kB gzip de JS y 9,01 kB gzip de CSS, frente a 119,35/9,04 documentados; el tamaño sin comprimir, el número de módulos y la conclusión permanecen. La diferencia es pequeña y debe registrarse como variación de entorno/herramienta, no como mejora o regresión funcional.

### Baseline ejecutada sin remediar

| Comando/inspección | Resultado actual |
| --- | --- |
| `node --version` | `v20.19.5` |
| `npm --version` | `10.8.2` |
| `npm run build -- --outDir /tmp/despensa-rayana-frontend-baseline-e623d5a` | **Pasa**; Vite 7.3.6, 1.741 módulos, un JS y un CSS |
| Bundle JS | 391,29 kB; 119,65 kB gzip |
| Bundle CSS | 44,22 kB; 9,01 kB gzip |
| `npm run lint` | **Falla**; 5 errores y 19 warnings |
| Tests frontend | 0 archivos `*.test.*`/`*.spec.*`; no existe script `test` ni configuración Vitest/Playwright |
| CI frontend | No existe `.github/workflows` versionado |
| `npm audit --json` | **Pasa**; 0 vulnerabilidades en 336 dependencias contabilizadas |
| Grafo desde `src/main.jsx` | 51 módulos JS/JSX; 29 alcanzables, 22 no alcanzables, sin ciclos reportados por la auditoría |
| Assets | `camino-extremadura.png` 2.852.558 B (1896×830); `despensa-rayana-hero.png` 2.111.225 B (1672×941) |
| CSS | 2.985 líneas (`wc`), 46 bloques de selector repetidos, 2 bloques `:root`, 132 literales de color, 94 valores `px`, sin `prefers-reduced-motion` |

El build se dirigió a `/tmp`; el directorio temporal vacío de Vite se retiró al terminar. El estado Git final conserva exactamente los untracked preexistentes.

### Hallazgos obligatorios: resultado de verificación

| Hallazgo | Estado | Evidencia y dependencia |
| --- | --- | --- |
| Incompatibilidad de checkout | Confirmado | `useShopController.js:103-138,776-792` exige tarjeta; `CartView.jsx:135-160` solo muestra `method/accepted` |
| Pago real | Confirmado ausente | Solo `external_pending/manual_transfer`; no hay SDK, endpoint, webhook ni proveedor en frontend/backend. Depende de producto, backend y tercero |
| Cancelación | Confirmado | `OrdersView.jsx:47-50` usa `actions.cancelOrder`; no existe en acciones activas. Backend sí ofrece `PATCH /orders/:id/cancel` |
| Actualización de reseña | Confirmado | UI detecta `ownReview`, pero submit llama siempre a `reviewModel.create`; backend sí ofrece `PATCH /reviews/:id` |
| Listado admin | Confirmado | Usa `/products?limit=100`; backend reserva `/products/admin/all` para incluir todos los estados |
| Lint | Confirmado | 5 errores, 19 warnings reproducidos |
| Tests/CI | Confirmado ausente | Sin archivos, scripts ni workflows frontend |
| Controlador/vistas grandes | Confirmado | 1.569 líneas y 41 `useState`; `AdminView` 961, `SupplierView` 1.083, `HomeView` 390 |
| Routing duplicado | Confirmado | `App.jsx:5-38`, `AppView.jsx:38-49`, además `routeByView` activo en controlador |
| Módulos desconectados | Confirmado | 22 módulos exactos no alcanzables desde entrypoint |
| README/runtime | Confirmado | README anuncia supplier, SEO, cookies, analytics y cuenta avanzada que no se montan |
| Tokens en `localStorage` | Confirmado | `sessionModel.js:1-14`; backend devuelve ambos tokens en JSON. Dependencia cross-stack para corregir |
| Red sin cancelación/debounce/caché | Confirmado | `apiClient.js` usa `fetch` directo; efectos disparan por cada cambio; no hay `AbortController` ni single-flight |
| Límite 100 | Confirmado | catálogo con filtros locales, destacados y admin usan 100; backend fija máximo 100 |
| Accesibilidad | Confirmado estáticamente; conformidad completa no medida | Errores lint y patrones de foco/dialog/tabs; falta validación axe/lector/pantalla real |
| Imágenes pesadas | Confirmado | 4.963.783 B en dos hero PNG, sin variantes AVIF/WebP responsive activas |
| Code splitting | Confirmado ausente | Sin `lazy`/`Suspense`; build genera un único JS |
| CSS duplicado | Confirmado | Métrica reproducida de 46 grupos duplicados y dos capas `:root` |
| Legales/consentimiento | Confirmado fuera del runtime | `LegalView`/`CookieConsent` no alcanzables; textos son placeholders. Depende de legal/producto/hosting |

### Limitaciones y confianza

- No se ejecutaron flujos reales en navegador contra una base de datos ni proveedor de pago; no hay staging ni fixtures frontend.
- No se verificaron cabeceras del host que servirá el HTML, rewrites SPA, TLS, CDN, Core Web Vitals de campo, navegadores reales ni lectores de pantalla.
- El backend local actual se usó solo para contrastar contratos. Tiene Helmet para la API, pero eso no demuestra las cabeceras del hosting del SPA.
- `npm audit` solo cubre vulnerabilidades conocidas del ecosistema y no sustituye threat modeling, SAST ni revisión de lógica.
- El diagnóstico tiene confianza **alta** para grafo, fallos de código, build/lint/assets; **media** para UX/a11y/performance sin ejecución real; **baja/no evaluable** para producción, legal, logística y terceros.

## 3. Principios de ejecución

1. Ejecutar y aprobar una fase antes de abrir la siguiente; una excepción requiere RFC y responsable explícito.
2. Mantener una única arquitectura canónica. Durante la migración puede existir un adaptador temporal, no dos implementaciones con autoridad equivalente.
3. Añadir tests de caracterización antes de refactorizaciones de riesgo. Las reparaciones mínimas de Fase 2 no autorizan reestructuración.
4. Hacer cambios pequeños, revisables y reversibles; un PR debe tener un objetivo observable.
5. No mezclar reparación funcional, refactor, rediseño visual, dependencias y cambios cross-stack en el mismo commit.
6. No borrar código desconectado sin clasificar propósito, contrato, propietario y evidencia de no uso.
7. No conectar automáticamente la segunda arquitectura. Cada pieza debe demostrar contratos existentes, tests y ventaja frente a extraer desde el runtime.
8. No introducir dependencias sin ADR/RFC breve: problema, alternativas nativas, coste de bundle/mantenimiento, licencia, seguridad y rollback.
9. No declarar terminado porque compila. Definition of Done: lint, tests, build, revisión de diff, estados loading/empty/error/success/disabled, teclado, responsive y criterio funcional.
10. No aceptar errores o warnings nuevos. Tras Fase 2, lint debe quedar en cero; cobertura y budgets se ratchetean.
11. Validar móvil, tablet, desktop, teclado, foco, Escape, red lenta, 4xx/5xx/timeout y sesión expirada según el alcance.
12. Cada PR documenta rollback técnico y de datos; cualquier migración de storage/API debe ser compatible o versionada.
13. Proteger Git: inventario previo, worktree conocido, nunca limpiar artefactos ajenos ni sobrescribir cambios locales.
14. Backend, frontend, hosting, proveedor, producto y legal tienen entregables y aprobadores separados.
15. Evitar sobreingeniería: no añadir estado global, query library, Storybook, monorepo o TypeScript global sin evidencia y decisión de fase.

## 4. Decisión de modelo

### Recomendación

Modelo principal: **GPT-5.6 Sol (`gpt-5.6-sol`, alias `gpt-5.6`)**, siempre que esté habilitado en el workspace de Codex. La documentación oficial lo recomienda para razonamiento complejo y coding y ofrece `high`, `xhigh` y `max` ([OpenAI Models](https://developers.openai.com/api/docs/models)). Mantener el mismo modelo en todo el programa conserva criterios, vocabulario, decisiones y memoria documental.

Fallback único si el entitlement no expone GPT-5.6 Sol: **GPT-5.3-Codex con `xhigh`**, registrando la sustitución en `BASELINE_FRONTEND.md`; es el modelo Codex especializado disponible documentado con `low` a `xhigh` ([GPT-5.3-Codex](https://developers.openai.com/api/docs/models/gpt-5.3-codex)). No alternar entre ambos por tarea una vez iniciada una fase.

Razonamiento por defecto: **extra alto (`xhigh`)**. Subir a **máximo (`max`)** para arquitectura, seguridad, auth, checkout/pagos, contratos cross-stack, migraciones de estado y GO/NO GO. Usar **alto (`high`)** solo para tareas mecánicas con especificación cerrada, por ejemplo inventarios, copy aprobado o ajustes CSS acotados. Modelos rápidos se limitan a búsquedas/mediciones auxiliares no decisorias; sus resultados los valida el principal.

Agentes auxiliares solo cuando el trabajo sea independiente y de solo lectura o con archivos sin solapamiento: inventario de imports, matriz de endpoints, ejecución de navegadores o revisión a11y. El principal fija criterios, integra resultados y revisa cada diff. No delegar decisiones de arquitectura, seguridad, pago, auth, aceptación ni merge. No cambiar de modelo a mitad de una fase, ante un fallo difícil ni para abaratar una revisión crítica.

Para mantener criterio entre sesiones: leer siempre `AUDITORIA_FRONTEND.md`, este plan, `BASELINE_FRONTEND.md`, RFC/ADRs vigentes y último gate; registrar modelo/reasoning, commit base, decisiones y excepciones en el artefacto de fase.

| Fase | Modelo recomendado | Razonamiento | Motivo | Riesgo de modelo inferior |
| --- | --- | --- | --- | --- |
| 0 Gobierno | GPT-5.6 Sol | max | Límites, Git, DoD y clasificación condicionan todo | Reglas ambiguas y alcance contaminado |
| 1 Baseline | GPT-5.6 Sol | high; xhigh al interpretar | Medición mayormente mecánica con lectura crítica | Omitir variabilidad o confundir ausencia con éxito |
| 2 Estabilización | GPT-5.6 Sol | xhigh; max en checkout | Flujos de negocio y contratos frontend/backend | Fix local que rompe pedidos, stock o permisos |
| 3 Tests/CI | GPT-5.6 Sol | xhigh | Seleccionar pruebas útiles y gates no frágiles | Cobertura cosmética o E2E inestable |
| 4 RFC | GPT-5.6 Sol | max | Decisión arquitectónica y retirada segura | Migración incoherente o reescritura encubierta |
| 5 Features | GPT-5.6 Sol | xhigh; max en auth/checkout | Extracción compleja con compatibilidad temporal | Duplicación, acoplamiento y regresiones |
| 6 Seguridad/pago/legal | GPT-5.6 Sol | max | Threat model, PCI, webhooks, cookies y cumplimiento | Vulnerabilidades, cobros duplicados o falsa conformidad |
| 7 A11y/UI/performance | GPT-5.6 Sol | xhigh; high en ajustes mecánicos | Interacciones, medición y consistencia visual | Correcciones superficiales o budgets arbitrarios |
| 8 Contratos/escala | GPT-5.6 Sol | max para diseño; xhigh implementación | HTTP, schemas, tipos, caché y concurrencia | Contratos incompletos y carreras sutiles |
| 9 Producción | GPT-5.6 Sol | max | Revisión independiente y decisión de riesgo | Aprobación por checklist sin evidencia |

## 5. Matriz completa de hallazgos

### 5.1 Vista de control

Las etiquetas de dependencia no rebajan severidad: indican quién debe resolver. “Parcial” significa que la evidencia estática existe pero falta validación runtime/externa. Ninguna recomendación opcional (por ejemplo Storybook o una librería de caché concreta) se convierte en obligación.

| ID | Verificación | Severidad | Categoría | Dependencias clave | Fase |
| --- | --- | --- | --- | --- | ---: |
| C-01 | Confirmado | Crítica | Checkout | Producto; contrato backend existente | 2 |
| C-02 | Confirmado; backend/tercero | Crítica | Pagos | Producto, backend, proveedor, finanzas | 6 |
| C-03 | Confirmado; legal/producto | Crítica | Cumplimiento | Legal, producto, hosting, analytics | 6 |
| H-01 | Confirmado | Alta | Arquitectura | RFC | 4-5 |
| H-02 | Confirmado; producto | Alta | Supplier | Producto, backend, soporte | 4-5 |
| H-03 | Confirmado | Alta | Pedidos | Endpoint backend disponible | 2 |
| H-04 | Confirmado | Alta | Reseñas | Endpoint backend disponible | 2 |
| H-05 | Confirmado | Alta | Administración | Endpoint backend disponible | 2 |
| H-06 | Confirmado | Alta | Mantenibilidad | Tests + RFC | 4-5 |
| H-07 | Confirmado | Alta | Calidad | Política CI | 3 |
| H-08 | Confirmado; cross-stack | Alta | Seguridad/auth | Backend, hosting | 6/8 |
| H-09 | Confirmado | Alta | Datos/red | Estrategia query | 5/8 |
| H-10 | Confirmado estático; parcial runtime | Alta | Accesibilidad | QA/a11y | 7 |
| H-11 | Confirmado | Alta | Rendimiento | Diseño/CDN | 7 |
| H-12 | Confirmado | Alta | Calidad | Ninguna externa | 2 |
| M-01…M-15 | Confirmados o parciales indicados abajo | Media | Varias | Ver ficha | 5-8 |
| L-01…L-07 | Confirmados | Baja | Higiene | Ver ficha | 0-8 |
| M-16 | Confirmado (nuevo) | Media | Reproducibilidad | Decisión de runtime | 1/3 |
| M-17 | Parcial; hosting | Media | Despliegue | Hosting/DevOps | 1/6/9 |
| N-01 | Confirmado (nuevo) | Alta operativa | Gobierno | Usuario/entorno | 0 |

### 5.2 Fichas críticas y altas

#### C-01 — Checkout incompatible

- **Origen/evidencia/estado:** auditoría confirmada; `useShopController.js:103-138,776-809`, `controllerInitialState.js:115-120` y `controllerHelpers.js:73-84` esperan tarjeta, mientras `CartView.jsx:135-160` solo expone `method/accepted`. La alternativa desconectada repite el defecto.
- **Severidad/categoría/impactos:** crítica, funcional/checkout. Impacto técnico: submit inalcanzable; usuario: no puede finalizar; negocio: cero conversión. Probabilidad 100 % al intentar comprar; regresión alta por stock, carrito y pedidos.
- **Alcance/dependencias/archivos:** frontend principal; backend ya acepta `external_pending/manual_transfer`. Producto debe elegir checkout temporal o paso directo a pago. Archivos previsibles: controller, helpers/estado canónico, `CartView`, `orderModel` y tests.
- **Solución/alternativas/bloqueadores:** Fase 2 recomienda contrato temporal explícito para beta: validar `method/accepted`, enviar método permitido, mostrar que no hay cobro y registrar pedido pendiente. Alternativa: no habilitar checkout hasta Fase 6. No introducir campos PAN/CVC. Bloqueador: decisión de producto.
- **Esfuerzo/modelo:** M, 1-2 días incluyendo pruebas y UX de error; GPT-5.6 Sol, max.
- **Tests/manual/aceptación:** unit de validación y payload; integración items→shipping→payment; E2E pedido pendiente success/400/401/stock. Manual teclado/móvil/red lenta. Aceptación: campos visibles y validados coinciden, una acción crea un único pedido, carrito solo se limpia tras 201, error conserva datos, copy no promete cobro.
- **Rollback/fase:** revertir el PR C-01 completo y deshabilitar CTA de checkout mediante configuración aprobada; nunca volver al formulario de tarjeta. Fase 2.

#### C-02 — Ausencia de pasarela real

- **Origen/evidencia/estado:** confirmado y dependiente de backend/tercero; búsquedas en ambos repositorios solo encuentran copy de Stripe/Redsys/PayPal. Backend persiste pago pendiente sin intents, redirect ni webhook.
- **Severidad/categoría/impactos:** crítica, pagos. Técnico: no hay máquina de estados de pago; usuario: no puede pagar; negocio: no se puede cobrar ni conciliar. Probabilidad 100 % en producción cobrable; regresión/riesgo financiero crítico.
- **Alcance/dependencias/archivos:** frontend checkout/confirmación, backend payments/orders, proveedor, secretos, hosting, finanzas/soporte. Archivos concretos se fijarán tras elegir proveedor.
- **Solución/alternativas/bloqueadores:** proveedor PCI con PaymentIntent/hosted redirect, confirmación server-side, webhook firmado, idempotencia, estados y reconciliación. Alternativas: redirect alojado (menor superficie PCI) o Elements/SDK; transferencia manual solo si negocio/legal la aprueba y opera. Bloqueadores: proveedor, cuenta merchant, flujos de devolución y decisión fiscal.
- **Esfuerzo/modelo:** XL, 1-4 semanas cross-stack más onboarding externo; GPT-5.6 Sol, max.
- **Tests/manual/aceptación:** sandbox success/decline/cancel/timeout/3DS, doble click, replay webhook, webhook fuera de orden, refund, carrito/stock. Aceptación: ningún PAN/CVC toca sistemas propios, pedido y pago concilian, idempotencia evita duplicados, observabilidad sin PII y runbook aprobado.
- **Rollback/fase:** feature flag server-side, desactivar creación cobrable y conservar beta sin cobro; no borrar registros de conciliación. Fase 6.

#### C-03 — Legales, privacidad, cookies, condiciones y devoluciones fuera del runtime

- **Origen/evidencia/estado:** confirmado; `LegalView`, `CookieConsent` y analytics son inalcanzables, `AppView` no declara rutas, sitemap sí las anuncia y los textos dicen expresamente que son placeholders. Dependiente de asesoría legal/producto/hosting.
- **Severidad/categoría/impactos:** crítica, cumplimiento/UX. Usuario sin información ni control; negocio expuesto a reclamaciones/sanciones. Probabilidad alta; regresión alta si se cargan tags antes del consentimiento.
- **Alcance/dependencias/archivos:** frontend router/layout/footer/CMP, gestor de tags, CMS si aplica; legal, privacidad, marketing, hosting y analytics.
- **Solución/alternativas/bloqueadores:** contenido aprobado y versionado, rutas reales, footer, CMP que bloquee no esenciales, retirada/granularidad/registro según asesoría. Alternativa SaaS CMP justificada frente a implementación propia. Bloqueadores: identidad legal, política real, vendors y bases jurídicas.
- **Esfuerzo/modelo:** L, 3-10 días técnicos + plazo legal indeterminado; GPT-5.6 Sol, max.
- **Tests/manual/aceptación:** E2E primera visita/rechazo/aceptación parcial/retirada, inspección de cookies/requests, links en checkout/footer, teclado. Aceptación solo con firma legal y evidencia de cero tags no esenciales antes de consentir.
- **Rollback/fase:** retirar tags no esenciales y mantener solo páginas legales estáticas aprobadas; nunca restaurar placeholders como producción. Fase 6.

#### H-01 — Arquitecturas superpuestas y 22 módulos desconectados

- **Evidencia/estado:** confirmado por grafo 29/51; 3.895 LOC reportadas. Contratos rotos adicionales: métodos admin ausentes y acciones supplier messages inexistentes. Parte duplicada, parte incompleta; no todo es “código muerto”.
- **Impactos/riesgo:** alta, arquitectura/mantenibilidad; falsa confianza, merges defectuosos, negocio cree disponer de features. Probabilidad alta; regresión muy alta si se conecta en bloque.
- **Alcance/solución:** todo `src`; RFC y matriz de módulos. Elegir opción C, tests antes de migrar, feature por feature. Alternativas A temporal, B descartada como conexión directa, D no justificada.
- **Esfuerzo/modelo:** XL, distribuido en Fases 4-5; GPT-5.6 Sol max para decisión, xhigh implementación.
- **Pruebas/aceptación/rollback:** grafo automático, tests de feature y ausencia de consumidores dobles. Aceptación: una autoridad por dominio y código antiguo retirado solo tras equivalencia. Rollback por adaptador/feature PR.

#### H-02 — Supplier anunciado pero no funcional

- **Evidencia/estado:** confirmado y dependiente de producto. Sin ruta activa; `SupplierView` (1.083 líneas) requiere 21 campos/acciones y tres acciones de mensajes no existen; la refactorización no está ensamblada.
- **Impactos/riesgo:** alta, feature/roles; proveedor no accede y una activación parcial puede exponer datos o fallar. Probabilidad 100 % para la ruta anunciada; regresión/permisos muy alta.
- **Alcance/solución:** router, guard, feature supplier, modelos, backend, soporte. Decidir mantener fuera del alcance o completar por subflujos; no conectar vista monolítica. Alternativa retirar promesas de README/sitemap/UI.
- **Esfuerzo/modelo:** XL, 1-3 semanas según alcance; GPT-5.6 Sol max/xhigh.
- **Pruebas/aceptación/rollback:** matriz rol/ownership, E2E alta/login/perfil/productos/revisión/mensajes/reportes elegidos. Aceptación por feature matrix; rollback con ruta/flag y sin pérdida de datos. Fases 4-5, último dominio.

#### H-03 — Acción de cancelación inexistente

- **Evidencia/estado:** confirmado frontend; `OrdersView.jsx:48` frente a acciones retornadas `useShopController.js:1498-1567`. Modelo y backend sí existen.
- **Impactos/riesgo:** alta, pedidos; TypeError desmontable sin Error Boundary, usuario no cancela, soporte manual. Probabilidad 100 % al click; regresión media.
- **Solución/alternativas:** acción mínima que confirme, llame `orderModel.cancel`, refresque pedido/catálogo y gestione estados/idempotencia visual. No borrar pedido. Bloqueador: copy/razones y política de cancelación.
- **Esfuerzo/modelo:** S, 0,5-1 día con pruebas; GPT-5.6 Sol xhigh.
- **Tests/manual/aceptación:** pending cancelable, processing rechazado, 401/403/409, doble click; diálogo accesible. Pedido pasa a cancelled, stock/refund mostrados desde backend. Rollback del PR restaura CTA deshabilitado. Fase 2.

#### H-04 — Reseña existente vuelve a crearse

- **Evidencia/estado:** confirmado frontend; `ProductView.jsx:62,198-213`, submit `reviewModel.create`; backend PATCH disponible.
- **Impactos/riesgo:** alta, contenido; 409/duplicado y pérdida de confianza. Probabilidad alta para autor con reseña; regresión media.
- **Solución/alternativas:** precargar ownReview, ramificar create/update por ID, reset al cambiar producto; opcional redirigir edición a cuenta solo si producto lo decide.
- **Esfuerzo/modelo:** S, 0,5-1 día; GPT-5.6 Sol xhigh.
- **Tests/manual/aceptación:** create sin propia, PATCH con propia, cambio de producto, delete/error. Exactamente una reseña por usuario/producto y copy coherente. Rollback: deshabilitar formulario cuando existe propia. Fase 2.

#### H-05 — Listado administrativo incompleto

- **Evidencia/estado:** confirmado frontend; `loadAdminProducts` usa catálogo público, backend filtra publicados salvo `req.adminList` en `/products/admin/all`.
- **Impactos/riesgo:** alta, administración; borradores/pendientes invisibles, moderación bloqueada. Probabilidad alta; regresión media por separar caches.
- **Solución/alternativas:** método autenticado admin paginado, cache/estado separado del público; no elevar privilegios del endpoint público.
- **Esfuerzo/modelo:** S, 0,5-1 día; GPT-5.6 Sol xhigh.
- **Tests/manual/aceptación:** admin ve published/draft/pending/rejected; usuario recibe 401/403; catálogo público no filtra datos privados. Rollback a endpoint público más aviso explícito, nunca mezclar cache. Fase 2.

#### H-06 — Controlador monolítico y vistas gigantes

- **Evidencia/estado:** confirmado: controller 1.569 líneas/41 estados; Admin 961, Home 390, Supplier 1.083; `state/actions` completos se propagan.
- **Impactos/riesgo:** alta, arquitectura; renders y cambios globales, onboarding lento. Probabilidad alta; riesgo de refactor muy alto.
- **Solución/alternativas:** extracción por feature tras tests/RFC, interfaces estrechas y estado remoto/local separado. No imponer Context/reducer/query library sin medición.
- **Esfuerzo/modelo:** XL, 3-6 semanas incremental; GPT-5.6 Sol max/xhigh.
- **Pruebas/aceptación:** caracterización por dominio, render count solo si hay problema medido. Salida: ownership explícito y ninguna nueva responsabilidad en god hook. Rollback por feature adapter. Fases 4-5.

#### H-07 — Sin tests ni CI

- **Evidencia/estado:** confirmado frontend; el backend sí tiene tests, pero no protegen UI. Sin script/config/workflows.
- **Impactos/riesgo:** alta, calidad/entrega; fallos críticos pasan build. Probabilidad y regresión altas.
- **Solución/alternativas:** Vitest + RTL + MSW, Playwright, Actions, cobertura crítica y gates. Empezar con flujos, no snapshots masivos.
- **Esfuerzo/modelo:** L, 5-8 días iniciales; GPT-5.6 Sol xhigh.
- **Aceptación/rollback:** Gate 3; checks obligatorios y reproducibles, flakes en cuarentena con owner/plazo. Rollback individual de tooling sin retirar pruebas útiles. Fase 3.

#### H-08 — Access y refresh token en `localStorage`

- **Evidencia/estado:** confirmado; backend actual devuelve/rota refresh en body y detecta reuse, por lo que la corrección es cross-stack.
- **Impactos/riesgo:** alta, seguridad/auth; XSS exfiltra sesión larga. Probabilidad incierta, impacto alto, regresión auth muy alta.
- **Solución/alternativas:** threat model; refresh HttpOnly Secure SameSite, access corto en memoria, CSRF/CORS coherentes, rotación single-flight, revocación/logout. Alternativa BFF si hosting lo justifica.
- **Esfuerzo/modelo:** L, 3-8 días cross-stack; GPT-5.6 Sol max.
- **Tests/aceptación/rollback:** reload, múltiples 401, reuse, logout, multi-tab, CSRF, expiración. Ningún refresh legible por JS; fallback temporal versionado y con expiración. Fases 6/8.

#### H-09 — Peticiones sin debounce, cancelación, caché ni deduplicación

- **Evidencia/estado:** confirmado; filtros cambian efecto por tecla, reviews duplicadas, destacados/catálogo separados, `fetch` sin signal.
- **Impactos/riesgo:** alta, datos/performance; resultados viejos sobrescriben nuevos y carga API. Probabilidad alta; regresión media-alta.
- **Solución/alternativas:** primero AbortSignal, debounce y request keys; evaluar query library en RFC frente a capa ligera. No cachear datos privados con claves públicas.
- **Esfuerzo/modelo:** M/L, 3-6 días; GPT-5.6 Sol xhigh.
- **Tests/aceptación/rollback:** timers, respuestas fuera de orden, unmount, dedupe, retry controlado, 401. Última intención gana y request count medido baja. Rollback por feature. Fases 5/8.

#### H-10 — Accesibilidad insuficiente

- **Evidencia/estado:** violaciones estáticas confirmadas; conformidad WCAG global parcialmente confirmada hasta pruebas. ProductCard falso link, menús/drawer sin foco/Escape, tabs/carousels no semánticos, errores no asociados y contraste bajo.
- **Impactos/riesgo:** alta, a11y/UX/legal; exclusión y abandono. Probabilidad alta; regresión visual/interacción media.
- **Solución/alternativas:** semántica nativa y primitivas accesibles probadas; librería headless solo si reduce riesgo y supera evaluación.
- **Esfuerzo/modelo:** L, 5-10 días; GPT-5.6 Sol xhigh.
- **Tests/aceptación/rollback:** axe sin serious/critical, teclado completo, lector de pantalla muestral, contraste AA. Rollback por componente, nunca restaurar un blocker conocido. Fase 7.

#### H-11 — Hero pesados y canvas continuo

- **Evidencia/estado:** confirmado con tamaños/dimensiones; canvas usa `requestAnimationFrame` permanente; sin reduced motion.
- **Impactos/riesgo:** alta, performance/energía; LCP, datos y batería. Probabilidad alta; riesgo visual medio.
- **Solución/alternativas:** AVIF/WebP responsive, tamaños/dimensiones, preload solo hero real; pausar/eliminar canvas según medición y reduced motion. CDN solo con decisión de hosting.
- **Esfuerzo/modelo:** M, 2-4 días incluyendo medición visual; GPT-5.6 Sol xhigh/high.
- **Tests/aceptación/rollback:** comparación visual, Lighthouse 3 runs, red lenta, DPR, reduced motion. Budgets aprobados y sin CLS. Conservar originales fuera del bundle hasta aceptar. Fase 7.

#### H-12 — Lint fallido

- **Evidencia/estado:** confirmado: duplicados `items/productIds`, tres errores a11y adicionales y 19 warnings de hooks/uso.
- **Impactos/riesgo:** alta como gate; deuda oculta defectos. Probabilidad 100 %; regresión baja si cambios separados.
- **Solución/alternativas:** corregir causa, no silenciar reglas globalmente; warnings revisados uno a uno. Config changes requieren justificación.
- **Esfuerzo/modelo:** S/M, 0,5-1,5 días; GPT-5.6 Sol high/xhigh para hooks.
- **Tests/aceptación/rollback:** `npm run lint` 0/0 y build; smoke de home/producto. Rollback por commit de regla/código, sin desactivar plugin. Fase 2.

### 5.3 Fichas medias, bajas y nuevas

En estas tablas, **T/U/B** significa impacto técnico/usuario/negocio; **P/R** probabilidad/riesgo de regresión. La columna de alcance identifica frontend (FE), backend (BE) y dependencia externa (EXT). Todas las validaciones manuales se ejecutan además en móvil y teclado cuando exista UI.

| ID y hallazgo (estado, severidad, categoría) | Evidencia e impactos; P/R | Alcance, archivos, dependencias y bloqueadores | Solución recomendada y alternativas | Esfuerzo; modelo/razonamiento | Tests, validación manual, aceptación, rollback y fase |
| --- | --- | --- | --- | --- | --- |
| **M-01 CSS acumulativo** — confirmado, media, UI/mantenibilidad | `styles.css` 2.985 líneas, 46 grupos duplicados, 2 `:root`, 132 colores. T: cascada implícita; U: inconsistencias; B: cambios caros. P alta/R alta | FE `styles.css` y vistas; depende de inventario visual. Bloquea no tener referencia visual/visual regression | Inventariar, fijar tokens semánticos y retirar capa a capa por feature. Alternativa CSS Modules solo si RFC demuestra valor; no reescritura global | L, 5-10 días incrementales; GPT-5.6, xhigh | Visual regression de rutas/estados, responsive y contraste. Aceptación: cero override retirado sin equivalencia y duplicados reducidos con budget. Rollback por bloque/feature. Fase 7 |
| **M-02 Sin splitting/Error Boundary** — confirmado, media, arquitectura/runtime | Un JS de 391,29 kB, sin `lazy/Suspense/ErrorBoundary`. T: carga/caída global; U: espera/pantalla rota; B: conversión/soporte. P media/R media | FE `App.jsx`, `AppView.jsx`, router/layout; observabilidad M-15 | Lazy por dominios y boundaries global/ruta con fallback y logging. Alternativa splitting manual Vite solo si lazy no basta | M, 2-4 días; GPT-5.6 xhigh | Test de chunk load error y boundary; inspección build/network. Aceptación: chunks por ruta y recuperación observable. Rollback imports por dominio. Fases 5/7 |
| **M-03 Filtros fuera de URL** — confirmado, media, routing/UX | Estado solo React. T: navegación no reproducible; U: back/share fallan; B: analítica/SEO. P alta/R media | FE catálogo/router; depende RFC routing | `searchParams` validados como autoridad y defaults compatibles. Alternativa mantener estado local solo para inputs no aplicados | M, 2-3 días; GPT-5.6 xhigh | Unit parse/serialize, E2E deep link/back/forward. Aceptación: URL reproduce filtros/página. Rollback adapter que lee ambos. Fase 5 catálogo |
| **M-04 `busy`/Notice globales** — confirmado, media, estado/UX | Un boolean/message para operaciones. T: bloqueos cruzados; U: feedback ambiguo; B: abandono. P alta/R media | FE controller, `Notice`, formularios; depende extracción feature | Estado async por operación, error inline y notice tipado. Alternativa mínima: mapa de operation IDs antes de migrar | M, 3-5 días; GPT-5.6 xhigh | Concurrencia de acciones, 4xx/5xx/retry; aceptación: una operación no bloquea otra y éxito/error distinguibles. Rollback por feature. Fase 5 |
| **M-05 Destructivas sin confirmación** — confirmado, media, UX/seguridad accidental | Delete directo en admin/cuenta/pedidos. T/U/B: pérdida accidental, soporte y datos. P media/R baja | FE `AdminView`, `AccountView`, `OrdersView`; BE para idempotencia/auditoría; producto define textos | Dialog accesible con impacto, confirmación y busy; undo solo donde backend lo soporte. No usar `window.confirm` como solución final | S/M, 2-4 días; GPT-5.6 xhigh | Teclado/foco/Escape/doble click/409. Aceptación: acción irreversible requiere confirmación contextual. Rollback deshabilita acción, no elimina guard. Fases 2 (cancel) y 7/general |
| **M-06 Auth incompleto/errores** — parcialmente confirmado, media, auth/UX | UI no ofrece verify resend/reset; backend sí tiene endpoints; password persiste en estado y errores genéricos/inglés. T: flujo truncado; U: bloqueo; B: soporte. P alta/R alta | FE account/auth, BE auth; email/soporte EXT. Bloquean política de cuenta y UX | Flujos verify/reset/resend, errores por campo y limpiar secretos. Alternativa enlace a soporte temporal aprobado | M/L, 4-8 días; GPT-5.6 max | E2E expirado/usado/rate limit/no enumeración; aceptación con backend real y copy aprobado. Rollback por rutas independientes. Fase 5 auth/6 seguridad |
| **M-07 Cliente HTTP débil** — confirmado, media, datos | Sin timeout, error tipado, request ID expuesto, single-flight. T: recuperación/observabilidad; U: spinners/errores; B: soporte. P alta/R alta | FE `apiClient.js`; BE aporta `X-Request-Id`; depende H-08/H-09 | Cliente único con AbortSignal, timeout, error normalizado y refresh coordinado. Alternativa wrapper nativo; librería solo por RFC | M/L, 4-7 días; GPT-5.6 max | Unit 204/text/json, timeout, abort, 401 simultáneos, retry unsafe. Aceptación: contrato único y IDs correlacionables sin PII. Rollback adapter. Fase 8 |
| **M-08 Sin tipos/schemas runtime** — confirmado, media, contratos | JS sin TS/PropTypes/schemas; respuestas confiadas. T: fallos tardíos; U: errores runtime; B: integración. P alta/R media-alta | FE todo `src`, contrato BE; depende RFC. TypeScript es decisión, schema en borde es requisito por riesgo | Schemas runtime para externos y TS incremental por archivos tocados. Alternativa JSDoc + schemas; no conversión total | XL, 2-4 semanas incremental; GPT-5.6 max/xhigh | Fixtures válidas/inválidas, typecheck incremental. Aceptación: endpoints críticos validados y errores controlados. Rollback por adaptadores, no big-bang. Fase 8 |
| **M-09 URLs CMS arbitrarias/imágenes** — confirmado, media, seguridad/performance | `startsWith('http')`, URLs externas y sin dimensiones. T: mixed content/tracking/CLS; U: destinos no fiables; B: marca. P media/R media | FE Home/Admin/models; BE CMS, CDN/hosting y producto EXT | Parser URL HTTPS, protocolos/hosts/política, metadata alt/dimensiones, proxy/CDN si aprobado. Alternativa bloquear enlaces externos | M, 3-6 días; GPT-5.6 max | URLs `javascript:`, http, IDN, redirects, imágenes rotas; aceptación según política documentada. Rollback deshabilita link externo. Fases 6/7 |
| **M-10 Headings/tabs/carousels** — confirmado, media, a11y/SEO | Múltiples h1 y patrones ARIA ausentes. T: semántica; U: lector/teclado; B: SEO/accesibilidad. P alta/R media | FE `HomeView`, `ProductView`, carruseles | Un h1 por página, jerarquía y patrones WAI-ARIA con nativo preferido. Alternativa carrusel scroll simple sin semántica falsa | M, 2-4 días; GPT-5.6 xhigh | axe, teclado/flechas, lector muestral. Aceptación: árbol/hitos correctos. Rollback por componente manteniendo nativo. Fase 7 |
| **M-11 Listas limitadas a 100** — confirmado, media, escala/datos | `limit=100` en filtros/admin/reviews/orders/users. T: resultados incompletos; U: elementos invisibles; B: operación incorrecta. P creciente/R alta | FE controllers/models/views; BE paginación/filtros/total. Bloquea acordar contratos | Server-side page/filter/sort con total; virtualizar solo si medición. Alternativa cursor si backend lo requiere | L, 5-10 días cross-stack; GPT-5.6 max | >100 fixtures, límites, cambios de filtro, permisos. Aceptación: todos los resultados accesibles y total fiable. Rollback compatibilidad page/limit. Fase 8 |
| **M-12 Navegación incompleta** — confirmado, media, routing/UX | Wildcard a home, sin footer/scroll/focus; guards inactivos. T/U/B: deep links confusos, acceso legal/soporte. P alta/R media | FE router/AppShell; hosting rewrite M-17; legal C-03 | Router canónico, 404, footer, scroll/focus y guards. Alternativa incremental con rutas actuales envueltas | M, 3-6 días; GPT-5.6 max/xhigh | E2E deep link/404/auth/back; aceptación URLs y foco predecibles. Rollback por rutas individuales. Fases 4-5/7 |
| **M-13 Seeds/categorías duplicados** — confirmado, media, datos/mantenimiento | `categoryVisualModel`, `homeContentModel`, JSON y scripts duplican. T: drift; U: filtros erróneos; B: catálogo. P media/R media | FE models/scripts; BE seed/domain. Requiere owner de catálogo | Fuente schema/JSON canónica y adaptadores/generación. Alternativa mantener copias con test de consistencia | S/M, 1-3 días; GPT-5.6 high | Test de claves/slugs/IDs, dry-run seed. Aceptación: una autoridad documentada. Rollback conserva snapshot. Fase 8 |
| **M-14 Script Atlas acoplado** — confirmado, media, frontera/repositorio | Ruta absoluta a backend, imports internos/credenciales. T: no portable y capa violada; B: operación insegura. P alta fuera del equipo/R baja | Mover a BE o retirar; depende DevOps/datos. Archivo `scripts/seed-atlas-extremadura.mjs` | CLI backend configurada con dry-run o API autenticada. No ejecutar en Fase 0-1 | S/M, 1-2 días; GPT-5.6 high | Dry-run, entorno vacío, sin secretos/log PII. Aceptación: cero ruta absoluta en FE. Rollback mantener script deshabilitado/documentado. Fase 8 |
| **M-15 Sin observabilidad frontend** — confirmado en repo; parcial hosting, media, operaciones | Sin SDK, release/source maps/reporting. T: fallos invisibles; U: soporte lento; B: MTTR. P alta en producción/R media | FE/Vite, hosting, vendor, privacidad/legal. Bloquean vendor y consentimiento | Error/performance monitoring con release, scrub PII, sampling y runbook. Alternativa logs propios mínimos si cumplen | M, 2-4 días + vendor; GPT-5.6 max | Error intencional staging, sourcemap privado, consent, request ID. Aceptación: alerta accionable y no PII. Rollback flag/vendor disable. Fases 6/8/9 |
| **M-16 Runtime no fijado** — nuevo confirmado, media, reproducibilidad | No `engines`, `.nvmrc` ni Volta; baseline depende Node 20.19.5/npm 10.8.2. T/B: CI/local divergentes; U indirecto. P media/R baja | Raíz/package/CI; decisión de plataforma | Documentar y fijar rango LTS compatible tras probar. Alternativa imagen CI pinneada; no actualizar dependencias | S, 0,5 día; GPT-5.6 high | Matrix mínima o versión única CI, `npm ci/build/lint`. Aceptación: mismo resultado limpio local/CI. Rollback del pin si incompatible documentando causa. Fases 1/3 |
| **M-17 Despliegue/rewrites/headers no versionados** — nuevo parcial y dependiente hosting, media, producción | Sin config de host/staging; rutas BrowserRouter y headers SPA no verificables. T: deep links 404/CSP ausente; U: enlaces rotos; B: release. P desconocida/R alta | Hosting/DevOps EXT, FE Vite/router; API Helmet no cubre HTML SPA | Elegir hosting, versionar rewrites, headers, env validation y preview. Alternativa HashRouter solo con justificación, no recomendada por defecto | M, 2-5 días; GPT-5.6 max | Deep links, refresh, CSP report-only→enforce, cache assets/HTML. Aceptación en staging. Rollback config/slot previo. Fases 1/6/9 |

| ID y hallazgo (bajo) | Evidencia/impacto y alcance | Solución/alternativas; dependencias | Esfuerzo/modelo | Tests/aceptación/rollback/fase |
| --- | --- | --- | --- | --- |
| **L-01 Build deps en `dependencies`** — confirmado | `vite` y plugin React; T/B instalación/producción, U nulo; P alta/R baja. `package.json/lock` FE | Mover solo tras política y regenerar lock; no cambia runtime. Alternativa dejar si plataforma instala prod-only para build | S <0,5 d; GPT-5.6 high | `npm ci`, build; diff lock limitado. Rollback package+lock. Fase 3/8 |
| **L-02 Sin formatter/editorconfig** — confirmado, recomendación opcional | Formato futuro; impacto bajo. Raíz/CI | Equipo decide Prettier/EditorConfig; no obligatorio si ESLint/convensión bastan | S <0,5 d; high | Check no reformat masivo. Aceptación: solo archivos tocados. Rollback config. Fase 3 |
| **L-03 README divergente** — confirmado | Supplier/SEO/cookies/cuenta vs runtime; U/B falsa expectativa. README | Documentar matriz real y flags después de decisiones; no prometer roadmap | S 0,5 d; high | Links/scripts revisados. Aceptación coincide con grafo. Rollback documental. Fases 0/4/5 |
| **L-04 `.gitignore` incompleto** — confirmado | Untracked Codex/backup/Zone; riesgo commit accidental. Raíz/Git; cambios locales preexistentes bloquean limpieza automática | Ignorar patrones aprobados; clasificar antes. No `git clean` | S <0,5 d; high | `git status` esperado; no ocultar artefacto necesario. Rollback línea a línea. Fase 0 |
| **L-05 Copy/rutas inconsistentes** — confirmado | Textos sin tildes y `/gestion` vs `/admin`; U/SEO/soporte. Defaults/router | Copy aprobado e idioma/rutas canónicos con redirects | S/M 1-2 d; xhigh por rutas | Snapshot semántico/E2E redirects. Rollback copy/redirect. Fases 4/7 |
| **L-06 Sort duplicado/prop sin uso** — confirmado | Dos `createdAt:desc`, `Header.view` no usado; confusión. Catalog/Header/controller | Diferenciar relevancia si backend lo soporta o retirar; usar/remove prop tras tests | S <0,5 d; high | Unit query y smoke nav. Rollback aislado. Fase 2 quick win si directamente relacionado con lint; si no, 5 |
| **L-07 Preview sin consumidor** — confirmado | `DesignSystemPreview` desconectado y CSS entregado; valor incierto. FE UI | Investigar; convertir en herramienta solo si equipo la usa, o eliminar tras RFC. Storybook no obligatorio | S decisión; GPT-5.6 high | Referencias/grafo y visual antes de retirar. Rollback restaurar módulo. Fase 7 |
| **N-01 Workspace apunta al repo equivocado** — nuevo, alta operativa | Entorno inicial backend; FE es hermano y tiene remoto distinto. T/B: cambios en repo incorrecto; P alta si prompt omite preflight/R crítica | Gobierno/Git; responsable operador. Bloquea toda fase | Preflight obligatorio `pwd`, `git remote -v`, branch, HEAD y documentos; abortar si no es FE. No automatizar `cd` silencioso | S inmediato; GPT-5.6 max en F0 | Gate 0 registra ruta/remoto/commit. Aceptación antes de cada sesión. Rollback: no aplicar cambios y cerrar rama equivocada sin borrar nada. Fase 0 |

## 6. Matriz de módulos desconectados

Ningún módulo de esta tabla se integra o elimina durante esta planificación. “Consumidor esperado” es una inferencia por nombre/imports y debe validarse en RFC.

| Módulo | Propósito aparente / estado real | Consumidores esperados / dependencias rotas | Valor reutilizable / riesgo | Decisión provisional | Resolución |
| --- | --- | --- | --- | --- | --- |
| `src/api.js` | Fachada legacy de auth/API; inalcanzable | Imports históricos; dependencias internas válidas pero duplica exports | Bajo/medio; riesgo de dos APIs | Conservar provisionalmente e investigar; probablemente eliminar tras grafo histórico | Fase 4/5 auth |
| `src/components/cms/CmsResponsiveImage.jsx` | `<picture>` CMS; inalcanzable | Home/CMS futuros; no dimensiones/lazy/sizes | Medio; pieza pequeña mejorable, integración baja-media | Investigar e integrar solo dentro de estrategia de imágenes | Fase 7 |
| `adminControllerActions.js` | Factory de admin refactor; inalcanzable | Controller futuro; llama métodos ausentes de `adminModel` (list/all supplier/approve/reject…) | Partes CRUD reutilizables; riesgo muy alto | Reescribir/extraer selectivamente, no integrar | Fase 4 y 5 admin |
| `authAccountControllerActions.js` | Auth/perfil ampliado; inalcanzable | Account/controller; `authModel.registerSupplier` no existe | Helpers/copy reutilizables; riesgo alto auth | Reescribir selectivamente sobre contratos verificados | Fase 5 auth/supplier |
| `cartCheckoutControllerActions.js` | Carrito/checkout extraído; inalcanzable | Controller; replica tarjeta oculta/validator roto | Carrito reusable tras tests; checkout no | Conservar como referencia; reescribir desde C-01 estabilizado | Fase 5 cart/checkout |
| `catalogControllerActions.js` | Catálogo/detalle extraído; inalcanzable | Controller futuro; replica límites/races/review doble | Medio-alto como punto de extracción; riesgo medio | Integrar solo tras corregir H-09 y tests | Fase 5 catálogo |
| `controllerHelpers.js` | Helpers compartidos; inalcanzable | Factories; duplica activos y contiene validator de tarjeta inválido | Funciones de ruta/form útiles; riesgo medio | Clasificar función a función; eliminar validator pago | Fase 4/5 |
| `controllerInitialState.js` | Estado común refactor; inalcanzable | Factories/controller inexistente; conserva PAN/CVC y estados supplier | Defaults no sensibles reutilizables; riesgo alto si se conecta | Reescribir por feature; no convertir en estado global canónico | Fase 4/5 |
| `controllerRoutes.js` | Mapa de rutas ampliado; inalcanzable | Router/controller futuro; diverge `/gestion` vs `/admin/*` | Inventario útil; riesgo alto de doble autoridad | Usar como input RFC y reemplazar por router declarativo único | Fase 4 |
| `homeContentControllerActions.js` | Acciones CMS extraídas; inalcanzable | Controller futuro; duplica lógica activa | Valor medio, contratos mayormente existentes; riesgo medio | Investigar y extraer tras caracterización CMS | Fase 5 admin/home |
| `reviewControllerActions.js` | Reseñas extraídas; inalcanzable | Controller futuro; repite creación en lugar de update | CRUD cuenta reusable; submit producto roto | Reescribir desde H-04 corregido | Fase 5 producto/reseñas |
| `supplierControllerActions.js` | Orquestación supplier; inalcanzable | Supplier feature/controller futuro; no cubre mensajes que vista exige | Valor medio, endpoints mayormente existen; riesgo alto por estado incompleto | Investigar/rewrite por subfeature | Fase 5 supplier |
| `supplierMessageModel.js` | API de mensajes; inalcanzable | Supplier/Account; acciones orquestadoras ausentes | Contratos parecen corresponder al backend; riesgo medio | Conservar e investigar con matriz endpoint/roles | Fase 4/5 supplier |
| `supplierModel.js` | API supplier; inalcanzable | Supplier actions; registro usa `fetch` paralelo sin cliente común | Valor alto parcial; riesgo auth/error/cancel | Mover a cliente HTTP canónico y validar endpoint por endpoint | Fase 5/8 |
| `userModel.js` | Update/delete perfil; inalcanzable | Account actions; permisos dependen backend | Pequeño y reusable; riesgo medio auth/ownership | Integrar solo tras tests de owner/admin | Fase 5 auth/account |
| `utils/analytics.js` | Eventos consent-aware; inalcanzable | Vistas/checkout; no hay loader ni CMP runtime | Nombres útiles; alto riesgo legal/duplicidad purchase | Conservar, revisar e integrar solo tras CMP/plan analytics | Fase 6 |
| `AuthGuards.jsx` | Guards admin/supplier/user; inalcanzable | Router futuro; rutas supplier inactivas | Alto valor conceptual; riesgo medio por redirects/roles | Integrar/rewrite dentro de router canónico | Fase 4/5 |
| `CookieConsent.jsx` | Banner prototipo; inalcanzable | AppShell; no controla tags, reapertura ni foco completo | Valor bajo-medio; alto riesgo de falsa conformidad | Reescribir o sustituir según legal/CMP | Fase 6 |
| `DesignSystemPreview.jsx` | Preview interno; inalcanzable | Desarrollo/Storybook inexistente | Valor incierto; bajo riesgo runtime pero CSS muerto | Investigar; eliminar o formalizar según uso real | Fase 7 |
| `LegalView.jsx` | Páginas legales placeholder; inalcanzable | Router/footer; requiere contenido aprobado | Estructura reusable, contenido no | Reescribir contenido con legal; integrar solo tras aprobación | Fase 6 |
| `SeoManager.jsx` | Meta/canonical/JSON-LD; inalcanzable | App/router; rutas y datos divergentes | Valor medio; riesgo SEO por datos/canonical incorrectos | Investigar e integrar tras router/estrategia SEO | Fase 5/7 |
| `SupplierView.jsx` | Panel supplier monolítico; inalcanzable | Router + estado/actions no existentes; 21 contratos, mensajes incompletos | UI/flujo como inventario; riesgo muy alto | Reescribir por subrutas/features; no montar tal cual | Fase 5 supplier, al final |

Las reglas CSS de supplier/legal/consent/preview sí se entregan porque `styles.css` es global; se clasifican en M-01, no convierten esos JSX en alcanzables.

## 7. Decisión arquitectónica

| Criterio | A. Conservar controller y extraer | B. Conectar refactor existente | C. Híbrida incremental selectiva | D. Reescritura total |
| --- | --- | --- | --- | --- |
| Coste/duración | Medio; semanas, entregable | Aparenta bajo, real alto por contratos rotos | Medio-alto controlable; semanas por dominio | Muy alto; meses + doble mantenimiento |
| Riesgo/regresión | Medio si hay tests | Muy alto: checkout y APIs rotas | Medio y decreciente por gates | Crítico por paridad y big bang |
| Rollback | Alto por extracción pequeña | Bajo tras conexión amplia | Muy alto por adapters/feature PR | Bajo/caro |
| Testabilidad | Mejora gradualmente | Factories aislables, pero ensamblaje ausente | Alta: se prueba antes y después por dominio | Alta al final, baja durante transición |
| Deuda residual | Controller temporal | Duplicación y contratos heredados | Deuda explícita con retirada por feature | Puede recrear deuda sin conocimiento |
| Reutilización real | Parte del runtime probado | Sobreestimada; varios métodos inexistentes | Solo piezas verificadas | Baja; descarta valor útil |
| Compatibilidad | Máxima inicial | No demostrada | Máxima con adaptadores | Requiere paridad completa |
| Impacto negocio | Entrega rápida de fixes | Riesgo de interrupción | Entrega incremental y visible | Largo periodo sin valor |
| Complejidad temporal | God hook persiste un tiempo | Dos arquitecturas activas durante montaje | Dos capas, pero autoridad por feature y fecha de retirada | Dos productos completos en paralelo |
| Capacidad incremental | Alta | Baja/media | Muy alta | Baja |

**Decisión provisional: opción C**, usando A como mecanismo temporal. El controller activo sigue siendo autoridad solo para features no migradas; una feature pasa a autoridad nueva cuando: (1) tiene tests de caracterización, (2) contratos internos y HTTP explícitos, (3) no hay consumidores dobles, (4) smoke/E2E pasan, (5) existe rollback. La opción B queda descartada como conexión masiva por evidencia de contratos rotos. D no está justificada: el build, modelos, UI y backend ofrecen suficiente base para migración incremental.

Arquitectura objetivo a ratificar en RFC, no mandato previo:

```text
src/app/{router,providers,layout}
src/features/{catalog,product,reviews,cart,checkout,auth,account,admin,supplier}
src/entities/{product,order,user,supplier}
src/shared/{api,schemas,ui,lib,styles}
```

Reglas: router declarativo único; provider de sesión pequeño; estado servidor separado del UI; cliente HTTP único; schemas en el borde; rutas lazy por dominio; dependencias de feature explícitas; adaptadores temporales con issue/fecha de retirada.

## 8. Roadmap por fases

| Fase | Resultado principal | Contenido obligatorio | Gate de salida | Estimación orientativa* |
| ---: | --- | --- | --- | --- |
| 0 | Gobierno y protección | `AGENTS.md`, features, Git, DoD, rollback, freeze | Gate 0 | 0,5-1,5 días |
| 1 | Baseline reproducible | `BASELINE_FRONTEND.md`, comandos, rutas/flujos, bundle/assets, límites | Gate 1 | 0,5-1,5 días |
| 2 | Flujos críticos estables | C-01, H-03, H-04, H-05, H-12 y quick wins inseparables | Gate 2 | 2-5 días |
| 3 | Red de seguridad | Vitest, RTL, MSW, Playwright, Actions, cobertura/gates | Gate 3 | 5-10 días |
| 4 | Arquitectura aprobada | RFC, autoridad canónica, contratos, retirada y secuencia | Gate 4 | 2-4 días |
| 5 | Migración por features | catálogo; producto/reseñas; cart/checkout; auth/cuenta; admin; supplier | Gate 5 por dominio | 3-7 semanas incrementales |
| 6 | Seguridad/pago/cumplimiento | proveedor, webhooks, auth segura, headers, legales/CMP/analytics | Gate 6 | 2-6 semanas + terceros/legal |
| 7 | A11y/UI/performance | interacciones, responsive, assets, splitting, CSS, axe/Lighthouse | Gate 7 | 1-3 semanas |
| 8 | Contratos y escala | HTTP, schemas, TS incremental, paginación/cache/concurrencia/observabilidad | Gate 8 | 2-5 semanas incrementales |
| 9 | Revisión y producción | auditorías, staging, rollback, monitoring, GO decision | Gate 9 | 3-10 días + soak |

\* Rangos de esfuerzo de ingeniería, no fechas ni compromisos. Excluyen esperas de producto, legal, proveedor, datos y cuentas externas; se reestiman al entrar en cada fase.

No se incluyen en Fase 2: gran refactor, rediseño, TypeScript global, supplier completo ni pago definitivo. Los tests de caracterización se planifican en Fase 1, se crean en Fase 3 y preceden a la refactorización de Fases 4-5. Fase 2 se limita a reparaciones conductuales pequeñas con smoke manual documentado.

## 9. Detalle obligatorio de cada fase

### Fase 0 — Gobierno y protección

- **Objetivo/justificación:** impedir más divergencia y errores operativos antes de tocar runtime; resolver N-01 y L-04.
- **Entrada:** plan aprobado; acceso al repositorio frontend correcto; inventario de untracked y responsables.
- **Alcance:** crear `AGENTS.md`, `FEATURE_MATRIX_FRONTEND.md` o sección equivalente, política Git/commits/validación/rollback, Definition of Done, freeze de nuevas features y owners FE/BE/product/legal/hosting.
- **Exclusiones:** código productivo, dependencias, lint, tests, limpieza de archivos, conexión/eliminación de módulos.
- **Tareas y orden:** (1) preflight ruta/remoto/HEAD/status; (2) clasificar untracked sin moverlos; (3) matriz activa/desconectada/incompleta/descartada; (4) reglas de ramas/PR; (5) DoD y severidades; (6) rollback y escalado; (7) revisión humana.
- **Dependencias/bloqueadores:** responsable de producto para freeze y supplier; maintainer para branch protection; decidir si auditoría/plan se versionan.
- **Entregables:** `AGENTS.md`, matriz de features, política de ramas/commits, reglas de validación, criterios de rollback y acta Gate 0. No código productivo.
- **Modelo/razonamiento:** GPT-5.6 Sol, max.
- **Validación automática:** `pwd`; `git remote -v`; `git status --short --branch`; `git rev-parse HEAD`; `git diff --check`; revisión de links/Markdown. No `npm` necesario.
- **Validación manual:** dos revisores confirman rutas, owners, estados de feature y que ningún untracked ajeno se ocultó/perdió.
- **Aceptación/salida:** todos los campos Gate 0 medibles y firmados; freeze comunicado; cada feature tiene estado y owner; ninguna ambigüedad entre backend/frontend.
- **Rollback:** revertir solo el PR documental; conservar copia aprobada del inventario. No borrar archivos locales.
- **Riesgos:** burocracia excesiva; mitigar con documentos cortos y reglas ejecutables. Ocultar untracked mediante `.gitignore` sin clasificar; prohibido.
- **Estimación:** 0,5-1,5 días.
- **Commits previstos:** `docs(governance): add frontend execution rules`; `docs(governance): classify frontend features` si el segundo es revisable solo.
- **Rama:** `docs/remediation-f0-governance` desde `main` frontend.
- **Push:** solo tras revisión de diff, worktree conocido y aprobación explícita. **No push** si el repo/remoto/HEAD no coincide, hay cambios no atribuidos, falta owner o se mezcló código.

### Fase 1 — Baseline reproducible

- **Objetivo/justificación:** fijar evidencia repetible antes de cualquier cambio y evitar comparar contra memoria.
- **Entrada:** Gate 0; checkout limpio/controlado o clon aislado; runtime decidido provisionalmente.
- **Alcance:** `BASELINE_FRONTEND.md` con Node/npm/OS, install reproducible, build/lint/audit/tests/CI, import graph, rutas/flujos críticos, errores preexistentes, endpoints usados, bundle/chunks/assets/CSS y límites de ejecución.
- **Exclusiones:** corregir resultados, instalar tooling de tests, editar configuración productiva, ejecutar seeds o datos reales.
- **Tareas/orden:** preflight; usar clon/worktree aislado; `npm ci`; capturar comandos/salidas; generar grafo; medir assets/bundle; listar flujos con precondiciones; contrastar BE commit; repetir build para variabilidad; redactar baseline y revisión.
- **Dependencias/bloqueadores:** versión Node aprobada (M-16), acceso registry, commit backend registrado, entorno sin secretos. Staging no requerido.
- **Entregables:** `BASELINE_FRONTEND.md`, resultados de build/lint/audit, estado tests, rutas/flujos, errores, métricas y limitaciones; diseño de tests de caracterización sin crearlos.
- **Modelo/razonamiento:** GPT-5.6 Sol high para captura, xhigh para interpretación.
- **Comandos:** `git status --short --branch`; `node --version`; `npm --version`; `npm ci`; `npm run build`; `npm run lint`; `npm audit --json`; búsqueda de tests/workflows; script de alcanzabilidad; tamaños de `dist` y `public`. Ejecutar en entorno aislado para no contaminar el worktree principal.
- **Manual:** recorrer home, catálogo, producto, cuenta, cesta, pedidos y admin solo si API/fixtures seguros existen; si no, marcar “no ejecutado”, nunca “pasa”.
- **Aceptación/salida:** otra persona reproduce los resultados desde `package-lock`; baseline cita commit FE/BE; fallos esperados están enumerados; cero remediaciones ocultas.
- **Rollback:** revertir documento/artefactos generados; `dist/coverage` deben estar ignorados. No limpiar archivos desconocidos.
- **Riesgos:** red/registry variable, base de datos cambiante y audit temporal; registrar timestamp y distinguir estático/runtime.
- **Estimación:** 0,5-1,5 días.
- **Commits:** `docs(baseline): record frontend e623d5a`; métricas generadas solo si son pequeñas y deliberadamente versionadas.
- **Rama:** `docs/remediation-f1-baseline`, dependiente de merge F0.
- **Push:** tras reproducción por segundo entorno/revisor. **No push** si se alteró lock/config/código, faltan salidas o baseline afirma flujos no ejecutados.

### Fase 2 — Estabilización funcional crítica

- **Objetivo/justificación:** recuperar el comportamiento mínimo sin reestructurar arquitectura.
- **Entrada:** Gates 0-1; decisión humana “beta pedido pendiente” vs checkout deshabilitado; backend contract snapshot; plan de smoke/rollback por ID.
- **Alcance:** en orden estricto C-01, H-03, H-04, H-05, H-12. Quick wins solo si inseparables del diff: errores checkout accesibles, confirmación cancel, sort duplicado/prop unused cuando lint los toque.
- **Exclusiones:** C-02 pago definitivo, C-03 legal, supplier, query library, router nuevo, TS, rediseño, extracción de controller.
- **Tareas/orden:** (1) C-01 contrato visible; (2) revisión y smoke; (3) H-03 cancel; (4) H-04 review update; (5) H-05 endpoint admin; (6) H-12 por archivos/causa; (7) build/lint/smoke acumulado; un commit por ID.
- **Dependencias/bloqueadores:** producto decide checkout temporal; política cancelación; fixtures/usuarios para manual; endpoint BE actual. Si producto exige cobro inmediato, C-01 solo puede deshabilitar checkout y C-02 bloquea producción.
- **Entregables:** cinco PRs o commits claramente separables, registro de validación y rollback, README solo si cambia la capacidad visible.
- **Modelo/razonamiento:** GPT-5.6 Sol xhigh; max para C-01 y revisión cross-stack.
- **Comandos:** `npm run lint`; `npm run build`; inspección `git diff --check`; hasta Fase 3, scripts ad hoc no se versionan como sustituto de tests. Si ya existe harness por adelanto aprobado, ejecutar tests del flujo.
- **Manual:** checkout items/shipping/payment con success/error/refresh; cancelar pending y rechazo no-pending; crear/editar reseña; admin ve draft/pending y público no; teclado/móvil.
- **Aceptación/salida:** Gate 2; checkout temporal coherente o explícitamente deshabilitado; no TypeError cancel; PATCH review; admin completo; lint 0 errores/0 warnings; build pasa; ningún alcance extra.
- **Rollback:** C-01 flag/CTA off; H-03 deshabilitar cancel; H-04 impedir submit si ownReview; H-05 volver a listado con warning interno; H-12 revert por archivo. No rollback conjunto salvo incidente compartido.
- **Riesgos:** confundir pedido pendiente con pago, limpiar carrito ante fallo, refrescar caches equivocadas, silenciar lint. Revisión de payload/orden de awaits obligatoria.
- **Estimación:** 2-5 días.
- **Commits:** `fix(checkout): align pending order contract [C-01]`; `fix(orders): wire customer cancellation [H-03]`; `fix(reviews): update existing product review [H-04]`; `fix(admin): use complete product listing [H-05]`; `fix(lint): resolve existing frontend findings [H-12]`.
- **Ramas:** una por ID (`fix/c01-checkout-contract`, etc.) desde main actualizado; merge en el orden anterior.
- **Push:** cada ID solo tras revisión/validación local y autorización. **No push** si lint/build empeoran, no hay decisión C-01, se tocaron dependencias/arquitectura o un diff contiene otro ID.

### Fase 3 — Red de seguridad y CI

- **Objetivo/justificación:** convertir flujos críticos en gates antes de refactorizar.
- **Entrada:** Gate 2; contratos estabilizados; política CI y runners; Node fijado.
- **Alcance:** Vitest, React Testing Library, `@testing-library/user-event`, MSW, Playwright, GitHub Actions, cobertura, E2E smoke, audit y bundle budget. Versiones se eligen por compatibilidad y se fijan en lock, no por moda.
- **Exclusiones:** refactor productivo salvo seam mínimo justificado para test; snapshots visuales masivos; supplier si no está aprobado.
- **Tareas/orden:** ADR tooling; unit setup/jsdom; MSW handlers/fixtures; tests críticos; Playwright config; smoke; coverage ratchet; workflow CI; required checks; guía de debugging/flakes.
- **Flujos exactos:** (1) navegación anónima home→catálogo→producto; (2) búsqueda/filtros y respuesta fuera de orden; (3) login/error/expiración; (4) add/update/remove cart; (5) checkout pendiente success/validation/stock/401; (6) cancel pending y rechazo; (7) create/update/delete review; (8) admin ve todos los estados y usuario recibe deny; (9) error boundary cuando exista; (10) supplier solo cuando se active.
- **Dependencias/bloqueadores:** Actions habilitado, branch protection, estrategia de API E2E (MSW para integración; staging/servicio efímero para contrato real), secretos mínimos.
- **Entregables:** configs, tests, handlers, fixtures, workflows, política coverage/flakes y Gate 3.
- **Modelo/razonamiento:** GPT-5.6 Sol xhigh.
- **Comandos:** `npm ci`; `npm run lint`; `npm run test -- --run`; `npm run test:coverage`; `npm run build`; `npm run e2e`; `npm audit --audit-level=moderate`. Scripts exactos se fijan en `package.json`.
- **Manual:** reproducir un test fallando, trace Playwright, ejecución local limpia y re-run CI; inspeccionar que MSW no oculta contrato BE.
- **Aceptación/salida:** checks obligatorios; cero flakes conocidos sin issue/owner/plazo; módulos críticos C-01/H-03/H-04/H-05 con ≥80 % branches/lines y global registrado/ratcheted (no bajar); E2E smoke < presupuesto acordado; CI en PR nuevo.
- **Rollback:** revertir workflow/harness por commits sin retirar pruebas de comportamiento; si runner falla, check queda bloqueado hasta arreglar o excepción temporal firmada y caducable.
- **Riesgos:** mocks irreales, coverage gaming, E2E compartiendo datos. Contract fixtures y factories idempotentes.
- **Estimación:** 5-10 días.
- **Commits:** `test(setup): add vitest rtl and msw`; `test(critical): cover checkout orders reviews admin`; `test(e2e): add critical smoke`; `ci(frontend): enforce quality gates`.
- **Ramas:** `test/frontend-critical-flows` para harness/tests y `ci/frontend-quality-gates` para workflows/gates, divisibles en PRs encadenadas cortas.
- **Push:** tras `npm ci` limpio y revisión lock/licencias. **No push** con tests skipped/focused, secretos, flakes o workflow permisivo (`continue-on-error`) sin excepción.

### Fase 4 — Decisión arquitectónica definitiva

- **Objetivo/justificación:** aprobar la autoridad canónica antes de mover responsabilidades.
- **Entrada:** Gate 3; métricas del god hook/grafo; matriz de módulos y experiencia Fases 2-3.
- **Alcance:** RFC con opciones A-D, decisión, app shell/router/providers, límites por feature/entity/shared, contratos internos, estado remoto/local, adapters, flags, retirada y orden.
- **Exclusiones:** migrar features, introducir librerías o borrar módulos.
- **Tareas/orden:** actualizar evidencia; workshops FE/BE/product; prototipo documental de dependencias; ADR router/query/schema; plan de compatibilidad; criterios por dominio; revisión independiente; aprobación.
- **Dependencias/bloqueadores:** product scope supplier/CMS, estrategia auth/payments, capacidad equipo. Si no hay acuerdo, mantener arquitectura activa y no iniciar F5.
- **Entregables:** `RFC_FRONTEND_ARCHITECTURE.md`, ADRs necesarios, mapa de dependencias, lista de adapters/retirada y Gate 4.
- **Modelo/razonamiento:** GPT-5.6 Sol max.
- **Comandos:** scripts de grafo/LOC/complejidad, `npm run test`, `npm run build`; validación documental de links y contratos.
- **Manual:** walkthrough de cambios tipo (catálogo, auth, admin) y rollback simulado.
- **Aceptación/salida:** una autoridad por dominio, reglas de imports, estrategia de datos y routing, secuencia y owners aprobados; decisiones diferidas con fecha límite.
- **Rollback:** RFC supersedable mediante nueva RFC; no cambia runtime.
- **Riesgos:** diseñar arquitectura ideal sin capacidad o elegir librería por preferencia. Exigir problema medido y spike time-boxed.
- **Estimación:** 2-4 días.
- **Commits:** `docs(architecture): decide canonical frontend architecture`; ADRs separados si independientes.
- **Rama:** `docs/remediation-f4-architecture`.
- **Push:** solo con Gate 3 verde y aprobadores. **No push** como “aprobado” si quedan alternativas sin decisión o si el RFC esconde implementación.

### Fase 5 — Refactorización incremental por features

- **Objetivo/justificación:** retirar el controlador monolítico sin interrumpir entregas ni duplicar autoridad.
- **Entrada:** Gate 4; tests/CI verdes; adapter/rollback acordado para la subfase.
- **Alcance común:** una feature por subfase, contratos estrechos, rutas/estado/API propios, retirada del código antiguo solo tras equivalencia.
- **Exclusiones comunes:** rediseño global, auth/pago cross-stack de F6, TypeScript global, supplier si producto no lo aprueba.
- **Orden evaluado:** catálogo → producto/reseñas → cart/checkout → auth/cuenta → administración → supplier. Alterarlo requiere RFC corta basada en dependencia/negocio.
- **Dependencias/bloqueadores:** cada subfase depende de la anterior solo cuando comparte router/API; supplier depende de decisión humana y contratos mensajes/reportes.
- **Entregables:** módulos de feature, tests, grafo actualizado, adapter retirado, notas de migración por subfase.
- **Modelo/razonamiento:** GPT-5.6 Sol xhigh; max en cart/auth y revisiones de límites.
- **Comandos comunes:** `npm run lint`; tests unit/integration de feature; coverage; `npm run build`; E2E afectados; script de grafo; bundle diff.
- **Manual común:** success/loading/empty/error/disabled, 401/403, back/forward, móvil/teclado, red lenta.
- **Aceptación/salida común:** un solo owner/flujo de datos; no import dual; tests y budgets no bajan; código antiguo de esa feature clasificado y retirado/aislado.
- **Rollback común:** revert de PR/subfase o feature flag/adaptador; no migración de datos irreversible sin dual-read/versionado.
- **Riesgos:** convertir el controller en varios god hooks, Context global o abstracciones prematuras. Revisar API pública de cada feature.
- **Estimación:** 3-7 semanas total, reestimada por subfase.
- **Rama/push:** `refactor/<feature>-canonical`; PR ≤ una feature y preferiblemente ≤3-5 días de revisión. Push solo con CI local/remote y diff revisado; no push con duplicación, snapshots masivos o cambios visuales no previstos.

#### Fase 5.1 — Catálogo

- **Incluye:** filtros URL, carga/paginación, cancelación/dedupe inicial, `CatalogView`, `ProductCard` routing real; no ficha completa ni rediseño.
- **Archivos previsibles:** `App/AppView`, controller/catalog factory, `catalogModel`, `CatalogView`, `ProductCard`, nuevos `features/catalog/*`.
- **Pruebas/salida:** deep links, race, filtros, favoritos y >1 página; controller deja de poseer catálogo. Rollback adapter al API anterior.
- **Commits:** seam/router; data layer; UI; retirar duplicado. Estimación 3-6 días.

#### Fase 5.2 — Producto y reseñas

- **Incluye:** detalle, gallery/tabs y CRUD reseñas ya corregido; no sistema visual global.
- **Archivos:** `ProductView`, review/product models, controller/factory, feature nueva.
- **Pruebas/salida:** cambio de producto resetea estado, HTML sanitizado, create/update/delete, errores/races; una autoridad. Rollback por ruta. Commits data/reviews/UI/cleanup. 3-5 días.

#### Fase 5.3 — Carrito y checkout

- **Incluye:** cart y checkout temporal estable; prepara interfaz de pago sin implementar proveedor.
- **Archivos:** `CartView`, cart/order models, controller/factory, feature nueva.
- **Pruebas/salida:** carrito, validación, pedido único, preservación en error/401; no PAN/CVC ni duplicados. Rollback flag/adapter. Commits cart, checkout state machine, cleanup. 3-6 días.

#### Fase 5.4 — Autenticación y cuenta

- **Incluye:** sesión provider mínimo, guards, perfil/reseñas/flujos auth acordados; migración HttpOnly queda coordinada en F6.
- **Archivos:** `AccountView`, `AuthGuards`, auth/session/user/api models, controller/factory.
- **Pruebas/salida:** roles, refresh actual, logout, redirects y secretos limpiados; controller deja auth. Rollback provider adapter. Commits provider/guards/account/cleanup. 4-8 días.

#### Fase 5.5 — Administración

- **Incluye:** dividir `AdminView` por subrutas (dashboard/home/products/categories/orders/users/reviews y solo dominios aprobados); no supplier indirecto.
- **Archivos:** `AdminView`, admin/order/home models/actions, rutas `features/admin/*`.
- **Pruebas/salida:** permisos por ruta, listados completos, CRUD/confirmaciones; admin no carga en chunk público. Rollback subruta. Commits shell y una subfeature por commit/PR. 6-12 días.

#### Fase 5.6 — Supplier

- **Incluye:** solo matriz aprobada: alta/login/perfil/productos/moderación/ofertas/mensajes/reportes/pedidos, cada una como sub-PR; puede decidirse “fuera de alcance”.
- **Archivos:** `SupplierView`, supplier/message models/actions, guards/router y backend correspondiente.
- **Pruebas/salida:** ownership/roles, cada endpoint y estado; nada anunciado sin runtime. Rollback feature flag/ruta. Commits por subfeature, nunca la vista completa. 1-3 semanas si se incluye.

### Fase 6 — Seguridad, pagos y cumplimiento

- **Objetivo/justificación:** habilitar producción cobrable y reducir riesgo de sesión/privacidad.
- **Entrada:** Gates 3-5 relevantes; proveedor/merchant, modelo auth, hosting y textos legales decididos; threat model.
- **Alcance:** PaymentIntent o redirect seguro; webhooks firmados, idempotencia, estados/refunds; refresh HttpOnly/access memoria/logout/revocación; CSP/headers del SPA; URLs CMS; privacidad/cookies/condiciones/devoluciones/consentimiento/analytics.
- **Exclusiones:** claims de cumplimiento sin asesoría/auditoría; PAN/CVC propio; analytics no aprobado; rediseño.
- **Tareas/orden:** threat model; decisiones proveedor/auth/legal; contrato BE; sandbox pago; webhook/idempotencia; FE return/confirm; auth migration; CSP report-only y URL policy; legales/CMP; analytics; pruebas/review seguridad.
- **Dependencias/bloqueadores:** **BE:** endpoints/cookies/webhooks/refunds; **hosting:** TLS/CSP/secrets/redirects; **tercero:** proveedor/CMP/analytics; **legal:** textos/bases/retención; **producto/ops:** soporte/devolución/logística.
- **Entregables:** ADR pago/auth, integración sandbox, legal aprobado, CMP, headers versionados, threat model, runbooks y Gate 6.
- **Modelo/razonamiento:** GPT-5.6 Sol max.
- **Comandos:** suites security/auth/payment, lint/build/E2E; verificación headers (`curl -I` staging), inspección cookies, replay de webhook en sandbox, audit/SCA. Comandos del proveedor se documentan sin secretos.
- **Manual:** 3DS/success/decline/cancel/timeout/refund, refresh/reload/logout/multi-tab, consentimiento granular/retirada, URLs CMS maliciosas, CSP violations.
- **Aceptación/salida:** criterios Gate 6; sign-off legal/seguridad/finanzas; ningún secreto/PAN en cliente/logs; cobro-pedido conciliado e idempotente.
- **Rollback:** kill switch pago, volver a beta sin cobro, slot backend previo, CSP report-only, tags no esenciales off; preservar ledger/eventos.
- **Riesgos:** doble cobro, webhook out-of-order, CSRF, lockout, bloqueo CSP, consentimiento inválido. No rollout sin staging y observabilidad.
- **Estimación:** 2-6 semanas + esperas externas.
- **Commits:** separados BE/FE/hosting/legal refs; ejemplos `feat(payments): handle hosted checkout return`, `feat(auth): use httpOnly refresh flow`, `feat(compliance): add approved consent runtime`.
- **Ramas:** `feat/payments-<provider>`, `security/auth-session`, `feat/compliance-runtime`; PRs coordinadas con orden BE→FE→hosting flag→enable.
- **Push:** solo sin secretos y con reviewers de dominio. **No push/merge** si faltan webhooks/idempotencia, legal sign-off, sandbox E2E o rollback probado.

### Fase 7 — Accesibilidad, UI y rendimiento

- **Objetivo/justificación:** alcanzar experiencia medible y usable sin mezclarla con reparación/arquitectura.
- **Entrada:** rutas/features estables y Gate 6 o beta scope explícito; baseline Lighthouse/axe y referencia visual.
- **Alcance:** dialogs/foco/Escape/links/tabs/carousels/forms/contraste/headings/reduced motion; imágenes AVIF/WebP/dimensiones/srcset; lazy routes/Error Boundaries/code splitting/canvas/CSS; Lighthouse/axe.
- **Exclusiones:** rebranding, nuevas features, SEO SSR sin decisión, micro-optimizaciones sin medición.
- **Tareas/orden:** inventario/a11y; primitivas; navegación/menus/dialogs; forms/tabs/carousels/headings; contrast/motion; images/canvas; lazy/boundaries; CSS por feature; medición y regresión visual.
- **Dependencias/bloqueadores:** diseño aprueba referencia; hosting/CDN; copy; dispositivos/lectores. C-03 para footer/legal final.
- **Entregables:** matriz WCAG, componentes, assets, budgets, reportes Lighthouse/axe/teclado y Gate 7.
- **Modelo/razonamiento:** GPT-5.6 Sol xhigh; high para conversiones mecánicas revisadas.
- **Comandos:** lint/test/build/E2E; axe automatizado; Lighthouse CI 3 ejecuciones; análisis chunks/assets; visual regression si adoptado.
- **Manual:** keyboard-only, NVDA/VoiceOver muestral, zoom 200/400 %, reduced motion, móvil 320 px, tablet/desktop, contraste y red lenta.
- **Aceptación/salida:** axe sin serious/critical; todos los flujos por teclado y foco; contraste AA; budgets aprobados: LCP p75 objetivo ≤2,5 s, CLS ≤0,1, INP p75 ≤200 ms cuando haya RUM; Lighthouse móvil mediana ≥85 performance/≥95 a11y como señal, no sustituto WCAG; chunks y hero dentro del budget fijado.
- **Rollback:** assets originales y flags; revert por componente/route; no reintroducir blocker a11y conocido.
- **Riesgos:** cambios visuales amplios y Lighthouse variable. PRs por patrón y medianas controladas.
- **Estimación:** 1-3 semanas.
- **Commits:** `fix(a11y): ...` por patrón; `perf(images): ...`; `perf(routes): ...`; `refactor(styles): ...` por feature.
- **Rama/push:** ramas por patrón. Push con capturas/mediciones y CI; no push si solo “mejora score” rompiendo UX, si falta comparación o mezcla rebrand.

### Fase 8 — Tipado, contratos y escalabilidad

- **Objetivo/justificación:** consolidar frontera de datos y capacidad de crecimiento tras estabilizar dominios.
- **Entrada:** Gate 5 por features relevantes y CI estable; contrato BE versionado.
- **Alcance:** cliente HTTP, errores normalizados, schemas runtime, TS incremental, paginación server-side, cache/dedupe/cancelación, refresh single-flight, observabilidad.
- **Exclusiones:** conversión global en un commit, GraphQL/monorepo/microfrontends sin caso, virtualización prematura.
- **Tareas/orden:** error/API envelope; Abort/timeout/request IDs; schemas endpoints críticos; TS allowJs e incremental por feature; server pagination/filter; cache keys/invalidation; refresh single-flight; telemetry; retirar adapters.
- **Dependencias/bloqueadores:** BE pagination/schemas/error codes; H-08 auth; vendor observability/legal; RFC de query layer.
- **Entregables:** cliente único, schemas/fixtures, typecheck CI, listados >100, política cache/concurrencia, dashboards y Gate 8.
- **Modelo/razonamiento:** GPT-5.6 Sol max diseño, xhigh implementación.
- **Comandos:** lint/typecheck/test/coverage/build/E2E; contract tests; carga de listados; test concurrente 401; bundle diff.
- **Manual:** offline/slow/abort, respuesta inválida, >100 registros, filtros/paginación, múltiples tabs/401, correlación error.
- **Aceptación/salida:** todos los endpoints críticos pasan schemas; ninguna lista crítica truncada a 100; una renovación concurrente; errores tienen código/request ID; TS avanza por touched files sin bloque total; observabilidad operativa.
- **Rollback:** dual adapters/schema tolerant versioned; cache disable switch; conservar cliente anterior una release solo si owner/fecha de retirada.
- **Riesgos:** capas genéricas complejas, schema drift y cache de permisos. Diseñar por casos reales y claves con scope de usuario.
- **Estimación:** 2-5 semanas incremental.
- **Commits:** por frontera/feature, p. ej. `refactor(api): normalize errors`, `feat(catalog): use server pagination`, `refactor(types): migrate catalog contracts`.
- **Rama/push:** `refactor/api-contracts`, `feat/server-pagination-*`, `refactor/types-*`; no push de conversión masiva, cache sin invalidación o schema sin fixtures.

### Fase 9 — Revisión independiente y producción

- **Objetivo/justificación:** decidir GO con evidencia independiente, staging y rollback operativo.
- **Entrada:** Gates 0-8 aplicables; release candidate inmutable; staging production-like; owners on-call.
- **Alcance:** auditoría funcional, arquitectura, seguridad, a11y, performance, UX ecommerce, tests/CI, staging, rollback, monitoring, soporte y GO/GO WITH CONDITIONS/NO GO.
- **Exclusiones:** arreglos grandes dentro del RC; cada hallazgo vuelve a su fase/PR.
- **Tareas/orden:** freeze RC/tag; deploy staging; datos sintéticos; suites/auditorías independientes; disaster/rollback drill; soak; revisar métricas/runbooks; comité de release y acta.
- **Dependencias/bloqueadores:** hosting, dominio/TLS, proveedor live readiness, legal, logística, soporte, observabilidad y seguridad.
- **Entregables:** reportes firmados, checklist release, runbooks, rollback probado, dashboards/alerts, acta GO y condiciones con owner/fecha.
- **Modelo/razonamiento:** GPT-5.6 Sol max; revisor independiente que no implementó el cambio principal.
- **Comandos:** CI completo desde `npm ci`; E2E staging; Lighthouse/axe; SCA; health checks; smoke post-deploy; comandos de rollback documentados y ensayados.
- **Manual:** compra real controlada si legal/finanzas autoriza, refund, soporte, email, móvil/navegadores, teclado/lector, fallo de proveedor/API y recovery.
- **Aceptación/salida:** Gate 9. GO solo sin blockers críticos/altos abiertos; GO WITH CONDITIONS únicamente para riesgos no bloqueantes con owner/plazo/mitigación; cualquier pago/legal/auth crítico implica NO GO.
- **Rollback:** blue/green/slot o artefacto previo, DB backward-compatible, kill switches, comunicación y verificación post-rollback.
- **Riesgos:** presión de fecha y staging no representativo. La autoridad GO debe poder detener release.
- **Estimación:** 3-10 días + soak acordado.
- **Commits:** solo fixes mínimos separados tras reabrir fase; tag `frontend-rc-<semver>` y luego release tag tras GO.
- **Rama/push:** `release/frontend-<semver>`; push/tag por release manager. No push/enable live si gate, observabilidad, rollback, legal o proveedor no están aprobados.

## 10. Estrategia de Git

### Reglas concretas

- **Repositorio y base:** trabajar únicamente en `despensa-rayana-cliente`, remoto `Bujio/despensa-rayana-cliente`, desde `main` actualizado y commit registrado. El backend usa ramas/PR separados.
- **Preflight obligatorio:** `pwd`, `git remote -v`, `git status --short --branch`, `git rev-parse HEAD`. Detenerse si la ruta/remoto difieren o hay cambios no atribuidos.
- **Ramas:** `docs/remediation-f0-governance`, `docs/remediation-f1-baseline`; F2 usa `fix/c01-checkout-contract`, `fix/h03-order-cancel`, `fix/h04-review-update`, `fix/h05-admin-products` y `fix/h12-lint`; F3 usa `test/frontend-critical-flows` y `ci/frontend-quality-gates`; después `docs/remediation-f4-architecture`, `refactor/<feature>-canonical`, ramas separadas F6-8 y `release/frontend-<semver>`.
- **Límite de PR:** un objetivo, una categoría y un rollback. F2 usa un PR por ID. F5 usa una feature/subfeature. Cambios FE/BE/hosting se enlazan, no se mezclan en un repositorio.
- **Commits:** pequeños, compilables cuando sea viable y Conventional Commits: `docs`, `fix`, `test`, `ci`, `refactor`, `feat`, `perf`, `security` solo si commitlint lo acepta; incluir ID en cuerpo/asunto.
- **Dependencias entre PR:** declarar `Depends-On` y no abrir cadena mayor de 2-3 PR sin integrar. Orden F2: C-01→H-03→H-04→H-05→H-12. F6: backend contract→frontend behind flag→hosting/config→enable.
- **Merge:** squash solo si conserva trazabilidad acordada; si no, merge commit. Nunca reescribir una rama compartida. Merge en orden de dependencia tras required checks y review.
- **Puntos de integración:** después de cada ID F2, cada bloque F3, cada feature F5 y cada componente cross-stack F6. Ejecutar suite acumulada en `main` después de merge.
- **Conflictos:** asignar ownership temporal de `useShopController.js`, `AppView.jsx`, `styles.css` y `package-lock.json`; serializar PRs que los toquen. No resolver aceptando archivos completos de una rama.
- **Sincronización con main:** antes de crear rama y antes de review final, con worktree limpio/conocido. Preferir merge de `main` en ramas compartidas; rebase solo local, no compartido, no destructivo y con autorización de política.
- **Tags:** `frontend-baseline-e623d5a` tras baseline aprobada si se decide versionarla; `frontend-beta-<semver>` tras beta; `frontend-rc-<semver>` tras Gate 8; release tag solo Gate 9. Tags anotados y nunca para commits no revisados.
- **Push:** solo tras diff, checks locales aplicables, secretos scan, rollback y autorización. Push no equivale a merge/despliegue.
- **Detención:** parar ante repo equivocado, worktree desconocido, secreto, migración incompatible, test/flaky nuevo, contrato backend incierto, scope creep, fallo de gate o ausencia de rollback.

### Prohibiciones explícitas

Quedan prohibidos `git reset --hard`, `git clean -fd`, `git push --force`/`--force-with-lease`, rebase destructivo o de ramas compartidas, pérdida/ocultación de cambios locales, commits con secretos/datos personales, y mezclar varias fases en un commit. También se prohíbe usar `git checkout --`, restore masivo o resolver conflictos sustituyendo un archivo completo sin revisión semántica.

## 11. Gates obligatorios

| Gate | Criterios medibles | Evidencia/aprobadores | Si falla |
| --- | --- | --- | --- |
| **0 Gobierno aprobado** | Ruta/remoto/HEAD registrados; untracked clasificados; freeze, DoD, ramas, rollback y feature matrix con owner/estado | Diff documental; FE lead + producto + maintainer | No crear rama de implementación |
| **1 Baseline reproducible** | Dos ejecuciones desde lock con build equivalente; lint 5/19 pre-F2 registrado; audit/test/CI/grafo/assets/flujos y límites documentados | `BASELINE_FRONTEND.md`; segundo revisor | Corregir baseline, no código |
| **2 Críticos resueltos** | C-01 coherente/deshabilitado; cancel no lanza; review usa PATCH; admin ve estados; lint 0/0; build pasa; smoke de 5 flujos | PRs por ID + acta manual; FE/BE para contrato | Revertir ID defectuoso; no F3 |
| **3 CI/tests obligatorios** | Required checks install/lint/test/build/E2E; críticos ≥80 % branch/line; global ratchet; cero flakes sin excepción; smoke exacto | CI y reportes; Tech Lead | No RFC/migración productiva |
| **4 Arquitectura aprobada** | RFC con autoridad única, imports, estado/datos, adapters, retirada, owners, alternativas y rollback | FE architect + equipo/BE/product | Mantener runtime estabilizado |
| **5 Features sin duplicación** | Por dominio: tests verdes, un owner, cero caminos activos dobles, grafo actualizado, adapter retirado/fechado, E2E y bundle sin regresión no aprobada | Review feature + CI | Revert feature o mantener adapter, no siguiente dominio dependiente |
| **6 Pago/cumplimiento validados** | Sandbox success/decline/cancel/3DS/refund; webhook firmado/idempotente; auth threat model; legal sign-off; CMP bloquea tags; headers staging | Seguridad, legal, finanzas, BE, hosting | Beta sin cobro/analytics; NO GO cobrable |
| **7 A11y/performance aceptables** | Axe 0 serious/critical; teclado/lector muestral; AA contraste; CWV targets/budgets; reduced motion; responsive; error boundaries/chunks | A11y/UX/perf review | No release; revert patrón/asset |
| **8 Contratos/escala consolidados** | Schemas críticos, typecheck incremental, >100 server-side, abort/dedupe/cache, refresh single-flight, errores/request IDs, observabilidad | FE/BE/SRE | No RC; feature flag o adapter |
| **9 Producción aprobada** | RC inmutable; staging production-like; auditorías; rollback drill; monitoring/on-call; 0 críticos/altos; acta GO | Release board independiente | GO WITH CONDITIONS solo no bloqueantes; si no, NO GO |

## 12. Camino crítico a producción

### Entorno local estable

Necesita Gates 0-2: repositorio correcto, baseline, Node conocido, build y lint verdes, checkout temporal coherente o deshabilitado, cancelación/reseñas/admin reparados y smoke manual. No necesita todavía pago real, legal final ni refactor. Camino mínimo: F0→F1→C-01→H-03→H-04→H-05→H-12.

### Staging funcional

Necesita entorno local estable + Gate 3, configuración `VITE_API_URL` validada sin fallback localhost, backend/DB sintéticos, rewrites SPA/TLS/headers básicos, despliegue reproducible, E2E smoke, logs/request IDs y cuentas por rol. Camino: anterior→F3→decisión hosting/deploy M-17→deploy staging detrás de acceso controlado.

### Beta sin cobro real

Necesita staging funcional, pedido `external_pending` o transferencia explícitamente operada, copy inequívoco, emails/soporte/logística mínima, legales necesarios para la beta según asesoría, privacidad/CMP si hay tags, y observabilidad. Puede posponer proveedor de pago, supplier y migración completa; no puede presentarse como compra pagada. Camino: staging→F4→features mínimas F5 (catálogo/product/cart/auth)→parte aplicable F6 legal/auth→F7 blockers→beta tag.

### Producción cobrable

Necesita todos los anteriores + C-02/C-03/H-08, Gate 6 completo, admin operacional, seguridad/auth, proveedor live, webhooks/idempotencia/refunds, legal/CMP, hosting/CSP, QA a11y/perf y Gate 9. Supplier puede estar fuera si se retira de promesas y procesos. Camino crítico: F0-4→F5 dominios de compra/admin→F6→F7→F8 endpoints críticos→F9.

### Producción madura

Necesita producción cobrable + todas las features aprobadas migradas, supplier/CMS definidos, listas escalables, TS/schemas ampliados, RUM/SLO/alertas, runbooks, soporte y logística medidos, budgets ratcheted y ciclo de dependencias/seguridad. Camino: completar Gates 5/8 para todos los dominios→operación/soak→revisión periódica.

El pago y cumplimiento, no el refactor completo, forman el cuello de botella de “producción cobrable”. El refactor mínimo sí debe cubrir los dominios que soportan compra/auth/admin para reducir riesgo antes de activar dinero real.

## 13. Decisiones pendientes

| Decisión | Opciones | Impacto | Responsable propuesto | Límite | Bloquea |
| --- | --- | --- | --- | --- | --- |
| Checkout temporal vs pago inmediato | Pedido pendiente; checkout deshabilitado; acelerar proveedor | Define C-01, beta y copy | Producto + Tech Lead + operaciones | Antes de F2 | Gate 2/beta |
| Proveedor de pagos | Redirect PCI; SDK/Elements; transferencia operada | Arquitectura, PCI, comisiones, 3DS/refunds | Negocio/finanzas + BE/security | Antes de diseño F6 | C-02/Gate 6 |
| Modelo de autenticación | Refresh HttpOnly; BFF; riesgo temporal bearer | CSRF/CORS, sesiones, hosting | Security + BE/FE | RFC F4, final antes F6 | H-08/Gate 6 |
| Contenido legal | Asesor externo/interno; jurisdicción/identidad | GO legal, copy checkout/footer | Legal + dirección | Antes de integrar F6 | C-03/Gate 6/9 |
| Política cookies/CMP | Esencial only; CMP propia; SaaS | Tags, pruebas y evidencia | Legal/privacy + marketing | Antes de analytics F6 | C-03 |
| Analítica | Ninguna; first-party; vendor | Consent, RUM, KPIs y PII | Producto/marketing/privacy | Antes F6 | Analytics/M-15 |
| Alcance supplier | Fuera; MVP; completo | Semanas de trabajo, roles/soporte | Producto + operaciones | Antes RFC F4 | H-02/F5.6 |
| Alcance CMS | Home actual; CMS completo; externo | URLs/assets/roles y admin | Producto/content | Antes F5 admin | M-09/home |
| Soporte a usuarios | Email; ticketing; SLA/canales | Cancel/refund/incidentes | Operaciones/negocio | Antes beta | Gate 6/9 |
| Devoluciones/reembolsos | Política y excepciones perecederos | Pago, pedido, legal y soporte | Legal + operaciones + finanzas | Antes C-02 live | Gate 6 |
| Logística | Zonas, costes, 24/48h, stock/reserva | Copy, checkout, SLA y claims | Operaciones | Antes beta/producción | Copy/legal/checkout |
| Observabilidad | Vendor; solución propia mínima; RUM | MTTR, PII, sourcemaps/coste | SRE/Tech Lead/privacy | Antes F8/RC | M-15/Gate 9 |
| Hosting | Proveedor/CDN, entornos, dominio/TLS | Rewrites, CSP, secrets, deploy | DevOps/Tech Lead | Antes staging | M-17/Gates 6/9 |
| Política de despliegue | Manual controlado; CI/CD; blue-green/canary | Frecuencia y rollback | DevOps/release manager | Antes staging | Gate 9 |
| Dominio/SEO | SPA indexable actual; prerender/SSR futuro | Canonical/sitemap/metadata | Producto/marketing/FE | Antes activar SeoManager | M-12/SEO |
| Runtime Node | Node 20 LTS/rango o imagen pin | Reproducibilidad CI/local | Maintainer | F1/F3 | M-16/Gate 3 |

Toda decisión debe registrar: fecha, responsable, opciones descartadas, evidencia, consecuencias, fecha de revisión y feature flags asociados.

## 14. Orden exacto de ejecución

1. Abrir una sesión en `/home/rizzo/dev/react/Frontend DespensaRayana`; ejecutar preflight y abortar si remoto/HEAD no coinciden.
2. Inventariar sin modificar todos los archivos untracked inventariados durante el preflight; decidir con el maintainer cuáles son documentación/artefactos locales.
3. Ejecutar Fase 0 en `docs/remediation-f0-governance`; crear solo documentos de gobierno.
4. Revisar Fase 0 con el prompt específico; corregir únicamente hallazgos documentales.
5. Aprobar Gate 0; crear los commits documentales previstos. No push sin autorización explícita.
6. Sincronizar `main` de forma no destructiva y crear `docs/remediation-f1-baseline`.
7. Ejecutar Fase 1 desde un entorno/clon aislado; registrar Node 20.19.5/npm 10.8.2 como referencia, no como decisión final.
8. Repetir build/lint/audit/grafo/assets y comparar con `e623d5a`; marcar cualquier variación.
9. Revisar baseline independientemente; aprobar Gate 1 y commit documental; no remediar resultados dentro del commit.
10. Obtener decisión firmada sobre C-01: beta pendiente, checkout off o pago inmediato. Si no existe, detener F2.
11. Crear `fix/c01-checkout-contract`; implementar solo C-01, revisar payload/clear-cart/copy/error y smoke. Commit y PR independiente.
12. Revisar C-01; si falla, revertir o mantener CTA deshabilitado. Merge solo tras aceptación.
13. Sincronizar main; crear `fix/h03-order-cancel`; implementar H-03 con confirmación y estados. Probar pending/error/doble click. Commit/PR.
14. Sincronizar main; crear `fix/h04-review-update`; implementar create vs PATCH, precarga/reset. Probar create/update/delete. Commit/PR.
15. Sincronizar main; crear `fix/h05-admin-products`; usar endpoint admin separado y probar permisos/estados/cache. Commit/PR.
16. Sincronizar main; crear `fix/h12-lint`; corregir causa de 5/19 sin desactivar reglas. Commit por causa si el diff crece.
17. Ejecutar build, lint 0/0 y smoke acumulado de F2 en main integrado; revisión de estabilización y aprobación Gate 2.
18. Crear `test/frontend-critical-flows`; añadir Vitest/RTL/user-event/MSW y primero tests de C-01/H-03/H-04/H-05.
19. Añadir Playwright y los smoke exactos; después crear `ci/frontend-quality-gates` para GitHub Actions y required checks. Separar setup, tests, E2E y CI en commits/PRs apiladas cortas.
20. Forzar un fallo controlado para comprobar cada gate; resolver flakes; aprobar Gate 3.
21. Crear `docs/remediation-f4-architecture`; redactar RFC con evidencia post-F3 y decidir query/router/schema/adapters sin implementar.
22. Revisar RFC con FE/BE/product/security; aprobar Gate 4 o permanecer en runtime estabilizado.
23. Migrar catálogo en `refactor/catalog-canonical`: seam, data, UI, retirada; Gate 5-catálogo.
24. Migrar producto/reseñas en `refactor/product-reviews-canonical`; Gate 5-producto.
25. Migrar carrito/checkout temporal en `refactor/cart-checkout-canonical`; Gate 5-checkout.
26. Migrar auth/cuenta en `refactor/auth-account-canonical`, sin cambiar aún el contrato HttpOnly salvo PR coordinada; Gate 5-auth.
27. Dividir/migrar admin por subrutas en PRs; empezar products/orders y seguir solo dominios aprobados; Gate 5-admin.
28. Ejecutar F5.6 supplier únicamente si la decisión de producto lo incluye; de lo contrario retirar promesas/documentar fuera de scope.
29. Antes de dinero real, cerrar proveedor, auth, legal, cookies, analytics, hosting, soporte, devolución y logística.
30. Implementar F6 en orden backend contract→sandbox/webhook/idempotencia→frontend flag→auth→hosting/CSP→legal/CMP→analytics; nunca activar live durante el desarrollo.
31. Ejecutar revisión de seguridad/legal/finanzas y rollback drill; aprobar Gate 6 o mantener beta sin cobro.
32. Ejecutar F7 por patrones: navegación/dialogs, forms/tabs/carousels, contraste/headings/motion, imágenes/canvas, chunks/boundaries, CSS. Medir cada bloque.
33. Aprobar Gate 7 con axe/manual/Lighthouse/CWV budgets; no compensar fallos con exclusiones globales.
34. Ejecutar F8 por frontera: HTTP/errors, schemas, TS por feature, paginación, cache/concurrencia, refresh, observabilidad. No commit global.
35. Cargar datasets >100 y pruebas concurrentes; aprobar Gate 8.
36. Congelar `frontend-rc-<semver>`, desplegar staging production-like y ejecutar F9 con revisor independiente.
37. Ensayar rollback, validar soporte/monitoring y completar soak; emitir GO, GO WITH CONDITIONS o NO GO.
38. Solo tras GO, crear tag release y habilitar pago live de forma controlada; smoke post-release y observación reforzada.
39. Si cualquier gate falla, volver a la fase propietaria mediante PR separado; no “arreglar de paso” en release.

## 15. Prompts siguientes

### 15.1 Ejecutar Fase 0

```text
Actúa como Staff Frontend Engineer y Tech Lead. Usa GPT-5.6 Sol durante toda la sesión con razonamiento max; si no está disponible, usa GPT-5.3-Codex xhigh y registra el fallback, sin alternar después.

Ejecuta únicamente la Fase 0 — Gobierno y protección definida en PLAN_REMEDIACION_FRONTEND.md. Antes de actuar verifica que pwd sea /home/rizzo/dev/react/Frontend DespensaRayana, que el remoto sea Bujio/despensa-rayana-cliente, y registra git status --short --branch y HEAD. Si no coincide, detente sin modificar nada.

Lee completos: AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, README.md, package.json, .gitignore y cualquier AGENTS.md aplicable. Conserva y no ocultes ni elimines cambios locales/untracked. Crea solo los entregables documentales de Fase 0: AGENTS.md, matriz de features, política de ramas/commits, reglas de validación, Definition of Done y rollback. No modifiques código productivo, dependencias, lockfile, configuración de build/lint, tests ni CI; no corrijas hallazgos y no avances a Fase 1.

Ejecuta los checks existentes aplicables sin instalar ni alterar dependencias; si no hay tests frontend, regístralo, no lo interpretes como éxito y no crees tests en esta fase. Revisa el diff completo, ejecuta git diff --check, demuestra que cada cambio pertenece a Fase 0 y documenta el rollback exacto. No hagas commit, push, merge, limpieza ni operaciones destructivas. Entrega archivos modificados, evidencia, riesgos, Gate 0 PASS/FAIL y motivos. Detente al finalizar Fase 0.
```

### 15.2 Revisar Fase 0

```text
Actúa como revisor independiente Staff/Principal. Usa GPT-5.6 Sol con razonamiento max durante toda la revisión (fallback único GPT-5.3-Codex xhigh, registrado).

Revisa exclusivamente la implementación documental de Fase 0 contra AUDITORIA_FRONTEND.md y PLAN_REMEDIACION_FRONTEND.md. Lee además README.md, package.json, .gitignore, AGENTS.md, la matriz de features y git diff completo desde el commit base registrado. Verifica repo/remoto/HEAD/status antes de revisar.

No implementes fixes, no edites código, no instales dependencias, no limpies untracked, no hagas commit/push y no avances a Fase 1. Comprueba que la feature matrix refleja el grafo real, que no conecta ni elimina módulos, que Git/rollback/DoD son ejecutables, que todos los cambios son documentales y que no se ocultan cambios locales. Ejecuta checks documentales y los tests existentes aplicables sin cambiar el entorno; registra la ausencia de tests si corresponde. Revisa el diff por secretos, scope creep y contradicciones.

Entrega hallazgos por severidad con archivo/línea, evidencia, cambio mínimo recomendado, rollback y veredicto Gate 0 PASS/FAIL. Gate 0 solo pasa si cada criterio medible del plan se cumple. Detente tras la revisión.
```

### 15.3 Ejecutar Fase 1

```text
Actúa como Staff Frontend Engineer responsable de reproducibilidad. Usa GPT-5.6 Sol; razonamiento high para captura mecánica y xhigh para interpretar, sin cambiar de modelo (fallback GPT-5.3-Codex xhigh registrado).

Ejecuta únicamente la Fase 1 — Baseline reproducible de PLAN_REMEDIACION_FRONTEND.md, solo después de confirmar Gate 0. Verifica pwd/remoto/rama/HEAD/status. Lee completos AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, README.md, package.json, package-lock.json, Vite/ESLint/.gitignore, src/main.jsx, App.jsx, AppView.jsx y el documento de features.

Trabaja en clon/worktree aislado si npm ci o build pudieran alterar artefactos. Crea solo BASELINE_FRONTEND.md y artefactos explícitamente permitidos por Fase 1. Captura versiones, install, build, lint, audit, tests, CI, import graph, rutas/flujos, endpoints, bundle/chunks/assets/CSS, errores y limitaciones. Ejecuta los tests existentes; si no hay script/archivos, registra “ausente”, no “pasa”. No corrijas código/lint/config, no añadas tests/dependencias, no actualices lockfile y no avances a Fase 2.

Revisa el diff completo, ejecuta git diff --check, compara con e623d5a y explica variaciones. Incluye comandos reproducibles, outputs relevantes y rollback documental. No commit/push/merge ni operaciones destructivas. Entrega Gate 1 PASS/FAIL y detente.
```

### 15.4 Revisar la baseline

```text
Actúa como revisor independiente de build/reproducibilidad. Usa GPT-5.6 Sol con razonamiento xhigh (fallback único GPT-5.3-Codex xhigh registrado).

Revisa exclusivamente BASELINE_FRONTEND.md y el diff de Fase 1 contra AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, package.json/lock, configuraciones Vite/ESLint y commit e623d5a. Verifica repo/remoto/HEAD/status. Reejecuta en entorno aislado build, lint, audit, inventario tests/CI, grafo y métricas clave; ejecuta tests existentes o confirma su ausencia.

No arregles resultados, no edites código/config, no instales herramientas nuevas, no cambies lockfile, no commit/push y no avances. Comprueba que fallos se presentan como fallos, límites como límites y que otra persona puede reproducir. Revisa diff, secretos, artefactos y rollback.

Entrega discrepancias por severidad con evidencia y veredicto Gate 1 PASS/FAIL. Detente tras la revisión.
```

### 15.5 Ejecutar Fase 2

```text
Actúa como Staff Frontend Engineer y Tech Lead de estabilización. Usa GPT-5.6 Sol con razonamiento xhigh y max para checkout/contratos cross-stack; no cambies de modelo (fallback GPT-5.3-Codex xhigh registrado).

Ejecuta únicamente Fase 2 de PLAN_REMEDIACION_FRONTEND.md, después de Gates 0-1 y de una decisión escrita para C-01. Lee completos AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, BASELINE_FRONTEND.md, package files/config, src/main.jsx, App.jsx, AppView.jsx, useShopController.js y todos los modelos/vistas implicados; contrasta rutas backend actuales de orders/reviews/products.

Trabaja en este orden y en ramas/diffs separados: C-01, H-03, H-04, H-05, H-12. Antes de cada ID declara alcance, archivos, tests/smoke, criterio de aceptación y rollback. No hagas gran refactor, rediseño, TypeScript, supplier, pagos definitivos, legales, query layer ni conexión/eliminación de módulos desconectados. No instales dependencias salvo autorización nueva; no avances a Fase 3.

Para cada ID ejecuta los tests existentes aplicables y añade tests solo si el harness ya fue aprobado/está disponible; si aún no existe por secuencia del plan, ejecuta y documenta el smoke exacto y deja el caso especificado para Fase 3. Al cierre exige npm run lint con 0 errores/0 warnings, npm run build y los tests disponibles. Revisa git diff completo por ID, git diff --check, payloads/errores/permisos y rollback. No commit/push/merge sin autorización explícita; no operaciones destructivas.

Entrega resultado y aceptación por ID, comandos, diff summary, riesgos, rollback y Gate 2 PASS/FAIL. Detente al finalizar Fase 2.
```

### 15.6 Revisar la estabilización

```text
Actúa como revisor independiente Staff/Principal con foco funcional y cross-stack. Usa GPT-5.6 Sol con razonamiento max durante toda la revisión (fallback GPT-5.3-Codex xhigh registrado).

Revisa únicamente Fase 2 contra AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, BASELINE_FRONTEND.md y contratos backend actuales. Inspecciona el diff completo desde Gate 1 y separa C-01, H-03, H-04, H-05 y H-12. Ejecuta lint, build y todos los tests existentes; reproduce manualmente checkout temporal/deshabilitado, cancelación, create/update review y listado admin con success/error/permisos, incluyendo móvil/teclado donde aplique.

No implementes mejoras no solicitadas, no refactorices, no instales/actualices, no conectes código desconectado, no commit/push y no avances a Fase 3. Verifica que no se manejan datos de tarjeta, que un pedido no se duplica ni limpia carrito ante fallo, que cancel y reviews usan endpoint/ID correcto, que caches público/admin no se mezclan y que lint no se silenció. Revisa rollback por ID y secretos.

Entrega hallazgos por severidad/ID, evidencia archivo/línea/test, corrección mínima, rollback y Gate 2 PASS/FAIL. Detente.
```

### 15.7 Crear CI y tests

```text
Actúa como Staff Frontend Engineer especializado en calidad. Usa GPT-5.6 Sol con razonamiento xhigh durante toda la fase (fallback GPT-5.3-Codex xhigh registrado).

Ejecuta únicamente Fase 3 de PLAN_REMEDIACION_FRONTEND.md tras Gate 2. Lee AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, BASELINE_FRONTEND.md, package/lock/config, código de C-01/H-03/H-04/H-05 y contratos backend. Verifica repo/remoto/HEAD/status.

Introduce exclusivamente Vitest, React Testing Library, user-event, MSW, Playwright y GitHub Actions según el plan, justificando versiones/alternativas/licencia/bundle. Cubre exactamente navegación, búsqueda/races, auth, carrito, checkout, cancel, reseñas y permisos/admin. Define coverage crítica ≥80 % branches/lines y global ratchet; evita snapshots cosméticos, mocks irreales, sleeps y continue-on-error. No refactorices arquitectura, no añadas features, no corrijas UI fuera de seams mínimos demostrados y no avances a Fase 4.

Ejecuta npm ci en entorno limpio, lint, unit/integration, coverage, build, E2E y audit; demuestra que los tests fallan ante una mutación/control equivalente y que CI bloquea un fallo. Revisa lockfile y diff completos, secretos, flakes y rollback por commit. No commit/push/branch protection externa sin autorización explícita.

Entrega archivos, tests por flujo, tiempos/flakes, coverage, diff review, rollback y Gate 3 PASS/FAIL. Detente.
```

### 15.8 Crear RFC arquitectónico

```text
Actúa como Frontend Architect/Staff Engineer. Usa GPT-5.6 Sol con razonamiento max de principio a fin (fallback GPT-5.3-Codex xhigh registrado).

Ejecuta únicamente Fase 4 documental tras Gate 3. Lee completos AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, BASELINE_FRONTEND.md, feature/module matrices, resultados CI y todo el grafo/contratos relevantes. Verifica repo/remoto/HEAD/status y vuelve a medir alcanzabilidad.

Crea RFC_FRONTEND_ARCHITECTURE.md comparando A/B/C/D con coste, duración, riesgo, rollback, testabilidad, deuda, reutilización, compatibilidad, negocio y entrega. Define router/estado/datos/API/schemas/import rules/adapters/retirada/owners y criterios Gate 5. Basa la decisión en evidencia; no elijas librerías por preferencia. No modifiques código, dependencias, tests/config productiva, no elimines/conectes módulos y no avances a Fase 5.

Ejecuta tests/lint/build existentes para asegurar que el PR documental no altera baseline; revisa diff completo, git diff --check, contradicciones, migración y rollback del RFC. No commit/push sin autorización.

Entrega decisión, alternativas descartadas, incertidumbres, aprobadores pendientes y Gate 4 PASS/FAIL. Detente.
```

### 15.9 Implementar una feature

```text
Actúa como Staff Frontend Engineer. Usa GPT-5.6 Sol con razonamiento xhigh; usa max si [FEATURE] es auth, checkout, pagos o cruza backend, sin cambiar de modelo (fallback GPT-5.3-Codex xhigh registrado).

Implementa únicamente la subfase [FEATURE] de Fase 5 autorizada en PLAN_REMEDIACION_FRONTEND.md y RFC_FRONTEND_ARCHITECTURE.md. Antes verifica Gates 3-4, repo/remoto/HEAD/status y que la feature anterior requerida está integrada. Lee AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, BASELINE_FRONTEND.md, RFC/ADRs, tests y todos los módulos activos/desconectados de [FEATURE].

Declara alcance, exclusiones, contratos, archivos, adapter, tests, aceptación, commits y rollback. Migra una autoridad; reutiliza código desconectado solo tras demostrar contrato y tests. No rediseñes, no migres otra feature, no conviertas TS global, no añadas dependencias sin ADR, no borres código no clasificado y no avances a la siguiente subfase.

Añade/actualiza unit, integración MSW y E2E de todos los flujos/errores/permisos afectados. Ejecuta lint, test, coverage, build, E2E, grafo y bundle diff; valida manualmente loading/empty/error/success/disabled, móvil, teclado y red lenta. Revisa el diff línea a línea, imports dobles, secretos y rollback probado. No commit/push/merge sin autorización.

Entrega evidencia, criterios de salida, deuda/adapters restantes y Gate 5-[FEATURE] PASS/FAIL. Detente.
```

### 15.10 Revisar una feature

```text
Actúa como revisor independiente Principal Frontend Engineer. Usa GPT-5.6 Sol con razonamiento max (fallback GPT-5.3-Codex xhigh registrado).

Revisa exclusivamente [FEATURE] contra PLAN_REMEDIACION_FRONTEND.md, RFC/ADRs, AGENTS.md, BASELINE_FRONTEND.md, auditoría y contratos backend. Verifica repo/remoto/HEAD/status y examina el diff completo desde la base de la subfase.

Comprueba una única autoridad, límites/imports, estado remoto/local, compatibilidad/adapter, ausencia de código desconectado conectado sin validar y ausencia de scope visual/otra feature. Ejecuta lint, todos los tests, coverage, build, E2E, grafo y bundle; reproduce manualmente success/loading/empty/error/disabled, 401/403, móvil/teclado/red lenta. Exige tests que fallen ante el defecto que previenen y rollback ejecutable.

No implementes refactors o features adicionales, no instales/actualices, no commit/push y no avances. Entrega hallazgos por severidad con archivo/línea/test, cambio mínimo, riesgo, rollback y Gate 5-[FEATURE] PASS/FAIL. Detente.
```

### 15.11 Validar producción

```text
Actúa como comité técnico independiente (Staff Frontend, Security, QA, Accessibility, Performance y Release) coordinado por un único revisor. Usa GPT-5.6 Sol con razonamiento max durante toda la validación (fallback GPT-5.3-Codex xhigh registrado).

Ejecuta únicamente Fase 9 sobre el release candidate [VERSION]/[COMMIT]. Lee completos AUDITORIA_FRONTEND.md, PLAN_REMEDIACION_FRONTEND.md, AGENTS.md, BASELINE_FRONTEND.md, RFC/ADRs, actas Gates 0-8, threat model, legal sign-off, payment/auth contracts, CI, runbooks y deployment/rollback. Verifica repo/remoto/tag/HEAD/status y que staging es production-like.

No añadas features, no hagas refactors, no actualices dependencias y no corrijas findings dentro del RC: abre un hallazgo y devuelve a la fase propietaria. Ejecuta clean install, lint, unit/integration/coverage, build, E2E staging, payment sandbox/live controlado autorizado, auth, audit/security, axe/teclado/lector, Lighthouse/CWV budgets, headers/CSP/cookies, deep links, monitoring/alerts y rollback drill. Revisa el diff/release completo, migraciones, secretos, PII y evidencia de soporte/logística/refunds. No hagas push/tag/deploy live sin decisión humana explícita.

Entrega matriz funcional/arquitectura/security/a11y/performance/UX/tests/CI/staging/rollback/monitoring, blockers y veredicto único GO, GO WITH CONDITIONS o NO GO. GO WITH CONDITIONS solo admite riesgos no bloqueantes con owner, fecha y mitigación; cualquier crítico/alto abierto en pago, auth, legal, datos o rollback es NO GO. No avances ni despliegues; detente tras el acta.
```

## 16. Revisión crítica final del plan

### Comprobaciones realizadas

1. C-01 a C-03 y H-01 a H-12 aparecen en matriz, roadmap, fases/gates o decisiones; C-02/C-03 no se confunden con F2.
2. Ninguna fase necesita un artefacto de fase posterior: F2 usa reparación mínima/manual; tests preceden a refactor F4-5; pago precede a producción.
3. Las estimaciones son rangos de esfuerzo y declaran exclusiones/esperas; se reestiman por fase.
4. Criterios observables: comandos, endpoints, estados UI, thresholds, sign-offs y resultados Gate PASS/FAIL.
5. Cada fase y feature tiene rollback; pagos preservan ledger y usan kill switch.
6. Reparación (F2), red de seguridad (F3), refactor (F4-5) y rediseño/calidad visual (F7) están separados.
7. La segunda arquitectura no se conecta ni elimina en bloque; los 22 módulos se clasifican individualmente.
8. Backend, hosting, proveedor, legal, finanzas, producto y operaciones aparecen como dependencias explícitas.
9. Se rechazan TypeScript global, Context/query library/Storybook/virtualización/SSR sin evidencia; no hay reescritura.
10. Se resolvió la aparente contradicción “tests antes de refactor” vs F2: F2 no refactoriza; F3 crea tests antes de F4-5.
11. H-09/M-07 y H-08/M-07 no son duplicados: H-09 trata estrategia de queries; M-07 frontera HTTP; H-08 modelo de sesión. Sus entregables se coordinan en F8.
12. C-01 y C-02 se dividen: pedido temporal recupera beta; pago real habilita cobro.
13. H-10/M-10 se dividen: programa a11y global vs semántica concreta de headings/tabs/carousels.

### Incertidumbres que deben permanecer visibles

- Disponibilidad real de GPT-5.6 Sol en el workspace de Codex; usar fallback único registrado si no aparece.
- El motivo exacto de la pequeña variación gzip con igual commit; no afecta veredicto y se fija en F1.
- Estado y políticas del hosting, dominio, TLS, CDN, rewrites SPA y headers del documento.
- Datos, carga, browsers y Core Web Vitals reales; los valores actuales son estáticos/lab.
- Proveedor de pago, merchant onboarding, estados/refunds y requisitos PCI/3DS.
- Texto/alcance legal, fiscal, cookies, privacidad, retención, desistimiento y perecederos.
- Alcance supplier, CMS, analytics, soporte y logística.
- Contratos backend futuros para cookies HttpOnly, paginación completa y pagos; el backend actual solo valida compatibilidad parcial.
- Worktree frontend con material untracked y workspace inicial en otro repositorio; F0 debe resolver la operativa sin limpiar.
- Estándar de cobertura global inicial; se fija con baseline real y ratchet, manteniendo 80 % en módulos críticos como gate.
- Herramienta concreta de query/cache, schemas, observabilidad, CMP y visual regression; se decide por RFC/evaluación, no está preseleccionada.

**Conclusión del planning:** diez fases, opción C provisional y NO GO hasta Gate 9. El siguiente paso autorizado es ejecutar únicamente Fase 0 con el prompt 15.1.
