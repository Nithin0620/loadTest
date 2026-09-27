'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function LiveLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full bg-dark-900 border border-dark-800 rounded-2xl flex items-center justify-center text-xs font-mono text-zinc-500">
        Waiting for initial telemetry ticks...
      </div>
    );
  }

  // Format data for recharts
  const chartData = data.map((d, i) => ({
    name: `${d.second || i + 1}s`,
    rps: d.currentRps || 0,
    p95: d.p95Latency || 0,
    vus: d.activeVus || 0,
  }));

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          Live Telemetry Timeline (RPS vs p95 Latency)
        </h4>
        <span className="text-[10px] font-mono text-zinc-500">
          Last {chartData.length} Seconds
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1f1f28" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              yAxisId="left"
              stroke="#facc15"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#38bdf8"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0d',
                borderColor: '#272732',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#fff',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rps"
              name="Throughput (RPS)"
              stroke="#facc15"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="p95"
              name="p95 Latency (ms)"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
