'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  GitCompare,
  Download,
  FileText,
  Share2,
  Check,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Scorecard from '@/components/report/Scorecard';
import PercentileChart from '@/components/report/PercentileChart';
import CapacityAssessmentCard from '@/components/report/CapacityAssessmentCard';
import LiveLineChart from '@/components/live/LiveLineChart';
import StatusCodeBar from '@/components/live/StatusCodeBar';
import AuthGuard from '@/components/AuthGuard';

const TEST_TYPE_META = {
  load:   { label: 'Load Test',   color: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' },
  stress: { label: 'Stress Test', color: 'bg-orange-400/15 text-orange-400 border-orange-400/30' },
  spike:  { label: 'Spike Test',  color: 'bg-red-400/15    text-red-400    border-red-400/30'    },
  soak:   { label: 'Soak Test',   color: 'bg-blue-400/15   text-blue-400   border-blue-400/30'   },
};

function TestTypeBadge({ type }) {
  const meta = TEST_TYPE_META[type];
  if (!meta) return null;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id;

  const [run, setRun] = useState(null);  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reRunning, setReRunning] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  // ── Copy shareable link ──────────────────────────────────────────────────
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Export JSON ──────────────────────────────────────────────────────────
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `benchley-report-${runId}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ── Export PDF ───────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const { exportReportPdf } = await import('@/lib/exportPdf');
      const hostname = new URL(config.targetUrl || 'http://unknown').hostname;
      const testType = config.testType || 'load';
      const filename = `benchley-${testType}-${hostname}-${runId.slice(-6)}`;
      await exportReportPdf(run, filename);
    } catch (err) {
      console.error('[PDF export]', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // ── Re-run ───────────────────────────────────────────────────────────────
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

        {/* ── Toolbar (excluded from PDF) ─────────────────────────────── */}
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
                {config.testType && <TestTypeBadge type={config.testType} />}
                <h1 className="text-lg sm:text-xl font-mono font-bold text-white truncate max-w-lg" title={config.targetUrl}>
                  {config.targetUrl}
                </h1>
              </div>
              <div className="text-xs font-mono text-zinc-400 mt-1">
                Finished in {run.durationSeconds}s • Executed with k6 Engine
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReRun}
              disabled={reRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-black font-bold text-xs font-mono hover:bg-yellow-300 transition-all shadow-glow-sm cursor-pointer disabled:opacity-50"
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

            {/* PDF Export */}
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700 hover:border-red-400/50 text-xs font-mono text-zinc-300 hover:text-red-400 hover:bg-dark-800 transition-all cursor-pointer disabled:opacity-50"
              title="Download report as PDF"
            >
              {exportingPdf
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <FileText className="w-3.5 h-3.5" />
              }
              {exportingPdf ? 'Generating…' : 'PDF'}
            </button>

            {/* JSON Export */}
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700 hover:border-zinc-500 text-xs font-mono text-zinc-300 hover:bg-dark-800 transition-all cursor-pointer"
              title="Download raw metrics as JSON"
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

        {/* ── Printable report area ────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Report header — visible in PDF */}
          <div className="flex items-center justify-between pb-4 border-b border-dark-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yellow-400 text-black">
                  {config.httpMethod || 'GET'}
                </span>
                {config.testType && <TestTypeBadge type={config.testType} />}
                <span className="text-sm font-mono font-bold text-white">{config.targetUrl}</span>
              </div>
              <p className="text-xs font-mono text-zinc-500">
                Run ID: {runId} • Finished in {run.durationSeconds}s • k6 Engine
              </p>
            </div>
            <p className="text-xs font-mono text-zinc-600 hidden sm:block">
              {new Date(run.finishedAt || run.createdAt).toLocaleString()}
            </p>
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

          <Scorecard summary={summary} duration={run.durationSeconds} />
          <CapacityAssessmentCard run={run} />
          <PercentileChart latency={summary.latency || {}} />
          <LiveLineChart data={run.timeSeriesMetrics || []} />
          <StatusCodeBar
            status2xx={summary.statusCodes?.['2xx'] || summary.successfulRequests || 0}
            status4xx={summary.statusCodes?.['4xx'] || 0}
            status5xx={summary.statusCodes?.['5xx'] || summary.failedRequests || 0}
            totalRequests={summary.totalRequests || 0}
            errorRate={summary.errorRate || 0}
          />

          {/* PDF footer */}
          <div className="pt-4 border-t border-dark-800 flex items-center justify-between text-[10px] font-mono text-zinc-600">
            <span>Generated by Benchley Load Testing Platform</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
