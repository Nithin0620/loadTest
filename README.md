# LoadCheck ⚡

> **Developer-Centric HTTP Load Testing Platform**  
> Powered by Next.js, Mongoose/MongoDB, and Grafana k6 with real-time SSE telemetry.

---

## ⚡ Overview

**LoadCheck** provides an intuitive, high-velocity interface for running professional load tests against HTTP and HTTPS APIs without wrestling with complex test scripts or heavy enterprise tools. 

Under the hood, LoadCheck compiles user test configurations into high-performance **k6** scripts, executes them via isolated processes, streams live second-by-second performance metrics (RPS, active VUs, latency percentiles, status codes) directly to the browser using Server-Sent Events (SSE), and stores complete benchmark records in MongoDB.

---

## 🚀 Key Features

- **Cyberpunk Black & Yellow UI**: High-contrast, dark-mode first design with glowing accents and smooth micro-animations.
- **k6 Execution Engine**: Leverages Grafana k6 for sub-millisecond precision and low-overhead load generation.
- **cURL Quick Import**: Paste any raw `curl` command to instantly populate target endpoint, method, headers, auth tokens, and payload.
- **Multiple Load Distribution Modes**:
  - **Constant VUs**: Fixed virtual user concurrency over time.
  - **Ramp-up / Breakpoint Stages**: Incrementally increase load over stages to discover breaking points.
  - **Target Throughput (RPS)**: Generate precise fixed requests-per-second traffic.
- **Real-Time Telemetry Stream**: Live RPS speedometer gauge, active VUs meter, rolling latency sparklines (p50/p90/p95/p99), and live HTTP status distribution ticker (2xx, 4xx, 5xx).
- **Automated Capacity & Diagnostics Assessment**: Automatically detects breaking points and computes safe observed capacity.
- **Side-by-Side Run Comparison**: Compare any two benchmark runs with green/red $\Delta$ difference pills.
- **Shareable Reports & JSON Export**: 1-click JSON export and shareable permalinks.
- **Zero-Config Database**: Works out of the box with in-memory MongoDB for development or standard `MONGODB_URI` connection strings for production.

---

## 🛠️ Architecture

```
                 LOADCHECK UI (Next.js / Tailwind)
                                │
                                ▼
                       NEXT.JS API ROUTES
                    (MongoDB / Mongoose CRUD)
                                │
                                ▼
                       k6 SCRIPT GENERATOR
                                │
                                ▼
                    k6 RUNNER (child_process)
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
              Target Endpoint       1s NDJSON Aggregator
                                           │
                                           ▼
                                    SSE Telemetry Stream
                                           │
                                           ▼
                                  Live React Dashboard
```

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- (Optional) MongoDB instance (if not provided, an embedded in-memory MongoDB is automatically created)
- (Optional) `k6` binary (if not installed on your system, LoadCheck will auto-download the official release into `./bin/k6`)

### 2. Installation
```bash
git clone https://github.com/Nithin0620/loadTest.git
cd loadTest
npm install
```

### 3. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## ⚙️ Environment Variables (Optional)

Create a `.env.local` file to connect to an external MongoDB instance:

```env
MONGODB_URI=mongodb://localhost:27017/loadcheck
```

---

## 🛡️ Safety & Guardrails
- **Max VUs**: 1,000 Concurrent Virtual Users
- **Max Duration**: 300 seconds (5 minutes)
- **Max Target RPS**: 2,500 RPS
- **Identification Header**: Outbound requests automatically carry `User-Agent: LoadCheck-Engine/1.0 (+https://github.com/Nithin0620/loadTest)`