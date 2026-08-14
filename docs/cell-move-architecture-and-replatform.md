# Cell move: current architecture and replatform options

**Status:** Draft for discussion · **Epic:** MAPA-275 · **Story:** MAPA-276

## Why this document exists

The Activities & Appointments team have told us that `hmpps-change-someones-cell` POSTs
3–4k times per day to whereabouts-api `/cell/make-cell-move`, making this service the most
frequent remaining consumer of an API that is nearly ready for decommission.

Moving off whereabouts is not a URL swap. Whereabouts does not proxy a cell move — it
**orchestrates three operations and owns state that exists nowhere else**. This document
records what the current flow actually does, who depends on it, and what we propose to
build instead.

---

## 1. What this service depends on today

All API clients are constructed in `server/data/index.ts` and injected into services via
`server/services/index.ts`.

| API | Used for | Key endpoints |
|---|---|---|
| **whereabouts** | **The cell move itself** | `POST /cell/make-cell-move` |
| prison-api | Bookings, cell history, reference data, C-SWAP, images | `server/data/prisonApiClient.ts:399,409,430,442,452` |
| locations-inside-prison | Cells, capacity, occupancy, location groups | `server/data/locationsInsidePrisonApiClient.ts:77-104` |
| prisoner-search | Prisoner detail and alerts | `server/data/prisonerSearchApiClient.ts:35,41` |
| alerts | Active alerts for reception lists | `server/data/alertsApiClient.ts:26` |
| non-associations | Non-association checks | `server/data/nonAssociationsApiClient.ts:49` |
| manage-users | Current user and roles | `server/data/manageUsersApiClient.ts:29,34` |
| fe-components | DPS common header/footer | `server/data/feComponentsClient.ts:45` |
| Google Analytics | `cell_move` measurement events | `server/data/googleAnalyticsClient.ts:28` |

Only **one** of these — whereabouts — is being decommissioned. Everything else stays.

### Token model (constrains the replacement)

Two tokens are in play, and this matters for the new API's design:

- `res.locals.user.token` — the signed-in user's token, used for role checks
  (`authorisationMiddleware(['ROLE_CELL_MOVE'])`).
- `res.locals.systemClientToken` — a client-credentials token fetched in
  `server/middleware/populateClientToken.ts` and cached in Redis. **All downstream API
  calls use this one**, including the cell move.

---

## 2. The three journeys

### Cell move
`server/routes/cellMoveRouter.ts`

```
search-for-cell → select-cell → consider-risks → confirm-cell-move → [POST] → confirmation
```

The POST lands in `server/controllers/cellMove/confirmCellMove.ts`, which validates the
reason and comment (`validate`, line 158), then calls `makeCellMove` (line 111) →
`prisonerCellAllocationService.moveToCell` → `whereaboutsApiClient.moveToCell`
(`server/data/whereaboutsApiClient.ts:40`), posting to
`/cell/make-cell-move?lockTimeout=true`.

### Reception move
`server/routes/receptionMoveRouter.ts`

```
consider-risks-reception → confirm-reception-move → [POST] → confirmation
```

`server/controllers/cellMove/confirmReceptionMove.ts:107` calls the **same**
`moveToCell`, passing the first available reception location as the destination.

### C-SWAP — note the asymmetry

`confirmCellMove.ts:148` (`makeCSwap`) does **not** go through whereabouts. It calls
prison-api directly (`prisonApiClient.moveToCellSwap`, `server/data/prisonApiClient.ts:409`).

Consequently **a cell swap creates no case note and no link row**. This is a pre-existing
inconsistency, not something the decommission introduces, but the new API should decide
deliberately whether to keep it.

---

## 3. What whereabouts actually does

`whereabouts-api/src/main/java/uk/gov/justice/digital/hmpps/whereabouts/services/CellMoveService.kt:26-76`

