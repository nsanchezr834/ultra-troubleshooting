import { NextResponse } from 'next/server';
import { generateCsrfToken } from '../../../lib/security';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  let csrfToken = cookieStore.get('csrf_token')?.value;

  if (!csrfToken) {
    csrfToken = generateCsrfToken();
  }

  // Siempre volvemos a firmar/establecer la cookie CSRF para asegurar consistencia
  cookieStore.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1 hora
  });

  return NextResponse.json({ csrfToken });
}
