# AccountScreen Modernization Implementation

## Source Scope
- `apps/mobile/app/screens/AccountScreen.js` (líneas 1-202)
- `apps/mobile/app/components/SectionCard.js`
- `apps/api/src/models/index.js` (User, ProfessionalProfile, Review)
- `packages/domain/src/enums.js`
- `packages/contracts/src/reviews.js`
- `AGENTS.md` (secciones de producto, dominio y reglas funcionales)

---

## Current Scope and Assumptions

**What exists hoy:**
- AccountScreen tiene 3 cards apiladas: ProfileCard + Account Summary + Quick Actions
- ProfileCard muestra avatar, nombre, email, roles
- Account Summary muestra phone y roles
- Quick Actions muestra Notifications, Refresh Session, Sign Out

**Lo que no existe aún:**
- `CustomerProfile` model con métricas de reputación del cliente
- Rating promedio del cliente
- Tags estructurados (comunicación clara, puntual, etc.)
- Campos útiles para profesionales: completedRequestsCount, cancellationRate, memberSince, city, verifiedPhone, etc.
- Contrato Zod para serializar el customer profile hacia mobile
- Endpoint para obtener el profile del cliente autenticado

**Assumptions:**
- Se usa React Native (no Expo/React nueva arquitectura)
- AuthContext ya existe y expone `user` con roles y phone
- Mobile recibe datos del backend vía AuthContext, no localmente
- El rating bidireccional requiere changes en Review para soportar targetType (PROFESSIONAL | CUSTOMER)
- Se implementa CustomerProfile como modelo separado para no mezclar reputación

**Open questions:**
- ¿Los tags del cliente son solo lectura o el cliente puede editarlos?
- ¿La bio/notas del cliente son públicas o solo visibles post-aceptación?
- ¿Se requiere endpoint nuevo o se extiende el/me de auth?

---

## Implementation Tasks Ordered by Importance

### 1. Crear CustomerProfile model
- Crear `apps/api/src/models/customer-profile.js` con campos: ratingAverage, reviewCount, completedRequestsCount, cancelledRequestsCount, responseTimeMinutes, memberSince, city, bio, tags (JSONB), verifiedPhone, verifiedEmail
- Registrar en `apps/api/src/models/index.js`
- Agregar asociación: `User.hasOne(CustomerProfile)` + `CustomerProfile.belongsTo(User)`
- **Why**: desbloquea toda la reputación del cliente en backend
- **Owner**: `apps/api` (models)

### 2. Extender Review para soportar bidireccional
- Modificar modelo Review: agregar `reviewerRole` (CUSTOMER | PROFESSIONAL) y `targetRole` para saber qui流行病評quién califica a quién
- Opcional: crear `CustomerReviewTag` enum en domain: `COMMUNICATION_CLEAR`, `PUNCTUAL`, `RESPECTFUL`, `PRECISE_REQUEST`, `CANCELLED`, `CONFUSING_ADDRESS`, `SLOW_RESPONSE`
- **Why**: sin esto no se puede calcular rating del cliente
- **Owner**: `apps/api` + `packages/domain`

### 3. Crear migración de CustomerProfile
- Crear migración Sequelize para crear tabla `CustomerProfiles` con campos del modelo
- Incluir seed data para users existentes (memberSince = createdAt)
- **Why**: persistence layer obligatoria antes de serializar
- **Owner**: `apps/api` (migrations)

### 4. Crear contracts para customer profile
- Crear `packages/contracts/src/customer.js` con schema de customerProfile (rating, jobs, cancellationRate, tags, bio, etc.)
- Exportar en `packages/contracts/src/index.js`
- **Why**: contrato compartido entre API y mobile
- **Owner**: `packages/contracts`

### 5. Crear endpoint GET /me/customer-profile
- En `apps/api/src/routes/me.js` o crear route dedicado
- Retornar CustomerProfile serializado con los contratos
- Incluir métricas calculadas: completionRate, avgResponseTime, topTags
- **Why**: mobile necesita obtener datos actualizados del cliente
- **Owner**: `apps/api` (routes)

