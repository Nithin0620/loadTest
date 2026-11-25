import { targetMetrics } from '../../../lib/observability/targetMetrics.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleMock(request, 'GET');
}

export async function POST(request) {
  return handleMock(request, 'POST');
}

export async function PUT(request) {
  return handleMock(request, 'PUT');
}

export async function PATCH(request) {
  return handleMock(request, 'PATCH');
}

export async function DELETE(request) {
  return handleMock(request, 'DELETE');
}

async function handleMock(request, method) {
  const url = new URL(request.url);
  const delay = Math.max(0, Math.min(5000, parseInt(url.searchParams.get('delay') || '0', 10) || 0));
  const status = Math.max(100, Math.min(599, parseInt(url.searchParams.get('status') || '200', 10) || 200));
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const finish = targetMetrics.begin({
    method,
    path: url.pathname,
    requestId,
    runId: request.headers.get('x-loadcheck-run-id'),
    userAgent: request.headers.get('user-agent'),
  });

  try {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    let body = null;
    try {
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        body = await request.json().catch(() => null);
      }
    } catch {
      // ignore malformed payloads
    }

    return Response.json({
      message: 'LoadCheck Mock Target Response',
      method,
      timestamp: new Date().toISOString(),
      delayMs: delay,
      echoBody: body,
      requestId,
    }, {
      status,
      headers: { 'X-Request-Id': requestId },
    });
  } finally {
    finish(status);
  }
}
