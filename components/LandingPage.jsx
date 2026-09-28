'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Gauge,
  TrendingUp,
  ShieldCheck,
  GitCompare,
  Terminal,
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  BarChart3,
} from 'lucide-react';
import { BenchleyLogo } from './Logo';

export default function LandingPage() {
  const workflowUrl = process.env.NEXT_PUBLIC_WORKFLOW_URL || 'https://workflow.ssh.net.in';

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 max-w-4xl mx-auto pt-6 pb-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-yellow-400/[0.07] rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-mono shadow-glow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Distributed k6 Load Testing & Real-Time Telemetry</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
          Stress-Test APIs with <span className="text-yellow-400 text-glow-sm">Surgical Precision.</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
          Benchley orchestrates high-throughput HTTP load tests, streams real-time second-by-second performance telemetry, and auto-detects system breaking points before production traffic hits.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={`${workflowUrl}/login?redirect_to=https://benchley.ssh.net.in/`}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] hover:border-yellow-400/60 transition-all duration-150 group shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sign In with Workflow SSO</span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
          </a>

          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-yellow-400 hover:bg-yellow-300 text-black shadow-glow transition-all duration-150 active:scale-[0.98]"
          >
            <span>Create Free Account</span>
            <Zap className="w-4 h-4 fill-current" />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 backdrop-blur-sm space-y-3 hover:border-yellow-400/30 transition-all group">
            <div className="p-3 rounded-xl bg-yellow-400/10 text-yellow-400 w-fit">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
              k6 Sub-Millisecond Engine
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Compiles test definitions into isolated Go-powered k6 execution scripts with minimal CPU overhead and microsecond timing accuracy.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 backdrop-blur-sm space-y-3 hover:border-yellow-400/30 transition-all group">
            <div className="p-3 rounded-xl bg-yellow-400/10 text-yellow-400 w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
              Real-Time SSE Telemetry
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Live second-by-second event streaming with speedometer RPS gauges, rolling p50/p90/p95/p99 latency sparklines, and active VU tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 backdrop-blur-sm space-y-3 hover:border-yellow-400/30 transition-all group">
            <div className="p-3 rounded-xl bg-yellow-400/10 text-yellow-400 w-fit">
              <GitCompare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
              Side-by-Side Run Diffing
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Compare baseline benchmarks against candidate releases with delta percentage pills to catch latency regressions before merging.
            </p>
          </div>
        </div>
      </section>

      {/* Locked Interactive Preview */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              Test Runner Interface
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
            <Lock className="w-3.5 h-3.5 text-yellow-400" />
            <span>Sign in to unlock live execution</span>
          </div>
        </div>

        {/* Mock Preview Card with Glass Banner */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-dark-900/60 p-6 sm:p-8 overflow-hidden">
          {/* Mocked Runner Form Skeleton / Preview */}
          <div className="space-y-6 opacity-40 blur-[1px] pointer-events-none select-none">
            <div className="flex items-center gap-3">
              <div className="w-24 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-yellow-400">
                GET
              </div>
              <div className="flex-1 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 px-4 flex items-center font-mono text-xs text-zinc-400">
                https://api.example.com/v1/healthcheck
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 rounded-xl bg-zinc-800/60 border border-zinc-700/80 p-3 space-y-2">
                <div className="h-3 w-16 bg-zinc-700 rounded" />
                <div className="h-5 w-24 bg-yellow-400/40 rounded" />
              </div>
              <div className="h-20 rounded-xl bg-zinc-800/60 border border-zinc-700/80 p-3 space-y-2">
                <div className="h-3 w-16 bg-zinc-700 rounded" />
                <div className="h-5 w-24 bg-yellow-400/40 rounded" />
              </div>
              <div className="h-20 rounded-xl bg-zinc-800/60 border border-zinc-700/80 p-3 space-y-2">
                <div className="h-3 w-16 bg-zinc-700 rounded" />
                <div className="h-5 w-24 bg-yellow-400/40 rounded" />
              </div>
            </div>
          </div>

          {/* Unlock Callout Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="p-3 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white tracking-tight">
              Ready to execute high-throughput load tests?
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-md font-mono">
              Sign in with your Workflow or Benchley account to configure custom headers, stage profiles, and stream telemetry.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl font-mono text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-glow-sm transition-all"
              >
                Create Account →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
