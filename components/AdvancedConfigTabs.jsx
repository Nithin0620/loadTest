'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Key, Shield, FileCode, CheckSquare, Sparkles } from 'lucide-react';

export default function AdvancedConfigTabs({
  headers,
  setHeaders,
  auth,
  setAuth,
  bodyType,
  setBodyType,
  bodyContent,
  setBodyContent,
  thresholds,
  setThresholds,
}) {
  const [activeTab, setActiveTab] = useState('headers');

  // Header management
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index, field, val) => {
    const updated = [...headers];
    updated[index][field] = val;
    setHeaders(updated);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Format JSON helper
  const formatJson = () => {
    try {
      if (bodyContent) {
        const parsed = JSON.parse(bodyContent);
        setBodyContent(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // invalid JSON, ignore
    }
  };

  // Thresholds helper
  const addThreshold = () => {
    setThresholds([...thresholds, { metric: 'http_req_duration', operator: 'p95<', value: 500 }]);
  };

  const updateThreshold = (index, field, val) => {
    const updated = [...thresholds];
    updated[index][field] = val;
    setThresholds(updated);
  };

  const removeThreshold = (index) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-dark-700 bg-dark-900 rounded-xl overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-dark-800 bg-dark-850 px-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'headers'
              ? 'border-yellow-400 text-yellow-400 bg-dark-900/60'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Headers ({headers.filter((h) => h.key).length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'auth'
              ? 'border-yellow-400 text-yellow-400 bg-dark-900/60'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Authorization {auth.authType !== 'none' ? `(${auth.authType})` : ''}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'body'
              ? 'border-yellow-400 text-yellow-400 bg-dark-900/60'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Request Body {bodyType !== 'none' ? `(${bodyType})` : ''}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('thresholds')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'thresholds'
              ? 'border-yellow-400 text-yellow-400 bg-dark-900/60'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          SLO Thresholds ({thresholds.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4">
        {/* HEADERS TAB */}
        {activeTab === 'headers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Custom HTTP Request Headers</span>
              <button
                type="button"
                onClick={addHeader}
                className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-mono font-medium text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Header
              </button>
            </div>

            {headers.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono py-3">No custom headers configured. Click above to add one.</p>
            ) : (
              <div className="space-y-2">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) => updateHeader(idx, 'enabled', e.target.checked)}
                      className="accent-yellow-400 w-4 h-4 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Header Name (e.g. Content-Type)"
                      value={h.key}
                      onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                      className="flex-1 bg-dark-950 border border-dark-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. application/json)"
                      value={h.value}
                      onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                      className="flex-1 bg-dark-950 border border-dark-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUTH TAB */}
        {activeTab === 'auth' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {['none', 'bearer', 'basic'].map((type) => (
                <label key={type} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="radio"
                    name="authType"
                    value={type}
                    checked={auth.authType === type}
                    onChange={() => setAuth({ ...auth, authType: type })}
                    className="accent-yellow-400"
                  />
                  <span className="capitalize">{type === 'none' ? 'No Auth' : `${type} Token`}</span>
                </label>
              ))}
            </div>

            {auth.authType === 'bearer' && (
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-mono">Bearer Token</label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={auth.token}
                  onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80"
                />
              </div>
            )}

            {auth.authType === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-mono">Username</label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={auth.username}
                    onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                    className="w-full bg-dark-950 border border-dark-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-mono">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={auth.password}
                    onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                    className="w-full bg-dark-950 border border-dark-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* BODY TAB */}
        {activeTab === 'body' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                {['none', 'json', 'raw'].map((type) => (
                  <label key={type} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value={type}
                      checked={bodyType === type}
                      onChange={() => setBodyType(type)}
                      className="accent-yellow-400"
                    />
                    <span className="uppercase">{type}</span>
                  </label>
                ))}
              </div>

              {bodyType === 'json' && (
                <button
                  type="button"
                  onClick={formatJson}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 text-yellow-400 hover:bg-dark-700 text-xs font-mono transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Prettify JSON
                </button>
              )}
            </div>

            {bodyType !== 'none' && (
              <textarea
                rows={6}
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder={bodyType === 'json' ? '{\n  "query": "laptop",\n  "page": 1\n}' : 'raw payload'}
                className="w-full bg-dark-950 border border-dark-700 rounded-md p-3 text-xs font-mono text-yellow-100 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/80 resize-none"
              />
            )}
          </div>
        )}

        {/* THRESHOLDS TAB */}
        {activeTab === 'thresholds' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Automatic Pass / Fail SLO Criteria</span>
              <button
                type="button"
                onClick={addThreshold}
                className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-mono font-medium text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Threshold
              </button>
            </div>

            {thresholds.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono py-3">No thresholds configured. Tests will not fail automatically on latency or error spikes.</p>
            ) : (
              <div className="space-y-2">
                {thresholds.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={t.metric}
                      onChange={(e) => updateThreshold(idx, 'metric', e.target.value)}
                      className="bg-dark-950 border border-dark-700 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-200"
                    >
                      <option value="http_req_duration">Latency (http_req_duration)</option>
                      <option value="http_req_failed">Error Rate (http_req_failed)</option>
                    </select>

                    <select
                      value={t.operator}
                      onChange={(e) => updateThreshold(idx, 'operator', e.target.value)}
                      className="bg-dark-950 border border-dark-700 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-200"
                    >
                      <option value="p95<">p95 &lt;</option>
                      <option value="p99<">p99 &lt;</option>
                      <option value="avg<">avg &lt;</option>
                      <option value="max<">max &lt;</option>
                      <option value="rate<">rate &lt;</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Value (ms or %)"
                      value={t.value}
                      onChange={(e) => updateThreshold(idx, 'value', Number(e.target.value))}
                      className="w-28 bg-dark-950 border border-dark-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-400/80"
                    />

                    <span className="text-xs text-zinc-500 font-mono">ms / %</span>

                    <button
                      type="button"
                      onClick={() => removeThreshold(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
