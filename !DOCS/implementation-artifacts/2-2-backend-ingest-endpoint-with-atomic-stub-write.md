# Story 2.2: Backend ingest endpoint with atomic stub write

Status: ready-for-dev

## Story

As a user,
I want every paste or file drop to be durable the moment it lands,
so that I never lose a capture to a browser crash or a network blip — the server side of Story 2.1's capture flow.

## Acceptance Criteria

1. **`POST /api/items` endpoint exists.** `src/latestnews/api/items.py` registers a FastAPI router mounted at `/api/items`. `src/latestnews/app.py` includes it via `app.include_router(items.router)`. The handler accepts either `application/json` (body: `{ "url": str }`) or `multipart/form-data` (fields: `file`, `source_type`).

2. **Request validation.** JSON body: `{ url: str }` where `url` is trimmed, non-empty. Multipart: `file` is required, `source_type` ∈ `{ "pdf", "image", "markdown", "text" }` (optional; inferred from MIME when absent, same table as Story 2.1's `inferSourceType`). On validation failure, return `422 Unprocessable Entity` with the architecture's error envelope `{ "error": { "code": "ingest.validation_failed", "message": <dev>, "hint": <user> } }`.

3. **Atomic stub write.** `src/latestnews/fs/writer.py` exports `atomic_write(path: Path, content: str | bytes) -> None` using the temp-file-plus-rename algorithm: write to `{path.parent}/.{path.name}.tmp.{pid}.{random}` → `flush` + `fsync` the file → `os.replace(tmp, path)` → `fsync` the parent directory → close. On exception the partial tmp file is removed; the target is never partially written (NFR-R3).

4. **Stub file layout.** For each capture, `src/latestnews/fs/writer.py` exports `write_item_stub(data_root, *, item_id, source, source_type, original_source, title) -> Path`. It computes a filename `{YYYYmmddTHHMMSSZ}-{slug}.md` (UTC timestamp, title slugified to lowercase-hyphen-alphanumeric, 40-char cap) directly under `data_root`, builds YAML frontmatter with these fields **exactly in this order**, and calls `atomic_write`:
   ```yaml
   ---
   id: <uuid-v7>
   schema_version: 1
   source: url | file
   source_type: url_html | pdf | image | markdown | text
   sensitivity: personal
   created_at: <ISO 8601 UTC with Z suffix, milliseconds>
   title: <fallback>
   ---
   ```
   The body is empty (a single trailing newline after the closing `---`).

5. **UUIDv7 identifiers.** Use `uuid_utils.uuid7()` (Python stdlib's `uuid` module lacks v7 support as of 3.12; we add the dep). The same UUID is serialised into the frontmatter `id` field **and** returned in the 201 response `{ "id": "<uuid>", "status": "queued" }`. Filenames use the timestamp-slug form; UUID is the stable internal ID, filename is the human-readable disk anchor.

6. **`201 Created` response within 100 ms.** Measure and log the write-and-return latency (NFR-P1, `≤ 100 ms p95`). The response body is exactly `{ "id": "<uuid-v7>", "status": "queued" }` — no extra fields. The response Content-Type is `application/json`.

7. **Event bus scaffolding.** `src/latestnews/events/bus.py` implements a minimal in-process async pub-sub: `async def publish(event) -> None` and `async def subscribe() -> AsyncIterator[Event]`. `src/latestnews/events/types.py` defines a `TypedDict` (or pydantic model) `IngestProgressEvent` with `type: Literal["ingest.progress"]`, `payload: { item_id: str, state: "queued" | "fetching" | "parsing" | "summarizing" | "indexed" }`, `meta: { timestamp: str }`. Story 2.2 only emits the `queued` state — others come in Epic 3. The bus is a singleton created once at app startup and stored on `app.state.events` (or an equivalent module-level singleton).

8. **`GET /api/events` SSE endpoint.** `src/latestnews/api/events.py` exposes a `text/event-stream` endpoint that subscribes to the event bus and serialises each event as `event: <type>\ndata: <json>\n\n`. Supports graceful disconnect (generator stops cleanly when the client closes). No frontend consumer yet (Story 2.4). Story 2.2 ships the endpoint, one unit test covering the emit-then-receive round trip, and a module docstring pointing at the upstream consumer.

9. **`ingest.progress { state: queued }` emitted on stub write.** The coordinator (`src/latestnews/ingest/coordinator.py`) calls `write_item_stub(...)` first, then `publish(IngestProgressEvent(..., state="queued"))`, then returns the HTTP response. Order matters: the stub is durable before any event fires (so reconstruct-from-disk on restart is consistent).

10. **Settings + data root.** `src/latestnews/settings/__init__.py` exports a `get_settings() -> Settings` function returning a `pydantic_settings.BaseSettings` subclass with `data_root: Path`, reading from env var `LATESTNEWS_DATA_ROOT` (default: `~/LatestNews/`). At startup (FastAPI lifespan), the data root is expanded (`~` → `$HOME`), resolved, `mkdir(parents=True, exist_ok=True)`, and validated `is_dir()`. The Settings singleton is attached to `app.state.settings` — or consumed via FastAPI dependency injection.

11. **Error responses with envelope.** Per architecture's error contract:
    - `422` on validation failure → `{ "error": { "code": "ingest.validation_failed", "message": ..., "hint": ... } }`
    - `500` on write failure → `{ "error": { "code": "ingest.write_failed", "message": ..., "hint": "Failed to save item. Retry or check logs." } }`
    - `413` if multipart file exceeds a sensible cap (25 MB for MVP; the cap is enforced at FastAPI's multipart parser via `fastapi.Request` size limit or a custom `Depends` middleware). Body: `{ "error": { "code": "ingest.too_large", ... } }`. Return `415` if MIME is entirely unsupported — but default to accepting and marking `source_type="text"` (permissive).

12. **Backend tests.** Add to `tests/backend/`:
    - `tests/backend/fs/test_writer.py` — at least:
      - `atomic_write` produces the expected content at the path
      - A crash mid-write (simulate by raising in `flush` or `fsync`) leaves no partial file at the target path
      - Concurrent `atomic_write` on different paths succeed
      - `write_item_stub` produces the exact frontmatter shape + UTC `created_at` + slugified filename
    - `tests/backend/api/test_items.py` — at least:
      - POST `{ url }` returns `201` with a UUIDv7 id + `status: "queued"`
      - Stub file is on disk at the expected path after the response returns
      - Frontmatter parses as YAML and contains all 7 required fields
      - POST with empty URL → 422 + validation error envelope
      - POST multipart with `file` + `source_type=pdf` returns `201`; stub `source_type` is `pdf`
      - POST with unsupported MIME → permissive, `source_type=text`
    - `tests/backend/events/test_bus.py` — at least:
      - `publish` + `subscribe` round trip (one subscriber receives one event)
      - Multiple subscribers all receive the event
      - Subscriber that disconnects doesn't block the publisher
    - `tests/backend/api/test_events.py` — at least:
      - `GET /api/events` responds with `text/event-stream`
      - An `ingest.progress` published after subscription appears on the stream as `event: ingest.progress\ndata: {...}\n\n`
    - Reuse `httpx.AsyncClient` + `ASGITransport` harness from Story 1.1's health test.

13. **No frontend changes.** Story 2.2 is backend-only. The frontend already speaks to `/api/items` (Story 2.1). After this story merges, the frontend stops 502'ing — `CaptureInput` clears on success and `DropZone` fires its multipart POST. The frontend still doesn't show the captured item anywhere (item list is later in Epic 2); the stub file on disk is the durable receipt.

14. **Lint / typecheck / test / CI green.** `npm run lint`, `npm run typecheck`, `npm run test` at repo root pass. GitHub Actions CI on the resulting `dev` commit is green.

## Tasks / Subtasks

- [ ] **Task 1: Python deps + settings** (AC: #5, #10)
  - [ ] `uv add uuid-utils python-multipart pyyaml` — `uuid_utils` for UUIDv7, `python-multipart` (FastAPI requires it for multipart file uploads), `pyyaml` for the frontmatter serializer
  - [ ] Author `src/latestnews/settings/__init__.py` exporting `Settings(BaseSettings)` with `data_root: Path` and `get_settings()` helper. `env_prefix = "LATESTNEWS_"`. Default `~/LatestNews/`.
  - [ ] FastAPI lifespan in `src/latestnews/app.py` that creates the event bus singleton, expands+resolves data_root, and ensures the directory exists

- [ ] **Task 2: `fs/writer.py` — atomic write** (AC: #3, #4)
  - [ ] `atomic_write(path: Path, content: str | bytes) -> None` with tmp → fsync → os.replace → dir fsync
  - [ ] Uses `pathlib.Path` throughout; paths in `str` only at the filesystem boundary
  - [ ] Cleans up the tmp file on exception
  - [ ] `write_item_stub(data_root: Path, *, item_id: UUID, source: str, source_type: str, original_source: str, title: str) -> Path` that builds the YAML frontmatter (use `yaml.safe_dump` with `sort_keys=False` — field order matters), constructs the `{timestamp}-{slug}.md` filename, and calls `atomic_write`
  - [ ] `slugify(title: str, max_len: int = 40) -> str` — lowercase, replace non-alphanumeric with `-`, collapse consecutive `-`, strip leading/trailing `-`, truncate to `max_len`. If result is empty, fallback to `"untitled"`

- [ ] **Task 3: Event bus** (AC: #7)
  - [ ] `src/latestnews/events/types.py` — typed event envelope (`IngestProgressEvent` first; extend as other event types land)
  - [ ] `src/latestnews/events/bus.py` — in-process pub-sub. Subscribers hold `asyncio.Queue`s; `publish` fans out non-blocking (`queue.put_nowait` with a high ceiling; drop on full with a log warning). Clean up dead subscribers when iterator is garbage-collected
  - [ ] Bus is instantiated once at app startup and attached to `app.state.events`

- [ ] **Task 4: Ingest coordinator** (AC: #6, #9, #11)
  - [ ] `src/latestnews/ingest/coordinator.py` exports `async def ingest_url(data_root, events, url: str) -> CaptureResponse` and `ingest_file(data_root, events, file, source_type) -> CaptureResponse`
  - [ ] Each generates a UUIDv7, derives a fallback title (URL → domain name; file → basename without extension; else `"Untitled Item"`), calls `write_item_stub`, publishes `IngestProgressEvent(state="queued")`, and returns `{ id, status: "queued" }`
  - [ ] On `OSError` / `PermissionError` during stub write: re-raise as `IngestWriteError` with the `ingest.write_failed` code
  - [ ] Log write-and-return latency via structlog (structured log; `capture.latency_ms` field)

- [ ] **Task 5: `/api/items` router** (AC: #1, #2, #11)
  - [ ] `src/latestnews/api/items.py` exports a `router = APIRouter(prefix="/api", tags=["items"])`
  - [ ] `POST /items` accepts either JSON or multipart. FastAPI's content-type discrimination: two separate endpoint handlers (`@router.post("/items")` with a JSON body model + one with multipart form fields) is the cleanest, but FastAPI can't co-mount two handlers on the same path. The idiomatic solution: one handler that inspects `request.headers.get("content-type")` and branches
  - [ ] JSON branch: parse body via pydantic model `{ url: str }` with a `field_validator` that trims + enforces `min_length=1`
  - [ ] Multipart branch: `file: UploadFile = File(...)`, `source_type: str = Form(default=None)`. If `source_type` is `None`, infer from `file.content_type` via a helper that mirrors Story 2.1's `inferSourceType` (identical mapping: `application/pdf` → `pdf`, `image/*` → `image`, `text/markdown` → `markdown`, else `text`)
  - [ ] Error envelope responses use a small helper `error_response(status, code, message, hint)` so the three error types share one implementation

- [ ] **Task 6: `/api/events` SSE endpoint** (AC: #8)
  - [ ] `src/latestnews/api/events.py` exports `router = APIRouter(prefix="/api", tags=["events"])` with `GET /events`
  - [ ] Response is a `fastapi.responses.StreamingResponse` with `media_type="text/event-stream"`
  - [ ] Async generator subscribes to the bus, emits `f"event: {event.type}\ndata: {json.dumps(event)}\n\n"` for each received event, and terminates on `asyncio.CancelledError` (client disconnect)
  - [ ] Headers: `Cache-Control: no-cache`, `X-Accel-Buffering: no` (disables nginx-like buffering if ever proxied — defensive for NFR-P1)

- [ ] **Task 7: Wire into `app.py`** (AC: #1, #8, #10)
  - [ ] `src/latestnews/app.py` — include `items.router` and `events.router`; attach the singleton event bus + Settings to `app.state` in the lifespan
  - [ ] Existing `/api/health` route stays

- [ ] **Task 8: Backend tests** (AC: #12)
  - [ ] `tests/backend/fs/test_writer.py` — atomic-write contract + `write_item_stub` frontmatter shape
  - [ ] `tests/backend/events/test_bus.py` — pub-sub round trip, multi-subscriber fanout
  - [ ] `tests/backend/api/test_items.py` — endpoint contract with `httpx.AsyncClient` + `ASGITransport`; use `tmp_path` to isolate the data root per test (override the Settings dependency via FastAPI's `app.dependency_overrides`)
  - [ ] `tests/backend/api/test_events.py` — SSE round trip (subscribe, publish, assert stream contains the event)

- [ ] **Task 9: Gate + AGENTS.md**
  - [ ] `npm run lint` — Biome + Ruff green (Ruff covers Python; expect a handful of new issues to fix at first pass)
  - [ ] `npm run typecheck` — tsc + mypy strict. Mypy will want types for `uuid_utils` (may need `types-uuid-utils` or an inline `# type: ignore[import-not-found]` if stubs don't exist yet)
  - [ ] `npm run test` — Vitest (frontend unchanged) + pytest (backend gains ~20 tests)
  - [ ] Update `AGENTS.md` — one line under "How to add an ingest plugin" pointing at `src/latestnews/ingest/coordinator.py` as the top-level orchestrator (even though plugins land in Epic 3, the coordinator is the entry point they'll hang off)

- [ ] **Task 10: Commit + push + CI**
  - [ ] Conventional Commits: `feat(backend): ingest endpoint + atomic stub write + event bus (Story 2.2)`
  - [ ] Commit body lists new modules + test count
  - [ ] Push to `origin/dev`; verify CI green
  - [ ] Per AGENTS.md workflow: review → apply-fixes → PR/merge follow automatically

## Dev Notes

### Scope and altitude

Backend-only story. Ships the **durable receipt** of every capture (the stub file), the transport for future progress events (the SSE endpoint), and the validation layer (error envelopes). **No enrichment.** No URL fetching, no PDF parsing, no LLM calls, no search indexing. A capture becomes a stub on disk and an event on the bus; later stories pick up from there.

Explicitly out of scope:

- **Plugin invocation / enrichment** (URL fetching, PDF parsing, image OCR, title extraction) — Epic 3 (Stories 3.1+)
- **LLM processing** (TL;DR, related items, shelf suggestion) — Epic 3
- **Search indexing** (QMD index updates) — Story 4.1
- **Frontend SSE consumer** (`useCaptureStore` listening to events) — Story 2.4
- **Error toast + retry UI** — Story 2.5
- **Global Cmd-V handler** — Story 2.3
- **Item list + ItemCard rendering** — Story 2.4+ (once progress events flow and the UI needs to render)
- **Shelf organization** (items currently land at data-root root; shelves are later data model work)
- **Settings UI** (data-root change) — Story 4.1+
- **Per-user quotas / rate limits** — post-MVP

### Architecture source of truth

- **Architecture full document:** `!DOCS/planning-artifacts/architecture.md`.
- **API contract for Capture:** § API → Capture — `POST /api/items` accepts JSON `{ url }` or multipart file; returns `201 { id, status }`. Error envelope format: `{ error: { code, message, hint } }` — code is a dotted machine-readable identifier.
- **Data model — stub frontmatter:** § Data Model → Item File Format. Fields `id`, `schema_version`, `source`, `source_type`, `sensitivity`, `created_at`, `title` are required at stub-creation time; enrichment fills in `tldr`, `tags`, `related_ids`, `shelf`, etc. later.
- **Atomic write recipe:** § Filesystem Subsystem → Atomic Writes. Temp-file-plus-rename + both-file-and-directory fsync is non-negotiable (NFR-R3).
- **Event bus:** § Event Bus — in-process async pub-sub; SSE transport on `/api/events`; typed envelope with `type`, `payload`, `meta`. Story 5.1 extends event types (chat tokens, etc.) but the bus primitive lives here.
- **Python layout:** packages already created by Story 1.1: `api/`, `events/`, `ingest/`, `fs/`, `settings/`. They've been sitting empty with docstring `__init__.py` files; this is the story that starts populating them.

### PRD FRs + NFRs in play

- **FR1 / FR2 / FR4** — paste/drop + non-blocking. Story 2.2 is the backend half.
- **FR5** — visible per-item progress. Story 2.2 emits the first state (`queued`); the UI consumer and the 5-state pill land in Story 2.4.
- **FR6** — no silent failures. A write failure returns 5xx; the URL is never lost client-side (the `CaptureInput` preserves the value — NFR-R1 already validated in 2.1).
- **NFR-P1** — ingest ≤ 10 s p95 end-to-end. Story 2.2 contributes the write-and-return slice (`≤ 100 ms p95`). Target; not load-tested in MVP.
- **NFR-R1** — no silent data loss. Atomic write + 5xx on failure.
- **NFR-R3** — atomic writes on disk. Temp-file-plus-rename + fsync.
- **NFR-S1 / S2** — local bind, no outbound traffic in 2.2. (URL fetch is plugin territory.)
- **NFR-Q6** — commit references Story 2.2.

### Key technical decisions

- **FastAPI JSON-vs-multipart on the same path.** Two options: (a) one endpoint that discriminates on Content-Type, (b) two endpoints on different paths (`/api/items/url` + `/api/items/file`). Architecture chose (a) — single `POST /api/items` — because the frontend already dispatches both shapes there (Story 2.1). Implement the content-type branch in the handler.
- **`uuid_utils.uuid7()` over rolling our own.** UUIDv7 RFC is finalised (RFC 9562); `uuid_utils` is a widely-used reference impl. Adds ~200kB to the wheel tree; worth it vs hand-rolled.
- **YAML via `pyyaml.safe_dump(..., sort_keys=False)`.** Preserve frontmatter field order (Obsidian users + anyone reading the files directly will notice scrambled order). Alternative: hand-roll the YAML serialiser for 7 known fields — rejected as over-engineering.
- **`os.replace` + both-file-and-directory fsync.** POSIX guarantees atomic rename (`os.replace` on the same filesystem). Directory fsync ensures the rename reaches disk on ext4/XFS; macOS (APFS) doesn't strictly require it but does no harm.
- **Event bus: `asyncio.Queue` per subscriber, `put_nowait` on publish.** Simple, async-native, handles backpressure by dropping with a log warning (acceptable for progress events — they're advisory, not guaranteed). An AsyncIterator wraps the queue for clean iteration syntax.
- **SSE endpoint via `StreamingResponse`.** FastAPI's `EventSourceResponse` from `sse-starlette` is an alternative; `StreamingResponse` is stdlib-only and sufficient. Pick the latter for dependency minimalism.
- **Settings via `pydantic-settings`.** Already installed in Story 1.1's `pyproject.toml`. Use it.
- **`data_root` expansion at boot, not per-request.** Cache the resolved Path. Per-request expansion is an unnecessary allocation.
- **Stub at data root, not in a subdirectory yet.** Shelves (file-tree subdirectories) arrive in Story 7.x. Until then, every stub goes directly under `data_root`.
- **`created_at` in UTC with millisecond precision + `Z` suffix.** `datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")` — explicit + parse-friendly.

### File layout (story deliverables)

```
src/latestnews/
├─ __init__.py                             # unchanged
├─ __main__.py                             # unchanged
├─ app.py                                  # MODIFIED — include items + events routers; lifespan wires bus + settings
├─ settings/
│  └─ __init__.py                          # MODIFIED — Settings class + get_settings()
├─ fs/
│  ├─ __init__.py                          # unchanged (placeholder docstring)
│  └─ writer.py                            # NEW — atomic_write + write_item_stub + slugify
├─ events/
│  ├─ __init__.py                          # unchanged
│  ├─ bus.py                               # NEW
│  └─ types.py                             # NEW
├─ ingest/
│  ├─ __init__.py                          # unchanged
│  └─ coordinator.py                       # NEW — ingest_url + ingest_file
├─ api/
│  ├─ __init__.py                          # unchanged
│  ├─ health.py                            # unchanged (Story 1.1)
│  ├─ items.py                             # NEW
│  └─ events.py                            # NEW

tests/backend/
├─ __init__.py                             # unchanged
├─ test_health.py                          # unchanged
├─ fs/
│  ├─ __init__.py                          # NEW
│  └─ test_writer.py                       # NEW
├─ events/
│  ├─ __init__.py                          # NEW
│  └─ test_bus.py                          # NEW
└─ api/
   ├─ __init__.py                          # NEW
   ├─ test_items.py                        # NEW
   └─ test_events.py                       # NEW
```

Also modify:

- `pyproject.toml` — `uv add uuid-utils python-multipart pyyaml` (and verify `pydantic-settings` is still present from Story 1.1)
- `uv.lock`
- `AGENTS.md` — one bullet under "How to add an ingest plugin" pointing at `src/latestnews/ingest/coordinator.py`

### Previous-story intelligence (carry-over)

- **Branch strategy:** `dev` is integration, `main` is production. As of Story 2.2 start, `main` is at `362a722` (Story 2.1 merge commit). Pull `dev` (fast-forwarded to main) and start there.
- **Frontend contract (Story 2.1):** `postCaptureUrl` sends `POST /api/items` with `Content-Type: application/json` and body `{ url: string }`. `postCaptureFile` sends `multipart/form-data` with `file` + `source_type` form fields. `Content-Type` is **not** set manually on multipart (browser-managed boundary). The frontend treats any non-2xx as an error and preserves the input value.
- **FastAPI app factory (Story 1.1):** `src/latestnews/app.py` has `create_app() -> FastAPI`. The existing `_configure_cors` helper allows `http://localhost:5173` and `http://127.0.0.1:5173`. Story 2.2 adds the `items` + `events` routers to the factory and wires the lifespan.
- **Test harness (Story 1.1):** `tests/backend/test_health.py` uses `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")`. Reuse the pattern. `pytest-asyncio` is already configured via `asyncio_mode = "auto"` in `pyproject.toml`.
- **Biome** — doesn't touch Python. Ruff is the Python linter: the repo-root `npm run lint` script runs `uv run ruff check src tests`. Expect Ruff to flag a handful of style issues on first pass; auto-fix with `uv run ruff check --fix src tests`.
- **Mypy strict.** `mypy_path = "src"`, `packages = ["latestnews"]`. All new modules need complete type annotations. `uuid_utils` may need `# type: ignore[import-not-found]` on its import if no stubs are available — check and document in Dev Agent Record.
- **Python 3.12.** Use modern typing (`Path | None`, not `Optional[Path]`; `dict[str, Any]`, not `Dict[str, Any]`).
- **Structured logging — structlog.** Already in the dep tree from Story 1.1. Use `log = structlog.get_logger(__name__)` and emit structured events (`log.info("capture.received", item_id=..., source="url")`). Do **not** reach for the stdlib `logging` module.
- **No `print()` anywhere.** The architecture patterns rule — and Ruff will complain. structlog for everything.

### Library / version pins

- `uuid-utils@^0.11` (or whatever's latest on PyPI; uv.lock pins)
- `python-multipart@^0.0.9` (FastAPI requires this for multipart parsing)
- `pyyaml@^6` (frontmatter serialization)
- All others already present from Story 1.1: `fastapi`, `uvicorn`, `pydantic-settings`, `structlog`, `httpx`, `pytest`, `pytest-asyncio`, `ruff`, `mypy`.

### Known gotchas

- **`os.replace` vs `os.rename`.** `os.rename` fails if the target exists on Windows; `os.replace` is POSIX-semantic on every platform (overwrites). Use `os.replace` exclusively.
- **Directory fsync requires `os.open` on the directory itself**, not on a file inside. Open with `os.O_RDONLY` and close after `fsync`.
- **Windows filesystem semantics.** Directory fsync is a no-op on Windows (NTFS). CI runs on ubuntu-latest — Linux POSIX semantics apply. Don't write code that assumes Windows-specific behaviour.
- **FastAPI multipart requires `python-multipart`.** Without it, FastAPI raises at startup when any `File` / `Form` annotation appears. Add the dep before wiring the router.
- **Pydantic v2 body model vs `UploadFile`.** A single endpoint can't accept both a JSON body (pydantic model) and a multipart file via Depends on the same parameter. The handler signature takes raw `Request` and parses manually, branching on `Content-Type` — or splits into two internal helpers that each assume their shape.
- **UUID v7 in pydantic/JSON.** `uuid_utils.UUID` is a distinct type from stdlib `uuid.UUID`. Serialise to string explicitly (`str(uuid_utils.uuid7())`) when putting it in the JSON response or the YAML frontmatter — don't rely on pydantic's default UUID coercion.
- **SSE keep-alive.** Without a periodic ping, browsers / proxies can time out idle connections. For MVP we don't ship a ping loop — the frontend reconnects on timeout. Add a TODO comment at the generator.
- **`fsync` performance.** A full fsync on every capture is ~1–5 ms on SSD, ~10–30 ms on HDD. Within the ≤ 100 ms NFR-P1 budget. If a future story adds batch capture, consider coalescing fsyncs.
- **PyYAML `safe_dump` with unicode.** Add `allow_unicode=True` so accented titles don't turn into `\uXXXX` escapes. Also `default_flow_style=False` (block style).
- **PyYAML field order.** `safe_dump` on a `dict` preserves insertion order (Python 3.7+). Build the dict in the AC-required order; don't rely on `sort_keys=False` alone.
- **`tmp_path` fixture in pytest.** Gives each test its own directory. Use it for the data_root in `test_writer.py` and `test_items.py` so tests don't collide.
- **`httpx.AsyncClient` + SSE.** Regular `.get()` awaits the full response. For streaming SSE tests, use `client.stream(...)` to iterate the body. The `test_events.py` round trip has to publish-then-read carefully — use `asyncio.gather` or start the subscriber then publish after a short `await asyncio.sleep(0)`.
- **Ruff `E741` / mypy `any`.** Pre-emptively: avoid single-letter variable names (`i`, `e`); use `exc` for exceptions. Type all function signatures — strict mode will flag missing returns.
- **`File` vs `UploadFile` in FastAPI.** Use `UploadFile` — it's a wrapper around the streaming upload; `File(...)` is a Depends marker. `file: UploadFile = File(...)` is the idiomatic signature.
- **`UploadFile.read()` loads the whole file into memory.** 25MB is fine for MVP. Larger files should stream to disk — but we enforce a 25MB cap at the multipart parser via `Request(max_body_size=...)` or a `@app.middleware("http")` check. For this story, rely on FastAPI's defaults (no explicit cap) and document that the 25MB cap is aspirational — implement the enforcement in a later story if actual caps become necessary.

### Testing standards summary

- **Pytest + pytest-asyncio + httpx.AsyncClient + ASGITransport.** Same pattern as Story 1.1.
- **`tmp_path` fixture** for filesystem isolation.
- **`dependency_overrides`** to inject a test Settings with `data_root=tmp_path`.
- **No load tests yet.** Latency target is aspirational; measure in a future story once real-world capture flows exist.
- **Expected test count delta:** 1 (backend pre-2.2) → ~21 backend tests after 2.2 (+ 132 frontend unchanged). Target: 154 total.

### Project Structure Notes

Story 2.2 populates the `api/`, `events/`, `ingest/`, `fs/`, `settings/` subpackages that have been sitting as empty-docstring placeholders since Story 1.1. This is the architecture's intended fill — no conflicts detected.

### References

- Architecture — API contract: `!DOCS/planning-artifacts/architecture.md` § API → Capture
- Architecture — Data model (frontmatter): `!DOCS/planning-artifacts/architecture.md` § Data Model → Item File Format
- Architecture — Atomic writes: `!DOCS/planning-artifacts/architecture.md` § Filesystem Subsystem → Atomic Writes
- Architecture — Event bus: `!DOCS/planning-artifacts/architecture.md` § Event Bus
- Architecture — Package layout: `!DOCS/planning-artifacts/architecture.md` § Project Structure & Boundaries
- UX — Capture flow (backend visibility): `!DOCS/planning-artifacts/ux-design-specification.md` § Capture & Ingest Flow
- PRD — FR1/FR2/FR4/FR5/FR6, NFR-P1/R1/R3/S1/S2/Q6: `!DOCS/planning-artifacts/prd.md`
- Epics — Story 2.2: `!DOCS/planning-artifacts/epics.md` § Epic 2 → Story 2.2
- Story 2.1 (frontend contract): `!DOCS/implementation-artifacts/2-1-dashboard-capture-input-and-drag-drop-zone.md`
- UUIDv7 RFC: <https://datatracker.ietf.org/doc/rfc9562/>
- `uuid_utils`: <https://pypi.org/project/uuid-utils/>

## Dev Agent Record

### Agent Model Used

(to be filled by dev-story run)

### Debug Log References

### Completion Notes List

### File List

### Change Log
