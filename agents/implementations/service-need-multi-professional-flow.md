# Service Need Multi-Professional Flow Implementation

## Source Scope
- `AGENTS.md`
- `packages/domain/src/enums.js`
- `packages/domain/src/index.js`
- `packages/contracts/src/service-requests.js`
- `packages/contracts/src/uploads.js`
- `apps/api/src/models/index.js`
- `apps/api/src/controllers/service-requests-controller.js`
- `apps/api/src/routes/service-requests-routes.js`
- `apps/api/src/routes/index.js`
- `apps/api/src/utils/serializers.js`
- `apps/api/src/docs/openapi.js`
- `apps/mobile/app/navigation/RootNavigator.js`
- `apps/mobile/app/screens/HomeScreen.js`
- `apps/mobile/app/screens/ProfessionalDetailScreen.js`
- `apps/mobile/app/screens/CreateServiceRequestScreen.js`
- `apps/mobile/app/screens/RequestsScreen.js`
- `apps/mobile/app/screens/RequestDetailScreen.js`
- `apps/mobile/app/screens/ProfessionalHubScreen.js`
- `apps/mobile/app/components/WorkPostComposer.js`
- `apps/mobile/app/services/mediaUpload.js`

## Current Scope and Assumptions

**What exists today**
- The current product is modeled as `1 customer -> 1 ServiceRequest -> 1 professional -> 1 conversation`.
- `ServiceRequest` already owns title, message, location, budget, status and the message thread.
- `POST /service-requests` requires a single `professionalId`, so the customer cannot fan out one problem to many professionals.
- `RequestsScreen` and `RequestDetailScreen` are thread-first, not problem-first.
- Upload intents only support `professional-work-post`, not customer-authored problem photos.
- Contact reveal is already correctly gated by `ServiceRequestStatus.ACCEPTED` or `COMPLETED`.

**Confirmed product decisions**
- The parent entity will be `ServiceNeed`.
- `ServiceRequest` remains the child conversation thread.
- A professional message or quote does not mean acceptance.
- The customer chooses one candidate thread first.
- The chosen professional must confirm after being selected.
- Only after that confirmation does the child thread reach `ACCEPTED`.
- The public opportunities board stays inside this same implementation plan, not in a separate document.

**Assumptions used in this plan**
- When the customer selects a candidate thread, the parent need moves to a waiting-for-confirmation state and the chosen child request moves to a waiting-for-professional-confirmation state.
- When the chosen professional rejects or times out, the parent need returns to `OPEN` and the customer can choose another professional or dispatch again.
- Sibling threads close when the customer selects one candidate; if the chosen professional later declines, the customer can reopen activity by selecting from remaining viable threads or inviting new professionals.
- The board reuses the same `ServiceNeed` and `ServiceRequest` models instead of introducing a second marketplace object.
- AI-guided intake stays out of the first operational blocks, but the parent need model should be designed so AI can enrich drafts later.

## Implementation Tasks Ordered by Importance

### 1. Lock the shared naming and status model for parent needs and child requests
- Extend `packages/domain/src/enums.js` with the new state machine before touching persistence or UI.
- Add `ServiceNeedStatus`:
  - `DRAFT`
  - `OPEN`
  - `SELECTION_PENDING_CONFIRMATION`
  - `MATCHED`
  - `CLOSED`
  - `CANCELLED`
- Add `ServiceNeedVisibility`:
  - `DIRECT_ONLY`
  - `PUBLIC_BOARD`
- Extend `ServiceRequestStatus`:
  - `PENDING`
  - `AWAITING_PRO_CONFIRMATION`
  - `ACCEPTED`
  - `REJECTED`
  - `CANCELLED`
  - `COMPLETED`
  - `EXPIRED`
- Add `ServiceRequestOrigin`:
  - `DIRECT_INVITE`
  - `PUBLIC_BOARD`
- Add `ServiceRequestCloseReason`:
  - `CUSTOMER_CANCELLED`
  - `PROFESSIONAL_REJECTED`
  - `CUSTOMER_SELECTED_OTHER`
  - `BOARD_CLOSED`
  - `EXPIRED`
- Why it matters: this is the contract correction that prevents later backend and mobile work from being built on the wrong acceptance semantics.
- Primary owner: `packages/domain`

