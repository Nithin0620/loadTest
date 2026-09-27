'use client';

import React from 'react';
import QuickTestForm from '../components/QuickTestForm';
import RecentRunsTable from '../components/RecentRunsTable';
import { Zap, ShieldCheck, Gauge, TrendingUp, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-10 py-2">
      {/* Hero Headline */}
      <div className="text-center space-y-3 max-w-3xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-mono mb-2 shadow-glow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>k6-Powered Real-time Load Generation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
          STRESS TEST YOUR <span className="text-yellow-400">APIs</span> WITH ZERO FRICTION
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Simulate hundreds of concurrent virtual users, inspect real-time RPS & latency percentiles, auto-detect breaking points, and compare performance benchmarks.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {[
          { icon: Gauge, label: 'Sub-millisecond Precision' },
          { icon: TrendingUp, label: 'Realtime SSE Telemetry' },
          { icon: Zap, label: 'k6 High-Throughput Engine' },
          { icon: ShieldCheck, label: 'SLO & Breaking Point Detection' },
        ].map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-dark-900/60 border border-dark-800 text-xs font-mono text-zinc-300"
            >
              <Icon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="truncate">{feat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Main Test Configuration Form */}
      <div className="max-w-4xl mx-auto">
        <QuickTestForm />
      </div>

      {/* Recent Test History */}
      <div className="max-w-5xl mx-auto pt-4">
        <RecentRunsTable />
      </div>
    </div>
  );
}
