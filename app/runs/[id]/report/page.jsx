'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  GitCompare,
  Download,
  Share2,
  Check,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Scorecard from '@/components/report/Scorecard';
import PercentileChart from '@/components/report/PercentileChart';
import CapacityAssessmentCard from '@/components/report/CapacityAssessmentCard';
import LiveLineChart from '@/components/live/LiveLineChart';
import StatusCodeBar from '@/components/live/StatusCodeBar';
import AuthGuard from '@/components/AuthGuard';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id;

  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reRunning, setReRunning] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        const data = await res.json();
        if (data.success && data.run) {
          setRun(data.run);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [runId]);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-500">
        Loading test report benchmarks...
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-400 space-y-3">
        <p>Test run not found.</p>
        <Link href="/" className="inline-flex items-center gap-1 text-yellow-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const config = run.snapshotConfig || {};
  const summary = run.metricsSummary || {};

  // Copy shareable link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Export JSON summary
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `benchley-report-${runId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Re-run test
  const handleReRun = async () => {
    setReRunning(true);
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success && data.runId) {
        router.push(`/runs/${data.runId}`);
      }
    } catch {
      setReRunning(false);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-8 py-4">
        {/* Top Breadcrumb & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-dark-900 border border-dark-700 text-zinc-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yellow-400 text-black">
                  {config.httpMethod || 'GET'}
                </span>
                <h1 className="text-lg sm:text-xl font-mono font-bold text-white truncate max-w-lg" title={config.targetUrl}>
                  {config.targetUrl}
                </h1>
              </div>
              <div className="text-xs font-mono text-zinc-400 mt-1">
                Finished in {run.durationSeconds}s • Executed with k6 Engine
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReRun}
              disabled={reRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-black font-bold text-xs font-mono hover:bg-yellow-300 transition-all shadow-glow-sm cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${reRunning ? 'animate-spin' : ''}`} />
              Re-run Test
            </button>

            <Link
              href={`/compare?run1=${runId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700 hover:border-yellow-400/50 text-xs font-mono text-zinc-300 hover:bg-dark-800 transition-all"
            >
              <GitCompare className="w-3.5 h-3.5 text-yellow-400" />
              Compare Run
            </Link>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700 hover:border-zinc-500 text-xs font-mono text-zinc-300 hover:bg-dark-800 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700 hover:border-zinc-500 text-xs font-mono text-zinc-300 hover:bg-dark-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>

        {run.status === 'failed' && (
          <div className="p-4 bg-red-950/70 border border-red-800 rounded-2xl flex flex-col gap-2 text-xs font-mono text-red-300">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>Execution Failed</span>
            </div>
            {run.errorMessage && (
              <pre className="p-2.5 bg-black/50 border border-red-900/60 rounded-lg text-[11px] text-red-300 whitespace-pre-wrap font-mono overflow-x-auto">
                {run.errorMessage}
              </pre>
            )}
          </div>
        )}

        {/* Hero Scorecard */}
        <Scorecard summary={summary} duration={run.durationSeconds} />

        {/* Capacity Estimate & Diagnostics */}
        <CapacityAssessmentCard run={run} />

        {/* Tail Latency Percentiles Breakdown */}
        <PercentileChart latency={summary.latency || {}} />

        {/* Complete Time Series Timeline */}
        <LiveLineChart data={run.timeSeriesMetrics || []} />

        {/* HTTP Status Code & Error Distribution */}
        <StatusCodeBar
          status2xx={summary.statusCodes?.['2xx'] || summary.successfulRequests || 0}
          status4xx={summary.statusCodes?.['4xx'] || 0}
          status5xx={summary.statusCodes?.['5xx'] || summary.failedRequests || 0}
          totalRequests={summary.totalRequests || 0}
          errorRate={summary.errorRate || 0}
        />
      </div>
    </AuthGuard>
  );
}
