'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';
import { Activity, Pause, Play, RotateCcw, Zap } from 'lucide-react';

const TOOLTIP_STYLE = {
  backgroundColor: '#0a0a0a',
  borderColor: '#262626',
  borderRadius: '8px',
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#fff',
};

function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-yellow-400/30 bg-yellow-400/[0.04]' : 'border-white/[0.08] bg-dark-900'}`}>
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold font-mono ${accent ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] font-mono text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function ObservabilityPage() {
  const [stats, setStats] = useState(null);
  const [live, setLive] = useState(true);
  const [error, setError] = useState(null);
  const [bursting, setBursting] = useState(false);
  const [count, setCount] = useState(100);
  const [concurrency, setConcurrency] = useState(10);
  const [delay, setDelay] = useState(20);
  const [status, setStatus] = useState(200);
  const [targetUrl, setTargetUrl] = useState('');
  const liveRef = useRef(live);
  liveRef.current = live;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/mock-target/stats?window=120', { cache: 'no-store' });
      if (!response.ok) throw new Error(`stats request failed: ${response.status}`);
      setStats(await response.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setTargetUrl(`${window.location.origin}/api/mock-target`);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!live) return undefined;
    const interval = setInterval(() => {
      if (liveRef.current && !document.hidden) refresh();
    }, 1000);
    return () => clearInterval(interval);
  }, [live, refresh]);

  const reset = async () => {
    await fetch('/api/mock-target/stats', { method: 'DELETE' });
    refresh();
  };

  const runBurst = async () => {
    const total = Math.max(1, Math.min(5000, Number(count) || 100));
    const workersCount = Math.max(1, Math.min(200, Number(concurrency) || 10));
    const url = `/api/mock-target?delay=${Math.max(0, Number(delay) || 0)}&status=${Number(status) || 200}`;
    const runId = `manual-burst-${Date.now()}`;
    let next = 0;
    let sent = 0;

    setBursting(true);
    const workers = Array.from({ length: Math.min(workersCount, total) }, async () => {
      while (next < total) {
        next += 1;
        sent += 1;
        try {
          await fetch(url, { headers: { 'X-LoadCheck-Run-Id': runId } });
        } catch {
          setError('A burst request failed before reaching the server');
        }
      }
    });

    await Promise.all(workers);
    setBursting(false);
    refresh();
    return sent;
  };

  const timeline = stats?.timeline || [];
  const statusData = Object.entries(stats?.byStatus || {})
    .map(([code, value]) => ({ code, requests: value }))
    .sort((a, b) => Number(a.code) - Number(b.code));

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Live Target Observability</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-mono text-yellow-400">
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-yellow-400 animate-pulse' : 'bg-zinc-500'}`} />
              {live ? 'LIVE' : 'PAUSED'}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 font-mono">
            Server-side counters for every request hitting the built-in target endpoint.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLive(!live)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-white/[0.06]"
          >
            {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {live ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-white/[0.06]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-mono text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-yellow-400">Target URL for k6</p>
            <code className="mt-1 block text-sm font-mono text-white break-all">
              {targetUrl || 'loading...'}?delay=20
            </code>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Counters live in server memory and reset on restart.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total requests" value={stats?.totals.requests ?? '—'} accent />
        <StatCard label="Current RPS" value={stats?.currentRps ?? '—'} hint="10s rolling average" />
        <StatCard label="Peak RPS" value={stats?.peakRps ?? '—'} hint="120s window" />
        <StatCard label="In flight" value={stats?.totals.inFlight ?? '—'} />
        <StatCard label="Error rate" value={`${stats?.totals.errorRate ?? '—'}%`} hint="HTTP >= 400" />
        <StatCard label="p95 latency" value={`${stats?.latency.p95Ms ?? '—'} ms`} hint={`${stats?.latency.samples ?? 0} samples`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-dark-700 bg-dark-900 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Requests per second
            </h2>
            <span className="font-mono text-[10px] text-zinc-500">last 120 seconds</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#52525b"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  interval={Math.max(0, Math.floor(timeline.length / 8))}
                />
                <YAxis stroke="#facc15" fontSize={10} fontFamily="monospace" tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  name="Requests"
                  stroke="#facc15"
                  strokeWidth={2}
                  fill="url(#requestsFill)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="transparent"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-700 bg-dark-900 p-5">
          <h2 className="mb-4 text-xs font-mono font-bold uppercase tracking-wider text-white">
            Response codes
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="code" stroke="#52525b" fontSize={10} fontFamily="monospace" tickLine={false} />
                <YAxis stroke="#facc15" fontSize={10} fontFamily="monospace" tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="requests" name="Requests" fill="#facc15" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500">
            {Object.entries(stats?.byMethod || {}).map(([method, value]) => (
              <span key={method}>{method}: <span className="text-zinc-300">{value}</span></span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-dark-700 bg-dark-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-yellow-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Manual burst generator
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total requests', value: count, set: setCount, max: 5000 },
              { label: 'Concurrency', value: concurrency, set: setConcurrency, max: 200 },
              { label: 'Delay per request (ms)', value: delay, set: setDelay, max: 5000 },
              { label: 'HTTP status', value: status, set: setStatus, max: 599 },
            ].map((field) => (
              <label key={field.label} className="block">
                <span className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {field.label}
                </span>
                <input
                  type="number"
                  min={0}
                  max={field.max}
                  value={field.value}
                  onChange={(event) => field.set(Number(event.target.value))}
                  className="w-full rounded-lg border border-white/[0.1] bg-black px-3 py-2 font-mono text-xs text-white outline-none focus:border-yellow-400/50"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={runBurst}
              disabled={bursting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              {bursting ? 'Generating...' : 'Send burst'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-700 bg-dark-900 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Recent requests
            </h2>
            <span className="font-mono text-[10px] text-zinc-500">
              last {stats?.recent.length || 0} of {stats?.totals.requests || 0}
            </span>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="sticky top-0 bg-dark-900 text-zinc-500">
                <tr className="border-b border-white/[0.08]">
                  <th className="pb-2 pr-3 font-normal">Time</th>
                  <th className="pb-2 pr-3 font-normal">Method</th>
                  <th className="pb-2 pr-3 font-normal">Status</th>
                  <th className="pb-2 pr-3 font-normal">Latency</th>
                  <th className="pb-2 pr-3 font-normal">Run ID</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent || []).map((item) => (
                  <tr key={item.requestId} className="border-b border-white/[0.04] text-zinc-400">
                    <td className="py-1.5 pr-3">{item.time.slice(11, 23)}</td>
                    <td className="py-1.5 pr-3 text-zinc-200">{item.method}</td>
                    <td className={`py-1.5 pr-3 ${item.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.status}
                    </td>
                    <td className="py-1.5 pr-3">{item.durationMs} ms</td>
                    <td className="py-1.5 pr-3 max-w-[180px] truncate" title={item.runId || ''}>
                      {item.runId || '—'}
                    </td>
                  </tr>
                ))}
                {(!stats || stats.recent.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-600">
                      No requests yet. Send a burst or start a k6 run against the target URL.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
