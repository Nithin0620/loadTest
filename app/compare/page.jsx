'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

function CompareContent() {
  const searchParams = useSearchParams();
  const initialRun1 = searchParams.get('run1') || '';
  const initialRun2 = searchParams.get('run2') || '';

  const [runsList, setRunsList] = useState([]);
  const [selectedA, setSelectedA] = useState(initialRun1);
  const [selectedB, setSelectedB] = useState(initialRun2);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available runs for dropdowns
  useEffect(() => {
    async function fetchRuns() {
      try {
        const res = await fetch('/api/runs?limit=30');
        const data = await res.json();
        if (data.success && Array.isArray(data.runs)) {
          setRunsList(data.runs);
          if (!selectedA && data.runs.length > 0) setSelectedA(data.runs[0]._id);
          if (!selectedB && data.runs.length > 1) setSelectedB(data.runs[1]._id);
        }
      } catch {}
    }
    fetchRuns();
  }, []);

  // Fetch comparison diff when both selected
  useEffect(() => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      setComparison(null);
      return;
    }

    async function fetchDiff() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/runs/compare?run1=${selectedA}&run2=${selectedB}`);
        const data = await res.json();
        if (data.success) {
          setComparison(data);
        } else {
          setError(data.error || 'Failed to compare test runs');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDiff();
  }, [selectedA, selectedB]);

  const diff = comparison?.diff;
  const runA = comparison?.runA;
  const runB = comparison?.runB;

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-yellow-400" />
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-white">
            Compare Benchmark Runs
          </h1>
        </div>
        <p className="text-xs text-zinc-400">
          Analyze performance deltas between baseline and candidate benchmarks (e.g. before/after optimizations).
        </p>
      </div>

      {/* Run Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-dark-900 border border-dark-800 rounded-2xl shadow-xl">
        {/* Baseline Run A */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" /> Run A (Baseline)
          </label>
          <select
            value={selectedA}
            onChange={(e) => setSelectedA(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-400/80 cursor-pointer"
          >
            <option value="">Select Baseline Run...</option>
            {runsList.map((r) => (
              <option key={r._id} value={r._id}>
                {r.snapshotConfig?.targetUrl} — {r.snapshotConfig?.loadProfile?.vus || 50} VUs ({new Date(r.createdAt).toLocaleTimeString()})
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Run B */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Run B (Candidate)
          </label>
          <select
            value={selectedB}
            onChange={(e) => setSelectedB(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-sky-400/80 cursor-pointer"
          >
            <option value="">Select Candidate Run...</option>
            {runsList.map((r) => (
              <option key={r._id} value={r._id}>
                {r.snapshotConfig?.targetUrl} — {r.snapshotConfig?.loadProfile?.vus || 50} VUs ({new Date(r.createdAt).toLocaleTimeString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-xs font-mono text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-16 text-center font-mono text-xs text-zinc-500">
          Calculating benchmark deltas...
        </div>
      )}

      {/* Comparison Results */}
      {comparison && diff && (
        <div className="space-y-6">
          {/* Key Metric Diff Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* RPS Diff */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" /> Throughput (RPS)
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                    diff.rps.improved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {diff.rps.improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {diff.rps.delta > 0 ? `+${diff.rps.delta}` : diff.rps.delta} RPS ({diff.rps.percentDelta}%)
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Baseline (A)</div>
                  <div className="text-xl font-bold font-mono text-zinc-300">{diff.rps.baseline} req/s</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Candidate (B)</div>
                  <div className="text-xl font-bold font-mono text-yellow-400">{diff.rps.candidate} req/s</div>
                </div>
              </div>
            </div>

            {/* p95 Latency Diff */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> p95 Latency
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                    diff.p95Latency.improved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {diff.p95Latency.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {diff.p95Latency.delta > 0 ? `+${diff.p95Latency.delta}` : diff.p95Latency.delta} ms ({diff.p95Latency.percentDelta}%)
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Baseline (A)</div>
                  <div className="text-xl font-bold font-mono text-zinc-300">{diff.p95Latency.baseline} ms</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Candidate (B)</div>
                  <div className="text-xl font-bold font-mono text-sky-400">{diff.p95Latency.candidate} ms</div>
                </div>
              </div>
            </div>

            {/* Error Rate Diff */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Error Rate
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                    diff.errorRate.improved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {diff.errorRate.delta > 0 ? `+${diff.errorRate.delta}%` : `${diff.errorRate.delta}%`}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Baseline (A)</div>
                  <div className="text-xl font-bold font-mono text-zinc-300">{diff.errorRate.baseline}%</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Candidate (B)</div>
                  <div className="text-xl font-bold font-mono text-white">{diff.errorRate.candidate}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Side-by-Side Matrix Table */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-dark-800 font-mono text-sm font-bold text-white uppercase tracking-wider">
              Detailed Benchmark Diff Matrix
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-dark-950 text-zinc-400 border-b border-dark-800">
                <tr>
                  <th className="py-3 px-6">Benchmark Metric</th>
                  <th className="py-3 px-6 text-yellow-400">Run A (Baseline)</th>
                  <th className="py-3 px-6 text-sky-400">Run B (Candidate)</th>
                  <th className="py-3 px-6 text-right">Delta Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 text-zinc-300">
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">Target URL</td>
                  <td className="py-3.5 px-6 truncate max-w-xs">{runA?.snapshotConfig?.targetUrl}</td>
                  <td className="py-3.5 px-6 truncate max-w-xs">{runB?.snapshotConfig?.targetUrl}</td>
                  <td className="py-3.5 px-6 text-right text-zinc-500">—</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">Concurrency (VUs)</td>
                  <td className="py-3.5 px-6">{runA?.snapshotConfig?.loadProfile?.vus || 50} VUs</td>
                  <td className="py-3.5 px-6">{runB?.snapshotConfig?.loadProfile?.vus || 50} VUs</td>
                  <td className="py-3.5 px-6 text-right text-zinc-500">—</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">Total Requests</td>
                  <td className="py-3.5 px-6">{runA?.metricsSummary?.totalRequests?.toLocaleString()}</td>
                  <td className="py-3.5 px-6">{runB?.metricsSummary?.totalRequests?.toLocaleString()}</td>
                  <td className="py-3.5 px-6 text-right font-bold text-white">
                    {(runB?.metricsSummary?.totalRequests || 0) - (runA?.metricsSummary?.totalRequests || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">Average Throughput (RPS)</td>
                  <td className="py-3.5 px-6">{runA?.metricsSummary?.avgRps} req/s</td>
                  <td className="py-3.5 px-6">{runB?.metricsSummary?.avgRps} req/s</td>
                  <td className={`py-3.5 px-6 text-right font-bold ${diff.rps.improved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff.rps.delta > 0 ? `+${diff.rps.delta}` : diff.rps.delta} req/s ({diff.rps.percentDelta}%)
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">p95 Latency</td>
                  <td className="py-3.5 px-6">{runA?.metricsSummary?.latency?.p95} ms</td>
                  <td className="py-3.5 px-6">{runB?.metricsSummary?.latency?.p95} ms</td>
                  <td className={`py-3.5 px-6 text-right font-bold ${diff.p95Latency.improved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff.p95Latency.delta > 0 ? `+${diff.p95Latency.delta}` : diff.p95Latency.delta} ms ({diff.p95Latency.percentDelta}%)
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">Average Latency</td>
                  <td className="py-3.5 px-6">{runA?.metricsSummary?.latency?.avg} ms</td>
                  <td className="py-3.5 px-6">{runB?.metricsSummary?.latency?.avg} ms</td>
                  <td className={`py-3.5 px-6 text-right font-bold ${diff.avgLatency.improved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff.avgLatency.delta > 0 ? `+${diff.avgLatency.delta}` : diff.avgLatency.delta} ms
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-white">Error Rate</td>
                  <td className="py-3.5 px-6">{runA?.metricsSummary?.errorRate}%</td>
                  <td className="py-3.5 px-6">{runB?.metricsSummary?.errorRate}%</td>
                  <td className={`py-3.5 px-6 text-right font-bold ${diff.errorRate.improved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff.errorRate.delta > 0 ? `+${diff.errorRate.delta}%` : `${diff.errorRate.delta}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-mono text-xs text-zinc-500">Loading comparison view...</div>}>
      <CompareContent />
    </Suspense>
  );
}
