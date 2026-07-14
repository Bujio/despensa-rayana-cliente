# Gobierno de recuperación del frontend

**Fecha:** 14 de julio de 2026

**Repositorio:** `Bujio/despensa-rayana-cliente`

**Ruta verificada:** `/home/rizzo/dev/react/Frontend DespensaRayana`

**Base:** `main` @ `e623d5a2946e47ee91b546821bccad2c12157a8d`

**Estado:** cierre documental de Fase 0 aprobado. Gate 0 PASS.

## 1. Objetivo y freeze

La recuperación prioriza estabilidad, evidencia y entrega incremental. Desde la aprobación de este documento se propone congelar nuevas funcionalidades hasta Gate 3. Solo se admiten:

- documentación y baseline de Fases 0-1;
- C-01, H-03, H-04, H-05 y H-12 en Fase 2;
- tests y CI de Fase 3;
- mitigación urgente de seguridad/incidente autorizada y documentada.

Cualquier excepción requiere owner, razón de negocio, análisis de impacto, tests, rollback y decisión escrita del FE Lead y Product Owner. Supplier, rediseño, pago real, TypeScript global y conexión de módulos desconectados quedan fuera del freeze permitido.

Javier Vivas Ávila, como propietario del repositorio, Product Owner y Frontend Lead provisional para Fases 0 y 1, aprueba explícitamente este freeze el 14 de julio de 2026.

## 2. Inventario protegido del worktree

Preflight de Fase 0:

- rama `main`, alineada con `origin/main` (`ahead 0`, `behind 0`);
- `HEAD` `e623d5a2946e47ee91b546821bccad2c12157a8d`;
- sin cambios tracked ni staged;
- untracked encontrados y preservados:
  - `.codex-upload/`;
  - `.codex/`;
  - `.git-codex-backup/`;
  - `AUDITORIA_FRONTEND.md`;
  - `PLAN_REMEDIACION_FRONTEND.md`;
  - `public/camino-extremadura.png:Zone.Identifier`.

Clasificación provisional: los tres directorios `.codex*` son artefactos locales de tooling; auditoría y plan son documentación de recuperación aún no versionada; `Zone.Identifier` es metadata descargada. Propiedad y destino siguen pendientes. No se eliminan, mueven, añaden ni ocultan mediante `.gitignore` en Fase 0.

## 3. Roles y responsabilidades

| Rol | Responsabilidad de decisión/validación |
| --- | --- |
| Product Owner | Freeze, alcance visible, checkout temporal, supplier, soporte y prioridades |
| Frontend Lead | Arquitectura, calidad, alcance de PR, aceptación técnica y rollback FE |
| Backend Lead | Contratos API, permisos, idempotencia, auth, datos y rollback BE |
| QA Lead | Estrategia, casos críticos, evidencia manual/E2E y regresión |
| Security | Threat model, auth, pago, secretos, CSP y aprobación de riesgo |
| Legal/Privacy | Textos, cookies, consentimiento, analytics, retención y devoluciones |
| DevOps/SRE/Hosting | Branch protection, CI runners, entornos, headers, observabilidad y despliegue |
| Design/a11y | Referencia UI, responsive, interacción, contraste y accesibilidad |
| Finance/Ops/Support | Conciliación, proveedor, logística, devoluciones e incidentes de cliente |
| Release Manager | Gates de release, ventana, tag, rollback drill y GO/NO GO |

Para Gate 0 quedan asociados Product Owner, Frontend Lead, Maintainer y revisor principal. Backend Lead se nominará antes de la primera decisión cross-stack de Fase 2; Security y Legal antes de Fase 6; DevOps/Hosting antes de aplicar branch protection operativa, CI, staging o release en las fases correspondientes.

## 4. Severidad y escalado

| Nivel | Criterio | Tratamiento |
| --- | --- | --- |
| Crítica | Bloquea compra/cobro, expone datos o puede causar pérdida financiera/legal | Congelar merge/release; owner inmediato; rollback/kill switch |
| Alta | Rompe flujo principal, permisos, integridad o gate obligatorio | Resolver en fase propietaria antes del gate |
| Media | Degrada mantenibilidad, escala, rendimiento o UX sin bloquear el flujo | Priorizar por evidencia; no mezclar con críticos |
| Baja | Higiene, consistencia o mejora local sin impacto material inmediato | Resolver solo en fase/PR coherente |