### 2. Introduce `ServiceNeed` as the parent customer problem entity
- Add a `ServiceNeed` model in `apps/api/src/models/index.js` and a matching migration.
- Core fields:
  - `customerId`
  - `categoryId` nullable while draft
  - `title`
  - `description`
  - `photoUrls`
  - `city`
  - `province`
  - `addressLine`
  - `placeId`
  - `lat`
  - `lng`
  - `preferredDate`
  - `budgetAmount`
  - `budgetCurrency`
  - `contactName`
  - `contactPhone`
  - `contactWhatsapp`
  - `contactEmail`
  - `visibility`
  - `status`
  - `selectedServiceRequestId`
  - `publishedAt`
  - `selectionStartedAt`
  - `matchedAt`
  - `closedAt`
  - `cancelledAt`
- Add associations:
  - `User.hasMany(ServiceNeed, { as: 'serviceNeeds' })`
  - `ServiceNeed.belongsTo(User, { as: 'customer' })`
  - `Category.hasMany(ServiceNeed, { as: 'serviceNeeds' })`
  - `ServiceNeed.belongsTo(Category, { as: 'category' })`
- Why it matters: the customer needs a parent workspace that can outlive and coordinate many professional threads.
- Primary owner: `apps/api`

### 3. Re-anchor `ServiceRequest` as a child thread of `ServiceNeed`
- Add `serviceNeedId`, `origin`, `closeReason` and any needed timestamps to `ServiceRequest`.
- Add associations:
  - `ServiceNeed.hasMany(ServiceRequest, { as: 'requests' })`
  - `ServiceRequest.belongsTo(ServiceNeed, { as: 'serviceNeed' })`
- Add a uniqueness rule on `(service_need_id, professional_id)` so one professional cannot receive duplicate active threads for the same problem.
- Update transition logic so `ACCEPTED` is only reachable from `AWAITING_PRO_CONFIRMATION`.
- Why it matters: the existing thread model stays useful, but its lifecycle becomes consistent with the new customer-choice-first flow.
- Primary owner: `apps/api`

### 4. Create shared contracts, serializers and upload scopes for customer-authored needs
- Create `packages/contracts/src/service-needs.js`.
- Export it from `packages/contracts/src/index.js`.
- Add need-level schemas:
  - `createServiceNeedSchema`
  - `updateServiceNeedSchema`
  - `listServiceNeedsSchema`
  - `dispatchServiceNeedSchema`
  - `selectServiceNeedRequestSchema`
  - `listOpportunityNeedsSchema`
  - `expressInterestSchema`
- Extend `packages/contracts/src/service-requests.js` so its status enum includes `AWAITING_PRO_CONFIRMATION`.
- Extend `packages/contracts/src/uploads.js` to allow `scope: 'service-need'`.
- Add serializers in `apps/api/src/utils/serializers.js`:
  - `serializeServiceNeedSummary`
  - `serializeServiceNeedDetail`
  - enrich `serializeServiceRequest` with a compact parent need summary
- Why it matters: mobile needs a stable contract for parent needs, board opportunities and the new confirmation state.
- Primary owner: `packages/contracts` + `apps/api`

### 5. Build direct-send need endpoints for draft, dispatch, selection and confirmation flow
- Add `apps/api/src/controllers/service-needs-controller.js`.
- Add `apps/api/src/routes/service-needs-routes.js`.
- Wire the routes in `apps/api/src/routes/index.js`.
- Document them in `apps/api/src/docs/openapi.js`.
- Direct-flow endpoints:
  - `GET /service-needs`
  - `POST /service-needs`
  - `GET /service-needs/:id`
  - `PATCH /service-needs/:id`
  - `POST /service-needs/:id/dispatches`
  - `POST /service-needs/:id/select-request`
  - `POST /service-needs/:id/cancel`
- Required behavior:
  - `dispatches` creates one child `ServiceRequest` per selected professional inside a transaction
  - each child thread starts as `PENDING`
  - professionals can message or reject while the thread is `PENDING`
  - `select-request` closes siblings, moves the parent to `SELECTION_PENDING_CONFIRMATION`, and moves the chosen child to `AWAITING_PRO_CONFIRMATION`
  - the chosen professional confirms through the existing request status route, transitioning the child to `ACCEPTED` and the parent to `MATCHED`
  - if the chosen professional rejects, the child becomes `REJECTED`, the parent returns to `OPEN`, and the customer can continue the process
