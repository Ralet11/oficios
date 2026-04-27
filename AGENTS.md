# AGENTS.md

## Proposito del documento

Este archivo es la fuente de verdad operativa para humanos y agentes de IA que trabajen en el repo. Toda decision de producto, arquitectura, contratos y prioridades del MVP debe reflejarse aca antes o junto con el cambio de codigo.

## Producto

- Marketplace mobile-first para conectar clientes con profesionales de oficios en Argentina.
- Modelo de negocio inicial: generacion y gestion de leads/solicitudes; sin pagos in-app.
- Core loop MVP: necesidad del cliente en draft -> seleccion directa de profesionales o publicacion en tablero -> conversaciones simples -> cliente elige profesional -> profesional confirma -> aceptacion -> desbloqueo de contacto externo -> resena.

## Tipos de usuario

- `CUSTOMER`: busca, crea problemas, envia solicitudes, conversa, elige profesional y resena.
- `PROFESSIONAL`: crea perfil, define zonas/categorias, recibe y gestiona solicitudes.
- `ADMIN`: modera profesionales, categorias, resenas y operacion basica.

## Alcance MVP

### Cliente

- Registro/login mobile-first con telefono + codigo como camino principal; email/password queda como fallback y Google/Apple siguen previstos.
- Busqueda y filtros de profesionales por categoria, ubicacion, rating, disponibilidad y texto.
- Vista de detalle de profesional.
- Creacion de necesidad/problema en draft con mensaje inicial, fotos y snapshot de contacto.
- Envio directo de un mismo problema a multiples profesionales seleccionados.
- Publicacion opcional del problema en un tablero general de oportunidades.
- Vista agrupada de conversaciones y profesionales contactados por cada problema.
- Inbox de solicitudes y mensajeria simple.
- Visualizacion de contacto externo luego de aceptacion.
- Creacion de resena luego del servicio.

### Profesional

- Activacion del rol profesional sin perder rol cliente.
- Edicion de perfil profesional, fotos, zonas y categorias.
- Gestion de disponibilidad basica.
- Publicacion de trabajos previos en formato post con multiples fotos, texto y mensajes cortos.
- Carga de fotos de trabajos previos desde camara o galeria mobile con provider de media configurable.
- Recepcion, aceptacion/rechazo y seguimiento de solicitudes.
- Panel de oportunidades publicadas por clientes para descubrir nuevos trabajos.

### Admin

- Login con rol admin.
- Aprobacion/rechazo de profesionales.
- CRUD de categorias.
- Moderacion de resenas.
- Listados basicos de usuarios, profesionales y solicitudes.

## No objetivos del MVP

- Pagos dentro de la app.
- Chat en tiempo real complejo.
- Tracking en tiempo real.
- Matching inteligente.
- Asistencia IA de diagnostico, redaccion o seleccion de profesional en el primer corte del flujo.
- Microservicios.
- GraphQL.
- Agenda/calendario avanzada.

## Decisiones congeladas

- Pais inicial: Argentina.
- Una sola app mobile con multiples roles.
- Backend con express y node js con sequelize.
- PostgreSQL como source of truth.
- Redis para colas, cache corta y soporte operacional.
- Busqueda en PostgreSQL; sin Elastic/Search engine externo en MVP.
- El contacto directo del profesional se revela recien luego de `ServiceRequestStatus.ACCEPTED`.
- Favoritos quedan fuera del corte base.

## Dominio base

- `User`
- `AuthIdentity`
- `AuthVerificationCode`
- `Session`
- `ProfessionalProfile`
- `ProfessionalWorkPost`
- `Category`
- `ProfessionalCategory`
- `ServiceArea`
- `ServiceNeed`
- `ServiceRequest`
- `ServiceRequestMessage`
- `Review`
- `Notification`
- `AdminActionLog`

## Estados del dominio

- `UserRole`: `CUSTOMER | PROFESSIONAL | ADMIN`
- `ProfessionalStatus`: `DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | PAUSED`
- `ServiceNeedStatus`: `DRAFT | OPEN | SELECTION_PENDING_CONFIRMATION | MATCHED | CLOSED | CANCELLED`
- `ServiceRequestStatus`: `PENDING | AWAITING_PRO_CONFIRMATION | ACCEPTED | REJECTED | CANCELLED | COMPLETED | EXPIRED`
- `ReviewStatus`: `VISIBLE | HIDDEN`
- `ServiceNeedVisibility`: `DIRECT_ONLY | PUBLIC_BOARD`
- `AuthProvider`: `PASSWORD | GOOGLE | APPLE | PHONE`

## Reglas funcionales criticas

