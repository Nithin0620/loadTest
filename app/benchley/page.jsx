'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Gauge, TrendingUp, Activity, Clock, ShieldCheck, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function BenchleyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-mono">
              <Zap className="w-4 h-4" />
              <span>Powered by k6</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
              What is <span className="text-yellow-400">Benchley</span>?
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-zinc-400 leading-relaxed">
              Benchley is a high-performance API load testing platform powered by k6. It helps you understand how your application performs under various real-world conditions through automated performance testing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="https://benchley.ssh.net.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 transition-all shadow-glow-sm"
              >
                <span>Open Benchley</span>
                <ExternalLink className="w-5 h-5" />
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all"
              >
                <span>Back to Home</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Performance Testing Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Performance Testing?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              You might already write unit and integration tests to ensure your application works as designed. These are functional tests. But you also need to consider non-functional tests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                  <ShieldCheck className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold">Functional Tests</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Unit and integration tests verify that your application functions correctly. They ensure features work as designed.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/40">
                  <Gauge className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-yellow-400">Non-Functional Tests</h3>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Performance testing is a non-functional test that evaluates how your application performs under various conditions like security, efficiency, reliability, and performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Types of Performance Testing */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Types of Performance Testing</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Benchley supports multiple types of performance tests to help you understand different aspects of your application's behavior.
            </p>
          </div>

          <div className="space-y-8">
            {/* Load Testing */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 shrink-0">
                  <Gauge className="w-8 h-8 text-blue-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-2xl font-bold text-blue-400">Load Testing</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Determines how your application responds under average load. If your typical day sees 200 requests per second, that's what you set your load test to.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">Average Load</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">Performance Requirements</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">Threshold Validation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stress Testing */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 shrink-0">
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-2xl font-bold text-orange-400">Stress Testing</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Shows how your application handles increased load. You can increase requests by 50-100% or push until your application breaks to know your system's limits.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">Increased Load</span>
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">Breaking Point</span>
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">System Limits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spike Testing */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 shrink-0">
                  <Activity className="w-8 h-8 text-red-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-2xl font-bold text-red-400">Spike Testing</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Simulates sudden traffic spikes that quickly die off. Like when your application gets on the front page of Hacker News and has to handle very high load in a short time.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">Sudden Traffic</span>
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">Quick Ramp Up</span>
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">Viral Scenarios</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Soak Testing */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 shrink-0">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-2xl font-bold text-purple-400">Soak Testing</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Runs tests for extended periods (typically 8+ hours) to catch issues like memory leaks and excessive disk usage that happen gradually over time.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">Extended Duration</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">Memory Leaks</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">Stability Check</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="border-t border-white/10 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Use Benchley?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Built for developers who want to ensure their applications can handle real-world traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'k6 Powered',
                desc: 'Leverage the power of k6, a modern load testing tool with JavaScript-based test scripts.',
              },
              {
                icon: Gauge,
                title: 'Real-time Telemetry',
                desc: 'Monitor your tests in real-time with live metrics and performance data.',
              },
              {
                icon: TrendingUp,
                title: 'Performance Thresholds',
                desc: 'Set SLO criteria and ensure your application meets performance requirements.',
              },
              {
                icon: ShieldCheck,
                title: 'CI/CD Integration',
                desc: 'Automate performance tests in your pipeline to catch regressions early.',
              },
              {
                icon: Activity,
                title: 'Multiple Test Types',
                desc: 'Support for load, stress, spike, and soak testing scenarios.',
              },
              {
                icon: CheckCircle2,
                title: 'Easy to Use',
                desc: 'Simple interface for configuring and running complex load tests.',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4 hover:border-yellow-400/30 transition-colors">
                  <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30 w-fit">
                    <Icon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8 p-12 rounded-3xl border border-yellow-400/20 bg-gradient-to-b from-yellow-400/5 to-transparent">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">Ready to Test Your Application?</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Start load testing your APIs with Benchley today and ensure your application can handle real-world traffic.
              </p>
            </div>
            <a
              href="https://benchley.ssh.net.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 transition-all shadow-glow-sm"
            >
              <span>Open Benchley</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
