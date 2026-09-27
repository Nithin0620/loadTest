'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function PercentileChart({ latency = {} }) {
  const data = [
    { name: 'Min', value: latency.min || 0, color: '#10b981' },
    { name: 'Average', value: latency.avg || 0, color: '#10b981' },
    { name: 'Median (p50)', value: latency.med || 0, color: '#10b981' },
    { name: 'p90', value: latency.p90 || 0, color: '#facc15' },
    { name: 'p95', value: latency.p95 || 0, color: '#f59e0b' },
    { name: 'p99', value: latency.p99 || 0, color: '#ef4444' },
    { name: 'Max', value: latency.max || 0, color: '#ef4444' },
  ];

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Response Time Distribution & Percentiles
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tail latency breakdown measured at the client boundary (in milliseconds).
          </p>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1f1f28" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              fontFamily="monospace"
              unit="ms"
            />
            <Tooltip
              formatter={(val) => [`${val} ms`, 'Latency']}
              contentStyle={{
                backgroundColor: '#0a0a0d',
                borderColor: '#272732',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#fff',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Numerical Data Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-dark-800">
        {data.map((item) => (
          <div key={item.name} className="p-2.5 bg-dark-950 border border-dark-800 rounded-xl text-center">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">{item.name}</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">{item.value} ms</div>
          </div>
        ))}
      </div>
    </div>
  );
}