- Una cuenta puede tener multiples roles.
- El alta mobile prioriza `telefono -> codigo -> nombre/email`; la contrasena se pide solo en el fallback por email.
- Un profesional no aparece en catalogo publico hasta estar `APPROVED`.
- Un `ServiceNeed` pertenece al cliente y puede generar multiples `ServiceRequest`, una por profesional.
- Un mismo profesional no debe tener multiples `ServiceRequest` activas para el mismo `ServiceNeed`.
- Un `ServiceNeed` puede quedar en `DRAFT` sin categoria cerrada, pero debe quedar completo antes de enviarse o publicarse.
- La respuesta o mensaje de un profesional no implica aceptacion de la solicitud.
- El cliente puede elegir un solo `ServiceRequest` candidato por `ServiceNeed`; ese hilo pasa a espera de confirmacion del profesional.
- Un `ServiceRequest` solo pasa a `ACCEPTED` cuando el cliente ya lo eligio y el profesional confirma.
- Si el profesional elegido rechaza o expira la confirmacion, el `ServiceNeed` vuelve a `OPEN`.
- Cuando el cliente elige un candidato, el resto de los hilos del mismo `ServiceNeed` deben cerrarse o archivarse con razon explicita.
- Una resena solo puede existir si la solicitud fue aceptada/completada.
- Maximo una resena por `serviceRequest`.
- Mensajeria solo entre participantes de la solicitud.
- Los trabajos previos del profesional son visibles en perfil publico cuando el perfil esta `APPROVED`; el owner puede editarlos siempre desde su hub.
- Las fotos de trabajos previos del profesional se suben por upload directo a un provider configurable desde backend; Cloudinary es el default inicial.
- Las fotos de `ServiceNeed` del cliente se suben por upload directo a un provider configurable desde backend; Cloudinary es el default inicial.
- La publicacion en tablero no revela contacto externo del cliente ni del profesional hasta que exista `ServiceRequestStatus.ACCEPTED`.
- La API publica principal de busqueda es:
  `GET /professionals?categoryId&placeId&lat&lng&radiusKm&minRating&availableNow&text&sort&page&pageSize`

## Arquitectura

- `apps/mobile`: experiencia cliente/profesional.
- `apps/admin`: operacion interna.
- `apps/api`: REST API, auth, negocio, moderacion.
- `apps/worker`: emails, push, notificaciones y jobs.
- `packages/contracts`: contratos Zod reutilizables entre API y frontends.
- `packages/domain`: enums y tipos del dominio desacoplados del ORM.
- `packages/config`: validacion de envs.

## Convenciones

- Carpetas: `kebab-case`
- Componentes React: `PascalCase`
- Variables TS: `camelCase`
- Tablas y columnas SQL: `snake_case`
- Endpoints REST: sustantivos plurales
- Los schemas Zod viven en `packages/contracts`.
- Ningun package compartido lee `process.env` directamente.

## Variables de entorno

Cada app mantiene su `.env.example` y valida boot-time con Zod.

- `apps/api/.env.example`
- `apps/admin/.env.example`
- `apps/mobile/.env.example`
- `apps/worker/.env.example`

## Checklist de entrega por cambio

- Codigo coherente con `AGENTS.md`
- Contratos actualizados si cambia un request/response
- Swagger actualizado si cambia la API
- Seeds/migraciones actualizadas si cambia el modelo
- Variables de entorno documentadas
- Eventos analiticos nuevos registrados en este archivo o en docs asociados

## Changelog de decisiones

- 2026-03-18: pais inicial Argentina.
- 2026-03-18: app mobile unica con multiples roles.
- 2026-03-18: solicitud interna + aceptacion + mensajeria simple + contacto externo desbloqueado.
- 2026-03-18: favoritos fuera del primer corte.
- 2026-04-19: trabajos previos del profesional se publican como posts con multiples fotos y texto.
- 2026-04-19: la carga de fotos de posts usa upload directo con provider configurable; Cloudinary first.
- 2026-04-25: el onboarding mobile prioriza telefono con codigo y deja email/password como fallback.
- 2026-04-26: el flujo de origen pasa a ser un `ServiceNeed` del cliente que puede derivar en multiples `ServiceRequest`.
- 2026-04-26: el cliente puede enviar un mismo problema a varios profesionales o publicarlo en un tablero general de oportunidades.
- 2026-04-26: un profesional no acepta por solo responder; la aceptacion ocurre recien despues de seleccion del cliente y confirmacion del profesional.
- 2026-04-26: la asistencia IA para ayudar a diagnosticar y redactar problemas queda fuera del primer bloque de implementacion.

## Open questions

- Definir ciudades piloto del lanzamiento beta.
- Definir taxonomia final de categorias iniciales.
- Definir SLAs internos de moderacion y soporte.
- Definir politica de resenas fraudulentas/disputadas.
- Definir prioridad y reglas de moderacion del tablero general de oportunidades.
