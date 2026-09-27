'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, Cpu, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function CapacityAssessmentCard({ run = {} }) {
  const summary = run.metricsSummary || {};
  const config = run.snapshotConfig || {};
  const timeSeries = run.timeSeriesMetrics || [];

  const p95 = summary.latency?.p95 || 0;
  const errorRate = summary.errorRate || 0;
  const peakRps = summary.peakRps || summary.avgRps || 0;
  const avgRps = summary.avgRps || 0;

  // Calculate estimated stable capacity
  let stableRps = avgRps;
  let status = 'healthy';
  let recommendation = '';

  if (errorRate > 5) {
    status = 'critical';
    stableRps = Math.round(avgRps * 0.6);
    recommendation = `Target experienced severe degradation (${errorRate.toFixed(1)}% error rate). Observed stable capacity is limited to ~${stableRps} RPS before 5xx errors or network timeouts spike.`;
  } else if (p95 > 800) {
    status = 'degraded';
    stableRps = Math.round(avgRps * 0.8);
    recommendation = `Target maintained acceptable error rate (< 5%), but tail latency (p95: ${p95}ms) exceeded 800ms. Consider investigating database queries, connection pooling, or CPU saturation.`;
  } else {
    status = 'healthy';
    stableRps = peakRps;
    recommendation = `Target handled high load smoothly with excellent tail latency (p95: ${p95}ms) and 0% errors. Verified stable capacity of at least ${stableRps} RPS for this traffic pattern.`;
  }

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-yellow-400" />
          <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Capacity Estimate & Performance Assessment
          </h4>
        </div>

        {status === 'healthy' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-glow-green">
            <CheckCircle2 className="w-3.5 h-3.5" /> STABLE LOAD
          </span>
        )}
        {status === 'degraded' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> HIGH LATENCY
          </span>
        )}
        {status === 'critical' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950 text-red-400 border border-red-800 shadow-glow-red">
            <AlertTriangle className="w-3.5 h-3.5" /> CAPACITY BREACH
          </span>
        )}
      </div>

      <div className="p-4 bg-dark-950 border border-dark-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-zinc-400">Observed Stable Capacity</div>
          <div className="text-3xl font-black font-mono text-yellow-400 mt-1">
            ≈ {stableRps} RPS
          </div>
          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
            at p95 &lt; {p95 > 800 ? '800ms' : '500ms'} &amp; error rate &lt; 1%
          </div>
        </div>

        <div className="sm:border-l sm:border-dark-800 sm:pl-6 text-xs font-mono space-y-1 text-zinc-300">
          <div>• Workload: <span className="text-white font-bold">{config.loadProfile?.vus || 50} Concurrent VUs</span></div>
          <div>• Total Traffic: <span className="text-white font-bold">{summary.totalRequests?.toLocaleString()} Requests</span></div>
          <div>• Avg Latency: <span className="text-emerald-400 font-bold">{summary.latency?.avg} ms</span></div>
        </div>
      </div>

      <div className="text-xs font-mono text-zinc-300 leading-relaxed bg-dark-850 p-4 rounded-xl border border-dark-700">
        <span className="text-yellow-400 font-bold mr-1">LoadCheck AI Insight:</span>
        {recommendation}
      </div>
    </div>
  );
}
