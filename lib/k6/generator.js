/**
 * Generates an executable ES6 script for k6 from a TestConfig / snapshotConfig object.
 */
export function generateK6Script(config, runId = 'default-run') {
  const method = (config.httpMethod || 'GET').toUpperCase();
  const url = config.targetUrl;
  if (!url) {
    throw new Error('Target URL is required to generate k6 script');
  }

  const testType = config.testType || 'load';
  // Construct Options
  const loadProfile = config.loadProfile || { type: 'constant_vus', vus: 10, duration: '10s' };
  let optionsObj = {
    insecureSkipTLSVerify: true,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  };

  // Build stage shape based on testType first, then fall back to raw loadProfile
  if (testType === 'stress') {
    // Stress: incremental ramp-up steps until breakpoint, no ramp-down
    // loadProfile.stages carries user-defined steps; fallback to a safe default
    const stages = Array.isArray(loadProfile.stages) && loadProfile.stages.length > 0
      ? loadProfile.stages
      : buildStressStages(loadProfile);
    optionsObj.stages = stages.map(s => ({ duration: s.duration || '30s', target: Number(s.target) || 50 }));

  } else if (testType === 'spike') {
    // Spike: baseline → sudden spike → recovery
    optionsObj.stages = buildSpikeStages(loadProfile);

  } else if (testType === 'soak') {
    // Soak: quick ramp-up, long sustained load, ramp-down
    optionsObj.stages = buildSoakStages(loadProfile);

  } else if (loadProfile.type === 'ramping_vus' && Array.isArray(loadProfile.stages) && loadProfile.stages.length > 0) {
    // load test — custom stages
    optionsObj.stages = loadProfile.stages.map(s => ({
      duration: s.duration || '10s',
      target: Number(s.target) || 10
    }));
  } else if (loadProfile.type === 'constant_rps') {
    const targetRps = Number(loadProfile.targetRps) || 50;
    const duration = loadProfile.duration || '30s';
    optionsObj.scenarios = {
      constant_rps_scenario: {
        executor: 'constant-arrival-rate',
        rate: targetRps,
        timeUnit: '1s',
        duration: duration,
        preAllocatedVUs: Math.max(50, Math.min(targetRps * 2, 500)),
        maxVUs: Math.max(500, Math.min(targetRps * 5, 2000)),
      }
    };
  } else {
    // Constant VUs (load test default)
    optionsObj.vus = Math.min(Number(loadProfile.vus) || 10, 1000);
    optionsObj.duration = loadProfile.duration || '10s';
  }

  // Inject thresholds if provided
  if (Array.isArray(config.thresholds) && config.thresholds.length > 0) {
    optionsObj.thresholds = {};
    for (const t of config.thresholds) {
      if (t.metric && t.operator && t.value !== undefined && t.value !== null && t.value !== '') {
        const key = t.metric;
        let op = String(t.operator).trim();
        let val = Number(t.value);

        // Normalize percentile shorthand: e.g. p95< -> p(95)<, p99<= -> p(99)<=, p90> -> p(90)>
        op = op.replace(/^p(\d+)(.*)$/, 'p($1)$2');

        // Handle error rate threshold metric: if user entered > 1 (e.g. 1 or 5 meaning 1% or 5%), convert to decimal
        if (key === 'http_req_failed' && val > 1) {
          val = val / 100;
        }

        const expr = `${op}${val}`;
        optionsObj.thresholds[key] = optionsObj.thresholds[key] || [];
        optionsObj.thresholds[key].push(expr);
      }
    }
  }

  // Construct Headers
  const headerMap = {
    'User-Agent': 'LoadCheck-Engine/1.0 (+https://github.com/Nithin0620/loadTest)',
    'X-LoadCheck-Run-Id': String(runId),
  };

  if (Array.isArray(config.headers)) {
    for (const h of config.headers) {
      if (h.enabled !== false && h.key && h.value !== undefined) {
        headerMap[h.key] = h.value;
      }
    }
  }

  // Handle Auth
  if (config.auth) {
    if (config.auth.authType === 'bearer' && config.auth.token) {
      headerMap['Authorization'] = `Bearer ${config.auth.token}`;
    } else if (config.auth.authType === 'basic' && (config.auth.username || config.auth.password)) {
      const creds = Buffer.from(`${config.auth.username || ''}:${config.auth.password || ''}`).toString('base64');
      headerMap['Authorization'] = `Basic ${creds}`;
    }
  }

  // Handle Payload
  let payloadStr = 'null';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (config.bodyType === 'json' && config.bodyContent) {
      if (!headerMap['Content-Type']) {
        headerMap['Content-Type'] = 'application/json';
      }
      payloadStr = JSON.stringify(config.bodyContent);
    } else if (config.bodyContent) {
      payloadStr = JSON.stringify(config.bodyContent);
    }
  }

  const script = `
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = ${JSON.stringify(optionsObj, null, 2)};

const TARGET_URL = ${JSON.stringify(url)};
const HEADERS = ${JSON.stringify(headerMap, null, 2)};
const PAYLOAD = ${payloadStr};

export default function () {
  const params = {
    headers: HEADERS,
    tags: { name: 'LoadCheckRequest' },
    timeout: '30s',
    redirects: 5,
  };

  let res;
  try {
    ${generateHttpCall(method)}
  } catch (err) {
    // Catch connection aborts gracefully
  }

  if (res) {
    check(res, {
      'status is 2xx': (r) => r.status >= 200 && r.status < 300,
      'status is not 5xx': (r) => r.status < 500,
    });
  }
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      type: 'LOADCHECK_FINAL_SUMMARY',
      data: data
    })
  };
}
`.trim();

  return script;
}