### 6. Crear endpoint PATCH /me/customer-profile
- Permitir actualizar: city, bio, tags, verifiedPhone, verifiedEmail
- Validar con contracts de customer.js
- **Why**: el cliente necesita editar su perfil público
- **Owner**: `apps/api` (routes)

### 7. Actualizar AuthContext para incluir customerProfile
- En `apps/mobile/app/contexts/AuthContext.js`, incluir customerProfile en el user state
- **Why**: AccountScreen necesita estos datos
- **Owner**: `apps/mobile`

### 8. Refactor AccountScreen: nueva estructura moderna
- Header integrado: avatar, nombre, email, roles, verified badges
- Sección "Tu reputación": rating, trabajos completados, tasa de cancelación, tags
- Sección "Tus datos": teléfono, email, ciudad, preferencias
- Sección "Actividad": solicitudes activas, reseñas escritas
- Sección "Acciones": ayuda, privacidad, cerrar sesión
- Eliminar las 3 SectionCard pesadas y adoptar lista agrupada
- **Why**: alinear con Apple HIG y Android/Material modernos
- **Owner**: `apps/mobile`

### 9. Crear componentes reutilizables para AccountScreen
- `ProfileHeader`: avatar + nombre + badges
- `StatRow`: label + valor con icono
- `SettingsRow`: row clickeable con chevron
- `ReputationSection`: rating + tags
- `SectionHeader`: título de sección
- **Why**: DRY y consistencia
- **Owner**: `apps/mobile`

### 10. Implementar pantalla de edición de perfil del cliente
- Navegación desde AccountScreen a `EditCustomerProfileScreen`
- Campos editables: nombre, teléfono, email, ciudad, bio, preferencias de contacto
- **Why**: el cliente necesita editar sus datos
- **Owner**: `apps/mobile`

### 11. Escribir tests de integración para endpoints
- Test: GET /me/customer-profile retorna datos correctos
- Test: PATCH /me/customer-profile actualiza y devuelve perfil actualizado
- Test: cálculo de rating cuando se crea una review con reviewerRole=CUSTOMER
- **Why**: coverage básico del nuevo dominio
- **Owner**: `apps/api` (tests)

---

## Operational Delivery Blocks

### Block 1. Data Foundation
**Status**: proposed

**Tasks included**: `1`, `2`, `3`

**Scope**:
- CustomerProfile model
- Extensión de Review para bidireccional
- Migración

**Deliverable**: Modelo persistido y listo para query

**Why this block comes now**: todo lo demás depende de estos datos

---

### Block 2. API Contracts & Endpoints
**Status**: proposed

**Tasks included**: `4`, `5`, `6`

**Scope**:
- Contratos Zod para customer profile
- Endpoints GET/PATCH /me/customer-profile

**Deliverable**: API surface expuesta para mobile

**Why this block comes now**: mobile no puede construir UI sin endpoints

---

### Block 3. Mobile Auth & Context
**Status**: proposed

**Tasks included**: `7`

**Scope**:
- AuthContext actualizado con customerProfile

**Deliverable**: Auth state completo con reputación del cliente

---

### Block 4. Mobile UI — AccountScreen
**Status**: proposed

**Tasks included**: `8`, `9`, `10`

**Scope**:
- Nueva AccountScreen con estructura moderna
- Componentes reutilizables
- Pantalla de edición de perfil

**Deliverable**: UI moderna lista para testing

**Why this block comes now**: es el entregable visible al usuario

---

### Block 5. Testing
**Status**: proposed

**Tasks included**: `11`

**Scope**:
- Tests de integración de endpoints

**Deliverable**: Coverage básico del nuevo dominio

---

## Repo Ownership and Contract Impact

| Layer | Owner | Changes |
|-------|-------|---------|
| `packages/domain` |shared | Nuevos enums para CustomerReviewTag |
| `packages/contracts` | shared | Nuevo `customer.js` schema |
| `apps/api/models` | api | CustomerProfile model + migraciones |
| `apps/api/routes` | api | GET/PATCH /me/customer-profile |
| `apps/mobile` | mobile | AccountScreen + componentes + AuthContext |