```kotlin
@Transactional
fun makeCellMove(cellMoveDetails: CellMoveDetails, lockTimeout: Boolean): CellMoveResult {
  val occurrenceDateTime = LocalDateTime.now(clock)

  val moveResult = prisonApiService.putCellMove(...)          // 1. NOMIS move
  val caseNoteDetails = caseNotesService.postCaseNote(...)    // 2. MOVED_CELL case note
  val cellMove = CellMoveReason(
    bookingId = moveResult.bookingId,
    bedAssignmentsSequence = moveResult.bedAssignmentHistorySequence,
    caseNoteId = caseNoteDetails.caseNoteId,
  )
  cellMoveRepository.save(cellMove)                           // 3. local link row
  telemetryClient.trackEvent("CellMove", ...)
  return moveResult.copy(caseNoteId = caseNoteDetails.caseNoteId)
}
```

1. `PUT prison-api /api/bookings/{bookingId}/living-unit/{location}?lockTimeout=&reasonCode=`
2. `POST offender-case-notes /case-notes/{offenderNo}` with type `MOVED_CELL`, subType = the
   cell move reason code
3. `INSERT` into `CELL_MOVE_REASON`

### The table we have to rehome

`whereabouts-api/src/main/resources/db/migration/V12__create_cell_move_reason.sql`

```sql
CREATE TABLE CELL_MOVE_REASON (
  BOOKING_ID BIGINT NOT NULL,
  BED_ASSIGNMENT_SEQUENCE BIGINT NOT NULL,
  CASE_NOTE_ID INT NOT NULL,
  PRIMARY KEY (BOOKING_ID, BED_ASSIGNMENT_SEQUENCE)
);
COMMENT ON TABLE CELL_MOVE_REASON IS 'Links a case note with an cell move';
```

This exists because NOMIS `BED_ASSIGNMENT_HISTORIES` has **no column for a case note or
free-text reason** — only a 3–4 character `ASSIGNMENT_REASON` code. It is the only
DPS-owned cell move data in existence, and it is keyed entirely on NOMIS identifiers.

No timestamps, no audit columns, and nothing purges it.

### Behaviours worth knowing before we reproduce them

**The transaction is largely theatre.** `@Transactional` wraps two remote HTTP calls, but the
only transactional resource is the local insert. Rollback undoes the link row and nothing
else — **the NOMIS move is never compensated**. So these partial states already occur in
production today:

| Failure point | Result |
|---|---|
| prison-api move fails | Clean — nothing happened |
| Case note POST fails | **Prisoner moved in NOMIS, no case note, no link row** |
| DB insert fails | **Prisoner moved, case note created, link lost forever** |

**Retries on a non-idempotent write.** `PrisonApi.java:272-288` applies `.retry(3)` to the
NOMIS move — up to four attempts, retrying on *any* error including 4xx, with a single 12s
timeout shared across all of them.

**Error mapping loses detail.** `controllers/ControllerAdvice.kt:71-77` maps any prison-api
`WebClientResponseException` other than 401/403 to a **500**:

```kotlin
@ExceptionHandler(WebClientResponseException::class)
fun handleException(e: WebClientResponseException): ResponseEntity<ErrorResponse> {
  if (e.statusCode.value() == 401) return handleWebClientUnAuthorised(e)
  if (e.statusCode.value() == 403) return handleWebClientForbidden(e)
  return handleServerError(e)
}
```

Only 423 survives, via an explicit `DatabaseRowLockedException` mapping — that is the
"record open in P-NOMIS" case, and only when `lockTimeout=true`.

> **Suspected latent bug.** `confirmCellMove.ts:125` redirects to `cell-not-available` on
> `error.status === 400`, but prison-api's 400 ("cell full", invalid location) is masked as
> a 500 upstream — so that redirect looks unreachable in production. **Worth confirming
> against App Insights before relying on this.** A new API that passes 400 through honestly
> would make that page start working.

**No authorisation.** Whereabouts requires no role at all — any authenticated HMPPS token
can move any prisoner.

---

## 4. Who else is affected

