import { NextResponse } from 'next/server';

export async function POST(req) {
  const response = NextResponse.json({ success: true }, { status: 200 });

  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = isProd ? '.ssh.net.in' : undefined;

  // Clear auth cookies
  const cookiesToClear = [
    'auth_token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      domain: cookieDomain,
    });
    // Also clear with undefined domain just in case it was set locally
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  });

  return response;
}
