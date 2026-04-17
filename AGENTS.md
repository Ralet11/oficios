# AGENTS.md

## Propósito del documento

Este archivo es la fuente de verdad operativa para humanos y agentes de IA que trabajen en el repo. Toda decisión de producto, arquitectura, contratos y prioridades del MVP debe reflejarse acá antes o junto con el cambio de código.

## Producto

- Marketplace mobile-first para conectar clientes con profesionales de oficios en Argentina.
- Modelo de negocio inicial: generación y gestión de leads/solicitudes; sin pagos in-app.
- Core loop MVP: búsqueda -> perfil profesional -> solicitud de trabajo -> aceptación -> mensajería simple -> desbloqueo de contacto externo -> reseña.

## Tipos de usuario

- `CUSTOMER`: busca, envía solicitudes, conversa, reseña.
- `PROFESSIONAL`: crea perfil, define zonas/categorías, recibe y gestiona solicitudes.
- `ADMIN`: modera profesionales, categorías, reseñas y operación básica.

## Alcance MVP

### Cliente

- Registro/login con email/password, Google y Apple.
- Búsqueda y filtros de profesionales por categoría, ubicación, rating, disponibilidad y texto.
- Vista de detalle de profesional.
- Creación de solicitud con mensaje inicial.
- Inbox de solicitudes y mensajería simple.
- Visualización de contacto externo luego de aceptación.
- Creación de reseña luego del servicio.

### Profesional

- Activación del rol profesional sin perder rol cliente.
- Edición de perfil profesional, fotos, zonas y categorías.
- Gestión de disponibilidad básica.
- Recepción, aceptación/rechazo y seguimiento de solicitudes.

### Admin

- Login con rol admin.
- Aprobación/rechazo de profesionales.
- CRUD de categorías.
- Moderación de reseñas.
- Listados básicos de usuarios, profesionales y solicitudes.

## No objetivos del MVP

- Pagos dentro de la app.
- Chat en tiempo real complejo.
- Tracking en tiempo real.
- Matching inteligente.
- Microservicios.
- GraphQL.
- Agenda/calendario avanzada.

## Decisiones congeladas

- País inicial: Argentina.
- Una sola app mobile con múltiples roles.
- Backend con express y node js con sequelize.
- PostgreSQL como source of truth.
- Redis para colas, cache corta y soporte operacional.
- Búsqueda en PostgreSQL; sin Elastic/Search engine externo en MVP.
- El contacto directo del profesional se revela recién luego de `ServiceRequestStatus.ACCEPTED`.
- Favoritos quedan fuera del corte base.

## Dominio base

- `User`
- `AuthIdentity`
- `Session`
- `ProfessionalProfile`
- `Category`
- `ProfessionalCategory`
- `ServiceArea`
- `ServiceRequest`
- `ServiceRequestMessage`
- `Review`
- `Notification`
- `AdminActionLog`

## Estados del dominio

- `UserRole`: `CUSTOMER | PROFESSIONAL | ADMIN`
- `ProfessionalStatus`: `DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | PAUSED`
- `ServiceRequestStatus`: `PENDING | ACCEPTED | REJECTED | CANCELLED | COMPLETED | EXPIRED`
- `ReviewStatus`: `VISIBLE | HIDDEN`
- `AuthProvider`: `PASSWORD | GOOGLE | APPLE`

## Reglas funcionales críticas

- Una cuenta puede tener múltiples roles.
- Un profesional no aparece en catálogo público hasta estar `APPROVED`.
- Una reseña solo puede existir si la solicitud fue aceptada/completada.
- Máximo una reseña por `serviceRequest`.
- Mensajería solo entre participantes de la solicitud.
- La API pública principal de búsqueda es:
  `GET /professionals?categoryId&placeId&lat&lng&radiusKm&minRating&availableNow&text&sort&page&pageSize`

## Arquitectura

- `apps/mobile`: experiencia cliente/profesional.
- `apps/admin`: operación interna.
- `apps/api`: REST API, auth, negocio, moderación.
- `apps/worker`: emails, push, notificaciones y jobs.
- `packages/contracts`: contratos Zod reutilizables entre API y frontends.
- `packages/domain`: enums y tipos del dominio desacoplados del ORM.
- `packages/config`: validación de envs.

## Convenciones

- Carpetas: `kebab-case`
- Componentes React: `PascalCase`
- Variables TS: `camelCase`
- Tablas y columnas SQL: `snake_case`
- Endpoints REST: sustantivos plurales
- Los schemas Zod viven en `packages/contracts`.
- Ningún package compartido lee `process.env` directamente.

## Variables de entorno

Cada app mantiene su `.env.example` y valida boot-time con Zod.

- `apps/api/.env.example`
- `apps/admin/.env.example`
- `apps/mobile/.env.example`
- `apps/worker/.env.example`

## Checklist de entrega por cambio

- Código coherente con `AGENTS.md`
- Contratos actualizados si cambia un request/response
- Swagger actualizado si cambia la API
- Seeds/migraciones actualizadas si cambia el modelo
- Variables de entorno documentadas
- Eventos analíticos nuevos registrados en este archivo o en docs asociados

## Changelog de decisiones

- 2026-03-18: país inicial Argentina.
- 2026-03-18: app mobile única con múltiples roles.
- 2026-03-18: solicitud interna + aceptación + mensajería simple + contacto externo desbloqueado.
- 2026-03-18: favoritos fuera del primer corte.

## Open questions

- Definir ciudades piloto del lanzamiento beta.
- Definir taxonomía final de categorías iniciales.
- Definir SLAs internos de moderación y soporte.
- Definir política de reseñas fraudulentas/disputadas.