Un hallazgo dependiente de backend, tercero, producto o legal no pierde severidad. La dependencia identifica al aprobador y el bloqueo.

## 5. Estrategia de ramas

`main` deberá estar protegida antes de integrar cambios funcionales o abrir una release.

Propuesta de ramas por fase:

| Fase | Rama |
| ---: | --- |
| 0 | `docs/remediation-f0-governance` |
| 1 | `docs/remediation-f1-baseline` |
| 2 | una rama por ID: `fix/c01-checkout-contract`, `fix/h03-order-cancel`, `fix/h04-review-update`, `fix/h05-admin-products`, `fix/h12-lint` |
| 3 | `test/frontend-critical-flows` y `ci/frontend-quality-gates` |
| 4 | `docs/remediation-f4-architecture` |
| 5 | `refactor/<feature>-canonical` por feature/subfeature |
| 6 | `feat/payments-<provider>`, `security/auth-session`, `feat/compliance-runtime` |
| 7 | ramas por patrón medible: a11y, images, splitting, CSS |
| 8 | ramas por frontera/feature: HTTP, schemas, tipos, escala, observabilidad |
| 9 | rama/tag de release candidate según política aprobada |

Reglas:

1. Crear cada rama desde `main` actualizado después de merge y gate de su dependencia.
2. Una rama/PR no contiene más de una fase ni más de un hallazgo funcional independiente.
3. PR preferiblemente revisable en 1-3 días; dividir por comportamiento, no por capas artificiales.
4. Evitar editar archivos monolíticos en paralelo. Serializar cambios sobre `useShopController.js`, `AppView.jsx`, `AdminView.jsx` y `styles.css`.
5. Sincronizar con `main` antes de abrir PR, tras merges que afecten contratos compartidos y antes de la validación final.
6. No abrir una cadena larga de PR dependientes. Si existe dependencia, declararla, fijar orden y no mergear la hija primero.
7. Crear tags solo para baseline aprobada si se decide, release candidates y releases GO; nunca para trabajo incompleto.

## 6. Commits y PR

Usar Conventional Commits, descripción imperativa y referencia al ID/gate cuando exista:

- `docs(governance): add frontend execution rules`;
- `docs(governance): classify frontend features`;
- `fix(checkout): align pending order contract [C-01]`;
- `test(orders): cover customer cancellation [H-03]`;
- `ci(frontend): enforce critical quality gates`.

Cada commit debe:

- ser coherente y revertible por sí mismo;
- excluir formateos y archivos no relacionados;
- declarar motivo y resultado, no solo archivos tocados;
- no contener secretos, `.env`, tokens, datos personales ni dumps;
- no mezclar documentación de fase, fix, refactor, dependencia y rediseño.

Cada PR incluye base/HEAD, alcance/exclusiones, hallazgo o fase, evidencia antes/después, tests/comandos, validación manual, riesgos, dependencias externas, capturas cuando la UI cambie, rollback exacto y condición de parada. Requiere al menos revisión FE; añadir BE, Security, Legal, Product o DevOps según la frontera afectada.

## 7. Política de validación

| Categoría | Checks mínimos antes de merge |
| --- | --- |
| Solo documentación | Preflight; links/Markdown; revisión completa; `git diff --check`; secretos; coherencia con plan/gate |
| Reparación funcional | Lint; build; tests afectados; smoke success/error; payload/contrato; móvil/teclado si hay UI; rollback |
| Tests/CI | Ejecutar suite local y CI; prueba negativa del gate; detectar flakes; tiempos razonables; permisos mínimos |
| Refactor por feature | Caracterización previa; unit/integration/E2E; grafo; una autoridad; bundle diff; adapter y retirada/rollback |
| Auth/seguridad/pago | Threat model; tests cross-stack/sandbox; secretos; cookies/headers; idempotencia/replay; reviewers de dominio |
| UI/a11y/performance | axe/manual teclado/foco; responsive; contraste/motion; visual; Lighthouse/budgets y medición antes/después |
| Release | CI verde; staging production-like; auditorías; smoke; observabilidad; soporte; rollback drill; acta GO |

