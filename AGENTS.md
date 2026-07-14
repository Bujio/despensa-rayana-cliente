# Reglas de ejecución del frontend

## Alcance

Estas reglas se aplican a todo el repositorio `despensa-rayana-cliente`. Las instrucciones explícitas del usuario prevalecen. Un `AGENTS.md` más cercano puede concretarlas para su subárbol, pero no puede rebajar protecciones de Git, seguridad, calidad o gates sin aprobación registrada.

## Fuentes de autoridad

Usar este orden cuando existan discrepancias:

1. Código ejecutable, contratos backend vigentes, tests y resultados reproducibles.
2. Gate, baseline, RFC y ADR aprobados para la fase activa.
3. `PLAN_REMEDIACION_FRONTEND.md`.
4. `AUDITORIA_FRONTEND.md`.
5. `FEATURE_MATRIX_FRONTEND.md` y documentos operativos.
6. `README.md` y documentación descriptiva.

No inferir que una capacidad existe porque aparece en README, sitemap, CSS o código no alcanzable.

## Preflight obligatorio

Antes de leer o modificar el proyecto:

1. Confirmar `pwd`: `/home/rizzo/dev/react/Frontend DespensaRayana`.
2. Confirmar que `origin` apunta a `Bujio/despensa-rayana-cliente`.
3. Ejecutar `git status --short --branch` y `git rev-parse HEAD`.
4. Registrar la rama, base, diferencias con `origin/main`, cambios tracked y untracked.
5. Leer el plan, documentos de la fase, gate anterior y estas reglas.

Detenerse sin modificar nada si el repositorio, remoto, base o fase no coinciden. No ocultar, mover, sobrescribir ni borrar cambios locales para conseguir un worktree limpio.

## Fases y gates

- Ejecutar una sola fase o subfase autorizada cada vez.
- No avanzar automáticamente después de completar o revisar una fase.
- Un gate requiere evidencia medible y las aprobaciones humanas que indique el plan.
- `PENDING`, `FAIL` o ausencia de acta impiden abrir la siguiente fase.
- Para el Gate 0 de este proyecto personal, la revisión técnica independiente de Codex y la aprobación explícita del propietario satisfacen la revisión documental; esta excepción no se extiende a gates funcionales, cross-stack, seguridad, pago, legal o producción.
- Un cambio fuera de alcance requiere detenerse y obtener autorización; no se resuelve «de paso».
- Separar reparación funcional, tests/CI, refactor, rediseño, seguridad, pago, legal y operaciones.

## Arquitectura y alcance

- La autoridad provisional es el runtime alcanzable desde `src/main.jsx`.
- Aplicar la opción C del plan de forma provisional: conservar el controlador activo como compatibilidad y migrar por features solo tras tests y RFC.
- No conectar en bloque los 22 módulos desconectados.
- No borrar, mover ni ignorar código desconectado sin propósito, consumidores, contrato, owner, evidencia de no uso y decisión aprobada.
- No mantener dos routers, clientes HTTP o fuentes de estado con autoridad equivalente.
- No introducir una dependencia, patrón o abstracción por preferencia. Documentar problema, alternativas, coste, licencia, seguridad, bundle, mantenimiento y rollback.
- Añadir tests de caracterización antes de refactorizaciones de riesgo.
- Preferir el cambio mínimo que satisfaga un criterio observable y permita rollback.

## Política de cambios

- Un PR y un commit deben tener un objetivo, categoría y fase identificables.
- No mezclar cambios mecánicos masivos con cambios de comportamiento.
- No actualizar dependencias o lockfile salvo fase y autorización específicas.
- No cambiar contratos frontend/backend unilateralmente.
- No añadir TypeScript global, estado global, query layer, Storybook o rediseño sin RFC y evidencia.
- No declarar terminado porque compila.
- No aceptar errores, warnings, exclusiones o silenciamientos nuevos.
- Preservar compatibilidad de datos; versionar o soportar dual-read cuando una migración lo exija.

## Validación mínima

Cada cambio debe declarar antes de implementarse:

- alcance y exclusiones;
- archivos previsibles;
- riesgos y dependencias frontend/backend/producto/legal/terceros;
- tests y validación manual;
- criterios de aceptación observables;
- rollback y señal que lo dispara.

Al cerrar, ejecutar lo aplicable de forma reproducible:

- `git diff --check` y revisión completa del diff;
- lint sin nuevos errores ni warnings;
- tests unitarios, integración y E2E afectados;
- build de producción;
- estados loading, empty, error, success y disabled;
- 401, 403, 4xx, 5xx, timeout, red lenta y sesión expirada cuando apliquen;
- móvil, tablet, desktop, teclado, foco y Escape cuando haya UI;
- bundle, assets, accesibilidad, seguridad u observabilidad cuando la categoría lo requiera.

Si no existe un test, registrarlo como ausencia; nunca convertirlo en «pasa». Un smoke manual no sustituye una suite exigida por el gate.

## Git y protección del trabajo

- `main` deberá estar protegida antes de integrar cambios funcionales o abrir una release.
- Partir de la rama/base indicada para la fase y sincronizar antes de abrir trabajo nuevo.
- Usar commits pequeños con Conventional Commits e ID de hallazgo cuando exista.
- No hacer commit, push, merge, tag ni release sin autorización explícita.
- No añadir secretos, tokens, `.env`, datos personales, credenciales de proveedor o dumps.
- No incluir cambios locales ajenos en staging o commits.
- No mezclar varias fases en un commit.

Está prohibido:

- `git reset --hard`;
- `git clean -fd` o variantes destructivas;
- `git push --force`;
- rebase destructivo;
- perder o sobrescribir cambios locales;
- usar `.gitignore` para ocultar artefactos sin clasificarlos;
- revertir trabajo ajeno sin autorización.

## Baseline conocida en la base auditada

En `e623d5a2946e47ee91b546821bccad2c12157a8d`:

- build de producción pasa;
- lint falla con 5 errores y 19 warnings;
- no hay tests frontend ni script `test`;
- no hay CI versionada;
- el runtime alcanza 29 módulos JS/JSX y deja 22 fuera;
- checkout, cancelación, edición de reseñas y listado admin tienen los bloqueos documentados.

Estos resultados son deuda preexistente, no permiso para empeorar el baseline ni para corregirla fuera de su fase.

## Definition of Done resumida

Un cambio solo está terminado si cumple aceptación funcional, tests y checks aplicables, no amplía el alcance, no introduce deuda silenciosa, documenta dependencias y rollback, supera revisión del diff y conserva una única autoridad arquitectónica. Seguridad, accesibilidad, responsive y tratamiento de errores forman parte del resultado cuando el cambio los afecta.

## Condiciones de parada

Detenerse y no hacer push si hay repo/base incorrectos, cambios no atribuidos, gate anterior incompleto, decisión humana bloqueante, secretos, contrato backend incierto, tests/checks peores, rollback no viable, alcance mezclado o discrepancia entre evidencia y documentación.
