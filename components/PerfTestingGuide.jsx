'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Gauge, TrendingUp, Zap, Activity, ShieldCheck,
  Terminal, Code2, CheckCircle2, AlertTriangle, Clock,
  Server, Cpu, HardDrive, LineChart, Eye, Rocket,
  FlaskConical, Layers, ArrowRight, Waves,
} from 'lucide-react';

// ─── Test Types ───────────────────────────────────────────────────────────────

const TEST_TYPES = [
  {
    id: 'load',
    label: 'Load',
    icon: Gauge,
    accent: '#facc15',
    colorClass: 'text-yellow-400',
    borderActive: 'border-yellow-400',
    bgActive: 'bg-yellow-400/10',
    tagline: 'Normal traffic · baseline',
    question: 'Does it keep its promises on an ordinary day?',
    what: 'Reproduce expected production load, prove your SLOs hold, and create a baseline every future run compares against.',
    shape: [[0,58],[30,12],[170,12],[200,58]],
    phases: [
      { label: 'Ramp up', w: 'w-[15%]', dim: false },
      { label: 'Hold at avg load', w: 'w-[70%]', dim: false },
      { label: 'Ramp down', w: 'w-[15%]', dim: true },
    ],
    stats: [
      { num: '100%', desc: 'of avg production traffic' },
      { num: 'p95 < 500ms', desc: 'typical latency SLO' },
      { num: '< 1%', desc: 'error rate target' },
    ],
    bullets: [
      'Derive target from real traffic analytics — not guesswork.',
      'Hold long enough to surface GC pressure and cache churn.',
      'Vary request data to defeat caches and memoisation.',
    ],
    watch: ['p95/p99 latency drift during the plateau', 'CPU and memory staying flat (creeping = leak)', 'Latency bump at ramp start (cold connection pools)'],
    code: `stages: [
  { duration: '2m',  target: 200 },  // ramp to normal load
  { duration: '15m', target: 200 },  // hold — baseline window
  { duration: '2m',  target: 0   },  // ramp down
],
thresholds: {
  http_req_failed:   ['rate<0.01'],
  http_req_duration: ['p(99)<100'],
}`,
    observed: 'A .NET API on a Raspberry Pi 2 (900 MHz, 1 GB) held 200 req/s at under 20% CPU and passed a 100 ms p99 threshold.',
  },
  {
    id: 'stress',
    label: 'Stress',
    icon: TrendingUp,
    accent: '#fb923c',
    colorClass: 'text-orange-400',
    borderActive: 'border-orange-400',
    bgActive: 'bg-orange-400/10',
    tagline: 'Beyond capacity · find the ceiling',
    question: 'Where is the ceiling, and how does it fail?',
    what: 'Push past normal load in steps until the system degrades — learn its breaking point and whether failure is a cliff or graceful saturation.',
    shape: [[0,58],[20,48],[60,38],[100,28],[140,18],[200,18]],
    phases: [
      { label: 'Baseline', w: 'w-[10%]', dim: true },
      { label: 'Step ↑', w: 'w-[20%]', dim: false },
      { label: 'Step ↑', w: 'w-[20%]', dim: false },
      { label: 'Step ↑', w: 'w-[20%]', dim: false },
      { label: 'Ceiling (no ramp-down)', w: 'w-[30%]', dim: false },
    ],
    stats: [
      { num: '2×–10×', desc: 'above normal load' },
      { num: 'No ramp-down', desc: 'run until it breaks' },
      { num: '1 variable', desc: 'change at a time' },
    ],
    bullets: [
      'Never ramp down — stop when a threshold fires or the system collapses.',
      'Hold each step long enough to rule out one-second flukes.',
      'Raise one variable at a time so the bottleneck is attributable.',
    ],
    watch: ['Exact VU/RPS where latency stops tracking throughput (queueing begins)', 'Cliff failure (errors explode) vs graceful degradation', 'Which resource saturates: CPU, memory, connection pool, or a lock'],
    code: `// 200 → 1,000 req/s in steps, no ramp-down
stages: [
  { duration: '1m', target: 200  },
  { duration: '5m', target: 400  },
  { duration: '5m', target: 600  },
  { duration: '5m', target: 800  },
  { duration: '5m', target: 1000 },
]`,
    observed: 'Same Pi: 200 req/s ≈ 20% CPU, 800 req/s ≈ 45%, 1,000 req/s ≈ 50%+ — latency was higher but the service kept responding.',
  },
  {
    id: 'spike',
    label: 'Spike',
    icon: Zap,
    accent: '#f87171',
    colorClass: 'text-red-400',
    borderActive: 'border-red-400',
    bgActive: 'bg-red-400/10',
    tagline: 'Sudden burst · recovery speed',
    question: 'Can it absorb a front-page-of-HN moment?',
    what: 'Fire a sudden short burst far above baseline, then measure how fast the system recovers once the burst drops.',
    shape: [[0,52],[70,52],[90,8],[120,8],[140,52],[200,52]],
    phases: [
      { label: 'Baseline', w: 'w-[25%]', dim: true },
      { label: 'Spike', w: 'w-[15%]', dim: false },
      { label: 'Hold', w: 'w-[10%]', dim: false },
      { label: 'Drop', w: 'w-[5%]', dim: true },
      { label: 'Recovery', w: 'w-[45%]', dim: true },
    ],
    stats: [
      { num: '5×–20×', desc: 'baseline, near-instantaneous' },
      { num: 'Memory', desc: 'spikes highest of all 4 types' },
      { num: 'Recovery', desc: 'read as carefully as the spike' },
    ],
    bullets: [
      'Establish a baseline first — without it you can\'t isolate the spike behaviour.',
      'Jump to peak almost instantly, hold briefly, then drop straight back.',
      'Triggered by: product launches, viral posts, marketing blasts, mis-timed cron jobs.',
    ],
    watch: ['Time to recover after the drop — queue drain, stuck threads', 'Whether autoscaling absorbs it before timeouts fire', 'Memory usage — frequently the highest you\'ll ever see'],
    code: `stages: [
  { duration: '2m', target: 200  },   // baseline
  { duration: '5s', target: 2000 },   // instant spike
  { duration: '2m', target: 2000 },   // hold
  { duration: '5s', target: 200  },   // drop
  { duration: '2m', target: 200  },   // observe recovery
]`,
    observed: 'At 2,000 req/s the Pi hit very high CPU, memory far above every other test type, and p95 latency reached 101 ms — a 100 ms threshold would have failed this run.',
    alert: 'Never run against production. This test deliberately pushes a system to its limits.',
  },
  {
    id: 'soak',
    label: 'Soak',
    icon: Clock,
    accent: '#60a5fa',
    colorClass: 'text-blue-400',
    borderActive: 'border-blue-400',
    bgActive: 'bg-blue-400/10',
    tagline: 'Hours of load · find slow leaks',
    question: 'Does it still behave after hours of traffic?',
    what: 'Hold steady load for 1–8 hours to expose degradation that only shows up over time: memory leaks, connection exhaustion, log disk growth.',
    shape: [[0,58],[15,12],[185,12],[200,58]],
    phases: [
      { label: 'Ramp up', w: 'w-[5%]', dim: true },
      { label: 'Sustain (1h – 8h)', w: 'w-[90%]', dim: false },
      { label: 'Ramp down', w: 'w-[5%]', dim: true },
    ],
    stats: [
      { num: '1h – 8h', desc: 'typical duration' },
      { num: '~100%', desc: 'of avg load — duration is the variable' },
      { num: 'Memory', desc: 'that climbs and never comes back' },
    ],
    bullets: [
      'Duration is the variable under test, not intensity — match normal load.',
      'Use k6 duration strings: 30m, 1h, 2h30m — not seconds.',
      'Raise load slightly if you need to see exhaustion faster than 8 hours.',
    ],
    watch: ['Memory that climbs and never comes back down', 'File-handle and connection count growth over time', 'Third-party rate limits and quota errors after hours of requests'],
    code: `stages: [
  { duration: '2m', target: 200 },   // ramp up
  { duration: '8h', target: 200 },   // sustain
  { duration: '2m', target: 0   },   // ramp down
]`,
    observed: 'Identical shape to a load test — just stretched. 30 minutes of load testing is never enough to judge stability.',
  },
];

