# Baseline reproducible del frontend

**Fecha y hora de captura:** 14 de julio de 2026, 16:58 CEST (`Europe/Madrid`)

**Repositorio frontend:** `Bujio/despensa-rayana-cliente`

**Commit medido:** `201c3e67992e5580c03fcdb15c98ee56a4a950cc`

**Commit de runtime auditado:** `e623d5a2946e47ee91b546821bccad2c12157a8d`

**Snapshot backend contrastado:** `Bujio/despensaRayana`, `main` @ `346d881335ab5052779b7169964a0b2f485cb6ed`

**Rama de trabajo:** `docs/remediation-f1-baseline`

**Estado:** evidencia de Fase 1 revisada de forma independiente; no contiene remediaciones. Gate 1 PASS.

## 1. Objetivo, alcance y fuentes

Esta baseline fija resultados reproducibles antes de cualquier reparación funcional. Mide instalación, build, lint, audit, tests, CI, grafo de imports, routing, contratos HTTP visibles, bundle, assets y CSS. No evalúa como correctos los flujos que no pudieron ejecutarse.

Fuentes, en orden operativo:

1. commit frontend `201c3e6` y snapshot backend `346d881`;
2. comandos y artefactos reproducidos en dos extracciones independientes;
3. `AGENTS.md`, `PLAN_REMEDIACION_FRONTEND.md`, `AUDITORIA_FRONTEND.md`, `FEATURE_MATRIX_FRONTEND.md` y `GOBIERNO_FRONTEND.md`;
4. README solo como documentación descriptiva.

Entre `e623d5a` y `201c3e6` solo se añadieron cinco documentos de gobierno. `git diff --quiet e623d5a..201c3e6 -- src public index.html package.json package-lock.json vite.config.js eslint.config.js .gitignore .env.example` devuelve 0: el runtime y su configuración son idénticos.

## 2. Estado Git y protección del workspace

| Campo | Resultado |
| --- | --- |
| Ruta | `/home/rizzo/dev/react/Frontend DespensaRayana` |
| Remoto | `https://github.com/Bujio/despensa-rayana-cliente.git` |
| Base integrada | `main` y `origin/main` en `201c3e6`, diferencia `0 0` |
| Rama F1 | `docs/remediation-f1-baseline`, creada desde `201c3e6` |
| Cambios tracked/staged antes de F1 | Ninguno |
| Untracked preexistentes | `.codex-upload/`, `.codex/`, `.git-codex-backup/`, `public/camino-extremadura.png:Zone.Identifier` |
| Protección aplicada | Ningún untracked fue movido, ocultado, limpiado, añadido o modificado |

Todo comando que instala o genera artefactos se ejecutó fuera del workspace en:

- `/tmp/despensa-f1-201c3e6-run-a`;
- `/tmp/despensa-f1-201c3e6-run-b`;
- archivo fuente `/tmp/despensa-f1-201c3e6.tar` generado mediante `git archive HEAD`.

Las copias ocupan aproximadamente 166 MB cada una y el tar 5,9 MB. Se conservan temporalmente para la revisión independiente; no forman parte de Git. No se realizó limpieza destructiva.

## 3. Entorno de reproducción

| Componente | Valor observado |
| --- | --- |
| Fecha | `2026-07-14T16:58:34+02:00` |
| Sistema | Linux `6.6.114.1-microsoft-standard-WSL2`, x86_64 GNU/Linux |
| Node | `v20.19.5` |
| npm | `10.8.2` |
| Git | `2.43.0` |
| Vite resuelto | `7.3.6` |
| Lockfile | versión 3; SHA-256 `ec3f6a39804b4302d377eaa0c12617585ff92f935d837aca628fd4e7645dab3f` |
| `package.json` | SHA-256 `86e28ed82eadc273572e9dd018b4559332ed2c5860a80b27fd20d89013247fbe` |
| Entradas `packages` del lock | 337, incluida la raíz |
| `.env` privado | Ausente en las dos copias |
| `.env.example` | `VITE_API_URL=http://localhost:3000/api` |

Node no está fijado mediante `.nvmrc`, `.node-version`, Volta, `engines` o imagen versionada. `v20.19.5` es referencia reproducida, no decisión definitiva; corresponde a M-16.

Versiones top-level resueltas de forma idéntica en A y B:

| Paquete | Versión |
| --- | ---: |
| React / React DOM | `19.2.7` / `19.2.7` |
| React Router DOM | `7.18.1` |
| Vite / plugin React | `7.3.6` / `5.2.0` |
| DOMPurify | `3.4.11` |
| Lucide React | `0.562.0` |
| ESLint / `@eslint/js` | `9.39.4` / `9.39.4` |
| jsx-a11y / react-hooks / react plugin | `6.10.2` / `7.1.1` / `7.37.5` |
| globals | `17.7.0` |

## 4. Metodología y comandos

Las dos ejecuciones parten del mismo tar versionado, no del `node_modules` local:

```bash
git archive --format=tar --output=/tmp/despensa-f1-201c3e6.tar 201c3e67992e5580c03fcdb15c98ee56a4a950cc
mkdir /tmp/despensa-f1-201c3e6-run-a
mkdir /tmp/despensa-f1-201c3e6-run-b
tar -xf /tmp/despensa-f1-201c3e6.tar -C /tmp/despensa-f1-201c3e6-run-a
tar -xf /tmp/despensa-f1-201c3e6.tar -C /tmp/despensa-f1-201c3e6-run-b
```

En cada copia:

```bash
npm ci
npm run build
npm run lint
```

En A también:

```bash
npm audit --json
npm run audit
find . -type f \( -name '*.test.*' -o -name '*.spec.*' \)
find .github/workflows -type f
```

La primera ejecución sandboxed de `npm ci` falló al validar el binario de esbuild con `spawnSync ... EPERM`; al repetir exactamente `npm ci` fuera de esa restricción, A y B pasaron. La primera ejecución sandboxed de `npm run audit` falló por DNS `EAI_AGAIN`; repetida con red autorizada, pasó. Son limitaciones del entorno de ejecución, no fallos del proyecto.

## 5. Resultado consolidado

| Comprobación | Ejecución A | Ejecución B | Veredicto de baseline |
| --- | --- | --- | --- |
| `npm ci` | Pasa: 287 paquetes añadidos, 288 auditados, 0 vulnerabilidades | Idéntico | Reproducible en este entorno |
| `npm run build` | Pasa; Vite 7.3.6; 1.741 módulos; 1,72 s | Mismos nombres, tamaños, hashes y 1,72 s | Reproducible byte a byte |
| `npm run lint` | Falla: 5 errores, 19 warnings | Idéntico | Fallo preexistente confirmado |
| `npm audit --json` | 0 vulnerabilidades | No repetido | Temporal; no sustituye revisión de seguridad |
| `npm run audit` | Pasa tras habilitar red | No repetido | Script funcional con registry disponible |
| Tests | Ausentes | Ausentes | No ejecutables; no equivale a PASS |
| CI | Ausente | Ausente | No existe gate remoto versionado |

`npm ci` y `npm audit` emplean contabilidades distintas: la instalación informa 288 paquetes auditados; el JSON de audit informa 336 dependencias (`69 prod`, `215 dev`, `53 optional`, categorías no necesariamente disjuntas). No deben compararse como la misma métrica.

## 6. Build, bundle y reproducibilidad

Los 13 archivos de `dist` son idénticos entre A y B (`diff -qr` sin salida). Métricas de los artefactos generados:

| Archivo | Bytes | Vite gzip | SHA-256 |
| --- | ---: | ---: | --- |
| `index.html` | 1.173 | 0,53 kB | `8898cfe1e432034d6ef866b182634d9c0a45867585b2cf79786d717afaed6a86` |
| `assets/index-BAJwW1e5.css` | 44.217 | 9,01 kB | `f48070c255c55aafb15d9f442a6de94884a24f3e05334fe0c7f4fa0cafb73020` |
| `assets/index-ej3jfGuV.js` | 391.313 | 119,68 kB | `600bffc891dc371c69709ed6d016cecbfcab129859f56cff4ddc5346760215f4` |

La revisión independiente repitió dos builds limpios en directorios de salida nuevos: A terminó en 1,72 s y B en 1,71 s. Los 13 archivos, sus nombres, tamaños y hashes fueron idénticos byte a byte; el tiempo de ejecución no se usa como criterio de reproducibilidad.

Resultado estructural:

- un único chunk JavaScript y un único CSS;
- sin `React.lazy`, `Suspense`, Error Boundary ni división por ruta;
- 13 archivos y 5.705.567 bytes totales en `dist`, dominados por assets copiados de `public`;
- sin sourcemaps de producción;
- el build aislado sin `.env` incrusta una vez `http://localhost:3000/api`, por lo que sirve como referencia técnica pero no es desplegable en producción.

Comparación histórica:

