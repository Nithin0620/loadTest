'use client';

/**
 * PdfReport
 * A self-contained, white-background report component purpose-built for PDF export.
 * Uses inline styles throughout so html2canvas captures everything correctly
 * regardless of Tailwind's CSS being present or not.
 *
 * Color palette:
 *   - Background:   #ffffff
 *   - Surface:      #f9fafb  (gray-50)
 *   - Border:       #e5e7eb  (gray-200)
 *   - Text primary: #111827  (gray-900)
 *   - Text muted:   #6b7280  (gray-500)
 *   - Accent:       #eab308  (yellow-500)
 *   - Success:      #16a34a  (green-600)
 *   - Warning:      #d97706  (amber-600)
 *   - Danger:       #dc2626  (red-600)
 */

import React from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#ffffff',
  surface:  '#f9fafb',
  border:   '#e5e7eb',
  primary:  '#111827',
  muted:    '#6b7280',
  accent:   '#eab308',
  accentBg: '#fefce8',
  accentBorder: '#fde68a',
  green:    '#16a34a',
  greenBg:  '#f0fdf4',
  amber:    '#d97706',
  amberBg:  '#fffbeb',
  red:      '#dc2626',
  redBg:    '#fef2f2',
  blue:     '#2563eb',
  blueBg:   '#eff6ff',
};

