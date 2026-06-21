import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Borrar cookies de sesión y CSRF
  cookieStore.delete('session_id');
  cookieStore.delete('csrf_token');

  return NextResponse.json({ success: true });
}