| Métrica | Auditoría 13-07 | Plan 14-07 | Baseline F1 |
| --- | ---: | ---: | ---: |
| JS sin comprimir | 391,29 kB | 391,29 kB | 391,31 kB |
| JS gzip | 119,35 kB | 119,65 kB | 119,68 kB |
| CSS sin comprimir | 44,22 kB | 44,22 kB | 44,22 kB |
| CSS gzip | 9,04 kB | 9,01 kB | 9,01 kB |

No hay diff de runtime entre los commits y las dos ejecuciones actuales son idénticas. Las diferencias históricas, inferiores a 0,35 kB, se clasifican como variación de medición/herramienta no documentada, no como cambio funcional ni mejora.

## 7. Lint reproducido

ESLint termina con código 1 y `24 problems (5 errors, 19 warnings)` en A y B.

### Errores

| Archivo/línea | Regla | Resultado |
| --- | --- | --- |
| `src/models/homeContentModel.js:86-87` | `no-dupe-keys` | `items` y `productIds` se declaran dos veces |
| `src/views/HomeView.jsx:70,271` | `jsx-a11y/no-noninteractive-tabindex` | `tabIndex` en elementos no interactivos |
| `src/views/ProductCard.jsx:28` | `jsx-a11y/no-noninteractive-element-to-interactive-role` | rol interactivo sobre elemento no interactivo |

Los cinco errores están en módulos alcanzables.

### Warnings

| Grupo | Cantidad | Alcance |
| --- | ---: | --- |
| `useShopController.js`: dependencias/memos | 7 | Runtime activo |
| `Header.jsx`: prop sin usar e interacción estática | 3 | Runtime activo |
| `ProductCard.jsx` | 1 | Runtime activo |
| `ProductView.jsx` | 2 | Runtime activo |
| `adminControllerActions.js` | 1 | Desconectado |
| `SeoManager.jsx` | 1 | Desconectado |
| `SupplierView.jsx` | 4 | Desconectado |

Hay 13 warnings alcanzables y 6 desconectados. No se silenció ni corrigió ninguno.

## 8. Tests y CI

Estado confirmado en el árbol versionado, excluyendo `node_modules` y `dist`:

- no existe script `test`;
- no existen archivos `*.test.*` o `*.spec.*`;
- no existe configuración Vitest, Jest o Playwright;
- no existe `.github/workflows`;
- no existe cobertura ni threshold versionado.

Por tanto, tests y CI se registran como **AUSENTES**, nunca como “pasan”. Los únicos checks ejecutables actuales son build, lint y audit.

## 9. Grafo de imports desde `src/main.jsx`

El analizador recorre imports/exports estáticos y `import()` relativos, resuelve `.js`, `.jsx` e `index.*`, y excluye CSS del universo JS/JSX. La revisión independiente calculó componentes fuertemente conexos sobre el grafo completo para detectar ciclos.

| Métrica | Resultado |
| --- | ---: |
| Módulos JS/JSX | 51 |
| Alcanzables | 29 |
| Desconectados | 22 |
| Imports relativos JS/JSX sin resolver | 0 |
| Componentes cíclicos | 0 |
| Líneas JS/JSX totales | 8.885 |
| Líneas alcanzables | 4.990 |
| Líneas desconectadas | 3.895 (43,84 %) |

Módulos desconectados, idénticos a la matriz aprobada:

```text
src/api.js
src/components/cms/CmsResponsiveImage.jsx
src/controllers/adminControllerActions.js
src/controllers/authAccountControllerActions.js
src/controllers/cartCheckoutControllerActions.js
src/controllers/catalogControllerActions.js
src/controllers/controllerHelpers.js
src/controllers/controllerInitialState.js
src/controllers/controllerRoutes.js
src/controllers/homeContentControllerActions.js
src/controllers/reviewControllerActions.js
src/controllers/supplierControllerActions.js
src/models/supplierMessageModel.js
src/models/supplierModel.js
src/models/userModel.js
src/utils/analytics.js
src/views/AuthGuards.jsx
src/views/CookieConsent.jsx
src/views/DesignSystemPreview.jsx
src/views/LegalView.jsx
src/views/SeoManager.jsx
src/views/SupplierView.jsx
```

No se conectó, movió ni eliminó ningún módulo.

## 10. Routing y rutas observables

El runtime conserva tres representaciones: `readRoute` en `App.jsx`, `<Routes>` en `AppView.jsx` y `routeByView/buildRoute` en el controlador.