// ─── k6 concepts ─────────────────────────────────────────────────────────────

const ANATOMY = [
  { icon: Layers,       term: 'Virtual Users (VUs)', detail: 'Parallel workers that each loop through your default function — one request at a time. 100 VUs ≈ 100 concurrent users.' },
  { icon: Clock,        term: 'sleep(1)', detail: 'Without sleep, VUs generate maximum possible load. sleep(1) gives ≈ 1 req/s per VU — the honest way to simulate N concurrent users.' },
  { icon: LineChart,    term: 'Stages', detail: 'The traffic shape over time. Same script, different stages = load test, stress test, spike test, or soak test.' },
  { icon: FlaskConical, term: 'Varied test data', detail: 'Put payloads in an array and pick randomly per iteration. Identical requests let caches flatter your numbers.' },
  { icon: CheckCircle2, term: 'Checks', detail: 'Assert correctness during the run. A fast 500 still counts as a failure — latency alone would call it a pass.' },
  { icon: ShieldCheck,  term: 'Thresholds', detail: 'Encode pass/fail SLOs into the test. k6 exits non-zero so CI/CD blocks a regression before it ships.' },
];

const METRICS = [
  { metric: 'http_req_duration', label: 'Latency',     note: 'Read p95/p99 — averages hide exactly the users having a bad time.' },
  { metric: 'http_req_failed',   label: 'Error rate',  note: 'Sharpest single signal that the system is past its limit.' },
  { metric: 'http_reqs',         label: 'Throughput',  note: 'Compare achieved vs target — the gap tells you where the time went.' },
  { metric: 'checks',            label: 'Check rate',  note: 'Functional pass rate under load — behaviour that only degrades at concurrency.' },
  { metric: 'dropped_iterations',label: 'Dropped',     note: 'k6 could not start iterations on time — the generator, not your app, is the bottleneck.' },
  { metric: 'CPU / memory',      label: 'System',      note: 'Flat under steady load is healthy. Creeping is a leak in waiting.' },
];