Estados a cubrir cuando apliquen: loading, empty, error, success y disabled; 401, 403, 4xx, 5xx, timeout, red lenta, refresh, back/forward y sesión expirada. No se aceptan exclusiones globales para hacer verde un gate.

Baseline conocida en la base auditada: build pasa; lint falla con 5 errores/19 warnings; no hay tests, script `test` ni CI. Esos fallos deben registrarse hasta su fase; ausencia de test no equivale a éxito.

## 8. Definition of Done

Un cambio está terminado únicamente cuando:

1. El alcance y las exclusiones aprobadas no cambiaron silenciosamente.
2. Cada criterio de aceptación es observable y aporta evidencia.
3. Código, contratos, documentación y copy visible son coherentes.
4. Lint, build, tests y CI aplicables pasan sin errores/warnings nuevos ni silenciamientos.
5. Tests cubren comportamiento y errores relevantes; no dependen de sleeps o snapshots cosméticos.
6. Se validan estados de UI, responsive, teclado, foco y errores cuando el cambio los afecta.
7. Seguridad, privacidad, datos y permisos tienen reviewer cuando cruzan su frontera.
8. Existe una sola autoridad para la feature y el código desconectado fue clasificado, no conectado por accidente.
9. El diff completo está revisado, `git diff --check` pasa y no hay secretos/artefactos ajenos.
10. El impacto en bundle, accesibilidad, rendimiento y observabilidad se mide cuando corresponde.
11. Rollback está documentado, es viable y conserva datos; se probó si el riesgo lo exige.
12. El gate y los owners requeridos aprueban; compilar por sí solo no satisface DoD.

## 9. Rollback

Todo PR debe definir:

- señal de activación: fallo de checks, error rate, flujo roto, doble operación, degradación o incidente;
- owner que decide y ejecuta;
- mecanismo: revert del PR, feature flag, deshabilitar CTA/ruta o volver al slot anterior;
- tratamiento de datos/eventos y compatibilidad con la versión anterior;
- validación posterior y comunicación.

Principios:

- Preferir revert de un PR pequeño; no usar comandos destructivos.
- Una reparación funcional tiene rollback por ID, no rollback conjunto de toda la fase.
- Migraciones de storage/API deben admitir versión anterior o dual-read durante la ventana acordada.
- Pago debe tener kill switch, conservar ledger/webhooks y permitir volver a beta sin cobro.
- Auth requiere compatibilidad de sesión y plan para evitar lockout.
- CSP se despliega report-only antes de enforcement.
- Legal/analytics no esenciales pueden deshabilitar tags, pero no falsear consentimiento.
- Un rollback no borra logs/evidencia ni cambios locales ajenos.

Prohibiciones permanentes: `git reset --hard`, `git clean -fd`, `git push --force`, rebase destructivo, pérdida de cambios locales, commits con secretos y varias fases en un commit.

## 10. Push, merge y parada

Hacer push solo con autorización explícita, worktree inventariado, diff revisado, checks aplicables ejecutados, rollback escrito y sin datos sensibles. Mergear solo en orden de dependencias y tras reviewers/gate. No usar push como copia de seguridad de trabajo no revisado.

No hacer push/merge si:

- repositorio, remoto, base o gate no coinciden;
- hay cambios locales no atribuidos o alcance mezclado;
- falta una decisión u owner bloqueante;
- checks empeoran o se silencian;
- contratos cross-stack no están verificados;
- falta rollback, staging o aprobación de dominio exigida;
- se pretende avanzar a otra fase sin orden explícita.

## 11. Acta Gate 0

