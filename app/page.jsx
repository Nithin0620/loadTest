'use client';

import React from 'react';
import QuickTestForm from '../components/QuickTestForm';
import RecentRunsTable from '../components/RecentRunsTable';
import LandingPage from '../components/LandingPage';
import { useAuth } from '../lib/auth-context';
import { Zap, ShieldCheck, Gauge, TrendingUp, Sparkles, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
          Initializing Benchley environment...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="space-y-10 py-2">
      {/* Hero Headline */}
      <div className="text-center space-y-3 max-w-3xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-mono mb-2 shadow-glow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>k6-Powered Load Generation</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          High-Velocity Load Testing <span className="text-yellow-400">Without Limits</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Welcome back, <span className="text-white font-semibold">{user.name || user.email}</span>. Configure load distribution, trigger live k6 runs, and monitor metrics.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {[
          { icon: Gauge, label: 'Sub-millisecond Precision' },
          { icon: TrendingUp, label: 'Realtime SSE Telemetry' },
          { icon: Zap, label: 'k6 Core Engine' },
          { icon: ShieldCheck, label: 'SLO Criteria & Breaking Points' },
        ].map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-xl bg-dark-900 border border-dark-700 text-xs text-zinc-300 font-medium"
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