Verified by grepping every local repo for `make-cell-move` and `cell-move-reason`.

### hmpps-prisoner-profile — the one blocker

`server/data/whereaboutsClient.ts` → `server/services/prisonerLocationHistoryService.ts:48-71`:

```ts
const cellMoveReason = await whereaboutsApi.getCellMoveReason(bookingId, bedAssignmentHistorySequence, true)
if (cellMoveReason) {
  const caseNote = await caseNotesApi.getCaseNote(
    offenderNo, caseloadId, cellMoveReason.cellMoveReason?.caseNoteId.toString(), true,
  )
  if (caseNote) { return caseNote.text }
}
```

This two-hop (link row → case note) renders **"What happened"** on the prisoner location
history page. It is the sole reader of `GET /cell/cell-move-reason/...`.

Note also that `reasonForMove` in `prisonerLocationHistoryController.ts` is *gated* on that
response, so if whereabouts disappears the reason silently degrades to "Not entered" —
even though the reason code is independently available from prison-api. Worth fixing
regardless.

### digital-prison-services — dead code

`backend/api/whereaboutsApi.ts` defines `getCellMoveReason` and `moveToCell`, but nothing
calls them. The cell move feature already migrated out; only a redirect page remains. Safe
to delete independently.

### Everything else is clean

`hmpps-locations-inside-prison-api`, `hmpps-external-movements-api`, `hmpps-integration-api`,
`hmpps-prison-roll-count` and the CSRA services have no dependency on these endpoints.

---

## 5. Options considered

**A. Orchestrate from this Node UI.** Call prison-api and case-notes directly from
`confirmCellMove.ts`. Cheapest, but leaves `CELL_MOVE_REASON` homeless — and that table dies
with whereabouts. Also puts a non-atomic three-step write with no retry story into a front
end, and gives us nothing towards the NOMIS work. **Rejected.**

**B. Add it to `hmpps-locations-inside-prison-api`.** It already owns cells and capacity, so
superficially attractive. But it holds **no prisoner data at all** — occupancy is a
read-through projection of prisoner-search (`service/PrisonerLocationService.kt`), and every
write endpoint is location reference data. Adding per-booking transactional data would be a
domain violation and would make its already-large NOMIS sync surface bidirectional over a
much higher-volume table family. **Rejected.**

**C. Extend `hmpps-cell-sharing-risk-assessment-api`.** Team-owned, new, and cell-adjacent.
But CSRA is a risk-assessment bounded context; cell movement is a different one. We would be
merging two NOMIS extractions into one service for convenience. **Rejected as a home — but
adopted as the template.**

**D. New `hmpps-change-someones-cell-api`. Recommended.**

---

## 6. Recommended target architecture

A new Kotlin Spring Boot API, modelled closely on `hmpps-cell-sharing-risk-assessment-api` —
which this team built, and which solves the same shape of problem: a new DPS service taking
a per-booking dataset out of NOMIS.

### Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /cell-movements` | Perform the move. Returns movement id, `bedAssignmentHistorySequence`, case note reference. Passes 400 and 423 through honestly. |
| `GET /cell-movements/{bookingId}/bed-assignment/{sequence}` | Serve "what happened" in **one hop** from stored comment text — replaces prisoner-profile's two-hop. |
| `GET /prisoners/{prisonerNumber}/cell-movements` | *(later)* History served from our own data rather than NOMIS. |

### Data model

Follow the split in `hmpps-cell-sharing-risk-assessment-api/docs/csra-persistence-new-model.md`:
a core table for both native and migrated rows, plus a side table holding legacy NOMIS
fields verbatim.

```
cell_movement
  id                       uuid pk
  prisoner_number          text
  booking_id               bigint
  bed_assignment_sequence  int
  from_location_key        text
  to_location_key          text
  reason_code              text          -- CHG_HOUS_RSN
  comment_text             text          -- WE STORE THIS (see below)
  case_note_uuid           uuid
  case_note_legacy_id      bigint        -- migrated rows only
  occurred_at              timestamp
  recorded_by              text
  status                   text          -- PENDING | COMPLETED | CASE_NOTE_FAILED

cell_movement_nomis        -- migrated CELL_MOVE_REASON rows, verbatim
```

