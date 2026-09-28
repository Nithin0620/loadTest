'use client';

import React from 'react';
import { Square, Clock } from 'lucide-react';

export default function ProgressBar({
  elapsedSeconds = 0,
  totalDurationSeconds = 30,
  onCancel,
  cancelling = false,
}) {
  const percent = Math.min(100, Math.round((elapsedSeconds / Math.max(1, totalDurationSeconds)) * 100));

  return (
    <div className="bg-dark-900 border border-dark-700 rounded-2xl p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Test Execution Progress
          </span>
          <span className="text-xs font-mono text-yellow-400 font-bold ml-2">
            {elapsedSeconds}s / {totalDurationSeconds}s ({percent}%)
          </span>
        </div>

        {/* Emergency Stop Button */}
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-850 hover:bg-zinc-800 border border-dark-700 hover:border-yellow-400/60 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-current text-yellow-400" />
          {cancelling ? 'Stopping Test...' : 'Emergency Stop'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-dark-800 p-0.5">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300 shadow-glow-sm"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