| Criterio medible | Evidencia Fase 0 | Estado |
| --- | --- | --- |
| Ruta, remoto, rama y HEAD correctos | Registrados arriba; `main` @ `e623d5a`, origin esperado | PASS |
| Worktree protegido e inventariado | Todos los archivos untracked inventariados durante el preflight permanecen preservados y clasificados | PASS |
| Reglas permanentes disponibles | `AGENTS.md` | PASS documental |
| Freeze y excepciones definidos | Sección 1; aprobación explícita de Javier Vivas Ávila | PASS |
| Cada feature tiene estado y owner por rol | `FEATURE_MATRIX_FRONTEND.md`; responsables F0-F1 nominados y roles posteriores diferidos a su fase | PASS |
| Los 22 módulos desconectados están clasificados | Inventario completo; ninguno conectado/eliminado | PASS |
| Políticas de ramas, commits, PR y validación | Secciones 5-7 | PASS documental |
| Definition of Done y rollback | Secciones 8-9 | PASS documental |
| Política de branch protection definida | `main` deberá estar protegida antes de integrar cambios funcionales o abrir una release; Javier Vivas Ávila es Maintainer provisional F0-F1 | PASS F0; aplicación operativa obligatoria antes de integración funcional/release |
| Owners y aprobación F0-F1 | Javier Vivas Ávila asume Product Owner, Frontend Lead, Maintainer y revisor principal provisional | PASS |
| Freeze aprobado y comunicado para el proyecto personal | Aprobación explícita del propietario registrada el 14-07-2026 | PASS |
| Revisión documental independiente | Revisión técnica de Codex completada y aceptada explícitamente por el propietario; no se exigen dos revisores para Fase 0 de este proyecto personal | PASS |
| Ningún código/config/dependencia/test/CI cambió | El conjunto revisado contiene exclusivamente los cinco documentos autorizados; los demás untracked permanecen fuera de staging | PASS |

**Veredicto:** **GATE 0 PASS**. Los criterios técnicos y documentales de Fase 0 están satisfechos para este proyecto personal. Backend, Security, Legal y DevOps siguen pendientes únicamente para las fases donde resulten necesarios. Este PASS no inicia automáticamente la Fase 1.

## 12. Aprobaciones

| Rol | Persona | Decisión | Fecha |
| --- | --- | --- | --- |
| Product Owner provisional F0-F1 | Javier Vivas Ávila | Aprueba freeze, alcance y matriz de features | 14-07-2026 |
| Frontend Lead provisional F0-F1 | Javier Vivas Ávila | Aprueba reglas técnicas, arquitectura provisional y DoD | 14-07-2026 |
| Maintainer provisional F0-F1 | Javier Vivas Ávila | Aprueba rama, versionado y cierre de Gate 0 | 14-07-2026 |
| Revisor principal | Javier Vivas Ávila | Acepta la revisión de Codex y aprueba el cierre documental | 14-07-2026 |
| Revisión técnica independiente | Codex | Completada sin cambios de código/config/dependencias/tests/CI | 14-07-2026 |
| Backend Lead | Pendiente | Nominar antes de decisiones cross-stack/contratos backend desde Fase 2 | — |
| Security | Pendiente | Nominar antes de autenticación, seguridad o pagos de Fase 6 | — |
| Legal/Privacy | Pendiente | Nominar antes de cumplimiento, cookies o analytics de Fase 6 | — |
| DevOps/Hosting | Pendiente | Nominar antes de CI/branch protection operativa, staging o release | — |

## 13. Rollback de Fase 0

Antes de merge, el rollback primario es no abrir o cerrar el PR: `main` no recibe ningún cambio. Si debe revertirse el commit de Gate 0 en esta rama o después de integrarlo, conservar primero una copia revisada de los cinco documentos versionados y ejecutar `git revert <commit-gate-0>`; validar status/diff y publicar el nuevo commit de reversión sin force push. El revert retira del historial efectivo de la rama `AGENTS.md`, `AUDITORIA_FRONTEND.md`, `PLAN_REMEDIACION_FRONTEND.md`, `FEATURE_MATRIX_FRONTEND.md` y `GOBIERNO_FRONTEND.md`, sin tocar `.codex*`, `Zone.Identifier` ni otros artefactos locales. No existe rollback de runtime, datos, dependencias o configuración.
