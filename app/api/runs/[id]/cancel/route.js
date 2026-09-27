import { cancelK6Test } from '../../../../lib/k6/runner.js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const cancelled = await cancelK6Test(id);

    return Response.json({
      success: true,
      cancelled,
      message: cancelled ? 'Test run cancelled successfully' : 'Test run was not active or already finished',
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
