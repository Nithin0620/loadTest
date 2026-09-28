'use client';

import React from 'react';
import { Users, Zap, Activity } from 'lucide-react';

export default function MetricGauge({ currentRps = 0, peakRps = 0, activeVus = 0, maxVus = 100 }) {
  const maxRpsScale = Math.max(500, peakRps * 1.25);
  const rpsPercentage = Math.min(100, Math.round((currentRps / maxRpsScale) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current RPS Gauge Card */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Current Throughput
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-bold">
            LIVE
          </span>
        </div>

        <div className="my-4 flex items-baseline gap-2">
          <span className="text-5xl font-black font-mono text-white tracking-tight">
            {currentRps}
          </span>
          <span className="text-xs font-mono text-yellow-400 uppercase font-semibold">
            req / sec
          </span>
        </div>

        {/* Small progress meter */}
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-dark-800">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300 shadow-glow-sm"
              style={{ width: `${rpsPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Peak: {peakRps} RPS</span>
            <span>Scale: {Math.round(maxRpsScale)} RPS</span>
          </div>
        </div>
      </div>

      {/* Active VUs Card */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-zinc-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-yellow-400" />
            Active Concurrency
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-zinc-300">
            TARGET: {maxVus}
          </span>
        </div>

        <div className="my-4 flex items-baseline gap-2">
          <span className="text-5xl font-black font-mono text-yellow-400 tracking-tight">
            {activeVus}
          </span>
          <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">
            Virtual Users
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-dark-800">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((activeVus / Math.max(1, maxVus)) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>0 VUs</span>
            <span>{maxVus} Max VUs</span>
          </div>
        </div>
      </div>

      {/* Engine Status Card */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-yellow-400" />
            Engine State
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
          </span>
        </div>

        <div className="my-4">
          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>STREAMING</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Aggregating 1-second metric packets
          </span>
        </div>

        <div className="pt-2 border-t border-dark-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
          <span>Worker: k6 child_process</span>
          <span className="text-yellow-400 font-bold">ONLINE</span>
        </div>
      </div>
    </div>
  );
}
