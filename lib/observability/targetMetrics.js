const MAX_BUCKETS = 300;
const MAX_RECENT = 40;
const MAX_LATENCY_SAMPLES = 5000;

class TargetMetricsCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.startedAt = Date.now();
    this.totalRequests = 0;
    this.inFlight = 0;
    this.errorCount = 0;
    this.serverErrorCount = 0;
    this.lastRequestAt = null;
    this.byMethod = Object.create(null);
    this.byStatus = Object.create(null);
    this.byPath = Object.create(null);
    this.byRun = Object.create(null);
    this.buckets = new Map();
    this.recent = [];
    this.latencies = new Array(MAX_LATENCY_SAMPLES);
    this.latencyCursor = -1;
    this.latencyCount = 0;
  }

  begin({ method, path, requestId, runId, userAgent }) {
    this.inFlight += 1;
    const startedAt = Date.now();

    return (status) => {
      this.inFlight = Math.max(0, this.inFlight - 1);
      this._record({
        method,
        path,
        status,
        requestId,
        runId,
        userAgent,
        durationMs: Date.now() - startedAt,
      });
    };
  }

  _record({ method, path, status, requestId, runId, userAgent, durationMs }) {
    const now = Date.now();
    const second = Math.floor(now / 1000);

    this.totalRequests += 1;
    this.lastRequestAt = new Date(now).toISOString();
    this.byMethod[method] = (this.byMethod[method] || 0) + 1;
    this.byStatus[status] = (this.byStatus[status] || 0) + 1;
    this.byPath[path] = (this.byPath[path] || 0) + 1;
    if (runId && runId !== 'undefined') {
      this.byRun[runId] = (this.byRun[runId] || 0) + 1;
    }
    if (status >= 400) this.errorCount += 1;
    if (status >= 500) this.serverErrorCount += 1;

    const bucket = this.buckets.get(second) || { requests: 0, errors: 0 };
    bucket.requests += 1;
    if (status >= 400) bucket.errors += 1;
    this.buckets.set(second, bucket);

    const cutoff = second - MAX_BUCKETS + 1;
    for (const key of this.buckets.keys()) {
      if (key < cutoff) this.buckets.delete(key);
    }

    this.latencyCursor = (this.latencyCursor + 1) % MAX_LATENCY_SAMPLES;
    this.latencies[this.latencyCursor] = durationMs;
    this.latencyCount = Math.min(this.latencyCount + 1, MAX_LATENCY_SAMPLES);

    this.recent.unshift({
      time: new Date(now).toISOString(),
      method,
      path,
      status,
      durationMs,
      requestId,
      runId: runId && runId !== 'undefined' ? runId : null,
      userAgent: userAgent || null,
    });
    if (this.recent.length > MAX_RECENT) this.recent.pop();
  }

  getSnapshot(windowSeconds = 120) {
    const window = Math.max(10, Math.min(MAX_BUCKETS, Number(windowSeconds) || 120));
    const nowSecond = Math.floor(Date.now() / 1000);
    const timeline = [];

    for (let second = nowSecond - window + 1; second <= nowSecond; second += 1) {
      const bucket = this.buckets.get(second);
      timeline.push({
        second,
        time: new Date(second * 1000).toISOString().slice(11, 19),
        requests: bucket ? bucket.requests : 0,
        errors: bucket ? bucket.errors : 0,
      });
    }

    const lastTen = timeline.slice(-10);
    const recentTotal = lastTen.reduce((sum, point) => sum + point.requests, 0);
    const peakRps = timeline.reduce((max, point) => Math.max(max, point.requests), 0);

    const samples = [];
    for (let i = 0; i < this.latencyCount; i += 1) {
      const index = (
        this.latencyCursor - this.latencyCount + 1 + i + MAX_LATENCY_SAMPLES
      ) % MAX_LATENCY_SAMPLES;
      const value = this.latencies[index];
      if (Number.isFinite(value)) samples.push(value);
    }
    samples.sort((a, b) => a - b);
    const percentile = (p) => {
      if (samples.length === 0) return 0;
      const index = Math.min(samples.length - 1, Math.floor((p / 100) * samples.length));
      return Math.round(samples[index] * 10) / 10;
    };

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      startedAt: new Date(this.startedAt).toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      totals: {
        requests: this.totalRequests,
        inFlight: this.inFlight,
        errors: this.errorCount,
        serverErrors: this.serverErrorCount,
        errorRate: this.totalRequests
          ? Math.round((this.errorCount / this.totalRequests) * 1000) / 10
          : 0,
      },
      currentRps: Math.round((recentTotal / lastTen.length) * 10) / 10,
      peakRps,
      timeline,
      byMethod: this.byMethod,
      byStatus: this.byStatus,
      byPath: this.byPath,
      byRun: this.byRun,
      latency: {
        samples: samples.length,
        avgMs: samples.length
          ? Math.round((samples.reduce((sum, value) => sum + value, 0) / samples.length) * 10) / 10
          : 0,
        p50Ms: percentile(50),
        p95Ms: percentile(95),
        maxMs: samples.length ? samples[samples.length - 1] : 0,
      },
      recent: this.recent.slice(0, 20),
      lastRequestAt: this.lastRequestAt,
    };
  }
}

const globalKey = Symbol.for('loadcheck.targetMetrics');
if (!globalThis[globalKey]) {
  globalThis[globalKey] = new TargetMetricsCollector();
}

export const targetMetrics = globalThis[globalKey];
export default targetMetrics;
