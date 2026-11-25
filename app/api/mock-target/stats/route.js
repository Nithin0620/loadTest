import { targetMetrics } from '../../../../lib/observability/targetMetrics.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const windowSeconds = new URL(request.url).searchParams.get('window');
  return Response.json(targetMetrics.getSnapshot(windowSeconds || 120), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function DELETE() {
  targetMetrics.reset();
  return Response.json(targetMetrics.getSnapshot(120));
}