| URL | Vista alcanzable | Precondición funcional | Estado de ejecución F1 |
| --- | --- | --- | --- |
| `/` | `HomeView` | API de home/productos para contenido remoto | No ejecutado en navegador |
| `/catalogo` | `CatalogView` | API pública de catálogo | No ejecutado |
| `/catalogo/:categorySlug` | `CatalogView` | categoría/datos válidos | No ejecutado |
| `/producto/:productId` | `ProductView` | ID y API de producto/reseñas | No ejecutado |
| `/cesta` | `CartView` | sesión para carrito backend | No ejecutado |
| `/la-rayana` | `StoryView` | Ninguna API esencial identificada | No ejecutado |
| `/pedidos` | `OrdersView` | sesión de cliente | No ejecutado |
| `/cuenta` | `AccountView` | sesión según acciones internas | No ejecutado |
| `/gestion` | `AdminView` | usuario admin; guard solo interno de vista | No ejecutado |
| Cualquier otra | redirección a `/` | Router montado | Verificado solo estáticamente |

Supplier, legales, consentimiento, SEO dinámico y preview no tienen ruta alcanzable.

## 11. Frontera HTTP activa

Base del cliente: `VITE_API_URL` o fallback `http://localhost:3000/api`. `apiClient.js` usa `fetch` directo, añade bearer si hay sesión y reintenta una vez tras `POST /auth/refresh`; no hay abort, debounce, caché, deduplicación ni refresh single-flight.

| Dominio | Endpoints activos visibles | Autorización esperada según backend `346d881` |
| --- | --- | --- |
| Auth | `POST /auth/login`, `/register`, `/refresh`, `/logout` | públicos; refresh/logout reciben token en body |
| Catálogo | `GET /categories?limit=100`, `/products?...`, `/products/:id` | público |
| Categorías admin | `POST /categories`, `PATCH/DELETE /categories/:id` | admin |
| Productos admin | `POST /products`, `PATCH/DELETE /products/:id`, `POST /products/:id/images` | admin |
| Home/CMS | `GET /home-content`, `PUT /home-content`, `POST /home-content/images` | lectura pública; escritura admin |
| Carrito | `GET/DELETE /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:sku` | usuario autenticado |
| Pedidos | `GET /orders?limit=100`, `GET /orders/client/:email`, `POST /orders`, `DELETE /orders/:id`, `PATCH /orders/:id/cancel` | admin/owner según operación |
| Reseñas | `GET /reviews/product/:id`, `GET /reviews/me`, `GET /reviews?limit=100`, `POST /reviews/product/:id`, `PATCH/DELETE /reviews/:id` | mixto público, owner y admin |
| Usuarios | `GET /users?limit=100`, `PATCH/DELETE /users/:id` | admin u owner según operación |

Contrastes relevantes:

- backend ofrece `GET /products/admin/all`, pero el admin activo usa el catálogo público limitado: H-05 confirmado;
- backend ofrece `PATCH /orders/:id/cancel` y el modelo activo lo implementa, pero `actions.cancelOrder` no se expone: H-03 confirmado;
- backend ofrece `PATCH /reviews/:id`; el formulario de producto llama siempre a create: H-04 confirmado;
- backend acepta creación de pedido, pero UI y validación de checkout divergen: C-01 confirmado;
- supplier/mensajería tiene rutas backend, pero sus modelos/vistas frontend son desconectados y quedan fuera de la frontera activa.

Este contraste es estático. No se enviaron peticiones, no se ejecutaron seeds y no se modificaron datos.

## 12. Flujos críticos y estado de ejecución

| Flujo | Precondiciones mínimas | Evidencia estática | Ejecución F1 |
| --- | --- | --- | --- |
| Home → catálogo → producto | Backend/DB con categorías y productos | Rutas/modelos alcanzables | No ejecutado: sin entorno de datos controlado |
| Buscar/filtrar/paginar | Dataset >100 y red controlable | Petición por cambio; límite/carreras documentados | No ejecutado |
| Registro/login/refresh/logout | Email/usuarios y secretos backend | Modelos activos; tokens persistidos en `localStorage` | No ejecutado |
| Añadir/editar/eliminar carrito | Usuario y stock conocido | Endpoints activos | No ejecutado |
| Checkout/pedido | Usuario, carrito, dirección y decisión C-01 | Validación exige tarjeta no renderizada | Bloqueado estáticamente; no se intentó pedido |
| Listar/cancelar pedido | Pedido owner en estado cancelable | Botón llama acción inexistente | Fallo confirmado estáticamente; no se invocó API |
| Crear/editar/eliminar reseña | Usuario, producto y reseña propia | Edición de producto usa create | Fallo confirmado estáticamente |
| Administración | Cuenta admin y datos de todos los estados | listado usa endpoint público | Incompleto estáticamente; no ejecutado |
| Supplier | Cuenta/contratos supplier | 22 módulos fuera del grafo | No disponible en runtime |
| Legal/consentimiento/analytics | contenido y decisiones aprobadas | módulos desconectados/placeholders | No disponible en runtime |

