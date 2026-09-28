import { NextResponse } from 'next/server';

const WORKFLOW_API_URL = process.env.WORKFLOW_API_URL || 'https://workflow.ssh.net.in';

export async function POST(req) {
  try {
    const body = await req.json();

    const workflowRes = await fetch(`${WORKFLOW_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await workflowRes.json();

    if (!workflowRes.ok) {
      return NextResponse.json(
        { error: data.error || 'Invalid email or password' },
        { status: workflowRes.status }
      );
    }

    const response = NextResponse.json(data, { status: 200 });

    // Set cross-subdomain cookie or local cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = isProd ? '.ssh.net.in' : undefined;

    if (data.token) {
      response.cookies.set('auth_token', data.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        domain: cookieDomain,
      });
    }

    return response;
  } catch (err) {
    console.error('Benchley auth login proxy error:', err);
    return NextResponse.json({ error: 'Failed to connect to authentication server' }, { status: 500 });
  }
}
