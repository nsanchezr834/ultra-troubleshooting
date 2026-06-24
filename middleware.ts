import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data:;
    font-src 'self' https://fonts.gstatic.com;
    media-src 'self' https://hdwbmwnppatfbwntiskd.supabase.co;
    connect-src 'self'
      https://hdwbmwnppatfbwntiskd.supabase.co
      wss://hdwbmwnppatfbwntiskd.supabase.co
      https://fcm.googleapis.com
      https://*.push.services.mozilla.com
      https://*.notify.windows.com
      https://*.push.apple.com;
    worker-src 'self';
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // 2. Mitigación de Clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // 3. Mitigación de MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 4. Strict-Transport-Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 5. Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
};