- Why it matters: this is the core customer workflow and the most important behavioral change in the system.
- Primary owner: `apps/api`

### 6. Preserve compatibility with the current single-request entrypoint
- Keep `POST /service-requests` alive during rollout.
- Internally it should create:
  - one `ServiceNeed` with `visibility = DIRECT_ONLY`
  - one child `ServiceRequest`
  - one initial customer message
- Return the child request payload as today so current mobile entrypoints keep working until they are migrated.
- Why it matters: avoids a hard API cutover and keeps the current app usable while the parent-first flow lands.
- Primary owner: `apps/api`

### 7. Add customer draft, workspace and professional-selection screens
- Add new mobile surfaces:
  - `ServiceNeedsScreen`
  - `ServiceNeedComposerScreen`
  - `ServiceNeedDetailScreen`
  - `SelectProfessionalsScreen`
- Reuse the image upload pattern from `WorkPostComposer.js`, but extract shared need-safe media primitives instead of copying the component whole.
- `ServiceNeedComposerScreen` should support:
  - save draft
  - edit draft
  - add photos
  - set category and location
  - set budget
  - snapshot contact fields
  - continue later
- `ServiceNeedDetailScreen` should show:
  - parent summary
  - selected status
  - child threads
  - pending professional confirmation state
  - actions to select a candidate, re-dispatch, cancel, or publish to board
- Why it matters: the customer experience must become problem-first, not thread-first.
- Primary owner: `apps/mobile`

### 8. Refactor the explore and detail flow into a reusable professional selection mode
- Do not overload `HomeScreen.js` with brittle one-off state for need dispatch.
- Extract reusable professional catalog pieces from `apps/mobile/app/screens/HomeScreen.js` into shared components.
- Build `SelectProfessionalsScreen` with the same filter and ranking behavior but add multiselect state and a selection summary CTA.
- `ProfessionalDetailScreen` should support a selection mode where the CTA becomes `Enviar este problema`.
- Why it matters: the customer should be able to draft once and then send to multiple professionals without navigating a totally different UI.
- Primary owner: `apps/mobile`

### 9. Rework requests and inbox UX around parent needs plus child conversations
- Refactor `RequestsScreen` so customers can switch between:
  - `Conversaciones`
  - `Mis problemas`
- Keep the professional inbox thread-first, but enrich each thread card with parent need context.
- Update `RequestDetailScreen` so it handles:
  - `PENDING`
  - `AWAITING_PRO_CONFIRMATION`
  - `ACCEPTED`
  - rejection after selection
  - parent linkback
- Why it matters: once a problem creates multiple conversations, the customer needs a parent dashboard to understand the whole operation.
- Primary owner: `apps/mobile`

### 10. Build the public opportunities board in the same implementation plan
- Reuse `ServiceNeed` with `visibility = PUBLIC_BOARD`.
- Add board endpoints:
  - `GET /service-needs/opportunities`
  - `GET /service-needs/opportunities/:id`
  - `POST /service-needs/:id/express-interest`
  - `POST /service-needs/:id/close-board` if needed for manual shutdown
- Opportunity behavior:
  - professionals can browse open needs that fit their role
  - they can express interest
  - the first interest creates or opens a child `ServiceRequest`
  - board visibility never reveals direct customer contact until the chosen thread reaches `ACCEPTED`
- Add professional UI surfaces:
  - `OpportunitiesBoardScreen`
  - `OpportunityDetailScreen`
  - entrypoint from `ProfessionalHubScreen`
- Why it matters: this is the second acquisition mode and the user explicitly wants it in this same implementation plan.
- Primary owner: `apps/api` + `apps/mobile`

### 11. Add moderation, notification and lifecycle safeguards for both flows
- Extend notification behavior for:
  - multi-dispatch
  - customer selection
  - professional confirmation
  - board interest
  - sibling closure
- Add basic admin visibility for `ServiceNeed` and board activity in later admin touches if needed.
- Add lifecycle jobs or cron-ready hooks for:
  - stale board posts
  - selected professional confirmation timeout
  - expired pending threads
- Why it matters: both direct-send and board flows create more operational edge cases than the current one-thread model.
- Primary owner: `apps/api` + `apps/worker`

