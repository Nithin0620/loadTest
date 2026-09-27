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

export async function DELETE(request) {
  return handleMock(request, 'DELETE');
}

async function handleMock(request, method) {
  const { searchParams } = new URL(request.url);
  const delay = parseInt(searchParams.get('delay') || '0', 10);
  const status = parseInt(searchParams.get('status') || '200', 10);

  if (delay > 0) {
    await new Promise((res) => setTimeout(res, Math.min(delay, 5000)));
  }

  let body = null;
  try {
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.json().catch(() => null);
    }
  } catch {
    // ignore
  }

  return Response.json({
    message: 'LoadCheck Mock Target Response',
    method,
    timestamp: new Date().toISOString(),
    delayMs: delay,
    echoBody: body,
  }, { status });
}
