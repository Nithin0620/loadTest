import test from 'node:test';
import assert from 'node:assert/strict';
import { connectToDatabase, disconnectDatabase } from '../lib/db/mongoose.js';
import TestConfig from '../models/TestConfig.js';
import TestRun from '../models/TestRun.js';

test('Database Foundation & Models Test Suite', async (t) => {
  await t.test('should connect to database successfully', async () => {
    const conn = await connectToDatabase();
    assert.ok(conn, 'Mongoose connection should be established');
    assert.equal(conn.connection.readyState, 1, 'Connection state should be 1 (connected)');
  });

  await t.test('should create, validate, and retrieve a TestConfig document', async () => {
    const configData = {
      name: 'User Login Endpoint Load Test',
      targetUrl: 'https://api.example.com/v1/auth/login',
      httpMethod: 'POST',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      auth: { authType: 'bearer', token: 'secret-token-xyz' },
      bodyType: 'json',
      bodyContent: JSON.stringify({ email: 'load@test.com', pass: '123456' }),
      loadProfile: {
        type: 'ramping_vus',
        stages: [
          { duration: '10s', target: 50 },
          { duration: '20s', target: 100 }
        ]
      }
    };

    const created = await TestConfig.create(configData);
    assert.ok(created._id, 'Document should have an _id');
    assert.equal(created.name, 'User Login Endpoint Load Test');
    assert.equal(created.loadProfile.stages.length, 2);

    const fetched = await TestConfig.findById(created._id);
    assert.equal(fetched.targetUrl, 'https://api.example.com/v1/auth/login');
  });

  await t.test('should create, update, and retrieve a TestRun document with timeSeries metrics', async () => {
    const runData = {
      snapshotConfig: { targetUrl: 'https://api.example.com/v1/auth/login', vus: 100 },
      status: 'running',
      startedAt: new Date(),
      timeSeriesMetrics: [
        {
          second: 1,
          currentRps: 150,
          activeVus: 20,
          p95Latency: 110,
          avgLatency: 80,
          errorCount: 0,
          status2xx: 150,
          status4xx: 0,
          status5xx: 0
        }
      ]
    };

    const run = await TestRun.create(runData);
    assert.ok(run._id);
    assert.equal(run.status, 'running');

    // Update with completion summary
    run.status = 'completed';
    run.finishedAt = new Date();
    run.metricsSummary.totalRequests = 1500;
    run.metricsSummary.peakRps = 240;
    run.metricsSummary.latency.p95 = 145.5;
    await run.save();

    const updated = await TestRun.findById(run._id);
    assert.equal(updated.status, 'completed');
    assert.equal(updated.metricsSummary.totalRequests, 1500);
    assert.equal(updated.metricsSummary.latency.p95, 145.5);
  });

  // Clean up
  t.after(async () => {
    await disconnectDatabase();
  });
});
