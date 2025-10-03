import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  let token = request.headers.get('authorization')?.replace('Bearer ', '');

  // Also check for token in query parameters (for download links)
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('token') || undefined;
  }

  console.log('Middleware check for:', request.url, 'Token:', token ? 'present' : 'missing');

  if (!token) {
    console.log('No token provided');
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    console.log('Token verified successfully');
    return NextResponse.next();
  } catch (error) {
    console.log('Token verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/attendees/:path*', '/api/upload/:path*', '/api/download/:path*', '/api/template/:path*'],
};