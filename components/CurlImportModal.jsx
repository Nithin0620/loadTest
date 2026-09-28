'use client';

import React, { useState } from 'react';
import { Terminal, X, Check, AlertCircle } from 'lucide-react';
import { parseCurlCommand } from '../lib/k6/curlParser';

export default function CurlImportModal({ isOpen, onClose, onImport }) {
  const [curlText, setCurlText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    setError('');
    try {
      if (!curlText.trim()) {
        setError('Please paste a valid cURL command');
        return;
      }
      const parsed = parseCurlCommand(curlText);
      onImport(parsed);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to parse cURL command');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-black">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Import from cURL</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-dark-900">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Paste any raw cURL command (including headers, authorization tokens, request body, and HTTP method). Benchley will automatically configure your test parameters.
          </p>

          <textarea
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            rows={8}
            placeholder={`curl -X POST https://api.domain.com/v1/orders \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer my_token' \\\n  -d '{"items": [1, 2, 3], "total": 99.5}'`}
            className="w-full bg-black border border-dark-700 rounded-xl p-3.5 text-xs font-mono text-yellow-300 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-dark-850 border border-yellow-400/40 rounded-xl text-xs text-yellow-300 font-mono">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-800 bg-black">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-dark-850 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-xs font-bold rounded-lg hover:bg-yellow-300 transition-all shadow-glow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply & Populate
          </button>
        </div>
      </div>
    </div>
  );
}
