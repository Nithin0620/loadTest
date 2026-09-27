import mongoose from 'mongoose';

const TimeSeriesMetricSchema = new mongoose.Schema({
  second: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  currentRps: { type: Number, default: 0 },
  activeVus: { type: Number, default: 0 },
  p95Latency: { type: Number, default: 0 },
  avgLatency: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  status2xx: { type: Number, default: 0 },
  status4xx: { type: Number, default: 0 },
  status5xx: { type: Number, default: 0 }
}, { _id: false });

const TestRunSchema = new mongoose.Schema({
  testConfigId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestConfig', required: false },
  snapshotConfig: { type: Object, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], 
    default: 'pending',
    index: true
  },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  exitCode: { type: Number },
  errorMessage: { type: String, default: null },

  // Final Summary Benchmarks
  metricsSummary: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    peakRps: { type: Number, default: 0 },
    avgRps: { type: Number, default: 0 },
    latency: {
      avg: { type: Number, default: 0 },
      min: { type: Number, default: 0 },
      med: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      p90: { type: Number, default: 0 },
      p95: { type: Number, default: 0 },
      p99: { type: Number, default: 0 }
    },
    dataTransferred: {
      receivedBytes: { type: Number, default: 0 },
      sentBytes: { type: Number, default: 0 }
    },
    statusCodes: { type: Map, of: Number, default: {} },
    checksPassed: { type: Number, default: 0 },
    checksFailed: { type: Number, default: 0 }
  },

  timeSeriesMetrics: [TimeSeriesMetricSchema],
  rawSummaryJson: { type: String, default: '' }
}, { 
  timestamps: true 
});

export default mongoose.models.TestRun || mongoose.model('TestRun', TestRunSchema);
