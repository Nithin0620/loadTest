# LoadCheck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build **LoadCheck**, a fullstack load-testing platform with Next.js (Pure JavaScript / JSX), Tailwind CSS (Black & Yellow aesthetic), Mongoose/MongoDB persistence, and a live k6 execution engine with real-time SSE streaming metrics, reports, and run comparisons.

**Architecture:** A unified fullstack Next.js application where API route handlers orchestrate k6 child processes, aggregate 1-second rolling metric windows, broadcast telemetry over Server-Sent Events, persist test definitions and benchmarks into MongoDB via Mongoose, and render live cyber-styled React dashboards.

**Tech Stack:** Next.js (App Router, JS/JSX), Tailwind CSS, Lucide React, Recharts, Framer Motion, Mongoose / MongoDB, k6 CLI engine, Jest / Node Test runner.

**Spec:** [`docs/superpowers/specs/2026-09-27-loadcheck-design.md`](file:///home/nithin/Projects/loadTest/docs/superpowers/specs/2026-09-27-loadcheck-design.md)

## Global Constraints

- Platform: Linux (x86_64)
- Language: Pure JavaScript (.js / .jsx) — no TypeScript compilation layer
- Theme: Black background (`#050505` / `#0d0d0d`), Electric/Amber Yellow accents (`#FACC15`, `#EAB308`, `#FFE600`), Emerald green (`#10B981`) for 2xx, Ruby red (`#EF4444`) for errors
- Engine: Grafana k6 binary execution via `child_process.spawn`
- Database: Mongoose with automatic connection resilience and support for custom `MONGODB_URI`
- Phased Workflow: Each phase ends with validation tests and a git commit before moving to the next.

---

### Phase 1: Project Scaffolding, Theme & Database Foundation

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `app/globals.css`
- Create: `lib/db/mongoose.js`
- Create: `models/TestConfig.js`
- Create: `models/TestRun.js`
- Create: `tests/db.test.js`

**Interfaces:**
- `connectToDatabase()` $\rightarrow$ `Promise<Mongoose>`
- `TestConfig` Mongoose Model
- `TestRun` Mongoose Model

- [ ] **Step 1: Create package.json with dependencies**
  Install Next.js, React, Tailwind CSS, Mongoose, Lucide React, Recharts, Framer Motion, Jest, and supporting utilities.

- [ ] **Step 2: Configure Tailwind with custom Black & Yellow palette and animations**
  Setup `tailwind.config.js`, `postcss.config.js`, and `app/globals.css` with custom glow shadows, yellow accents, and dark background tokens.

- [ ] **Step 3: Implement resilient Mongoose connection manager (`lib/db/mongoose.js`)**
  Cached connection handler supporting standard `MONGODB_URI` and fallback in-memory MongoDB for local zero-config setups.

- [ ] **Step 4: Implement Mongoose schemas (`models/TestConfig.js`, `models/TestRun.js`)**
  Implement the exact schemas from the spec with validation rules, timestamps, and indexes.

- [ ] **Step 5: Write and run DB connection & model unit tests**
  Verify connection, schema creation, validation, and querying.

- [ ] **Step 6: Commit Phase 1 deliverable**
  `git commit -m "feat(core): setup Next.js project, black-yellow theme, and Mongoose models"`

---

### Phase 2: k6 Script Generator, cURL Parser & Execution Engine

**Files:**
- Create: `lib/k6/curlParser.js`
- Create: `lib/k6/generator.js`
- Create: `lib/k6/eventBus.js`
- Create: `lib/k6/runner.js`
- Create: `scripts/ensure-k6.js`
- Create: `tests/k6-generator.test.js`
- Create: `tests/curl-parser.test.js`

**Interfaces:**
- `parseCurlCommand(curlString)` $\rightarrow$ `Object { targetUrl, httpMethod, headers, auth, bodyType, bodyContent }`
- `generateK6Script(config, runId)` $\rightarrow$ `String` (Valid executable ES6 k6 test script)
- `runK6Test(testRunId, config)` $\rightarrow$ `Promise<Object>` (Final aggregated summary)
- `cancelK6Test(testRunId)` $\rightarrow$ `Boolean`
- `k6EventBus`: EventEmitter emitting `'tick'` and `'done'` events keyed by `runId`.

- [ ] **Step 1: Implement cURL Command Parser (`lib/k6/curlParser.js`)**
  Parse flags: `-X`, `--request`, `-H`, `--header`, `-d`, `--data`, `--data-raw`, `-u`, `--user`, `--compressed`, URLs.

- [ ] **Step 2: Implement k6 Dynamic Script Generator (`lib/k6/generator.js`)**
  Support constant VUs, ramping stages, target RPS scenarios, headers, auth, JSON bodies, custom check thresholds, and `handleSummary` export.

- [ ] **Step 3: Implement k6 Binary Downloader & Manager (`scripts/ensure-k6.js`)**
  Ensure a valid `k6` binary exists (checks system `$PATH` or auto-downloads official standalone binary to `bin/k6`).

- [ ] **Step 4: Implement Process Runner & NDJSON Metric Parser (`lib/k6/runner.js`)**
  Spawns k6 process, parses output line-by-line, aggregates 1-second rolling metrics, emits events to `eventBus`, updates MongoDB `TestRun` on exit, handles graceful cancellation.

- [ ] **Step 5: Write unit tests for cURL parser and k6 generator**
  Run test suite and verify all variations (GET, POST with JSON, Bearer auth, Ramping stages).

- [ ] **Step 6: Commit Phase 2 deliverable**
  `git commit -m "feat(engine): add k6 script generator, curl parser, and realtime runner"`

---

### Phase 3: Core API Endpoints & Mock Target

**Files:**
- Create: `app/api/runs/route.js` (POST to create & start, GET to list recent runs)
- Create: `app/api/runs/[id]/route.js` (GET run details & metrics)
- Create: `app/api/runs/[id]/stream/route.js` (GET SSE stream)
- Create: `app/api/runs/[id]/cancel/route.js` (POST cancel run)
- Create: `app/api/runs/compare/route.js` (GET diff between run1 and run2)
- Create: `app/api/mock-target/route.js` (Mock target for latency & error testing)
- Create: `tests/api.test.js`

**Interfaces:**
- `POST /api/runs`: body `{ targetUrl, httpMethod, loadProfile, ... }` $\rightarrow$ `{ runId, status: 'running' }`
- `GET /api/runs/[id]`: returns `TestRun` document
- `GET /api/runs/[id]/stream`: SSE endpoint (`text/event-stream`)
- `POST /api/runs/[id]/cancel`: returns `{ success: true }`
- `GET /api/runs/compare?run1=ID&run2=ID`: returns `{ runA, runB, delta }`

- [ ] **Step 1: Implement Mock Target API (`app/api/mock-target/route.js`)**
  Allows simulating configurable response delays (e.g. `?delay=50`) and status codes (e.g. `?status=200`).

- [ ] **Step 2: Implement Run Creation & List Route (`app/api/runs/route.js`)**
  Validates config limits (max 1000 VUs, max 300s duration), creates `TestRun`, spawns `runK6Test` asynchronously.

- [ ] **Step 3: Implement SSE Telemetry Stream Route (`app/api/runs/[id]/stream/route.js`)**
  Streams live 1-second `tick` packets and final `done` or `error` packets over HTTP SSE.

- [ ] **Step 4: Implement Run Details, Cancellation & Comparison API Routes**
  Build `/api/runs/[id]`, `/api/runs/[id]/cancel`, and `/api/runs/compare`.

- [ ] **Step 5: Run integration tests on API routes against Mock Target**
  Verify full test lifecycle: spawn $\rightarrow$ stream $\rightarrow$ completion $\rightarrow$ saved summary in DB.

- [ ] **Step 6: Commit Phase 3 deliverable**
  `git commit -m "feat(api): implement REST endpoints, SSE stream route, and mock target"`

---

### Phase 4: Frontend UI - Dashboard, Test Creator & cURL Importer

**Files:**
- Create: `app/layout.jsx`
- Create: `components/Navbar.jsx`
- Create: `components/CurlImportModal.jsx`
- Create: `components/QuickTestForm.jsx`
- Create: `components/AdvancedConfigTabs.jsx`
- Create: `components/RecentRunsTable.jsx`
- Create: `app/page.jsx`

- [ ] **Step 1: Build Root Layout and Navigation (`app/layout.jsx`, `components/Navbar.jsx`)**
  Sleek dark layout, brand logo `LoadCheck ⚡` with amber lightning, navigation links, and DB status badge.

- [ ] **Step 2: Build cURL Import Modal (`components/CurlImportModal.jsx`)**
  Interactive dialog where users paste a `curl` string and instantly preview parsed target, method, headers, and body.

- [ ] **Step 3: Build Test Configuration Form (`components/QuickTestForm.jsx`, `components/AdvancedConfigTabs.jsx`)**
  Clean URL bar, HTTP method badges, VU slider, Duration picker, Ramping stages editor, Headers table, JSON body editor with formatting.

- [ ] **Step 4: Build Recent Runs History Table (`components/RecentRunsTable.jsx`)**
  List past runs with status badges (green/yellow/red), target URL, p95 latency, peak RPS, timestamp, and 1-click re-test.

- [ ] **Step 5: Wire up Main Dashboard (`app/page.jsx`)**
  Integrate forms, cURL modal, recent runs, and navigation to live test on submit.

- [ ] **Step 6: Commit Phase 4 deliverable**
  `git commit -m "feat(ui): build dashboard, test configuration form, and cURL importer"`

---

### Phase 5: Frontend UI - Live Execution Screen with SSE Telemetry

**Files:**
- Create: `components/live/MetricGauge.jsx`
- Create: `components/live/LiveLineChart.jsx`
- Create: `components/live/StatusCodeBar.jsx`
- Create: `components/live/ProgressBar.jsx`
- Create: `app/runs/[id]/page.jsx`

- [ ] **Step 1: Build Live Speedometer & Metric Counters (`components/live/MetricGauge.jsx`)**
  Electric yellow live RPS gauge and active VUs counter with smooth animations.

- [ ] **Step 2: Build Real-time Multi-metric Timeline (`components/live/LiveLineChart.jsx`)**
  Recharts live line chart rendering rolling RPS and p95 latency curves.

- [ ] **Step 3: Build HTTP Status Distribution & Progress Bar (`components/live/StatusCodeBar.jsx`, `components/live/ProgressBar.jsx`)**
  Real-time 2xx/4xx/5xx pills and remaining time progress countdown.

- [ ] **Step 4: Build Live Test Page (`app/runs/[id]/page.jsx`)**
  Connects to `/api/runs/[id]/stream` via `EventSource`, updates state on every tick, handles "Emergency Stop" button, and auto-navigates to Report on completion.

- [ ] **Step 5: Validate Live UI with a live test against mock target**
  Run test and verify smooth SSE live updates without UI stutter.

- [ ] **Step 6: Commit Phase 5 deliverable**
  `git commit -m "feat(ui): implement live telemetry dashboard with real-time SSE stream"`

---

### Phase 6: Frontend UI - Performance Report & Run Comparison Diff

**Files:**
- Create: `components/report/Scorecard.jsx`
- Create: `components/report/PercentileChart.jsx`
- Create: `components/report/CapacityAssessmentCard.jsx`
- Create: `app/runs/[id]/report/page.jsx`
- Create: `app/compare/page.jsx`

- [ ] **Step 1: Build Report Scorecard & Capacity Assessment Card**
  Display Total Requests, Success Rate %, p95/p99 Latency, Peak RPS, and auto-generated capacity summary.

- [ ] **Step 2: Build Detailed Percentile Charts & Response Breakdown**
  Render latency distribution (min, p50, p90, p95, p99, max) and status breakdown.

- [ ] **Step 3: Build Report Page (`app/runs/[id]/report/page.jsx`)**
  Assemble report view with Re-run, Compare, and Export JSON actions.

- [ ] **Step 4: Build Run Comparison View (`app/compare/page.jsx`)**
  Side-by-side run selection dropdowns, metric diff matrix with green/red $\Delta$ badges, and overlaid latency/throughput curves.

- [ ] **Step 5: Validate Report & Comparison views**
  Verify accurate rendering of single report and comparison diffs.

- [ ] **Step 6: Commit Phase 6 deliverable**
  `git commit -m "feat(ui): build performance report view and side-by-side run comparison diff"`

---

### Phase 7: End-to-End System Verification & Polish

**Files:**
- Create/Update: `README.md`
- Test: Full End-to-End Test Suite

- [ ] **Step 1: Run comprehensive end-to-end integration test suite**
- [ ] **Step 2: Verify production Next.js build (`npm run build`)**
- [ ] **Step 3: Polish visual aesthetics, glowing effects, and responsive breakpoints**
- [ ] **Step 4: Document setup, CLI runner, and architecture in README.md**
- [ ] **Step 5: Final Git Commit**
  `git commit -m "feat(release): finalize LoadCheck v1.0 with complete documentation"`