function generateHttpCall(method) {
  switch (method) {
    case 'GET':
      return 'res = http.get(TARGET_URL, params);';
    case 'POST':
      return 'res = http.post(TARGET_URL, PAYLOAD, params);';
    case 'PUT':
      return 'res = http.put(TARGET_URL, PAYLOAD, params);';
    case 'PATCH':
      return 'res = http.patch(TARGET_URL, PAYLOAD, params);';
    case 'DELETE':
      return 'res = http.del(TARGET_URL, PAYLOAD, params);';
    case 'HEAD':
      return 'res = http.head(TARGET_URL, params);';
    case 'OPTIONS':
      return 'res = http.options(TARGET_URL, null, params);';
    default:
      return `res = http.request(${JSON.stringify(method)}, TARGET_URL, PAYLOAD, params);`;
  }
}

// ─── Test Type Stage Builders ────────────────────────────────────────────────

/**
 * Stress: incremental ramp up until the system cracks, no ramp-down.
 * Each step increases VUs by `stepVus` for `stepDuration`.
 */
function buildStressStages(loadProfile) {
  const maxVus = Math.min(Number(loadProfile.vus) || 200, 1000);
  const steps = Number(loadProfile.steps) || 5;
  const stepDuration = loadProfile.stepDuration || '30s';
  const stepSize = Math.ceil(maxVus / steps);
  const stages = [];
  for (let i = 1; i <= steps; i++) {
    stages.push({ duration: stepDuration, target: Math.min(stepSize * i, maxVus) });
  }
  return stages;
}

/**
 * Spike: flat baseline → instantaneous spike → recovery back to baseline.
 * Shape:  ___/‾‾‾\___
 */
function buildSpikeStages(loadProfile) {
  const baselineVus = Math.max(Number(loadProfile.baselineVus) || 10, 1);
  const spikeVus = Math.min(Number(loadProfile.spikeVus) || 200, 1000);
  const baselineDuration = loadProfile.baselineDuration || '30s';
  const spikeDuration = loadProfile.spikeDuration || '10s';
  const recoveryDuration = loadProfile.recoveryDuration || '30s';
  return [
    { duration: baselineDuration, target: baselineVus },  // hold baseline
    { duration: '5s',             target: spikeVus },     // instant spike
    { duration: spikeDuration,    target: spikeVus },     // hold spike
    { duration: '5s',             target: baselineVus },  // drop back
    { duration: recoveryDuration, target: baselineVus },  // recovery observation
  ];
}

/**
 * Soak: quick ramp-up, long sustained plateau, short ramp-down.
 * Shape:  /‾‾‾‾‾‾‾‾‾‾‾‾‾\
 */
function buildSoakStages(loadProfile) {
  const vus = Math.min(Number(loadProfile.vus) || 50, 1000);
  const rampUp = loadProfile.rampUp || '2m';
  const sustainDuration = loadProfile.sustainDuration || '30m';
  const rampDown = loadProfile.rampDown || '2m';
  return [
    { duration: rampUp,          target: vus },   // ramp up
    { duration: sustainDuration, target: vus },   // sustain
    { duration: rampDown,        target: 0 },     // ramp down
  ];
}