### 12. Define future AI-assisted intake extension points without building the AI flow now
- Preserve extension points so AI can later:
  - suggest category
  - suggest missing photos
  - suggest clearer descriptions
  - suggest better-fit professional types
- Keep AI out of the initial delivery blocks; do not block foundation work on model selection or prompt design.
- Why it matters: the future assistant should enrich `ServiceNeed` drafts instead of forcing another domain rewrite.
- Primary owner: future cross-layer work

## Operational Delivery Blocks

### Block 1. Shared Domain Foundation
Status:
- proposed

Tasks included:
- `1`
- `2`
- `3`
- `4`

Scope:
- shared state model
- parent `ServiceNeed`
- child `ServiceRequest` re-anchoring
- shared contracts
- upload scope extension

Deliverable:
- stable naming, persistence and contract base for both direct-send and board flows

Why this block comes now:
- every later route and screen depends on this state machine being correct

### Block 2. Direct Multi-Send Customer Flow
Status:
- proposed

Tasks included:
- `5`
- `6`
- `7`
- `8`
- `9`

Scope:
- draft creation
- multi-dispatch
- customer selection
- professional confirmation
- parent + child inbox UX
- compatibility path for the old entrypoint

Deliverable:
- a customer can draft one problem, send it to many professionals, choose one candidate, wait for confirmation, and continue on the winning thread

Why this block comes now:
- it closes the main product gap while staying close to the current request and messaging architecture

### Block 3. Public Opportunities Board
Status:
- proposed

Tasks included:
- `10`
- `11`

Scope:
- board publication
- professional opportunity browsing
- express-interest flow
- board lifecycle safeguards

Deliverable:
- the same parent need model supports inbound professional discovery in addition to direct invites

Why this block comes after Block 2:
- it reuses the same foundation, but it adds a second marketplace surface and more operational load

### Block 4. AI-Assisted Intake Hooks
Status:
- future

Tasks included:
- `12`

Scope:
- future guidance hooks only

Deliverable:
- the model is ready for assisted drafting later without replanning the domain

Why this block comes later:
- it is an enrichment layer, not part of the core transactional flow

## Repo Ownership and Contract Impact

### Shared contract and domain ownership
- `packages/domain`
  - add `ServiceNeedStatus`
  - add `ServiceNeedVisibility`
  - add `ServiceRequestOrigin`
  - add `ServiceRequestCloseReason`
  - extend `ServiceRequestStatus` with `AWAITING_PRO_CONFIRMATION`

- `packages/contracts`
  - add `service-needs.js`
  - extend `service-requests.js`
  - extend `uploads.js`
  - export new schemas from `index.js`

### Backend ownership
- `apps/api/models`
  - add `ServiceNeed`
  - extend `ServiceRequest`
  - add indexes and associations

- `apps/api/controllers`
  - add `service-needs-controller.js`
  - update `service-requests-controller.js`

- `apps/api/routes`
  - add `service-needs-routes.js`
  - wire routes in `index.js`

- `apps/api/docs`
  - document new endpoints and status transitions in `openapi.js`

- `apps/worker`
  - add timeout and stale-post lifecycle hooks when the project reaches that block

### Mobile ownership
- `apps/mobile/navigation`
  - register the new parent-need and board routes

- `apps/mobile/screens`
  - add customer need screens
  - refactor `RequestsScreen`
  - refactor `RequestDetailScreen`
  - add professional board surfaces
  - add selection mode on top of `ProfessionalDetailScreen`

- `apps/mobile/components`
  - extract reusable catalog cards and lists from `HomeScreen.js`
  - extract reusable upload pieces from `WorkPostComposer.js`
  - add need cards, board cards and parent headers

**Contract impact**
- Mobile gains a parent-first API in addition to the current thread-first request API.
- `ServiceRequest` payloads must carry a compact `serviceNeed` summary.
- The request state machine changes and must be reflected consistently in both backend validation and mobile UI state handling.

## Backend Plan

### Data Model

