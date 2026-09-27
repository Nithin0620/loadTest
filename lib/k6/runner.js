import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import readline from 'readline';
import { generateK6Script } from './generator.js';
import { ensureK6Binary } from '../../scripts/ensure-k6.js';
import { k6EventBus } from './eventBus.js';
import { connectToDatabase } from '../db/mongoose.js';
import TestRun from '../../models/TestRun.js';

// In-memory process registry for active runs
const activeProcesses = new Map();

/**
 * Executes a load test run with k6, streaming telemetry in real-time.
 */
export async function runK6Test(runId, config) {
  await connectToDatabase();

  const scriptContent = generateK6Script(config, runId);
  const tempScriptPath = path.join(os.tmpdir(), `loadcheck-${runId}.js`);
  fs.writeFileSync(tempScriptPath, scriptContent, 'utf-8');

  let k6BinaryPath;
  try {
    k6BinaryPath = await ensureK6Binary();
  } catch (err) {
    const errorMsg = `Failed to locate or download k6 binary: ${err.message}`;
    await updateRunError(runId, errorMsg);
    throw new Error(errorMsg);
  }

  // Mark run as started in DB
  const startedAt = new Date();
  await TestRun.findByIdAndUpdate(runId, {
    status: 'running',
    startedAt,
  });

  return new Promise((resolve, reject) => {
    // Spawn k6 with ndjson stdout stream and summary
    const child = spawn(k6BinaryPath, ['run', '--out', 'json=stdout', '--quiet', tempScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, K6_NO_COLOR: 'true' }
    });

    activeProcesses.set(String(runId), { child, tempScriptPath, startedAt });

    const rl = readline.createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    });

    let secondCounter = 0;
    let currentVus = 0;
    let rollingReqCount = 0;
    let rollingLatencies = [];
    let rollingErrors = 0;
    let rolling2xx = 0;
    let rolling4xx = 0;
    let rolling5xx = 0;

    const allTimeSeries = [];
    let summaryJsonData = null;
    let stdoutLogBuffer = '';

    // Overall counters for summary fallback
    let totalReqs = 0;
    let total2xx = 0;
    let total4xx = 0;
    let total5xx = 0;
    let allLatencies = [];
    let peakRps = 0;

    // 1-second rolling tick interval
    const tickInterval = setInterval(async () => {
      secondCounter++;
      const currentRps = rollingReqCount;
      if (currentRps > peakRps) peakRps = currentRps;

      const p95Latency = calculatePercentile(rollingLatencies, 95);
      const avgLatency = rollingLatencies.length > 0
        ? rollingLatencies.reduce((a, b) => a + b, 0) / rollingLatencies.length
        : 0;

      const tickData = {
        runId: String(runId),
        second: secondCounter,
        currentRps,
        activeVus: currentVus,
        p95Latency: Number(p95Latency.toFixed(1)),
        avgLatency: Number(avgLatency.toFixed(1)),
        errorCount: rollingErrors,
        status2xx: rolling2xx,
        status4xx: rolling4xx,
        status5xx: rolling5xx,
        totalRequests: totalReqs,
      };

      allTimeSeries.push({
        second: secondCounter,
        timestamp: new Date(),
        currentRps,
        activeVus: currentVus,
        p95Latency: Number(p95Latency.toFixed(1)),
        avgLatency: Number(avgLatency.toFixed(1)),
        errorCount: rollingErrors,
        status2xx: rolling2xx,
        status4xx: rolling4xx,
        status5xx: rolling5xx,
      });

      // Broadcast tick to SSE listeners
      k6EventBus.emitTick(String(runId), tickData);

      // Reset rolling window
      rollingReqCount = 0;
      rollingLatencies = [];
      rollingErrors = 0;
      rolling2xx = 0;
      rolling4xx = 0;
      rolling5xx = 0;
    }, 1000);

    // Parse NDJSON streaming output from k6
    rl.on('line', (line) => {
      if (!line || !line.trim()) return;
      stdoutLogBuffer += line + '\n';

      try {
        const parsed = JSON.parse(line.trim());

        // Check if custom summary payload emitted by handleSummary
        if (parsed.type === 'LOADCHECK_FINAL_SUMMARY' && parsed.data) {
          summaryJsonData = parsed.data;
          return;
        }

        // Standard k6 metric point
        if (parsed.metric === 'http_reqs' && parsed.type === 'Point') {
          rollingReqCount += (parsed.data?.value || 1);
          totalReqs += (parsed.data?.value || 1);

          const status = Number(parsed.data?.tags?.status) || 200;
          if (status >= 200 && status < 300) {
            rolling2xx++;
            total2xx++;
          } else if (status >= 400 && status < 500) {
            rolling4xx++;
            total4xx++;
          } else if (status >= 500) {
            rolling5xx++;
            total5xx++;
            rollingErrors++;
          }
        } else if (parsed.metric === 'http_req_duration' && parsed.type === 'Point') {
          const dur = Number(parsed.data?.value) || 0;
          rollingLatencies.push(dur);
          allLatencies.push(dur);
        } else if (parsed.metric === 'vus' && parsed.type === 'Point') {
          currentVus = Number(parsed.data?.value) || currentVus;
        }
      } catch {
        // Non-JSON line from k6 banner/log
      }
    });

    let stderrBuffer = '';
    child.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });

    child.on('error', async (err) => {
      clearInterval(tickInterval);
      cleanupTempScript(tempScriptPath);
      activeProcesses.delete(String(runId));
      await updateRunError(runId, err.message);
      k6EventBus.emitError(String(runId), { message: err.message });
      reject(err);
    });

    child.on('close', async (code) => {
      clearInterval(tickInterval);
      cleanupTempScript(tempScriptPath);
      const isStillActive = activeProcesses.has(String(runId));
      activeProcesses.delete(String(runId));

      const finishedAt = new Date();
      const durationSeconds = Math.max(1, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000));

      if (!isStillActive) {
        // Run was cancelled explicitly
        return resolve({ status: 'cancelled' });
      }

      // If k6 collected any metrics/requests or emitted a summary, mark as completed
      const status = (code === 0 || code === 99 || totalReqs > 0 || summaryJsonData) ? 'completed' : 'failed';
      const summaryMetrics = compileFinalMetrics({
        summaryJsonData,
        totalReqs,
        total2xx,
        total4xx,
        total5xx,
        allLatencies,
        peakRps,
        durationSeconds,
      });

      try {
        await connectToDatabase();
        const updated = await TestRun.findByIdAndUpdate(runId, {
          status,
          finishedAt,
          durationSeconds,
          exitCode: code,
          errorMessage: status === 'failed' ? stderrBuffer || 'Process exited with non-zero code' : null,
          metricsSummary: summaryMetrics,
          timeSeriesMetrics: allTimeSeries,
          rawSummaryJson: summaryJsonData ? JSON.stringify(summaryJsonData) : '',
        }, { new: true });

        k6EventBus.emitDone(String(runId), {
          status,
          metricsSummary: summaryMetrics,
          durationSeconds,
        });

        resolve(updated);
      } catch (dbErr) {
        console.error('[LoadCheck Runner] Error saving completed test run to DB:', dbErr);
        resolve({ status, metricsSummary: summaryMetrics });
      }
    });
  });
}

