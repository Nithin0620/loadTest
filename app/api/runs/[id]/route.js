import { connectToDatabase } from '../../../../lib/db/mongoose.js';
import TestRun from '../../../../models/TestRun.js';
import { isTestRunning } from '../../../../lib/k6/runner.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const run = await TestRun.findById(id).lean();
    if (!run) {
      return Response.json({ success: false, error: 'Test run not found' }, { status: 404 });
    }

    const isRunning = isTestRunning(id);

    return Response.json({
      success: true,
      run: {
        ...run,
        isActivelyRunning: isRunning,
      }
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
