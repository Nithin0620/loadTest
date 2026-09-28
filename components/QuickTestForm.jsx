'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, Sliders, Terminal, Plus, Trash2, ArrowRight,
  TrendingUp, Activity, Flame, Clock
} from 'lucide-react';
import AdvancedConfigTabs from './AdvancedConfigTabs';
import CurlImportModal from './CurlImportModal';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// ─── Test type metadata ────────────────────────────────────────────────────────
const TEST_TYPES = [
  {
    id: 'load',
    label: 'Load Test',
    icon: Activity,
    color: 'text-yellow-400',
    activeBg: 'bg-yellow-400/10 border-yellow-400',
    desc: 'Validate performance under expected normal traffic.',
  },
  {
    id: 'stress',
    label: 'Stress Test',
    icon: TrendingUp,
    color: 'text-orange-400',
    activeBg: 'bg-orange-400/10 border-orange-400',
    desc: 'Find the breaking point by ramping up load incrementally.',
  },
  {
    id: 'spike',
    label: 'Spike Test',
    icon: Flame,
    color: 'text-red-400',
    activeBg: 'bg-red-400/10 border-red-400',
    desc: 'Simulate a sudden traffic surge and measure recovery.',
  },
  {
    id: 'soak',
    label: 'Soak Test',
    icon: Clock,
    color: 'text-blue-400',
    activeBg: 'bg-blue-400/10 border-blue-400',
    desc: 'Run sustained load over hours to detect memory leaks and drift.',
  },
];

// Duration quick-pick sets per test type
const DURATION_PRESETS = {
  load:   ['10s', '30s', '60s', '120s'],
  stress: ['20s', '30s', '60s', '120s'],
  spike:  ['10s', '20s', '30s', '60s'],
  soak:   ['15m', '30m', '1h', '2h'],
};