const QUICK_INSTALL = `brew install k6                        # macOS
choco install k6                        # Windows (Chocolatey)
docker run --rm -i grafana/k6:latest    # Docker — no install needed

k6 run test.js                          # run a script
k6 run --out json=result.json test.js   # save raw metrics`;

const MINIMAL_SCRIPT = `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 200 },   // ramp up
    { duration: '5m',  target: 200 },   // hold
    { duration: '30s', target: 0   },   // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],    // < 1% errors
    http_req_duration: ['p(99)<100'],    // p99 under 100 ms
  },
};

export default function () {
  const res = http.get('https://api.example.com/');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}`;

// ─── Shape SVG ────────────────────────────────────────────────────────────────

function ShapeSVG({ points, accent }) {
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ');
  const area = [
    ...points.map(([x, y]) => `${x},${y}`),
    `${points[points.length - 1][0]},62`,
    `${points[0][0]},62`,
  ].join(' ');
  const id = `sg${accent.replace('#', '')}`;
  return (
    <svg viewBox="0 0 200 64" className="w-full h-20" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40].map(y => (
        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={accent} />
      ))}
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PerfTestingGuide() {
  const [activeId, setActiveId] = useState('load');
  const t = TEST_TYPES.find(x => x.id === activeId);
  const Icon = t.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-14">

      {/* ── Section heading ───────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-mono shadow-glow-sm">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Performance Testing Reference</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Four ways to stress-test your API <span className="text-yellow-400">on purpose</span>
        </h2>
        <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
          Load, stress, spike, and soak testing each answer a different question. Here's what each one does, how to shape the traffic, and what numbers to watch.
        </p>
      </div>

      {/* ── Why bother? ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel icon={ShieldCheck} text="Why performance testing?" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, kind: 'Functional', tag: 'Right answer, one at a time',  detail: "Unit & integration tests verify correctness. They're deterministic and run against a handful of calls — they tell you the endpoint is correct, not how it behaves at 5,000 req/s." },
            { icon: ShieldCheck,  kind: 'Non-functional', tag: 'Quality under pressure',   detail: "Security, reliability, scalability, performance. These can't be asserted with pass/fail unit tests — they need a system under realistic pressure to become measurable." },
            { icon: Activity,     kind: 'Performance', tag: 'Load, latency, limits',       detail: 'Latency at your target load, sustainable throughput, error rate under stress, and the exact point where the system gives way.' },
          ].map(({ icon: I, kind, tag, detail }) => (
            <div key={kind} className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-5 space-y-2.5 hover:border-yellow-400/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400"><I className="w-5 h-5" /></div>
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">{tag}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{kind}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.04] p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-300 leading-relaxed">
            <span className="text-yellow-400 font-semibold">The gap that matters — </span>
            Unit suites stay green while a service falls over at 200 req/s. Functional correctness tells you the answer is right; performance testing tells you whether you can keep answering at the rate real users ask.
          </p>
        </div>
      </section>

      {/* ── Four test types ───────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionLabel icon={Zap} text="The four test types" />

        {/* Tab row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEST_TYPES.map(type => {
            const TI = type.icon;
            const on = type.id === activeId;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveId(type.id)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  on ? `${type.bgActive} ${type.borderActive} text-white shadow-glow-sm` : 'bg-dark-900 border-dark-800 text-zinc-400 hover:border-dark-700 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TI className={`w-4 h-4 ${on ? type.colorClass : 'text-zinc-500'}`} />
                  <span className={`text-sm font-bold ${on ? type.colorClass : 'text-zinc-300'}`}>{type.label}</span>
                </div>
                <span className="block text-[11px] text-zinc-500 leading-snug">{type.tagline}</span>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 sm:p-8 space-y-6">

          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl mt-0.5" style={{ backgroundColor: `${t.accent}18` }}>
              <Icon className="w-5 h-5" style={{ color: t.accent }} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{t.label} Test</h4>
              <p className="text-sm font-mono mt-0.5" style={{ color: t.accent }}>{t.question}</p>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1.5 max-w-2xl">{t.what}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left col: shape + stats + phases */}
            <div className="lg:col-span-2 space-y-4">

              {/* Shape */}
              <div className="rounded-xl bg-black border border-dark-800 p-4 space-y-2">
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Traffic shape over time</p>
                <ShapeSVG points={t.shape} accent={t.accent} />
                {/* Phase bar */}
                <div className="flex w-full h-5 rounded overflow-hidden gap-px mt-1">
                  {t.phases.map((p, i) => (
                    <div
                      key={i}
                      className={`${p.w} flex items-center justify-center text-[9px] font-mono font-bold text-black truncate px-1 transition-all`}
                      style={{ backgroundColor: t.accent, opacity: p.dim ? 0.45 : 0.9 }}
                    >
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-3 gap-2">
                {t.stats.map((s, i) => (
                  <div key={i} className="bg-black border border-dark-800 rounded-xl p-3 text-center space-y-0.5">
                    <div className="text-base font-black font-mono leading-none" style={{ color: t.accent }}>{s.num}</div>
                    <div className="text-[10px] text-zinc-500 leading-snug">{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Alert */}
              {t.alert && (
                <div className="flex items-start gap-2.5 p-3 bg-red-950/30 border border-red-800/40 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{t.alert}</p>
                </div>
              )}
            </div>

            {/* Right col: bullets, watch, code */}
            <div className="lg:col-span-3 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* How */}
                <div className="rounded-xl border border-white/[0.06] bg-dark-850/60 p-4 space-y-2">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">How to run it</p>
                  <ul className="space-y-1.5">
                    {t.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                        <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: t.accent }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Watch */}
                <div className="rounded-xl border border-white/[0.06] bg-dark-850/60 p-4 space-y-2">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">What to watch</p>
                  <ul className="space-y-1.5">
                    {t.watch.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                        <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: t.accent }} />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* k6 stage definition */}
              <div className="rounded-xl bg-black border border-dark-800 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                  <Code2 className="w-3 h-3" /> k6 stage definition
                </div>
                <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                  <code>{t.code}</code>
                </pre>
              </div>

              {/* Observed */}
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] p-4 flex items-start gap-2.5">
                <Waves className="w-3.5 h-3.5 text-yellow-400/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-mono text-yellow-400/70 uppercase tracking-wider mb-1">Observed in practice</p>
                  <p className="text-xs text-zinc-300 leading-relaxed">{t.observed}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── k6 anatomy ────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionLabel icon={Code2} text="Anatomy of a k6 test" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Code */}
          <div className="rounded-2xl border border-white/[0.08] bg-black p-5 overflow-hidden">
            <div className="flex items-center gap-1.5 pb-3 border-b border-dark-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-2 text-[11px] font-mono text-zinc-600">load-test.js</span>
            </div>
            <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed pt-3">
              <code>{MINIMAL_SCRIPT}</code>
            </pre>
          </div>

          {/* Concept cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ANATOMY.map(({ icon: I, term, detail }) => (
              <div key={term} className="rounded-xl border border-white/[0.08] bg-dark-900/80 p-4 space-y-1.5 hover:border-yellow-400/30 transition-all">
                <div className="flex items-center gap-2">
                  <I className="w-3.5 h-3.5 text-yellow-400" />
                  <h4 className="text-xs font-bold text-white font-mono">{term}</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ───────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionLabel icon={Activity} text="The numbers that matter" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {METRICS.map(({ metric, label, note }) => (
            <div key={metric} className="rounded-xl border border-white/[0.08] bg-dark-900/80 p-4 space-y-1.5 hover:border-yellow-400/30 transition-all">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-yellow-400">{metric}</code>
                <span className="text-[10px] font-mono text-zinc-600 uppercase">{label}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick start ───────────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionLabel icon={Terminal} text="Start from the terminal" />
        <div className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-5 sm:p-6 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            k6 is a free, scriptable load generator written in JavaScript — a handful of lines gets you a running test, and no code changes are needed to move between test types. Benchley wraps the same engine with live telemetry, SLO gates, and run comparison.
          </p>
          <pre className="text-[11px] font-mono text-zinc-300 bg-black border border-dark-800 rounded-xl p-4 overflow-x-auto leading-relaxed">
            <code>{QUICK_INSTALL}</code>
          </pre>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-glow-sm transition-all"
            >
              Run your first test in Benchley
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://grafana.com/docs/k6/latest/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] transition-all"
            >
              k6 documentation ↗
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

function SectionLabel({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-yellow-400" />
      <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">{text}</h3>
    </div>
  );
}