No existe staging, fixtures frontend ni base sintética documentada. Marcar estos recorridos como PASS sería una afirmación no sustentada.

## 13. Assets, CSS y tamaño estructural

### Assets versionados

`public` contiene 10 archivos y 5.268.864 bytes.

| Asset | Dimensiones | Bytes |
| --- | ---: | ---: |
| `camino-extremadura.png` | 1896×830 | 2.852.558 |
| `despensa-rayana-hero.png` | 1672×941 | 2.111.225 |
| `android-chrome-512x512.png` | 512×512 | 221.090 |
| Resto de 7 archivos | iconos/robots/sitemap | 83.991 |

Los dos hero suman 4.963.783 bytes, el 94,21 % de `public`. No existen variantes AVIF/WebP versionadas para ellos.

### CSS

Metodología: comentarios retirados; preludios de selector normalizados; valores medidos con regex explícitas.

| Métrica | Resultado |
| --- | ---: |
| Líneas / bytes de `src/styles.css` | 2.985 / 55.255 |
| Bloques de selector | 454 |
| Grupos repetidos | 47 incluyendo `:root`; 46 excluyéndolo |
| Bloques extra dentro de grupos repetidos | 64 |
| Bloques `:root` | 2 |
| Literales hex | 158 apariciones; 61 valores únicos |
| Valores `px` | 729 apariciones; 94 valores distintos |
| `prefers-reduced-motion` | Ausente |

La auditoría indicó 132 literales de color sin publicar su regex. Esa cifra no se reproduce con el criterio actual; no se interpreta como cambio porque el archivo es byte a byte el mismo. Los 94 valores `px` coinciden si se cuentan valores distintos.

### Módulos grandes

| Archivo | Líneas | Estado |
| --- | ---: | --- |
| `useShopController.js` | 1.569; 41 `useState` | Activo |
| `AdminView.jsx` | 961 | Activo |
| `SupplierView.jsx` | 1.083 | Desconectado |
| `HomeView.jsx` | 390 | Activo |
| `ProductView.jsx` | 233 | Activo |

## 14. Errores y riesgos preexistentes fijados

Esta baseline conserva, sin remediar:

- C-01 checkout bloqueado;
- C-02 pago real ausente;
- C-03 legales/consentimiento fuera del runtime;
- H-03 cancelación no expuesta;
- H-04 edición de reseña incorrecta;
- H-05 listado admin incompleto;
- H-12 lint 5/19;
- H-01/H-06 controlador monolítico y arquitectura superpuesta;
- H-07 tests/CI ausentes;
- H-08 tokens access/refresh en `localStorage`;
- H-09 red sin cancelación, debounce, caché o single-flight;
- H-10/H-11 deuda de accesibilidad y rendimiento.

Build correcto no reduce la severidad de estos hallazgos.

## 15. Tests de caracterización planificados, no creados

Orden mínimo para Fase 3, sujeto a la estabilización F2 prevista:

1. routing: deep links, back/forward y fallback;
2. catálogo: filtros, paginación y respuesta fuera de orden;
3. auth: login, 401→refresh, fallo refresh y logout;
4. carrito: add/update/remove/clear y errores de stock;
5. C-01: validación visible, payload único, carrito preservado ante error y sin PAN/CVC;
6. H-03: cancel owner, estado permitido, rechazo y doble click;
7. H-04: create frente a PATCH, precarga, reset y delete;
8. H-05: endpoint admin, estados no públicos y 403;
9. home/CMS: normalización y claves duplicadas corregidas;
10. smoke Playwright: home→producto, auth, carrito/checkout, pedidos/reseñas y permisos admin.

No se añadió harness, dependencia, configuración ni archivo de test en Fase 1.

## 16. Limitaciones y confianza