export default function QuickTestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Test type ──────────────────────────────────────────────────────────────
  const [testType, setTestType] = useState('load');

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/get');
  const [httpMethod, setHttpMethod] = useState('GET');

  // ── Load test params ───────────────────────────────────────────────────────
  const [loadMode, setLoadMode] = useState('constant_vus'); // constant_vus | ramping_vus | constant_rps
  const [vus, setVus] = useState(50);
  const [duration, setDuration] = useState('30s');
  const [targetRps, setTargetRps] = useState(200);
  const [stages, setStages] = useState([
    { duration: '10s', target: 25 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ]);

  // ── Stress test params ─────────────────────────────────────────────────────
  const [stressMaxVus, setStressMaxVus] = useState(300);
  const [stressSteps, setStressSteps] = useState(5);
  const [stressStepDuration, setStressStepDuration] = useState('30s');
  const [stressCustomStages, setStressCustomStages] = useState([]);
  const [stressUseCustom, setStressUseCustom] = useState(false);

  // ── Spike test params ──────────────────────────────────────────────────────
  const [spikeBaselineVus, setSpikeBaselineVus] = useState(10);
  const [spikePeakVus, setSpikePeakVus] = useState(300);
  const [spikeBaselineDuration, setSpikeBaselineDuration] = useState('30s');
  const [spikeSpikeDuration, setSpikeSpikeDuration] = useState('10s');
  const [spikeRecoveryDuration, setSpikeRecoveryDuration] = useState('30s');

  // ── Soak test params ───────────────────────────────────────────────────────
  const [soakVus, setSoakVus] = useState(50);
  const [soakRampUp, setSoakRampUp] = useState('2m');
  const [soakSustain, setSoakSustain] = useState('30m');
  const [soakRampDown, setSoakRampDown] = useState('2m');

  // ── Advanced ───────────────────────────────────────────────────────────────
  const [headers, setHeaders] = useState([]);
  const [auth, setAuth] = useState({ authType: 'none', token: '', username: '', password: '' });
  const [bodyType, setBodyType] = useState('none');
  const [bodyContent, setBodyContent] = useState('');
  const [thresholds, setThresholds] = useState([
    { metric: 'http_req_duration', operator: 'p(95)<', value: 500 },
  ]);

  // ── cURL import ────────────────────────────────────────────────────────────
  const handleCurlImport = (parsed) => {
    if (parsed.targetUrl) setTargetUrl(parsed.targetUrl);
    if (parsed.httpMethod) setHttpMethod(parsed.httpMethod);
    if (parsed.headers) setHeaders(parsed.headers);
    if (parsed.auth) setAuth(parsed.auth);
    if (parsed.bodyType) setBodyType(parsed.bodyType);
    if (parsed.bodyContent) setBodyContent(parsed.bodyContent);
    setShowAdvanced(true);
  };

  // ── Stage helpers (load ramping mode) ─────────────────────────────────────
  const addStage = () =>
    setStages([...stages, { duration: '10s', target: (stages[stages.length - 1]?.target || 50) + 50 }]);

  const updateStage = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = field === 'target' ? Number(value) : value;
    setStages(updated);
  };

  const removeStage = (index) => setStages(stages.filter((_, i) => i !== index));

  // ── Stress custom stage helpers ────────────────────────────────────────────
  const addStressStage = () =>
    setStressCustomStages([...stressCustomStages, { duration: '30s', target: (stressCustomStages[stressCustomStages.length - 1]?.target || 50) + 50 }]);

  const updateStressStage = (index, field, value) => {
    const updated = [...stressCustomStages];
    updated[index][field] = field === 'target' ? Number(value) : value;
    setStressCustomStages(updated);
  };

  const removeStressStage = (index) => setStressCustomStages(stressCustomStages.filter((_, i) => i !== index));

  // ── Build loadProfile for each test type ───────────────────────────────────
  const buildLoadProfile = () => {
    switch (testType) {
      case 'stress':
        return {
          type: 'ramping_vus',
          vus: Number(stressMaxVus),
          steps: Number(stressSteps),
          stepDuration: stressStepDuration,
          stages: stressUseCustom ? stressCustomStages : [],
        };
      case 'spike':
        return {
          type: 'ramping_vus',
          baselineVus: Number(spikeBaselineVus),
          spikeVus: Number(spikePeakVus),
          baselineDuration: spikeBaselineDuration,
          spikeDuration: spikeSpikeDuration,
          recoveryDuration: spikeRecoveryDuration,
        };
      case 'soak':
        return {
          type: 'ramping_vus',
          vus: Number(soakVus),
          rampUp: soakRampUp,
          sustainDuration: soakSustain,
          rampDown: soakRampDown,
        };
      default: // load
        return {
          type: loadMode,
          vus: Number(vus),
          duration,
          stages: loadMode === 'ramping_vus' ? stages : [],
          targetRps: Number(targetRps),
        };
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
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
        testType,
        targetUrl,
        httpMethod,
        loadProfile: buildLoadProfile(),
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
        throw new Error(data.error || 'Failed to start test');
      }

      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const activeType = TEST_TYPES.find((t) => t.id === testType);

  return (
    <div className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-800">
        <div>
          <h2 className="text-lg font-bold text-white">Configure Test</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Choose a test type, configure your target, and fire.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurlModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-dark-850 border border-dark-700 text-yellow-400 hover:border-yellow-400/50 hover:bg-dark-800 text-xs font-mono font-medium transition-all"
        >
          <Terminal className="w-3.5 h-3.5" />
          Import cURL
        </button>
      </div>

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* ── Test Type Selector ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-300">Test Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TEST_TYPES.map((t) => {
              const Icon = t.icon;
              const active = testType === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTestType(t.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    active
                      ? `${t.activeBg} text-white shadow-glow-sm`
                      : 'bg-black border-dark-800 text-zinc-400 hover:border-dark-700 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${active ? t.color : 'text-zinc-500'}`} />
                    <span className={`text-xs font-bold ${active ? t.color : 'text-zinc-300'}`}>{t.label}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 leading-snug">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Target Endpoint ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">Target Endpoint URL</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="bg-black border border-dark-700 rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-yellow-400 focus:outline-none focus:border-yellow-400 cursor-pointer sm:w-32"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
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

        {/* ── Per-type config panels ─────────────────────────────────────── */}

        {/* LOAD */}
        {testType === 'load' && (
          <LoadTestConfig
            loadMode={loadMode} setLoadMode={setLoadMode}
            vus={vus} setVus={setVus}
            duration={duration} setDuration={setDuration}
            targetRps={targetRps} setTargetRps={setTargetRps}
            stages={stages}
            addStage={addStage} updateStage={updateStage} removeStage={removeStage}
          />
        )}

        {/* STRESS */}
        {testType === 'stress' && (
          <StressTestConfig
            maxVus={stressMaxVus} setMaxVus={setStressMaxVus}
            steps={stressSteps} setSteps={setStressSteps}
            stepDuration={stressStepDuration} setStepDuration={setStressStepDuration}
            useCustom={stressUseCustom} setUseCustom={setStressUseCustom}
            customStages={stressCustomStages}
            addStage={addStressStage} updateStage={updateStressStage} removeStage={removeStressStage}
          />
        )}

        {/* SPIKE */}
        {testType === 'spike' && (
          <SpikeTestConfig
            baselineVus={spikeBaselineVus} setBaselineVus={setSpikeBaselineVus}
            peakVus={spikePeakVus} setPeakVus={setSpikePeakVus}
            baselineDuration={spikeBaselineDuration} setBaselineDuration={setSpikeBaselineDuration}
            spikeDuration={spikeSpikeDuration} setSpikeDuration={setSpikeSpikeDuration}
            recoveryDuration={spikeRecoveryDuration} setRecoveryDuration={setSpikeRecoveryDuration}
          />
        )}

        {/* SOAK */}
        {testType === 'soak' && (
          <SoakTestConfig
            vus={soakVus} setVus={setSoakVus}
            rampUp={soakRampUp} setRampUp={setSoakRampUp}
            sustain={soakSustain} setSustain={setSoakSustain}
            rampDown={soakRampDown} setRampDown={setSoakRampDown}
          />
        )}

        {/* ── Advanced ──────────────────────────────────────────────────── */}
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
            headers={headers} setHeaders={setHeaders}
            auth={auth} setAuth={setAuth}
            bodyType={bodyType} setBodyType={setBodyType}
            bodyContent={bodyContent} setBodyContent={setBodyContent}
            thresholds={thresholds} setThresholds={setThresholds}
          />
        )}

        {error && (
          <div className="p-3.5 bg-dark-850 border border-yellow-400/50 rounded-xl text-xs text-yellow-300 font-mono">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-3 active:scale-[0.99] transition-all shadow-glow disabled:opacity-50 cursor-pointer
              ${testType === 'load'   ? 'bg-yellow-400 text-black hover:bg-yellow-300' : ''}
              ${testType === 'stress' ? 'bg-orange-400 text-black hover:bg-orange-300' : ''}
              ${testType === 'spike'  ? 'bg-red-500    text-white hover:bg-red-400'    : ''}
              ${testType === 'soak'   ? 'bg-blue-500   text-white hover:bg-blue-400'   : ''}
            `}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Executing k6 Runner...
              </>
            ) : (
              <>
                {activeType && <activeType.icon className="w-4 h-4 fill-current" />}
                Run {activeType?.label}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <CurlImportModal
        isOpen={curlModalOpen}
        onClose={() => setCurlModalOpen(false)}
        onImport={handleCurlImport}
      />
    </div>
  );
}

// ─── Load Test Config Panel ──────────────────────────────────────────────────
function LoadTestConfig({ loadMode, setLoadMode, vus, setVus, duration, setDuration, targetRps, setTargetRps, stages, addStage, updateStage, removeStage }) {
  return (
    <div className="space-y-4">
      {/* Sub-mode selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-300">Workload Distribution Mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'constant_vus', title: 'Concurrent Users (VUs)', desc: 'Fixed virtual user volume' },
            { id: 'ramping_vus',  title: 'Ramp-up Stages',         desc: 'Gradually scale over stages' },
            { id: 'constant_rps', title: 'Requests / Second (RPS)', desc: 'Fixed rate traffic generator' },
          ].map((mode) => (
            <button
              type="button"
              key={mode.id}
              onClick={() => setLoadMode(mode.id)}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                loadMode === mode.id
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

      {loadMode === 'constant_vus' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black border border-dark-800 rounded-xl">
          <SliderField label="Virtual Users (VUs)" value={vus} min={1} max={500} onChange={setVus} color="yellow" unit="Users" />
          <DurationPicker label="Test Duration" value={duration} onChange={setDuration} presets={['10s','30s','60s','120s']} />
        </div>
      )}

      {loadMode === 'ramping_vus' && (
        <StagesEditor stages={stages} addStage={addStage} updateStage={updateStage} removeStage={removeStage} />
      )}

      {loadMode === 'constant_rps' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black border border-dark-800 rounded-xl">
          <SliderField label="Target Throughput (RPS)" value={targetRps} min={10} max={1000} step={10} onChange={setTargetRps} color="yellow" unit="req/s" />
          <DurationPicker label="Test Duration" value={duration} onChange={setDuration} presets={['10s','30s','60s']} />
        </div>
      )}
    </div>
  );
}

// ─── Stress Test Config Panel ────────────────────────────────────────────────
function StressTestConfig({ maxVus, setMaxVus, steps, setSteps, stepDuration, setStepDuration, useCustom, setUseCustom, customStages, addStage, updateStage, removeStage }) {
  const preview = [];
  if (!useCustom) {
    const size = Math.ceil(maxVus / steps);
    for (let i = 1; i <= steps; i++) preview.push({ target: Math.min(size * i, maxVus), duration: stepDuration });
  }

  return (
    <div className="space-y-4 p-4 bg-black border border-dark-800 rounded-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">Incrementally ramp up VUs until your system breaks. No ramp-down.</p>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="accent-orange-400" />
          Custom stages
        </label>
      </div>

      {!useCustom ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SliderField label="Max VUs (ceiling)" value={maxVus} min={50} max={1000} step={50} onChange={setMaxVus} color="orange" unit="VUs" />
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Number of Steps</label>
            <input
              type="number"
              min={2} max={20}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm font-mono text-orange-400 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Duration per Step</label>
            <input
              type="text"
              placeholder="30s"
              value={stepDuration}
              onChange={(e) => setStepDuration(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm font-mono text-orange-400 focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>
      ) : (
        <StagesEditor stages={customStages} addStage={addStage} updateStage={updateStage} removeStage={removeStage} accentColor="orange" />
      )}

      {/* Stage preview */}
      {!useCustom && preview.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {preview.map((s, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/30 text-orange-300 text-[11px] font-mono">
              {s.duration} → {s.target} VUs
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Spike Test Config Panel ─────────────────────────────────────────────────
function SpikeTestConfig({ baselineVus, setBaselineVus, peakVus, setPeakVus, baselineDuration, setBaselineDuration, spikeDuration, setSpikeDuration, recoveryDuration, setRecoveryDuration }) {
  return (
    <div className="space-y-4 p-4 bg-black border border-dark-800 rounded-xl">
      <p className="text-xs text-zinc-400">Holds a baseline, fires a sudden spike, then measures recovery.</p>

      {/* Shape visualiser */}
      <div className="flex items-end gap-0.5 h-10 font-mono text-[10px]">
        <PhaseBar label="Baseline" height={20} color="bg-zinc-600" widthClass="flex-1" />
        <PhaseBar label="Spike" height={100} color="bg-red-500" widthClass="w-8" />
        <PhaseBar label="Recovery" height={20} color="bg-zinc-600" widthClass="flex-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SliderField label="Baseline VUs" value={baselineVus} min={1} max={200} onChange={setBaselineVus} color="red" unit="VUs" />
        <SliderField label="Spike VUs (peak)" value={peakVus} min={50} max={1000} step={10} onChange={setPeakVus} color="red" unit="VUs" />
        <DurationInput label="Baseline Duration" value={baselineDuration} onChange={setBaselineDuration} placeholder="30s" />
        <DurationInput label="Spike Hold Duration" value={spikeDuration} onChange={setSpikeDuration} placeholder="10s" />
        <DurationInput label="Recovery Duration" value={recoveryDuration} onChange={setRecoveryDuration} placeholder="30s" />
      </div>
    </div>
  );
}

// ─── Soak Test Config Panel ──────────────────────────────────────────────────
function SoakTestConfig({ vus, setVus, rampUp, setRampUp, sustain, setSustain, rampDown, setRampDown }) {
  return (
    <div className="space-y-4 p-4 bg-black border border-dark-800 rounded-xl">
      <p className="text-xs text-zinc-400">
        Runs sustained moderate load over hours. Detects memory leaks, connection pool exhaustion, and latency drift.
      </p>

      {/* Shape visualiser */}
      <div className="flex items-end gap-0.5 h-10 font-mono text-[10px]">
        <PhaseBar label="Ramp Up" height={100} color="bg-blue-500" widthClass="w-10" ramp />
        <PhaseBar label="Sustain" height={100} color="bg-blue-500" widthClass="flex-1" />
        <PhaseBar label="Ramp Down" height={100} color="bg-blue-500" widthClass="w-10" rampDown />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SliderField label="Sustained VUs" value={vus} min={1} max={500} onChange={setVus} color="blue" unit="VUs" />
        <DurationInput label="Ramp-up Duration" value={rampUp} onChange={setRampUp} placeholder="2m" hint="e.g. 2m, 5m" />
        <DurationInput label="Sustain Duration" value={sustain} onChange={setSustain} placeholder="30m" hint="e.g. 30m, 1h, 2h" />
        <DurationInput label="Ramp-down Duration" value={rampDown} onChange={setRampDown} placeholder="2m" hint="e.g. 2m, 5m" />
      </div>

      <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg text-[11px] text-blue-300 font-mono">
        Tip: Use durations like <code>15m</code>, <code>1h</code>, or <code>2h30m</code>. Soak tests typically run 1–8 hours.
      </div>
    </div>
  );
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function SliderField({ label, value, min, max, step = 1, onChange, color = 'yellow', unit }) {
  const colorMap = {
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-zinc-400">{label}</span>
        <span className={`${colorMap[color]} font-bold`}>{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full cursor-pointer accent-${color === 'yellow' ? 'yellow' : color}-400`}
      />
      <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
        <span>{min} {unit}</span>
        <span>{Math.round((min + max) / 2)} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function DurationPicker({ label, value, onChange, presets }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {presets.map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => onChange(d)}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              value === d
                ? 'bg-yellow-400 text-black font-bold shadow-glow-sm'
                : 'bg-dark-850 text-zinc-400 hover:text-white border border-dark-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function DurationInput({ label, value, onChange, placeholder, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-yellow-400"
      />
      {hint && <p className="text-[10px] text-zinc-600 font-mono">{hint}</p>}
    </div>
  );
}

function StagesEditor({ stages, addStage, updateStage, removeStage, accentColor = 'yellow' }) {
  return (
    <div className="p-4 bg-dark-900 border border-dark-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-300">Stages Timeline</span>
        <button
          type="button"
          onClick={addStage}
          className={`flex items-center gap-1 text-xs text-${accentColor}-400 hover:text-${accentColor}-300 font-medium`}
        >
          <Plus className="w-3.5 h-3.5" /> Add Stage
        </button>
      </div>
      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500 w-16">Stage {idx + 1}</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[11px] font-mono text-zinc-400">VUs:</span>
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
              <button type="button" onClick={() => removeStage(idx)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseBar({ label, height, color, widthClass, ramp, rampDown }) {
  return (
    <div className={`${widthClass} flex flex-col items-center justify-end gap-1`}>
      <div
        className={`w-full ${color} opacity-70`}
        style={{
          height: `${height}%`,
          clipPath: ramp
            ? 'polygon(100% 0%, 100% 100%, 0% 100%)'
            : rampDown
            ? 'polygon(0% 0%, 100% 100%, 0% 100%)'
            : 'none',
        }}
      />
      <span className="text-zinc-600 text-[9px] text-center leading-tight">{label}</span>
    </div>
  );
}
