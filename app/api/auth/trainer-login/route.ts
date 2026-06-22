import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { secureCompare, createSessionToken, rateLimiter } from '../../../lib/security';

/**
 * POST /api/auth/trainer-login
 * Autentica al Trainer con TRAINER_PASSWORD.
 * Usa la misma lógica de seguridad que el operador (CSRF, rate limiting, timing-safe compare).
 * Escribe una cookie separada 'trainer_session_id' para no interferir con la sesión de operador.
 */
export async function POST(request: NextRequest) {
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

    // Rate limiting compartido (misma instancia — protege ambos endpoints)
    const limitCheck = rateLimiter.check(ip);
    if (limitCheck.isLocked) {
        const minutesLeft = Math.ceil(limitCheck.remainingMs / 60000);
        return NextResponse.json(
            { error: `Demasiados intentos fallidos. Intente de nuevo en ${minutesLeft} minutos.` },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { password, csrfToken } = body;

        // Validación CSRF
        const cookieStore = await cookies();
        const csrfCookie = cookieStore.get('csrf_token')?.value;

        if (!csrfCookie || !csrfToken || !secureCompare(csrfCookie, csrfToken)) {
            return NextResponse.json(
                { error: 'Petición no válida (Fallo de seguridad CSRF).' },
                { status: 403 }
            );
        }

        if (typeof password !== 'string' || password.length === 0 || password.length > 128) {
            rateLimiter.recordFailure(ip);
            return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
        }

        const trainerPassword = process.env.TRAINER_PASSWORD;
        if (!trainerPassword) {
            console.error('ERROR CRÍTICO: TRAINER_PASSWORD no está definida.');
            return NextResponse.json(
                { error: 'Error de configuración interna del servidor.' },
                { status: 500 }
            );
        }

        const isMatch = secureCompare(password, trainerPassword);
        if (!isMatch) {
            rateLimiter.recordFailure(ip);
            return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
        }

        // Autenticación exitosa — sesión de Trainer en cookie separada
        rateLimiter.reset(ip);
        const sessionToken = createSessionToken();

        cookieStore.set('trainer_session_id', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7200, // 2 horas
        });

        // Limpiar CSRF para forzar nuevo token en la próxima sesión
        cookieStore.delete('csrf_token');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error en endpoint trainer-login:', error);
        return NextResponse.json({ error: 'Ocurrió un error en el servidor.' }, { status: 500 });
    }
}