**`ServiceNeed`**
```js
ServiceNeed {
  customerId: number
  categoryId: number | null
  title: string
  description: string
  photoUrls: string[]
  city: string
  province: string
  addressLine: string
  placeId: string | null
  lat: number | null
  lng: number | null
  preferredDate: Date | null
  budgetAmount: number | null
  budgetCurrency: string
  contactName: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  contactEmail: string | null
  visibility: 'DIRECT_ONLY' | 'PUBLIC_BOARD'
  status: 'DRAFT' | 'OPEN' | 'SELECTION_PENDING_CONFIRMATION' | 'MATCHED' | 'CLOSED' | 'CANCELLED'
  selectedServiceRequestId: number | null
  publishedAt: Date | null
  selectionStartedAt: Date | null
  matchedAt: Date | null
  closedAt: Date | null
  cancelledAt: Date | null
}
```

**`ServiceRequest` additions**
```js
ServiceRequest {
  serviceNeedId: number
  origin: 'DIRECT_INVITE' | 'PUBLIC_BOARD'
  status: 'PENDING' | 'AWAITING_PRO_CONFIRMATION' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED'
  closeReason: 'CUSTOMER_CANCELLED' | 'PROFESSIONAL_REJECTED' | 'CUSTOMER_SELECTED_OTHER' | 'BOARD_CLOSED' | 'EXPIRED' | null
}
```

### Lifecycle Rules
- `ServiceNeed.DRAFT`: the customer can edit freely and no threads exist yet.
- `ServiceNeed.OPEN`: there are active candidate threads or a live public board posting.
- `ServiceNeed.SELECTION_PENDING_CONFIRMATION`: the customer picked one candidate and the chosen professional still needs to confirm.
- `ServiceNeed.MATCHED`: the chosen professional confirmed and the winning thread is now `ACCEPTED`.
- `ServiceNeed.CLOSED`: the work finished or the need was archived after resolution.
- `ServiceNeed.CANCELLED`: the customer cancelled the whole need.

- `ServiceRequest.PENDING`: the professional was invited or expressed interest, and the thread is open for conversation.
- `ServiceRequest.AWAITING_PRO_CONFIRMATION`: the customer selected that thread and is waiting for the professional to confirm.
- `ServiceRequest.ACCEPTED`: the chosen professional confirmed; contact may unlock.
- `ServiceRequest.REJECTED`: the professional declined.
- `ServiceRequest.CANCELLED`: the customer cancelled the thread or selected another professional.
- `ServiceRequest.EXPIRED`: no response or confirmation happened within the configured window.

### Transition Rules
- Only the customer can call `select-request`.
- `select-request` can only target a child thread in `PENDING`.
- `select-request` moves the parent to `SELECTION_PENDING_CONFIRMATION`.
- `select-request` moves the chosen child to `AWAITING_PRO_CONFIRMATION`.
- The chosen professional is the only actor who can move that child from `AWAITING_PRO_CONFIRMATION` to `ACCEPTED`.
- If the chosen professional rejects, the parent returns to `OPEN` and clears `selectedServiceRequestId`.
- Contact reveal still depends on child request state reaching `ACCEPTED` or `COMPLETED`.
- Reviews remain attached to the winning child `ServiceRequest`.

### API Surface

**Need-level endpoints**
- `GET /service-needs?page&pageSize&status&visibility`
- `POST /service-needs`
- `GET /service-needs/:id`
- `PATCH /service-needs/:id`
- `POST /service-needs/:id/dispatches`
- `POST /service-needs/:id/select-request`
- `POST /service-needs/:id/cancel`

**Board endpoints**
- `GET /service-needs/opportunities?page&pageSize&categoryId&placeId`
- `GET /service-needs/opportunities/:id`
- `POST /service-needs/:id/express-interest`

**Existing request endpoints to update**
- `GET /service-requests`
- `GET /service-requests/:id`
- `PATCH /service-requests/:id/status`
- `POST /service-requests/:id/messages`

### Suggested Payloads
```js
POST /service-needs
{
  categoryId,
  title,
  description,
  photoUrls,
  city,
  province,
  addressLine,
  preferredDate,
  budgetAmount,
  budgetCurrency,
  contactName,
  contactPhone,
  contactWhatsapp,
  contactEmail,
  visibility
}
```

```js
POST /service-needs/:id/dispatches
{
  professionalIds: number[],
  customerMessage: string
}
```

```js
POST /service-needs/:id/select-request
{
  serviceRequestId: number
}
```

```js
POST /service-needs/:id/express-interest
{
  message: string
}
```

