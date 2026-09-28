'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

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
import MetricGauge from '@/components/live/MetricGauge';
import LiveLineChart from '@/components/live/LiveLineChart';
import StatusCodeBar from '@/components/live/StatusCodeBar';
import ProgressBar from '@/components/live/ProgressBar';
import AuthGuard from '@/components/AuthGuard';

export default function LiveTestPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id;

  const [status, setStatus] = useState('connecting');
  const [config, setConfig] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Metrics
  const [currentRps, setCurrentRps] = useState(0);
  const [peakRps, setPeakRps] = useState(0);
  const [activeVus, setActiveVus] = useState(0);
  const [p95Latency, setP95Latency] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status2xx, setStatus2xx] = useState(0);
  const [status4xx, setStatus4xx] = useState(0);
  const [status5xx, setStatus5xx] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [timeSeries, setTimeSeries] = useState([]);

  const eventSourceRef = useRef(null);

  // Fetch initial configuration
  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        const data = await res.json();
        if (data.success && data.run) {
          setConfig(data.run.snapshotConfig);
          if (data.run.status === 'completed' || data.run.status === 'failed' || data.run.status === 'cancelled') {
            setStatus(data.run.status);
            if (data.run.errorMessage) {
              setErrorMsg(data.run.errorMessage);
            }
          }
        }
      } catch {
        // ignore
      }
    }
    fetchDetails();
  }, [runId]);

  // Connect SSE
  useEffect(() => {
    if (!runId) return;

    const es = new EventSource(`/api/runs/${runId}/stream`);
    eventSourceRef.current = es;

    es.addEventListener('init', (e) => {
      try {
        const initData = JSON.parse(e.data);
        if (initData.snapshotConfig) {
          setConfig(initData.snapshotConfig);
        }
        if (initData.status === 'running') {
          setStatus('running');
        } else if (initData.status === 'failed' || initData.status === 'completed' || initData.status === 'cancelled') {
          setStatus(initData.status);
        }
      } catch {}
    });

    es.addEventListener('tick', (e) => {
      try {
        const tick = JSON.parse(e.data);
        setStatus('running');
        setCurrentRps(tick.currentRps || 0);
        setActiveVus(tick.activeVus || 0);
        setP95Latency(tick.p95Latency || 0);
        setElapsedSeconds(tick.second || 0);
        setStatus2xx((prev) => prev + (tick.status2xx || 0));
        setStatus4xx((prev) => prev + (tick.status4xx || 0));
        setStatus5xx((prev) => prev + (tick.status5xx || 0));
        setTotalRequests((prev) => prev + (tick.currentRps || 0));

        setPeakRps((prev) => Math.max(prev, tick.currentRps || 0));

        setTimeSeries((prev) => [...prev, tick]);
      } catch {}
    });

    es.addEventListener('done', (e) => {
      try {
        const doneData = JSON.parse(e.data);
        setStatus(doneData.status || 'completed');
        if (doneData.status === 'failed' && doneData.errorMessage) {
          setErrorMsg(doneData.errorMessage);
        }
        es.close();

        // Redirect to report page after brief delay if completed
        if (doneData.status === 'completed') {
          setTimeout(() => {
            router.push(`/runs/${runId}/report`);
          }, 1500);
        }
      } catch {}
    });

    es.addEventListener('error', (e) => {
      try {
        if (e.data) {
          const errData = JSON.parse(e.data);
          setErrorMsg(errData.message || 'Stream connection error');
          setStatus('failed');
        }
      } catch {}
      es.close();
    });

    return () => {
      if (es) es.close();
    };
  }, [runId, router]);

  // Handle Cancel
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await fetch(`/api/runs/${runId}/cancel`, { method: 'POST' });
      setStatus('cancelled');
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  };

  const estimatedDuration = parseInt(config?.loadProfile?.duration || '30', 10);
  const targetMaxVus = config?.loadProfile?.vus || 50;
  const errorRate = totalRequests > 0 ? ((status4xx + status5xx) / totalRequests) * 100 : 0;

  return (
    <AuthGuard>
      <div className="space-y-6 py-4">
        {/* Top Header Card */}
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-yellow-400 text-black">
                {config?.httpMethod || 'GET'}
              </span>
              <h2 className="text-base sm:text-lg font-mono font-bold text-white truncate max-w-xl" title={config?.targetUrl}>
                {config?.targetUrl || 'Loading target endpoint...'}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              <span>Run ID: <span className="text-zinc-200">{runId}</span></span>
              <span>•</span>
              {config?.testType && (
                <>
                  <TestTypeBadge type={config.testType} />
                  <span>•</span>
                </>
              )}
              <span>Profile: <span className="text-yellow-400">{config?.loadProfile?.type || 'constant_vus'}</span></span>
            </div>
          </div>

          {/* Live Status Badge */}
          <div className="flex items-center gap-3">
            {status === 'running' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 text-xs font-mono font-bold shadow-glow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
                RUNNING LOAD TEST
              </div>
            )}
            {status === 'connecting' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-850 border border-dark-700 text-zinc-300 text-xs font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                Connecting Engine...
              </div>
            )}
            {status === 'completed' && (
              <Link
                href={`/runs/${runId}/report`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black text-xs font-mono font-bold shadow-glow-sm hover:bg-yellow-300 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Test Finished — View Report
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {status === 'failed' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-mono font-bold shadow-glow-red">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                TEST FAILED
              </div>
            )}
            {status === 'cancelled' && (
              <div className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs font-mono font-bold">
                TEST CANCELLED
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl flex items-center gap-3 text-xs font-mono text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Progress Bar & Emergency Stop */}
        <ProgressBar
          elapsedSeconds={elapsedSeconds}
          totalDurationSeconds={estimatedDuration}
          onCancel={handleCancel}
          cancelling={cancelling}
        />

        {/* Metric Gauges */}
        <MetricGauge
          currentRps={currentRps}
          peakRps={peakRps}
          activeVus={activeVus}
          maxVus={targetMaxVus}
        />

        {/* Live Timeline Chart */}
        <LiveLineChart data={timeSeries} />

        {/* HTTP Status Code & Error Rate */}
        <StatusCodeBar
          status2xx={status2xx}
          status4xx={status4xx}
          status5xx={status5xx}
          totalRequests={totalRequests}
          errorRate={errorRate}
        />
      </div>
    </AuthGuard>
  );
}
