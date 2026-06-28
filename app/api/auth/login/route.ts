import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { secureCompare, createSessionToken, rateLimiter } from '../../../lib/security';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

function cleanAndFormatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    const { password, csrfToken, fullName, force } = body;

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

    // Sanitización de XSS y caracteres de inyección
    const sanitizedName = fullName.replace(/<[^>]*>?/gm, '').trim();

    // Validar formato para admitir solo caracteres seguros de nombres
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.\'\,\(\)]+$/;
    if (!nameRegex.test(sanitizedName)) {
      return NextResponse.json(
        { error: "El nombre contiene caracteres no permitidos." },
        { status: 400 }
      );
    }

    let finalName = cleanAndFormatName(sanitizedName);

    // Verificación inteligente de nombres similares
    if (!force) {
      const cleanInput = sanitizedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const inputWords = cleanInput.split(/\s+/).filter(w => w.length > 2);

      let matchedName: string | null = null;
      let isExactCasingMatch = false;

      // Obtener nombres históricos registrados para comparación
      let allExistingNames: string[] = [];
      try {
        const [{ data: logsData }, { data: traineesData }] = await Promise.all([
          supabaseAdmin.from('user_access_logs').select('full_name'),
          supabaseAdmin.from('trainees').select('full_name')
        ]);

        const nameSet = new Set<string>();
        if (logsData) logsData.forEach(d => nameSet.add(d.full_name));
        if (traineesData) traineesData.forEach(d => nameSet.add(d.full_name));
        allExistingNames = Array.from(nameSet);
      } catch (dbErr) {
        console.error('Error fetching names for similarity check:', dbErr);
      }

      for (const existingName of allExistingNames) {
        const cleanExisting = existingName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        // 1. Coincidencia exacta (ignorando mayúsculas/minúsculas/acentos)
        if (cleanInput === cleanExisting) {
          matchedName = existingName;
          isExactCasingMatch = true;
          break;
        }

        // 2. Coincidencia similar (ej: "Nahum Sanchez" vs "Nahum Sanchez Romero")
        if (cleanExisting.includes(cleanInput) || cleanInput.includes(cleanExisting)) {
          const existingWords = cleanExisting.split(/\s+/).filter(w => w.length > 2);
          const intersection = inputWords.filter(w => existingWords.includes(w));
          const minWords = Math.min(inputWords.length, existingWords.length);
          
          if (intersection.length >= Math.max(2, minWords)) {
            matchedName = existingName;
            break;
          }
        }
      }

      if (matchedName) {
        if (isExactCasingMatch) {
          // Si es el mismo en letras, corregimos mayúsculas en segundo plano
          finalName = matchedName;
        } else {
          // Si varía en contenido, pedimos confirmación al usuario
          return NextResponse.json({
            confirmName: true,
            matchedName: matchedName,
            enteredName: finalName
          });
        }
      }
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
          full_name: finalName,
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