**Storing `comment_text` ourselves is the key decision.** It means:

- prisoner-profile reads "what happened" in one call instead of two
- the case note becomes a **retryable derived artefact** rather than something lost forever
  on failure
- we stop depending on a deprecated numeric case note id

### Reliability — improve on today, don't reproduce it

```
1. Persist the movement row as PENDING (comment text captured)
2. PUT prison-api living-unit          → on failure, mark failed; nothing else happened
3. Record bedAssignmentHistorySequence → status COMPLETED
4. Create the case note                → on failure, status CASE_NOTE_FAILED, retry later
```

Because step 4 is recoverable, the worst case becomes "move recorded, case note pending"
instead of "move happened, explanation lost". Use the transactional outbox from
`hmpps-external-movements-api` (`events/DomainEventPoller.kt`,
`db/schema/V0_25__domain_events.sql`) rather than the fire-and-forget publish in
locations-api.

### Auth — the hard constraint

**The new API cannot be purely system-to-system.** Two downstreams demand a real NOMIS user:

- prison-api's cell move is `@ProxyUser` — NOMIS audit columns must record the actual user
- offender-case-notes rejects `sync to nomis` types without a NOMIS user, and `MOVED_CELL`
  is one (`notes/WriteCaseNote.kt:70-74`)

Whereabouts achieves this by adding `username` to the client-credentials token request
(`CustomOAuth2ClientCredentialsGrantRequestEntityConverter`). We must replicate this.

Roles should use the modern namespaced style: `ROLE_CELL_MOVEMENTS__RW` / `__RO` /
`__SYNC__RW` — unlike whereabouts, which requires none.

### Case note identifiers

offender-case-notes is now UUID-canonical; `legacyId` is deprecated
(`config/OpenApiConfiguration.kt:74-86`). Store the UUID. Keep the numeric legacy id only
for reading migrated rows.

---

## 7. Phasing

### Phase 1 — unblock the decommission
1. Bootstrap the repo and namespace via `hmpps-project-bootstrap`
2. Build `POST /cell-movements` and the "what happened" read endpoint
3. Migrate `CELL_MOVE_REASON` data across
4. Switch this UI (`server/data/whereaboutsApiClient.ts` becomes a client for the new API)
5. Switch hmpps-prisoner-profile
6. Delete whereabouts `/cell/*` and the dead code in digital-prison-services

### Phase 2 — consistency
Domain events for cell movements; decide whether C-SWAP should raise a case note; honest
400/423 handling; fix prisoner-profile's `reasonForMove` degradation.

### Phase 3 — own the data (the strategic prize)
Take `BED_ASSIGNMENT_HISTORIES` out of NOMIS, following
`hmpps-locations-inside-prison-api/docs/0003-nomis-sync-and-migration.md`.

> **Hard external dependency.** `hmpps-nomis-prisoner-api` has **no** bed-assignment
> endpoints today, and neither `hmpps-prisoner-to-nomis-update` nor
> `hmpps-prisoner-from-nomis-migration` has a cell/bed package — their `movements/` packages
> cover court and temporary absences only. Syscon would need to build the NOMIS-side
> endpoints plus a new `MigrationType`/`SynchronisationType`. **This needs negotiating
> early; it is not something we can deliver alone.**

---

## 8. Open questions

- Can we confirm from App Insights whether the `cell-not-available` 400 path ever fires?
- Should C-SWAP raise a case note, bringing it in line with normal cell moves?
- Is prisoner-profile's `reasonForMove` degradation worth fixing now, independently?
- What timeline do A&A need for whereabouts decommission, and does Phase 1 fit inside it?
- Capacity sizing: 3–4k moves/day is the current write volume — what read volume comes with
  serving history in Phase 3?
