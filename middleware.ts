import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtener la respuesta por defecto
  const response = NextResponse.next();

  // 1. Content Security Policy (CSP)
  // Permite scripts propios, estilos en línea (requerido por Tailwind CSS y Next.js), y conexiones seguras con Supabase
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data:;
    font-src 'self' https://fonts.gstatic.com;
    media-src 'self' https://hdwbmwnppatfbwntiskd.supabase.co;
    connect-src 'self' https://hdwbmwnppatfbwntiskd.supabase.co wss://hdwbmwnppatfbwntiskd.supabase.co;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // 2. Mitigación de Clickjacking (X-Frame-Options: DENY)
  response.headers.set('X-Frame-Options', 'DENY');

  // 3. Mitigación de MIME sniffing (X-Content-Type-Options: nosniff)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 4. Strict-Transport-Security (HSTS) - Fuerza HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 5. Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Permissions Policy (Deshabilita APIs del navegador no deseadas)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  return response;
}

// Configura el middleware para ejecutarse en todas las rutas excepto archivos estáticos
export const config = {
  matcher: [
    /*
     * Aplica a todos los paths excepto:
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (optimización de imágenes)
     * - favicon.ico y archivos .ico (icono del sitio)
     * - Archivos en public (imágenes, audios, etc.)
     */
    '/((?!_next/static|_next/image|.*\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
};
