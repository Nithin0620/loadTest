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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-850">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-semibold text-white font-mono">Import from cURL</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Paste any raw cURL command (including headers, authorization tokens, request body, and HTTP method). LoadCheck will automatically parse and configure your test suite.
          </p>

          <textarea
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            rows={8}
            placeholder={`curl -X POST https://api.myendpoint.com/v1/orders \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer my_jwt_token' \\\n  -d '{"items": [1, 2, 3], "total": 99.5}'`}
            className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 text-xs font-mono text-yellow-200 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80 focus:ring-1 focus:ring-yellow-400/50 resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-800 bg-dark-850">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-dark-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 bg-yellow-400 text-black text-xs font-bold font-mono rounded-md hover:bg-yellow-300 transition-all shadow-glow-sm"
          >
            <Check className="w-4 h-4" />
            Apply & Populate
          </button>
        </div>
      </div>
    </div>
  );
}
