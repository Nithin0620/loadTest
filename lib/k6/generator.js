/**
 * Generates an executable ES6 script for k6 from a TestConfig / snapshotConfig object.
 */
export function generateK6Script(config, runId = 'default-run') {
  const method = (config.httpMethod || 'GET').toUpperCase();
  const url = config.targetUrl;
  if (!url) {
    throw new Error('Target URL is required to generate k6 script');
  }

  // Construct Options
  const loadProfile = config.loadProfile || { type: 'constant_vus', vus: 10, duration: '10s' };
  let optionsObj = {};

  if (loadProfile.type === 'ramping_vus' && Array.isArray(loadProfile.stages) && loadProfile.stages.length > 0) {
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
        preAllocatedVUs: Math.max(10, Math.min(loadProfile.vus || 50, 1000)),
        maxVUs: 1000,
      }
    };
  } else {
    // Constant VUs (default)
    optionsObj.vus = Math.min(Number(loadProfile.vus) || 10, 1000);
    optionsObj.duration = loadProfile.duration || '10s';
  }

  // Inject thresholds if provided
  if (Array.isArray(config.thresholds) && config.thresholds.length > 0) {
    optionsObj.thresholds = {};
    for (const t of config.thresholds) {
      if (t.metric && t.operator && t.value !== undefined) {
        const key = t.metric;
        const expr = `${t.operator}${t.value}`;
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
  };

  let res;
  ${generateHttpCall(method)}

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'status is not 5xx': (r) => r.status < 500,
  });
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