- No se inició servidor, navegador, backend, base de datos ni proveedor externo.
- No se midieron Lighthouse, axe, Core Web Vitals, lectores de pantalla, responsive real o compatibilidad de navegador.
- No se validaron TLS, rewrites SPA, headers/CSP del hosting, cookies de producción ni observabilidad.
- Audit depende del estado temporal del registry y solo detecta vulnerabilidades publicadas.
- Los endpoints se contrastaron contra código backend local `346d881`, no contra un despliegue.
- El build sin `.env` usa localhost y no representa configuración de staging/producción.
- Las dos reproducciones comparten OS, Node, npm y cache de registry; una revisión en otro entorno sigue siendo necesaria.

Confianza: **alta** para install/build/lint/grafo/assets y contratos estáticos; **media** para riesgos UI/a11y/performance sin navegador; **no evaluable** para flujos reales, hosting, pagos, legal y operaciones.

## 17. Rollback de Fase 1

El único cambio permitido en el repositorio es `BASELINE_FRONTEND.md`.

- Antes de commit: con autorización explícita, ejecutar `rm -- BASELINE_FRONTEND.md`; no tocar los untracked preexistentes.
- Después del commit de esta fase, mientras sea el último commit de `docs/remediation-f1-baseline`: ejecutar `git revert --no-edit HEAD` y publicar el nuevo commit sin force push. El revert afecta únicamente a `BASELINE_FRONTEND.md`.
- Si existieran commits posteriores, identificar primero el SHA exacto mediante `git log --oneline --grep='^docs(baseline): record frontend remediation baseline$'`, verificarlo con `git show --stat <sha>`, y ejecutar `git revert --no-edit <sha>` solo después de esa comprobación.
- Las copias `/tmp/despensa-f1-201c3e6-*` son artefactos temporales de medición; pueden retirarse después de la revisión independiente mediante una operación explícitamente autorizada y limitada a esas rutas.
- No existe rollback productivo porque no se cambió runtime, configuración, lockfile, dependencias, tests, CI ni datos.

## 18. Revisión independiente y Gate 1

Hallazgos de revisión:

| Clasificación | Sección | Afirmación cuestionada | Evidencia reproducida | Impacto y corrección documental mínima |
| --- | --- | --- | --- | --- |
| Menor | 3 | La versión de Git no estaba registrada | `git version 2.43.0` | Completitud del entorno; se añadió una fila, sin afectar resultados |
| Importante | 9 | El recuento de ciclos requerido no era explícito | 0 componentes cíclicos mediante análisis de componentes fuertemente conexos | Faltaba una métrica del grafo; se añadió método y resultado |
| Sin acción | 5-6 | La captura inicial registró 1,72 s en ambos builds; la revisión obtuvo 1,72 s y 1,71 s | Los 13 archivos y sus SHA-256 son idénticos | Variación temporal no determinista; no se cambian las métricas originales |
| Sin acción | 13 | El workspace contiene 11 entradas en `public`, pero la baseline registra 10 assets | La undécima es el untracked preexistente `camino-extremadura.png:Zone.Identifier` de 25 bytes; el build versionado contiene 10 assets | La sección ya limita la afirmación a assets versionados; no requiere corrección |

| Criterio | Evidencia | Estado |
| --- | --- | --- |
| Gate 0 integrado | `main@201c3e6`, acta Gate 0 PASS | PASS |
| Dos instalaciones desde lock | A y B con mismo lock y versiones | PASS |
| Dos builds equivalentes | 13 archivos idénticos; hashes de chunks iguales | PASS |
| Lint fijado | 5 errores/19 warnings en A y B | PASS como evidencia; lint funcionalmente FAIL |
| Audit registrado | 0 vulnerabilidades el 14-07-2026 | PASS como captura temporal |
| Tests/CI registrados | Ambos AUSENTES, sin presentarlos como éxito | PASS documental |
| Grafo, rutas, endpoints, bundle, assets y CSS | Secciones 6 y 9-13 | PASS documental |
| Commits FE/BE y límites citados | `201c3e6` / `346d881`; sección 16 | PASS |
| Cero remediaciones ocultas | Status/diff final limitado a este documento; workspace productivo intacto | PASS |
| Reproducción/revisión independiente | Repetidos lint, dos builds limpios, audit, tests/CI, grafo/ciclos, bundle, assets y entorno; contratos contrastados con backend `346d881` | PASS |

**Veredicto final:** **GATE 1 PASS**. Todas las métricas clave se reproducen; las diferencias quedan justificadas y no se modificó runtime, configuración, dependencias, tests ni CI. Este cierre no inicia ni autoriza automáticamente la Fase 2.