**Contract impact**:
- `packages/contracts/src/index.js`: exportar `customerProfileSchema`
- `apps/mobile/app/contexts/AuthContext.js`: incluir `customerProfile` en state
- Endpoint respuesta: `{ ratingAverage, reviewCount, completedRequestsCount, cancellationRate, responseTimeMinutes, memberSince, city, bio, tags, verifiedPhone, verifiedEmail, topTags, completionRate }`

---

## Backend Plan

### Routes
- `GET /me/customer-profile` — retorna CustomerProfile del user autenticado
- `PATCH /me/customer-profile` — actualiza campos editables del cliente

### Business Logic
- Calcular `cancellationRate = cancelledRequestsCount / (completedRequestsCount + cancelledRequestsCount)`
- Calcular `completionRate = completedRequestsCount / totalRequests`
- Agregar `topTags` desde reviews visibles del cliente

### Data Model
```js
CustomerProfile {
  ratingAverage: Float (default 0)
  reviewCount: Integer (default 0)
  completedRequestsCount: Integer (default 0)
  cancelledRequestsCount: Integer (default 0)
  responseTimeMinutes: Integer (default 60)
  memberSince: Date
  city: String (nullable)
  bio: Text (nullable)
  tags: JSONB (default [])
  verifiedPhone: Boolean (default false)
  verifiedEmail: Boolean (default false)
}
```

### Jobs
- Job para recalcular rating promedio del cliente cuando se crea/modera una review

---

## Frontend / UI Plan

### Scope
Refactor de AccountScreen + componentes nuevos + pantalla de edición

### Product Goals
- Pantalla que se siente como "Mi perfil + confianza" y no como settings genéricos
- Mostrar reputación del cliente de forma prominente
- Permitir edición directa de datos públicos
- Información útil para profesionales visible en el perfil del cliente

### Visual Direction
- Header de perfil limpio integrado al scroll (no card flotante)
- Lista agrupada de rows escaneables (no cards pesadas con padding excesivo)
- Secciones: Header → Reputación → Datos → Actividad → Acciones
- Edge-to-edge con safe area respetada
- Top app bar con título "Mi cuenta"
- Badges de verificación (teléfono, email) próximos al header

### Route Map
```
/account (AccountScreen) — lectura
  └── /account/edit (EditCustomerProfileScreen) — escritura
```

### Core Screens

**AccountScreen (lectura)**
```
┌─────────────────────────────┐
│ ← Mi cuenta               │
├─────────────────────────────┤
│  ┌───┐ Juan Pérez          │
│  │ J │ juan@mail.com       │
│  └───┘ [CUSTOMER] [PRO]    │
├─────────────────────────────┤
│ TU REPUTACIÓN               │
│ ⭐ 4.8 · 12 trabajos       │
│ Cancela poco · Responde    │
├─────────────────────────────┤
│ TUS DATOS                   │
│ Teléfono  +111 555-1234   │
│ Email     juan@mail.com   │
│ Ciudad    Buenos Aires    │
├─────────────────────────────┤
│ ACTIVIDAD                   │
│ 2 solicitudes activas →    │
│ Reseñas escritas (8) →     │
├─────────────────────────────┤
│ ACCIONES                    │
│ Ayuda                    →  │
│ Privacidad                →  │
│ ────────────────────────── │
│ Cerrar sesión              │
└─────────────────────────────┘
```

**EditCustomerProfileScreen (escritura)**
```
┌─────────────────────────────┐
│ ← Guardar                   │
├─���───────────────────────────┤
│ Nombre                      │
│ [Juan Pérez               ] │
│                             │
│ Teléfono                    │
│ [+54 11 5555-1234         ] │
│                             │
│ Ciudad                      │
│ [Buenos Aires             ] │
│                             │
│ Sobre vos (bio)             │
│ [Vivo en depto, prefiero   ] │
│ [mensajes por la tarde     ] │
│                             │
│ Preferencias                │
│ [x] SMS  [ ] WhatsApp      │
│ [ ] Email                  │
└─────────────────────────────┘
```

