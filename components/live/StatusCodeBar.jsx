'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, BarChart2 } from 'lucide-react';

export default function StatusCodeBar({
  status2xx = 0,
  status4xx = 0,
  status5xx = 0,
  totalRequests = 0,
  errorRate = 0,
}) {
  const total = Math.max(totalRequests, status2xx + status4xx + status5xx);
  const p2xx = total > 0 ? (status2xx / total) * 100 : 100;
  const p4xx = total > 0 ? (status4xx / total) * 100 : 0;
  const p5xx = total > 0 ? (status5xx / total) * 100 : 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-yellow-400" />
          HTTP Status Distribution & Error Rate
        </h4>
        <span className="text-xs font-mono font-semibold text-zinc-300">
          Total: {total.toLocaleString()} Reqs
        </span>
      </div>

      {/* Multi-segmented bar */}
      <div className="w-full h-3 bg-dark-950 rounded-full overflow-hidden flex border border-dark-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${p2xx}%` }}
          title={`2xx: ${status2xx}`}
        />
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${p4xx}%` }}
          title={`4xx: ${status4xx}`}
        />
        <div
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${p5xx}%` }}
          title={`5xx: ${status5xx}`}
        />
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 bg-dark-950 border border-dark-800 rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">2xx OK</div>
            <div className="text-sm font-bold font-mono text-emerald-400">{status2xx.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-3 bg-dark-950 border border-dark-800 rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">4xx Warn</div>
            <div className="text-sm font-bold font-mono text-amber-400">{status4xx.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-3 bg-dark-950 border border-dark-800 rounded-xl flex items-center gap-2.5">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">5xx Error</div>
            <div className="text-sm font-bold font-mono text-red-400">{status5xx.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-3 bg-dark-950 border border-dark-800 rounded-xl flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full border border-yellow-400/40 text-yellow-400 flex items-center justify-center text-[10px] font-bold">
            %
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Error Rate</div>
            <div className={`text-sm font-bold font-mono ${errorRate > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
              {errorRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
