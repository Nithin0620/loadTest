'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, ArrowUpRight, Clock, Activity, CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';

export default function RecentRunsTable() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    try {
      const res = await fetch('/api/runs?limit=10');
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  if (loading) {
    return (
      <div className="p-8 border border-dark-800 bg-dark-900 rounded-2xl text-center text-zinc-500 font-mono text-xs">
        Loading test history...
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-8 border border-dark-800 bg-dark-900 rounded-2xl text-center text-zinc-500 font-mono text-xs">
        No recent load test runs found. Launch your first test above!
      </div>
    );
  }

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Recent Test Runs
          </h3>
        </div>
        <button
          onClick={fetchRuns}
          className="text-xs text-zinc-400 hover:text-yellow-400 flex items-center gap-1 font-mono transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-dark-950 text-zinc-400 border-b border-dark-800">
            <tr>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Target Endpoint</th>
              <th className="py-3 px-4">Workload</th>
              <th className="py-3 px-4">Throughput</th>
              <th className="py-3 px-4">p95 Latency</th>
              <th className="py-3 px-4">Success %</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800 text-zinc-300">
            {runs.map((run) => {
              const cfg = run.snapshotConfig || {};
              const summary = run.metricsSummary || {};
              const status = run.status;

              return (
                <tr key={run._id} className="hover:bg-dark-850/50 transition-colors">
                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    )}
                    {status === 'running' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-yellow-950/80 text-yellow-400 border border-yellow-800/50 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" /> Running
                      </span>
                    )}
                    {status === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-red-950/80 text-red-400 border border-red-800/50">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                    {status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-zinc-900 text-zinc-400 border border-zinc-700">
                        <AlertTriangle className="w-3 h-3" /> Cancelled
                      </span>
                    )}
                  </td>

                  {/* Target Endpoint */}
                  <td className="py-3.5 px-4 font-mono max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-dark-800 text-yellow-400 border border-dark-700">
                        {cfg.httpMethod || 'GET'}
                      </span>
                      <span className="truncate text-zinc-200" title={cfg.targetUrl}>
                        {cfg.targetUrl}
                      </span>
                    </div>
                  </td>

                  {/* Workload */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400">
                    {cfg.loadProfile?.type === 'constant_rps'
                      ? `${cfg.loadProfile.targetRps} RPS (${cfg.loadProfile.duration})`
                      : `${cfg.loadProfile?.vus || 50} VUs (${cfg.loadProfile?.duration || '30s'})`}
                  </td>

                  {/* Throughput */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-zinc-200">
                    {summary.avgRps ? `${summary.avgRps} req/s` : '—'}
                  </td>

                  {/* p95 Latency */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {summary.latency?.p95 ? (
                      <span className={`font-bold ${summary.latency.p95 > 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {summary.latency.p95} ms
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Success Rate */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {summary.totalRequests ? (
                      <span className={summary.errorRate > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {(100 - summary.errorRate).toFixed(1)}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Action link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      href={status === 'running' ? `/runs/${run._id}` : `/runs/${run._id}/report`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 hover:bg-yellow-400 hover:text-black text-zinc-300 text-[11px] transition-all font-semibold"
                    >
                      {status === 'running' ? 'Live View' : 'View Report'}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
