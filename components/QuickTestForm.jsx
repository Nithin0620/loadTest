'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Sliders, Terminal, Plus, Trash2, ArrowRight } from 'lucide-react';
import AdvancedConfigTabs from './AdvancedConfigTabs';
import CurlImportModal from './CurlImportModal';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export default function QuickTestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form State
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/get');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [loadType, setLoadType] = useState('constant_vus'); // 'constant_vus' | 'ramping_vus' | 'constant_rps'
  const [vus, setVus] = useState(50);
  const [duration, setDuration] = useState('30s');
  const [targetRps, setTargetRps] = useState(200);
  const [stages, setStages] = useState([
    { duration: '10s', target: 25 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ]);

  // Advanced State
  const [headers, setHeaders] = useState([]);
  const [auth, setAuth] = useState({ authType: 'none', token: '', username: '', password: '' });
  const [bodyType, setBodyType] = useState('none');
  const [bodyContent, setBodyContent] = useState('');
  const [thresholds, setThresholds] = useState([
    { metric: 'http_req_duration', operator: 'p(95)<', value: 500 },
  ]);

  // Handle cURL import
  const handleCurlImport = (parsed) => {
    if (parsed.targetUrl) setTargetUrl(parsed.targetUrl);
    if (parsed.httpMethod) setHttpMethod(parsed.httpMethod);
    if (parsed.headers) setHeaders(parsed.headers);
    if (parsed.auth) setAuth(parsed.auth);
    if (parsed.bodyType) setBodyType(parsed.bodyType);
    if (parsed.bodyContent) setBodyContent(parsed.bodyContent);
    setShowAdvanced(true);
  };

  // Stage Helpers
  const addStage = () => {
    setStages([...stages, { duration: '10s', target: (stages[stages.length - 1]?.target || 50) + 50 }]);
  };

  const updateStage = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = field === 'target' ? Number(value) : value;
    setStages(updated);
  };

  const removeStage = (index) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  // Submit test
  const handleLaunch = async (e) => {
    e.preventDefault();
    setError('');

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      setError('Target URL must start with http:// or https://');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        targetUrl,
        httpMethod,
        loadProfile: {
          type: loadType,
          vus: Number(vus),
          duration,
          stages: loadType === 'ramping_vus' ? stages : [],
          targetRps: Number(targetRps),
        },
        headers,
        auth,
        bodyType,
        bodyContent,
        thresholds,
      };

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start load test');
      }

      // Navigate to live test screen
      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Top Banner & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Configure Load Test
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Specify target endpoint, concurrency profile, and traffic parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurlModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-dark-850 border border-dark-700 text-yellow-400 hover:border-yellow-400/50 hover:bg-dark-800 text-xs font-mono font-medium transition-all"
          >
            <Terminal className="w-3.5 h-3.5" />
            Import cURL
          </button>
        </div>
      </div>

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* Main URL Bar */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">
            Target Endpoint URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Method Select */}
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="bg-black border border-dark-700 rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-yellow-400 focus:outline-none focus:border-yellow-400 cursor-pointer sm:w-32"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* URL Input */}
            <input
              type="text"
              required
              placeholder="https://api.domain.com/v1/resource"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-1 bg-black border border-dark-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 transition-all"
            />
          </div>
        </div>

        {/* Load Profile Selector */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-300">
            Workload Distribution Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'constant_vus', title: 'Concurrent Users (VUs)', desc: 'Constant virtual user volume' },
              { id: 'ramping_vus', title: 'Ramp-up / Breakpoint', desc: 'Gradually scale load over stages' },
              { id: 'constant_rps', title: 'Requests / Second (RPS)', desc: 'Fixed rate traffic generator' },
            ].map((mode) => (
              <button
                type="button"
                key={mode.id}
                onClick={() => setLoadType(mode.id)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                  loadType === mode.id
                    ? 'bg-yellow-400/10 border-yellow-400 text-white shadow-glow-sm'
                    : 'bg-black border-dark-800 text-zinc-400 hover:border-dark-700 hover:text-zinc-300'
                }`}
              >
                <span className="text-xs font-bold text-yellow-400">{mode.title}</span>
                <span className="text-[11px] text-zinc-500 mt-1">{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Specific Parameters */}
        {loadType === 'constant_vus' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black border border-dark-800 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Virtual Users (VUs)</span>
                <span className="text-yellow-400 font-bold">{vus} Users</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={vus}
                onChange={(e) => setVus(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>1 VU</span>
                <span>250 VUs</span>
                <span>500 VUs</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Test Duration</label>
              <div className="flex gap-2">
                {['10s', '30s', '60s', '120s'].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                      duration === d
                        ? 'bg-yellow-400 text-black font-bold shadow-glow-sm'
                        : 'bg-dark-850 text-zinc-400 hover:text-white border border-dark-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loadType === 'ramping_vus' && (
          <div className="p-4 bg-black border border-dark-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Ramping Stages Timeline</span>
              <button
                type="button"
                onClick={addStage}
                className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stage
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500 w-16">Stage {idx + 1}</span>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[11px] font-mono text-zinc-400">Target VUs:</span>
                    <input
                      type="number"
                      value={stage.target}
                      onChange={(e) => updateStage(idx, 'target', e.target.value)}
                      className="w-24 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-xs font-mono text-yellow-400"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[11px] font-mono text-zinc-400">Duration:</span>
                    <input
                      type="text"
                      value={stage.duration}
                      onChange={(e) => updateStage(idx, 'duration', e.target.value)}
                      placeholder="10s"
                      className="w-20 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  {stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStage(idx)}
                      className="text-zinc-500 hover:text-zinc-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loadType === 'constant_rps' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black border border-dark-800 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Target Throughput (RPS)</span>
                <span className="text-yellow-400 font-bold">{targetRps} req/s</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={targetRps}
                onChange={(e) => setTargetRps(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>10 RPS</span>
                <span>500 RPS</span>
                <span>1000 RPS</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Test Duration</label>
              <div className="flex gap-2">
                {['10s', '30s', '60s'].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                      duration === d
                        ? 'bg-yellow-400 text-black font-bold shadow-glow-sm'
                        : 'bg-dark-850 text-zinc-400 hover:text-white border border-dark-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Advanced Configuration */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-yellow-400 transition-colors font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showAdvanced ? 'Hide Advanced Options (Headers, Auth, Body, SLOs)' : 'Show Advanced Options (Headers, Auth, Body, SLOs)'}
          </button>
        </div>

        {showAdvanced && (
          <AdvancedConfigTabs
            headers={headers}
            setHeaders={setHeaders}
            auth={auth}
            setAuth={setAuth}
            bodyType={bodyType}
            setBodyType={setBodyType}
            bodyContent={bodyContent}
            setBodyContent={setBodyContent}
            thresholds={thresholds}
            setThresholds={setThresholds}
          />
        )}

        {error && (
          <div className="p-3.5 bg-dark-850 border border-yellow-400/50 rounded-xl text-xs text-yellow-300 font-mono">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-yellow-400 text-black font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-3 hover:bg-yellow-300 active:scale-[0.99] transition-all shadow-glow hover:shadow-glow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Executing k6 Runner...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                Run Benchmark
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* cURL Modal */}
      <CurlImportModal
        isOpen={curlModalOpen}
        onClose={() => setCurlModalOpen(false)}
        onImport={handleCurlImport}
      />
    </div>
  );
}
