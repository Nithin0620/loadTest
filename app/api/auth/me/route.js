import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKFLOW_API_URL = process.env.WORKFLOW_API_URL || 'https://workflow.ssh.net.in';

export async function GET(req) {
  try {
    const authToken = req.cookies.get('auth_token')?.value;
    const nextAuthToken =
      req.cookies.get('__Secure-next-auth.session-token')?.value ||
      req.cookies.get('next-auth.session-token')?.value;

    const authHeader = req.headers.get('authorization');

    if (!authToken && !nextAuthToken && !authHeader) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Pass along cookies for NextAuth session verification
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const workflowRes = await fetch(`${WORKFLOW_API_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers,
    });

    if (!workflowRes.ok) {
      return NextResponse.json({ user: null }, { status: workflowRes.status });
    }

    const data = await workflowRes.json();
    return NextResponse.json({ user: data.user || null }, { status: 200 });
  } catch (err) {
    console.error('Benchley /api/auth/me error:', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
