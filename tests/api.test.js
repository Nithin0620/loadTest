import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { GET as getMockTarget, POST as postMockTarget } from '../app/api/mock-target/route.js';
import { GET as getRuns, POST as postRun } from '../app/api/runs/route.js';
import { GET as getCompare } from '../app/api/runs/compare/route.js';
import { connectToDatabase, disconnectDatabase } from '../lib/db/mongoose.js';
import { k6EventBus } from '../lib/k6/eventBus.js';
import TestRun from '../models/TestRun.js';

test('API Route Handlers Test Suite', async (t) => {
  let mockServer;
  let mockPort;

  t.before(async () => {
    await connectToDatabase();

    // Start local mock HTTP server
    mockServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    });

    await new Promise((resolve) => {
      mockServer.listen(0, '127.0.0.1', () => {
        mockPort = mockServer.address().port;
        resolve();
      });
    });
  });

  t.after(async () => {
    if (mockServer) {
      await new Promise((resolve) => mockServer.close(resolve));
    }
    await disconnectDatabase();
  });

  await t.test('mock-target route should echo query delay and method', async () => {
    const req = new Request('http://localhost:3000/api/mock-target?delay=10&status=200');
    const res = await getMockTarget(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.method, 'GET');
    assert.equal(data.delayMs, 10);
  });

  await t.test('mock-target POST route should echo JSON body', async () => {
    const req = new Request('http://localhost:3000/api/mock-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: 'pong' })
    });
    const res = await postMockTarget(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.echoBody.ping, 'pong');
  });

  await t.test('POST /api/runs should validate and create a test run and complete execution', async () => {
    const req = new Request('http://localhost:3000/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: `http://127.0.0.1:${mockPort}/test`,
        httpMethod: 'GET',
        vus: 1,
        duration: '1s'
      })
    });

    const res = await postRun(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.runId);

    // Wait for the background k6 runner to finish so no dangling timers remain
    await new Promise((resolve) => {
      k6EventBus.onDone(String(data.runId), () => resolve());
    });
  });

  await t.test('GET /api/runs should list past test runs', async () => {
    const req = new Request('http://localhost:3000/api/runs?limit=5');
    const res = await getRuns(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.runs));
    assert.ok(data.runs.length > 0);
  });

  await t.test('GET /api/runs/compare should diff two completed runs', async () => {
    const run1 = await TestRun.create({
      snapshotConfig: { targetUrl: 'http://test.com/a' },
      status: 'completed',
      metricsSummary: {
        avgRps: 100,
        latency: { p95: 250, avg: 180 },
        errorRate: 2.0
      }
    });

    const run2 = await TestRun.create({
      snapshotConfig: { targetUrl: 'http://test.com/a' },
      status: 'completed',
      metricsSummary: {
        avgRps: 220,
        latency: { p95: 140, avg: 100 },
        errorRate: 0.1
      }
    });

    const req = new Request(`http://localhost:3000/api/runs/compare?run1=${run1._id}&run2=${run2._id}`);
    const res = await getCompare(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.diff.rps.improved, true);
    assert.equal(data.diff.rps.delta, 120);
    assert.equal(data.diff.p95Latency.improved, true);
    assert.equal(data.diff.p95Latency.delta, -110);
  });
});
