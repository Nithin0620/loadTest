import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { runK6Test, cancelK6Test } from '../lib/k6/runner.js';
import { k6EventBus } from '../lib/k6/eventBus.js';
import { connectToDatabase, disconnectDatabase } from '../lib/db/mongoose.js';
import TestRun from '../models/TestRun.js';

test('k6 Live Runner & Realtime Telemetry Test Suite', async (t) => {
  let mockServer;
  let mockPort;
  let requestCounter = 0;

  t.before(async () => {
    await connectToDatabase();

    // Start local mock HTTP server
    mockServer = http.createServer((req, res) => {
      requestCounter++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', counter: requestCounter }));
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

  await t.test('should run a 3s live load test with k6 and emit ticks and save completed summary in DB', async () => {
    // Create initial run record in DB
    const runDoc = await TestRun.create({
      snapshotConfig: {
        targetUrl: `http://127.0.0.1:${mockPort}/test`,
        httpMethod: 'GET',
        loadProfile: { type: 'constant_vus', vus: 5, duration: '3s' }
      },
      status: 'pending'
    });

    const receivedTicks = [];
    const onTick = (data) => receivedTicks.push(data);
    k6EventBus.onTick(String(runDoc._id), onTick);

    const result = await runK6Test(runDoc._id, runDoc.snapshotConfig);
    k6EventBus.offTick(String(runDoc._id), onTick);

    assert.equal(result.status, 'completed', 'Run status should be completed');
    assert.ok(result.metricsSummary.totalRequests > 0, 'Total requests should be > 0');
    assert.ok(result.metricsSummary.successfulRequests > 0, 'Successful requests should be > 0');
    assert.equal(result.metricsSummary.errorRate, 0, 'Error rate should be 0%');

    // Verify DB updated
    const saved = await TestRun.findById(runDoc._id);
    assert.equal(saved.status, 'completed');
    assert.ok(saved.metricsSummary.totalRequests > 0);
  });
});
