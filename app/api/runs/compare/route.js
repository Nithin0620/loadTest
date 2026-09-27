import { connectToDatabase } from '../../../../lib/db/mongoose.js';
import TestRun from '../../../../models/TestRun.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const run1Id = searchParams.get('run1');
    const run2Id = searchParams.get('run2');

    if (!run1Id || !run2Id) {
      return Response.json({
        success: false,
        error: 'Both run1 and run2 query parameters are required'
      }, { status: 400 });
    }

    const [runA, runB] = await Promise.all([
      TestRun.findById(run1Id).lean(),
      TestRun.findById(run2Id).lean(),
    ]);

    if (!runA || !runB) {
      return Response.json({
        success: false,
        error: 'One or both test runs could not be found'
      }, { status: 404 });
    }

    const diff = calculateRunDiff(runA, runB);

    return Response.json({
      success: true,
      runA,
      runB,
      diff,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

function calculateRunDiff(runA, runB) {
  const a = runA.metricsSummary || {};
  const b = runB.metricsSummary || {};

  const rpsA = a.avgRps || 0;
  const rpsB = b.avgRps || 0;
  const rpsDiff = Number((rpsB - rpsA).toFixed(1));
  const rpsPct = rpsA > 0 ? Number((((rpsB - rpsA) / rpsA) * 100).toFixed(1)) : 0;

  const p95A = a.latency?.p95 || 0;
  const p95B = b.latency?.p95 || 0;
  const p95Diff = Number((p95B - p95A).toFixed(1));
  const p95Pct = p95A > 0 ? Number((((p95B - p95A) / p95A) * 100).toFixed(1)) : 0;

  const avgLatA = a.latency?.avg || 0;
  const avgLatB = b.latency?.avg || 0;
  const avgLatDiff = Number((avgLatB - avgLatA).toFixed(1));

  const errRateA = a.errorRate || 0;
  const errRateB = b.errorRate || 0;
  const errRateDiff = Number((errRateB - errRateA).toFixed(2));

  return {
    rps: {
      baseline: rpsA,
      candidate: rpsB,
      delta: rpsDiff,
      percentDelta: rpsPct,
      improved: rpsDiff > 0,
    },
    p95Latency: {
      baseline: p95A,
      candidate: p95B,
      delta: p95Diff,
      percentDelta: p95Pct,
      improved: p95Diff < 0, // Lower latency is better
    },
    avgLatency: {
      baseline: avgLatA,
      candidate: avgLatB,
      delta: avgLatDiff,
      improved: avgLatDiff < 0,
    },
    errorRate: {
      baseline: errRateA,
      candidate: errRateB,
      delta: errRateDiff,
      improved: errRateDiff <= 0,
    }
  };
}