### Compatibility Route
- `POST /service-requests` becomes a wrapper that creates one parent `ServiceNeed` plus one child `ServiceRequest`.
- It should only be removed after all current customer entrypoints have migrated away from `CreateServiceRequestScreen`.

### Notifications and Jobs
- Notify professionals on direct dispatch.
- Notify the chosen professional when a thread moves to `AWAITING_PRO_CONFIRMATION`.
- Notify the customer when the chosen professional confirms or rejects.
- Notify professionals when sibling threads are closed because another candidate was selected.
- Add lifecycle hooks for:
  - pending confirmation timeout
  - stale board closure
  - expired unresponsive threads

## Frontend / UI Plan

### Scope
- New customer problem-first flow
- Reuse of existing catalog and messaging work
- Public opportunities board for professionals
- Minimal disruption to the current tab structure

### Product Goals
- Let the customer think in terms of one real-world problem, not one professional at a time.
- Keep conversations lightweight, but group them under a parent workspace.
- Make the customer-choice-first and professional-confirmation-second flow obvious.
- Reuse the current explore feel for professional selection.
- Give professionals a clear board of opportunities without forcing them through the profile editing hub to discover work.

### Visual Direction
- Preserve the current mobile visual language instead of redesigning the whole app.
- Use a stronger hierarchy:
  - parent need cards feel like briefs
  - child threads feel like negotiations
  - board cards feel like opportunities
- Status treatment must make these differences obvious:
  - `PENDING`
  - `AWAITING_PRO_CONFIRMATION`
  - `ACCEPTED`
  - `CANCELLED`
- The customer workspace should feel operational and dense enough to compare several professionals without becoming a chat wall.

### Route Map
```text
Tabs
  Home
  Requests
    - Customer segmented view:
      - Conversations
      - Mis problemas
    - Professional thread inbox
  Professional
    - ProfessionalHubScreen
    - OpportunitiesBoardScreen

Stack
  ServiceNeedComposerScreen
  ServiceNeedDetailScreen
  SelectProfessionalsScreen
  OpportunityDetailScreen
  ProfessionalDetailScreen (selection mode)
  RequestDetailScreen
```

### Core Screens

**`ServiceNeedsScreen`**
- Customer list of parent needs.
- States:
  - empty
  - draft only
  - open with active negotiations
  - waiting for professional confirmation
  - matched
  - closed
- CTA: `Crear problema`

**`ServiceNeedComposerScreen`**
- Draft and edit a parent need.
- Sections:
  - title
  - category
  - problem description
  - photos
  - location
  - budget
  - contact snapshot
- CTA flow:
  - `Guardar borrador`
  - `Seleccionar profesionales`
  - `Publicar en tablero`

**`SelectProfessionalsScreen`**
- Reuse the catalog ranking and filters from `HomeScreen`.
- Add multi-select state and a bottom summary CTA.
- CTA: `Enviar a N profesionales`

**`ServiceNeedDetailScreen`**
- Parent summary and current lifecycle state.
- Child thread list.
- Actions:
  - choose one candidate thread
  - publish to board if not yet published
  - invite more professionals
  - cancel the need
- Must show the special waiting state after customer selection and before professional confirmation.

**`RequestsScreen` refactor**
- Customer:
  - `Conversaciones`
  - `Mis problemas`
- Professional:
  - keep thread-first list, but enrich cards with parent need context and board/direct origin

**`RequestDetailScreen` updates**
- Show parent need summary.
- Show if the thread is merely active, selected-and-waiting, or fully accepted.
- For the chosen professional, show a confirmation CTA when the thread is `AWAITING_PRO_CONFIRMATION`.

**`OpportunitiesBoardScreen`**
- Professional list of public customer needs.
- Filters by category, area and freshness.
- Cards show:
  - title
  - category
  - location hint
  - budget hint
  - photo count
  - urgency markers if added later

**`OpportunityDetailScreen`**
- Full need summary without unlocked external contact.
- CTA: `Me interesa`
- After interest is expressed, link into the created child thread.

### Information Architecture
- Parent `ServiceNeed` is the customer operational workspace.
- Child `ServiceRequest` remains the negotiation, status and review unit.
- The board is another entry mode into the same parent-child structure, not a second marketplace domain.
- The professional confirmation step must be visible in both the parent need detail and the chosen child thread.