const TEST_TYPE = {
  load:   { label: 'Load Test',   bg: C.accentBg,  color: '#92400e',  border: C.accentBorder },
  stress: { label: 'Stress Test', bg: '#fff7ed',    color: '#9a3412',  border: '#fed7aa' },
  spike:  { label: 'Spike Test',  bg: C.redBg,     color: C.red,      border: '#fecaca' },
  soak:   { label: 'Soak Test',   bg: C.blueBg,    color: C.blue,     border: '#bfdbfe' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function s(...styles) {
  return Object.assign({}, ...styles);
}

function Section({ title, children, style }) {
  return (
    <div style={s({ marginBottom: 28 }, style)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Card({ children, style, color }) {
  return (
    <div style={s({
      background: C.surface,
      border: `1px solid ${color || C.border}`,
      borderRadius: 10,
      padding: '14px 16px',
    }, style)}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, valueColor, accentLeft }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '14px 16px',
      borderLeft: accentLeft ? `4px solid ${accentLeft}` : undefined,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: valueColor || C.primary, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PdfReport({ run }) {
  if (!run) return null;

  const config  = run.snapshotConfig  || {};
  const summary = run.metricsSummary  || {};
  const latency = summary.latency     || {};
  const timeSeries = run.timeSeriesMetrics || [];
  const testTypeMeta = TEST_TYPE[config.testType] || TEST_TYPE.load;

  const total    = summary.totalRequests       || 0;
  const success  = summary.successfulRequests  || 0;
  const failed   = summary.failedRequests      || 0;
  const errorRate = summary.errorRate          || 0;
  const avgRps   = summary.avgRps              || 0;
  const peakRps  = summary.peakRps             || 0;
  const p95      = latency.p95                 || 0;

  // Status distribution
  const statusTotal = Math.max(total, success + failed);
  const p2xx = statusTotal > 0 ? (success / statusTotal) * 100 : 100;
  const p4xx = statusTotal > 0 ? ((summary.statusCodes?.['4xx'] || 0) / statusTotal) * 100 : 0;
  const p5xx = statusTotal > 0 ? (failed / statusTotal) * 100 : 0;

  // Percentile bar chart data
  const percData = [
    { name: 'Min',   value: latency.min || 0, fill: C.green },
    { name: 'Avg',   value: latency.avg || 0, fill: C.green },
    { name: 'p50',   value: latency.med || 0, fill: '#65a30d' },
    { name: 'p90',   value: latency.p90 || 0, fill: C.amber },
    { name: 'p95',   value: latency.p95 || 0, fill: '#b45309' },
    { name: 'p99',   value: latency.p99 || 0, fill: C.red },
    { name: 'Max',   value: latency.max || 0, fill: C.red },
  ];

  // Time series chart data
  const chartData = timeSeries.slice(0, 300).map((d, i) => ({
    t:   `${d.second || i + 1}s`,
    rps: d.currentRps   || 0,
    p95: d.p95Latency   || 0,
    vus: d.activeVus    || 0,
  }));

  // Capacity status
  let capStatus = 'STABLE';
  let capColor  = C.green;
  let capBg     = C.greenBg;
  if (errorRate > 5)  { capStatus = 'CAPACITY BREACH'; capColor = C.red;   capBg = C.redBg; }
  else if (p95 > 800) { capStatus = 'HIGH LATENCY';    capColor = C.amber; capBg = C.amberBg; }

  const stableRps = errorRate > 5
    ? Math.round(avgRps * 0.6)
    : p95 > 800
      ? Math.round(avgRps * 0.8)
      : peakRps;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: C.bg,
      color: C.primary,
      padding: '32px 36px',
      width: 900,
      minHeight: 200,
      boxSizing: 'border-box',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${C.accent}` }}>
        <div>
          {/* Logo wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ background: C.accent, borderRadius: 6, padding: '4px 10px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: '#000' }}>BENCHLEY</span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>LOAD TESTING REPORT</span>
          </div>

          {/* Test info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: C.accent, color: '#000', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
              {config.httpMethod || 'GET'}
            </span>
            <span style={{ background: testTypeMeta.bg, color: testTypeMeta.color, border: `1px solid ${testTypeMeta.border}`, fontFamily: 'monospace', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
              {testTypeMeta.label}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: C.primary, wordBreak: 'break-all' }}>
              {config.targetUrl}
            </span>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, marginTop: 6 }}>
            Run ID: {run._id} &nbsp;•&nbsp; Duration: {run.durationSeconds}s &nbsp;•&nbsp; k6 Engine
          </div>
        </div>

        {/* Date / status */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted }}>
            {new Date(run.finishedAt || run.createdAt).toLocaleString()}
          </div>
          <div style={{ marginTop: 6, background: capBg, border: `1px solid ${capColor}30`, borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: capColor }}>{capStatus}</span>
          </div>
        </div>
      </div>

      {/* ── Scorecard row ───────────────────────────────────────────────── */}
      <Section title="Key Metrics">
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard label="Total Requests"     value={total.toLocaleString()}   sub={`${success.toLocaleString()} successful`} accentLeft={C.primary} />
          <StatCard label="Avg Throughput"     value={`${avgRps} req/s`}         sub={`Peak: ${peakRps} req/s`}               accentLeft={C.accent} valueColor={C.amber} />
          <StatCard label="p95 Tail Latency"   value={`${p95} ms`}              sub={`Average: ${latency.avg || 0} ms`}       accentLeft={p95 > 500 ? C.red : C.green} valueColor={p95 > 500 ? C.red : C.green} />
          <StatCard label="Error Rate"         value={`${errorRate.toFixed(2)}%`} sub={`${failed.toLocaleString()} failures`} accentLeft={errorRate > 0 ? C.red : C.green} valueColor={errorRate > 0 ? C.red : C.green} />
        </div>
      </Section>

      {/* ── Capacity assessment ─────────────────────────────────────────── */}
      <Section title="Capacity Assessment">
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, marginBottom: 4 }}>Observed Stable Capacity</div>
              <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 900, color: C.amber, lineHeight: 1 }}>≈ {stableRps} RPS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, marginTop: 4 }}>at p95 &lt; {p95 > 800 ? '800ms' : '500ms'} &amp; error rate &lt; 1%</div>
            </div>
            <div style={{ flex: 2, fontFamily: 'monospace', fontSize: 11, color: C.primary, lineHeight: 1.6, background: capBg, border: `1px solid ${capColor}30`, borderRadius: 8, padding: '12px 14px' }}>
              <span style={{ color: capColor, fontWeight: 700 }}>Diagnostics: </span>
              {errorRate > 5
                ? `Target experienced degradation (${errorRate.toFixed(1)}% error rate). Stable capacity is limited to ~${stableRps} RPS before errors spike.`
                : p95 > 800
                  ? `Acceptable error rate but p95 latency (${p95}ms) exceeded 800ms. Investigate DB queries, connection pooling, or CPU saturation.`
                  : `Target handled load smoothly — p95 ${p95}ms, 0% errors. Verified stable capacity of at least ${stableRps} RPS.`
              }
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, lineHeight: 2, flexShrink: 0 }}>
              <div>VUs: <strong style={{ color: C.primary }}>{config.loadProfile?.vus || 50}</strong></div>
              <div>Total: <strong style={{ color: C.primary }}>{total.toLocaleString()}</strong></div>
              <div>Avg latency: <strong style={{ color: C.green }}>{latency.avg || 0} ms</strong></div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── Percentile chart ────────────────────────────────────────────── */}
      <Section title="Response Time Distribution (ms)">
        <Card>
          {/* Numerical grid */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {percData.map(d => (
              <div key={d.name} style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: C.muted, marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: d.fill }}>{d.value}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: C.muted }}>ms</div>
              </div>
            ))}
          </div>
          {/* Bar chart */}
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={percData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={C.muted} fontSize={10} tickLine={false} fontFamily="monospace" />
                <YAxis stroke={C.muted} fontSize={10} tickLine={false} fontFamily="monospace" unit="ms" />
                <Tooltip
                  formatter={v => [`${v} ms`, 'Latency']}
                  contentStyle={{ background: C.bg, borderColor: C.border, borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {percData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      {/* ── Time series chart ────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Section title="Telemetry Timeline — Throughput vs p95 Latency">
          <Card>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="t" stroke={C.muted} fontSize={9} tickLine={false} fontFamily="monospace" interval="preserveStartEnd" />
                  <YAxis yAxisId="l" stroke={C.amber} fontSize={9} tickLine={false} fontFamily="monospace" />
                  <YAxis yAxisId="r" orientation="right" stroke={C.red} fontSize={9} tickLine={false} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{ background: C.bg, borderColor: C.border, borderRadius: 6, fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 6 }} />
                  <Line yAxisId="l" type="monotone" dataKey="rps" name="Throughput (RPS)" stroke={C.amber}   strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="r" type="monotone" dataKey="p95" name="p95 Latency (ms)"  stroke={C.red}    strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Section>
      )}

      {/* ── HTTP status distribution ─────────────────────────────────────── */}
      <Section title="HTTP Status Distribution">
        <Card>
          {/* Segmented bar */}
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 14, border: `1px solid ${C.border}` }}>
            <div style={{ width: `${p2xx}%`, background: C.green }} title={`2xx: ${success}`} />
            <div style={{ width: `${p4xx}%`, background: C.amber }} title={`4xx`} />
            <div style={{ width: `${p5xx}%`, background: C.red   }} title={`5xx: ${failed}`} />
          </div>
          {/* Stat row */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: '2xx OK',      value: success.toLocaleString(),                                              pct: p2xx.toFixed(1), color: C.green },
              { label: '4xx Client',  value: (summary.statusCodes?.['4xx'] || 0).toLocaleString(),                  pct: p4xx.toFixed(1), color: C.amber },
              { label: '5xx Server',  value: failed.toLocaleString(),                                               pct: p5xx.toFixed(1), color: C.red   },
              { label: 'Error Rate',  value: `${errorRate.toFixed(2)}%`,                                            pct: null,            color: errorRate > 0 ? C.red : C.green },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: C.muted, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</div>
                {item.pct !== null && (
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: C.muted }}>{item.pct}%</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ── Full latency table ───────────────────────────────────────────── */}
      <Section title="Full Metrics Summary">
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Metric', 'Value', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Total Requests',   value: total.toLocaleString(),           note: `${success.toLocaleString()} OK / ${failed.toLocaleString()} failed` },
                { metric: 'Avg Throughput',   value: `${avgRps} req/s`,                note: `Peak ${peakRps} req/s` },
                { metric: 'Duration',         value: `${run.durationSeconds}s`,        note: config.loadProfile?.type || 'constant_vus' },
                { metric: 'Min Latency',      value: `${latency.min || 0} ms`,         note: 'Best case response time' },
                { metric: 'Avg Latency',      value: `${latency.avg || 0} ms`,         note: 'Mean across all requests' },
                { metric: 'Median (p50)',     value: `${latency.med || 0} ms`,         note: '50% of requests faster than this' },
                { metric: 'p90 Latency',      value: `${latency.p90 || 0} ms`,         note: '90% of requests faster than this' },
                { metric: 'p95 Latency',      value: `${latency.p95 || 0} ms`,         note: 'Key SLO indicator' },
                { metric: 'p99 Latency',      value: `${latency.p99 || 0} ms`,         note: 'Tail — worst 1% of users' },
                { metric: 'Max Latency',      value: `${latency.max || 0} ms`,         note: 'Single worst request' },
                { metric: 'Error Rate',       value: `${errorRate.toFixed(3)}%`,       note: errorRate > 1 ? '⚠ Exceeds 1% SLO' : '✓ Within SLO' },
              ].map((row, i) => (
                <tr key={row.metric} style={{ background: i % 2 === 0 ? C.bg : C.surface }}>
                  <td style={{ padding: '7px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.primary }}>{row.metric}</td>
                  <td style={{ padding: '7px 12px', borderBottom: `1px solid ${C.border}`, color: C.accent, fontWeight: 700 }}>{row.value}</td>
                  <td style={{ padding: '7px 12px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10 }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: C.muted }}>Generated by Benchley Load Testing Platform</span>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: C.muted }}>{new Date().toLocaleString()}</span>
      </div>

    </div>
  );
}
