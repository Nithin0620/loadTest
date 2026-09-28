import { connectToDatabase } from '../../../lib/db/mongoose.js';
import TestRun from '../../../models/TestRun.js';
import TestConfig from '../../../models/TestConfig.js';
import { runK6Test } from '../../../lib/k6/runner.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const runs = await TestRun.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return Response.json({ success: true, runs });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.targetUrl) {
      return Response.json({ success: false, error: 'targetUrl is required' }, { status: 400 });
    }

    // Safety limits
    const vus = Math.min(Number(body.loadProfile?.vus || body.vus || 10), 1000);
    const targetRps = Math.min(Number(body.loadProfile?.targetRps || 100), 2500);

    const testType = ['load', 'stress', 'spike', 'soak'].includes(body.testType) ? body.testType : 'load';

    const snapshotConfig = {
      name: body.name || `${testType.charAt(0).toUpperCase() + testType.slice(1)} Test against ${new URL(body.targetUrl).hostname}`,
      testType,
      targetUrl: body.targetUrl,
      httpMethod: (body.httpMethod || 'GET').toUpperCase(),
      headers: Array.isArray(body.headers) ? body.headers : [],
      auth: body.auth || { authType: 'none' },
      bodyType: body.bodyType || 'none',
      bodyContent: body.bodyContent || '',
      loadProfile: {
        type: body.loadProfile?.type || 'constant_vus',
        vus: vus,
        duration: body.loadProfile?.duration || body.duration || '10s',
        stages: Array.isArray(body.loadProfile?.stages) ? body.loadProfile.stages : [],
        targetRps: targetRps,
      },
      thresholds: Array.isArray(body.thresholds) ? body.thresholds : []
    };

    // Optionally save TestConfig if saveAsTemplate is flagged
    let testConfigId = null;
    if (body.saveAsTemplate) {
      const configDoc = await TestConfig.create(snapshotConfig);
      testConfigId = configDoc._id;
    }

    // Create TestRun record
    const runDoc = await TestRun.create({
      testConfigId,
      snapshotConfig,
      status: 'pending',
    });

    // Start k6 runner in background
    runK6Test(runDoc._id, snapshotConfig).catch((err) => {
      console.error('[API /api/runs] Background run error:', err);
    });

    return Response.json({
      success: true,
      runId: runDoc._id,
      status: 'pending',
      message: 'Test run initiated',
    }, { status: 201 });
  } catch (err) {
    console.error('[API /api/runs] Error creating test run:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
