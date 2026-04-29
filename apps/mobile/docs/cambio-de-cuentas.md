Customer/Professional Mode Split Implementation
Source Scope
Pedido del usuario: separar claramente la experiencia cliente y profesional, con cambio explícito de modo desde Perfil/Cuenta.
Reglas del repo en AGENTS.md.
Código actual revisado en RootNavigator.js (line 106), AuthContext.js (line 6), AccountScreen.js (line 21), RequestsScreen.js (line 112), ProfessionalHubScreen.js (line 218).
Contexto adicional: existe un ServiceNeedsScreen.js (line 1) no integrado y con señales de estar desactualizado; no conviene adoptarlo sin refactor.
Current Scope and Assumptions
El problema principal es de navegación e información arquitectónica, no de permisos backend.
rol y modo deben separarse:
rol: capacidades reales del usuario (CUSTOMER, PROFESSIONAL).
modo: superficie activa de la app (CUSTOMER o PROFESSIONAL).
La primera implementación puede ser mobile-only y persistir activeMode localmente.
No hace falta cambio de API para la base, porque /auth/me ya devuelve user.roles y professionalProfile.
Recomendación de naming: usar modo cliente y modo profesional, no modo usuario.
Implementation Tasks Ordered by Importance
1. Definir y congelar la regla de producto rol != modo
Documentar en AGENTS.md que una cuenta puede tener múltiples roles, pero la app mobile muestra una sola superficie activa por vez.
Definir defaults:
sin rol pro: siempre modo cliente
con rol pro: restaurar último activeMode válido
si el usuario pierde acceso pro o no tiene perfil: volver a modo cliente
Why it matters: evita seguir implementando UI híbrida sin una regla base.
Primary owner: apps/mobile + AGENTS.md
2. Reemplazar el tab shell mixto por navegaciones separadas por modo
Rehacer RootNavigator.js (line 106) para que renderice CustomerTabs o ProfessionalTabs según activeMode.
Forzar reset de navegación al cambiar modo con key o navegadores distintos para no arrastrar tabs/screens del modo anterior.
Quitar el tab Professional del modo cliente; el acceso a pro pasa a Cuenta.
Why it matters: es el cambio que realmente elimina la mezcla visual y mental.
Primary owner: apps/mobile/navigation
3. Introducir activeMode en sesión y persistencia local
Extender AuthContext.js (line 6) con activeMode, setActiveMode, switchToCustomerMode, switchToProfessionalMode.
Persistir el modo en storage local, preferentemente en un servicio separado de api.js.
Validar en runtime que no se pueda entrar en modo profesional sin rol PROFESSIONAL.
Why it matters: la navegación separada necesita una fuente de verdad estable.
Primary owner: apps/mobile/contexts + apps/mobile/services
4. Mover activación pro y cambio de modo a Cuenta
Rediseñar AccountScreen.js (line 21) para incluir una tarjeta Modo actual.
Estados esperados:
cliente sin rol pro: Convertirme en profesional
cliente con rol pro: Cambiar a modo profesional
profesional en modo pro: Volver a modo cliente
Reusar ProfessionalHubScreen.js (line 218) como flujo de activación/editado, pero ya no como tab visible para clientes.
Why it matters: el usuario necesita un punto único y entendible para cambiar de superficie.
Primary owner: apps/mobile/screens
5. Separar las superficies híbridas de cliente y profesional
Dejar de usar RequestsScreen.js (line 112) como pantalla dual.
Crear o extraer:
CustomerNeedsScreen: listado de Mis problemas
ProfessionalInboxScreen: bandeja de solicitudes/conversaciones pro
Mantener RequestDetailScreen como pantalla compartida solo si el ownership ya está resuelto por backend.
Why it matters: aunque se cambien tabs, la confusión persiste si un screen sigue mezclando dos trabajos distintos.
Primary owner: apps/mobile/screens
6. Aplicar guardas de acceso por modo y por estado profesional
Cliente-only:
Home
creación/edición de ServiceNeed
selección de profesionales
Pro-only:
Mi Hub
Oportunidades
inbox profesional
Recomendación: si professionalProfile.status !== APPROVED, el modo profesional muestra solo Mi Hub y Cuenta.
Why it matters: evita tabs vacíos o promesas falsas para perfiles todavía no aprobados.
Primary owner: apps/mobile/navigation + apps/mobile/screens
7. Actualizar copy, componentes de soporte y tests
Ajustar labels actuales:
Ser Pro deja de ser tab
Reservas probablemente debe renombrarse según modo
Agregar componente reutilizable tipo ModeSwitchCard.
Actualizar RootNavigator.integration.test.js (line 12) y sumar casos de cambio de modo.
Why it matters: sin copy y cobertura consistentes, la UX vuelve a degradarse rápido.
Primary owner: apps/mobile/components + apps/mobile/navigation/__tests__
Operational Delivery Blocks
Block 1. Foundation and Navigation Shell
Status: proposed
Tasks included: 1, 2, 3
Scope: regla de producto, estado activeMode, navegadores separados, reset de shell
Deliverable: app capaz de entrar en modo cliente o profesional sin mezcla estructural
Why this block comes now: desbloquea todo el resto y evita seguir parcheando tabs híbridas
Block 2. Account Entry and Customer Cleanup
Status: proposed
Tasks included: 4, 5
Scope: mover CTA pro a Cuenta, sacar tab Ser Pro, separar Mis problemas del inbox pro
Deliverable: cliente ve solo su recorrido; la entrada a pro queda centralizada y entendible
Why this block comes now: resuelve el principal dolor de UX del usuario final
Block 3. Professional Gating, Polish, and QA
Status: proposed
Tasks included: 6, 7
Scope: guardas por modo/estado, tabs finales pro, copy, tests, regresión
Deliverable: experiencia profesional limpia y segura, sin accesos inconsistentes
Why this block comes now: depende de la base de navegación y de la separación de pantallas
Repo Ownership and Contract Impact
Frontend owner: apps/mobile
Product/doc owner: AGENTS.md
Contract impact: ninguno obligatorio en la base
Backend impact: no requerido para activeMode local
Deferred option: si más adelante se quiere persistencia cross-device del modo, ahí sí conviene API/campo server-side
Frontend / UI Plan
Scope
Navegación autenticada
Cuenta
Hub profesional
Bandeja/solicitudes
CTA de activación y cambio de modo
Product Goals
Que el usuario entienda en qué modo está
Que cliente y profesional no compartan tabs ni jerarquía principal
Que cambiar de modo sea explícito, reversible y estable
Route Map
CustomerTabs: Home, Mis problemas, Cuenta
ProfessionalTabs:
DRAFT | PENDING_APPROVAL | REJECTED | PAUSED: Mi Hub, Cuenta
APPROVED: Conversaciones, Oportunidades, Mi Hub, Cuenta
Shared stack: Notifications, Help, Privacy, detalles puntuales compartidos
Core Screens
AccountScreen: header compartido + tarjeta Modo actual + secciones dependientes del modo
ProfessionalHubScreen: pro-only; onboarding si el usuario vino desde Convertirme en profesional
CustomerNeedsScreen: reemplazo limpio de la vista cliente en RequestsScreen
ProfessionalInboxScreen: superficie pro dedicada
States That Must Be Designed
cliente sin rol pro
cliente con rol pro pero en modo cliente
profesional en draft/pending/rejected
profesional aprobado
intento de abrir screen del otro modo
cambio de modo con stack previo abierto
Component Strategy
ModeSwitchCard
ModeBadge o chip de Modo actual
shells separados para tabs cliente/pro
evitar más condicionales profundos en un mismo screen híbrido
Frontend Delivery Recommendation by Block
Block 1: contexto + shells + persistencia de modo
Block 2: Cuenta + extracción de pantalla cliente
Block 3: inbox pro, gating por estado, tests finales
Testing and Validation Plan
Tests de navegación para:
cliente sin rol pro
cliente con rol pro en modo cliente
profesional en modo profesional
profesional no aprobado
Tests de contexto para persistencia/restauración de activeMode
Validación manual:
activar rol pro desde Cuenta
cambiar de modo ida y vuelta
logout/login
entrar desde notificación o detalle con modo incorrecto
Regression check sobre ProfessionalHubScreen y RequestDetailScreen
Risks and Open Questions
¿El profesional no aprobado debe ver Oportunidades? Recomendación: no.
¿Después de Convertirme en profesional se cambia automáticamente a modo pro? Recomendación: sí, porque la acción ya es explícita.
Hay pantallas viejas no integradas; no conviene reutilizarlas sin auditoría.
Si se deja RequestsScreen híbrida demasiadas iteraciones, la arquitectura volverá a mezclarse.
Rollout Recommendation
Hacerlo en 3 bloques dentro del mismo frente mobile.
No mezclar este cambio con backend salvo que aparezca una necesidad real de persistencia server-side.
El primer entregable útil debe ser: Cuenta controla el modo y las tabs cambian completas; luego separar inbox/problemas y cerrar guardas.