### Information Architecture
- El perfil del cliente tiene dos caras: lo que ve él (AccountScreen) y lo que ven los profesionales (en la vista de ServiceRequest)
- El rating del cliente se muestra al profesional solo cuando la solicitud está ACCEPTED
- Los tags del cliente se muestran como badges: "Comunica claro", "Puntual", "Cancela poco"

### States That Must Be Designed
| Estado | Comportamiento |
|--------|----------------|
| Sin CustomerProfile | Mostrar skeleton, luego crear con defaults |
| Sin rating | Mostrar "Sin calificaciones aún" con muted color |
| Con tags positivos | Mostrar badges verdes |
| Con tags negativos | Mostrar badges rojos con tooltip |
| Editando | Navegar a EditCustomerProfileScreen |
| Loading | Skeleton del profile header |
| Error | Toast de error + retry |

### Component Strategy
- `ProfileHeader`: avatar circle + nombre + email + role pills + verified badges
- `StatRow`: icono + label + value + chevron opcional
- `StatBadge`: chip con color semántico (verde=positivo, rojo=negativo, gris=neutral)
- `SectionHeader`: título uppercase + acción opcional
- `SettingsRow`: label + chevron + onPress handler
- `ReputationCard`: rating + jobs + tags agregados

### Frontend Delivery Recommendation by Block
1. Crear componentes en `components/account/`
2. Implementar AccountScreen refactor con datos mockeados
3. Conectar AuthContext actualizado
4. Crear EditCustomerProfileScreen
5. Validar flows de edición

### Non-Goals
- No implementar sistema de reviews del cliente en esta iteración (Block 1-5 solo sienta la base)
- No mostrar reviews largas del cliente a profesionales (solo tags agregados)
- No implementar edit de preferencias de notificación (fuera de scope MVP)

---

## Testing and Validation Plan

### Backend Tests
- `POST /reviews` con `reviewerRole: CUSTOMER` retorna review ligada al CustomerProfile
- `GET /me/customer-profile` retorna profile con métricas correctas
- `PATCH /me/customer-profile` actualiza y persiste cambios
- Job de recalculo de rating funciona al crear review

### Mobile Tests
- AccountScreen renderiza sin crashing
- Todos los states (sin rating, con tags, etc.) se muestran correctamente
- Navigation a EditCustomerProfileScreen funciona
- Form de edición valida y persiste

### Visual Checkpoints
- No hay 3 SectionCard apiladas con sombras pesadas
- El header de perfil es compacto, no una card flotante
- Las secciones usan listas agrupadas, no cards con padding excesivo
- Los tags del cliente se muestran como chips coloreados

---

## Risks and Open Questions

| Risk | Mitigation |
|------|------------|
| El rating bidireccional requiere cambios en Review que pueden romper reviews existentes | Migración que preserve reviewerId + professionalId como único path para reviews existentes |
| CustomerProfile para users existentes puede estar null | Crear en onCreate hook o con seed/post-migrate |
| Los tags del cliente necesitan definición clara de enums | Cerrar con equipo de producto antes de implementar |

### Open Questions
1. ¿Los tags del cliente son editables por el cliente o son solo lectura computada?
2. ¿La bio del cliente es pública o solo visible post-aceptación?
3. ¿El endpoint de customer-profile va en /me routes o en /customer routes?
4. ¿Se requiere historia de calificaciones del cliente o solo el promedio actual?

---

## Rollout Recommendation

1. **Primero**: deploy backend (modelo + endpoints) porque mobile depende de ello
2. **Segundo**: mobile refactor de AccountScreen con datos del endpoint
3. **Tercero**: implementar EditCustomerProfileScreen
4. **Cuarto**: tests de integración y QA de UI

**Rollout sequencing**: backend debe estar en producción antes de que mobile suba el feature flag.