### States That Must Be Designed
- draft need with no professionals yet
- direct-send draft with uploaded photos still processing
- dispatch in progress
- open need with several active `PENDING` threads
- parent in `SELECTION_PENDING_CONFIRMATION`
- child thread in `AWAITING_PRO_CONFIRMATION`
- chosen professional rejects after customer selection
- matched parent after professional confirmation
- board post with zero interests
- board post with multiple interests
- empty opportunities board
- invalid draft that cannot be published or dispatched

### Component Strategy
- Extract reusable catalog cards and list sections from `HomeScreen.js`.
- Extract reusable photo upload, chip list and draft validation pieces from `WorkPostComposer.js`.
- Add:
  - `ServiceNeedCard`
  - `ServiceNeedHeader`
  - `ServiceNeedStatusPill`
  - `RequestThreadCard`
  - `ProfessionalSelectionFooter`
  - `OpportunityCard`
  - `OpportunityMetaRow`

### Frontend Delivery Recommendation by Block
1. Build shared parent-need cards, status pills and route registration.
2. Ship customer composer, list and detail flow for drafts and multi-send.
3. Refactor requests and thread detail to understand the new state machine.
4. Add professional board screens and their entrypoint from the professional area.
5. Polish selection-confirmation waiting states and timeout handling.

### Non-Goals
- No advanced quote builder in the first implementation.
- No real-time chat rewrite.
- No AI-assisted intake implementation yet.
- No large navigation redesign beyond the minimum needed to expose parent needs and board opportunities.

## Testing and Validation Plan

### Backend
- Creating a draft need persists with no professionals attached.
- Dispatch to multiple professionals creates one child `ServiceRequest` per professional in a transaction.
- Dispatch rejects duplicate professionals for the same need.
- Selecting a candidate moves the parent to `SELECTION_PENDING_CONFIRMATION` and the chosen child to `AWAITING_PRO_CONFIRMATION`.
- Only the chosen professional can confirm the selected child into `ACCEPTED`.
- Rejecting after customer selection reopens the parent need correctly.
- Board interest creates or links the expected child thread without leaking external contact.
- Compatibility `POST /service-requests` still returns the current payload shape.

### Mobile
- Customer can save, reopen and edit drafts.
- Customer can select multiple professionals and dispatch once.
- Customer can choose one candidate and see the waiting-for-confirmation state.
- Professional can confirm a selected thread and drive it to `ACCEPTED`.
- Requests tab does not regress for professionals.
- Professional board screens handle empty, filtered and populated states.

### Visual Checkpoints
- Parent need cards are clearly distinct from child conversation cards.
- `AWAITING_PRO_CONFIRMATION` looks different from `ACCEPTED`.
- The board feels like part of the same app, not a disconnected surface.
- Photo upload states match the current professional post upload quality bar.

## Risks and Open Questions

### Risks
- The new state machine is more complex than the current one-thread acceptance model.
- Closing sibling threads at customer selection time can create recovery edge cases if the chosen professional rejects later.
- `RequestsScreen` currently serves both customer and professional roles, so the refactor must avoid inbox regressions.
- The public board adds moderation and freshness concerns that the current product does not yet solve operationally.

### Mitigations
- Freeze the new parent and child state machine before backend route work starts.
- Keep `ACCEPTED` impossible until the chosen professional confirms.
- Reopen the parent need to `OPEN` when the chosen professional rejects or times out.
- Roll out compatibility routes so the old single-request surfaces keep functioning while migration happens.

### Open Questions
1. What exact timeout window should a chosen professional have to confirm before the selected thread expires and the parent returns to `OPEN`?
2. Should public board posts publish immediately, or pass through lightweight moderation rules first?
3. Should closed sibling threads stay visible in the customer need detail as archived conversations, or collapse into a historical summary row?
4. Does expressing interest from the board require a first structured message, or can it start with an empty thread plus a canned system intro?

## Rollout Recommendation

1. Ship shared enums, contracts, migrations and serializers first.
2. Ship the direct customer flow next: drafts, multi-send, candidate selection and professional confirmation.
3. Migrate customer entrypoints away from `CreateServiceRequestScreen`, while keeping the compatibility backend route alive.
4. Ship the public opportunities board in the same plan as the next delivery block on top of the same parent model.
5. Add lifecycle jobs and timeout handling before considering the AI-assisted intake layer.
