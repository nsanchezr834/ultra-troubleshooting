import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { secureCompare, createSessionToken, rateLimiter } from '../../../lib/security';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

export async function POST(request: NextRequest) {
  // 1. Obtener la IP del cliente para el rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  // 2. Verificar si la IP está bloqueada por fuerza bruta
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
    const { password, csrfToken, fullName } = body;

    // 3. Validación de Token CSRF (Double-Submit Cookie Pattern)
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get('csrf_token')?.value;

    if (!csrfCookie || !csrfToken || !secureCompare(csrfCookie, csrfToken)) {
      return NextResponse.json(
        { error: "Petición no válida (Fallo de seguridad CSRF)." },
        { status: 403 }
      );
    }

    // 4. Sanitización e inspección de entrada
    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { error: "La contraseña es requerida." },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre completo es requerido." },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      // Prevención de vectores de ataque por denegación de servicio de CPU en hashing/comparación
      rateLimiter.recordFailure(ip);
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    // 5. Comparación segura contra la variable de entorno
    const serverPassword = process.env.ACCESS_PASSWORD;

    if (!serverPassword) {
      console.error("ERROR CRÍTICO: La variable de entorno ACCESS_PASSWORD no está definida.");
      return NextResponse.json(
        { error: "Error de configuración interna del servidor." },
        { status: 500 }
      );
    }

    const isMatch = secureCompare(password, serverPassword);

    if (!isMatch) {
      // Registrar intento fallido
      rateLimiter.recordFailure(ip);
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    // 6. Autenticación Exitosa
    rateLimiter.reset(ip);
    
    // Registrar acceso en Supabase
    try {
      let location = 'Desconocido';
      const city = request.headers.get('x-vercel-ip-city');
      const region = request.headers.get('x-vercel-ip-country-region');
      const country = request.headers.get('x-vercel-ip-country');
      
      if (city || region || country) {
        const parts = [];
        if (city) parts.push(decodeURIComponent(city));
        if (region) parts.push(region);
        if (country) parts.push(country);
        location = parts.join(', ');
      } else if (ip !== '127.0.0.1' && ip !== '::1') {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.status === 'success') {
              const parts = [];
              if (geoData.city) parts.push(geoData.city);
              if (geoData.regionName) parts.push(geoData.regionName);
              if (geoData.country) parts.push(geoData.country);
              location = parts.join(', ');
            }
          }
        } catch (err) {
          console.error('Error fetching geolocation from ip-api:', err);
        }
      } else {
        location = 'Localhost (Desarrollo)';
      }

      await supabaseAdmin.from('user_access_logs').insert([
        {
          full_name: fullName.trim(),
          ip_address: ip,
          location: location
        }
      ]);
    } catch (dbErr) {
      console.error('Error logging user access to Supabase:', dbErr);
    }

    // Generar sesión criptográfica sin estado
    const sessionToken = createSessionToken();

    // Establecer la cookie de sesión de forma segura y HttpOnly
    cookieStore.set('session_id', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7200, // 2 horas (tiempo de expiración corto)
    });

    // Limpiar el token CSRF para forzar uno nuevo en la siguiente sesión
    cookieStore.delete('csrf_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en endpoint de login:", error);
    return NextResponse.json(
      { error: "Ocurrió un error en el servidor." },
      { status: 500 }
    );
  }
}
