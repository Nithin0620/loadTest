'use client';

import React from 'react';
import { Activity, CheckCircle, XCircle, Zap, Clock } from 'lucide-react';

export default function Scorecard({ summary = {}, duration = 0 }) {
  const total = summary.totalRequests || 0;
  const success = summary.successfulRequests || 0;
  const failed = summary.failedRequests || 0;
  const errorRate = summary.errorRate || 0;
  const p95 = summary.latency?.p95 || 0;
  const avgLat = summary.latency?.avg || 0;
  const avgRps = summary.avgRps || (duration > 0 ? (total / duration).toFixed(1) : 0);
  const peakRps = summary.peakRps || 0;

  const cards = [
    {
      label: 'Total Requests',
      value: total.toLocaleString(),
      subtext: `${success.toLocaleString()} successful`,
      icon: Activity,
      color: 'text-white',
      accent: 'border-dark-700',
    },
    {
      label: 'Average Throughput',
      value: `${avgRps}`,
      subtext: `Peak: ${peakRps} req/s`,
      icon: Zap,
      color: 'text-yellow-400',
      accent: 'border-yellow-400/40 shadow-glow-sm',
    },
    {
      label: 'p95 Tail Latency',
      value: `${p95} ms`,
      subtext: `Average: ${avgLat} ms`,
      icon: Clock,
      color: p95 > 500 ? 'text-amber-400' : 'text-emerald-400',
      accent: 'border-dark-700',
    },
    {
      label: 'Error Rate',
      value: `${errorRate.toFixed(2)}%`,
      subtext: `${failed.toLocaleString()} failures`,
      icon: errorRate > 0 ? XCircle : CheckCircle,
      color: errorRate > 0 ? 'text-red-400' : 'text-emerald-400',
      accent: errorRate > 0 ? 'border-red-900/60' : 'border-dark-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`bg-dark-900 border ${card.accent} rounded-2xl p-5 shadow-xl flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{card.label}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>

            <div className="my-3">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${card.color}`}>
                {card.value}
              </span>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-dark-800">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