/**
 * Cancels an active test run by sending SIGTERM to the k6 process.
 */
export async function cancelK6Test(runId) {
  const active = activeProcesses.get(String(runId));
  if (!active) {
    return false;
  }

  activeProcesses.delete(String(runId));

  try {
    if (active.child && !active.child.killed) {
      active.child.kill('SIGTERM');
      setTimeout(() => {
        if (active.child && !active.child.killed) {
          active.child.kill('SIGKILL');
        }
      }, 2000);
    }
  } catch (err) {
    console.error('[LoadCheck Runner] Error killing child process:', err);
  }

  cleanupTempScript(active.tempScriptPath);

  await connectToDatabase();
  await TestRun.findByIdAndUpdate(runId, {
    status: 'cancelled',
    finishedAt: new Date(),
  });

  k6EventBus.emitDone(String(runId), { status: 'cancelled' });
  return true;
}

/**
 * Returns true if test is actively running.
 */
export function isTestRunning(runId) {
  return activeProcesses.has(String(runId));
}

function calculatePercentile(numbers, p) {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

function compileFinalMetrics({ summaryJsonData, totalReqs, total2xx, total4xx, total5xx, allLatencies, peakRps, durationSeconds }) {
  if (summaryJsonData && summaryJsonData.metrics) {
    const m = summaryJsonData.metrics;
    const reqDuration = m.http_req_duration?.values || {};
    const reqs = m.http_reqs?.values?.count || totalReqs;
    const failedReqs = m.http_req_failed?.values?.passes || (total4xx + total5xx);
    const successfulReqs = Math.max(0, reqs - failedReqs);
    const errorRate = reqs > 0 ? (failedReqs / reqs) * 100 : 0;
    const avgRps = durationSeconds > 0 ? Number((reqs / durationSeconds).toFixed(1)) : 0;

    return {
      totalRequests: reqs,
      successfulRequests: successfulReqs,
      failedRequests: failedReqs,
      errorRate: Number(errorRate.toFixed(2)),
      peakRps: peakRps || Math.ceil(reqs / Math.max(1, durationSeconds)),
      avgRps: avgRps,
      latency: {
        avg: Number((reqDuration.avg || 0).toFixed(1)),
        min: Number((reqDuration.min || 0).toFixed(1)),
        med: Number((reqDuration.med || 0).toFixed(1)),
        max: Number((reqDuration.max || 0).toFixed(1)),
        p90: Number((reqDuration['p(90)'] || 0).toFixed(1)),
        p95: Number((reqDuration['p(95)'] || 0).toFixed(1)),
        p99: Number((reqDuration['p(99)'] || 0).toFixed(1)),
      },
      dataTransferred: {
        receivedBytes: m.data_received?.values?.count || 0,
        sentBytes: m.data_sent?.values?.count || 0,
      },
      statusCodes: {
        '2xx': total2xx || successfulReqs,
        '4xx': total4xx,
        '5xx': total5xx || failedReqs,
      },
      checksPassed: m.checks?.values?.passes || 0,
      checksFailed: m.checks?.values?.fails || 0,
    };
  }

  // Fallback if summary json was not captured
  const sorted = [...allLatencies].sort((a, b) => a - b);
  const failed = total4xx + total5xx;
  const errorRate = totalReqs > 0 ? (failed / totalReqs) * 100 : 0;
  const avgRps = durationSeconds > 0 ? Number((totalReqs / durationSeconds).toFixed(1)) : 0;

  return {
    totalRequests: totalReqs,
    successfulRequests: total2xx,
    failedRequests: failed,
    errorRate: Number(errorRate.toFixed(2)),
    peakRps: peakRps,
    avgRps: avgRps,
    latency: {
      avg: Number((allLatencies.length ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0).toFixed(1)),
      min: Number((sorted[0] || 0).toFixed(1)),
      med: Number((calculatePercentile(sorted, 50)).toFixed(1)),
      max: Number((sorted[sorted.length - 1] || 0).toFixed(1)),
      p90: Number((calculatePercentile(sorted, 90)).toFixed(1)),
      p95: Number((calculatePercentile(sorted, 95)).toFixed(1)),
      p99: Number((calculatePercentile(sorted, 99)).toFixed(1)),
    },
    dataTransferred: { receivedBytes: 0, sentBytes: 0 },
    statusCodes: { '2xx': total2xx, '4xx': total4xx, '5xx': total5xx },
    checksPassed: total2xx,
    checksFailed: failed,
  };
}

async function updateRunError(runId, errorMsg) {
  try {
    await connectToDatabase();
    await TestRun.findByIdAndUpdate(runId, {
      status: 'failed',
      finishedAt: new Date(),
      errorMessage: errorMsg,
    });
  } catch (err) {
    console.error('[LoadCheck Runner] DB error updating run failure:', err);
  }
}

function cleanupTempScript(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup error
  }
}
