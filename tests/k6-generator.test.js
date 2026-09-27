import test from 'node:test';
import assert from 'node:assert/strict';
import { generateK6Script } from '../lib/k6/generator.js';

test('k6 Script Generator Test Suite', async (t) => {
  await t.test('should generate valid k6 script for constant VUs GET request', () => {
    const config = {
      targetUrl: 'https://httpbin.org/get',
      httpMethod: 'GET',
      loadProfile: { type: 'constant_vus', vus: 25, duration: '15s' }
    };

    const script = generateK6Script(config, 'run-123');

    assert.ok(script.includes("import http from 'k6/http';"));
    assert.ok(script.includes('"vus": 25'));
    assert.ok(script.includes('"duration": "15s"'));
    assert.ok(script.includes('http.get(TARGET_URL'));
    assert.ok(script.includes('"X-LoadCheck-Run-Id": "run-123"'));
  });

  await t.test('should generate valid k6 script for ramping stages POST request with Bearer token', () => {
    const config = {
      targetUrl: 'https://api.example.com/items',
      httpMethod: 'POST',
      headers: [{ key: 'X-App-Env', value: 'staging', enabled: true }],
      auth: { authType: 'bearer', token: 'jwt-abc-xyz' },
      bodyType: 'json',
      bodyContent: '{"name": "test item"}',
      loadProfile: {
        type: 'ramping_vus',
        stages: [
          { duration: '5s', target: 20 },
          { duration: '10s', target: 80 }
        ]
      },
      thresholds: [
        { metric: 'http_req_duration', operator: 'p95<', value: 300 }
      ]
    };

    const script = generateK6Script(config, 'run-456');

    assert.ok(script.includes('"stages": ['));
    assert.ok(script.includes('"duration": "5s"'));
    assert.ok(script.includes('"target": 20'));
    assert.ok(script.includes('"Authorization": "Bearer jwt-abc-xyz"'));
    assert.ok(script.includes('"X-App-Env": "staging"'));
    assert.ok(script.includes('http.post(TARGET_URL, PAYLOAD'));
    assert.ok(script.includes('"p95<300"'));
  });

  await t.test('should generate constant RPS scenario script', () => {
    const config = {
      targetUrl: 'https://api.example.com/stream',
      httpMethod: 'GET',
      loadProfile: { type: 'constant_rps', targetRps: 200, duration: '20s', vus: 50 }
    };

    const script = generateK6Script(config, 'run-789');

    assert.ok(script.includes('"executor": "constant-arrival-rate"'));
    assert.ok(script.includes('"rate": 200'));
    assert.ok(script.includes('"duration": "20s"'));
  });
});
