import crypto from 'crypto';

// Clave secreta estable derivada de ACCESS_PASSWORD para firmar sesiones de forma persistente entre compilaciones
const SESSION_SECRET = process.env.SESSION_SECRET || 
  crypto.createHash('sha256').update(process.env.ACCESS_PASSWORD || 'ultra_fallback_secret_key').digest('hex');


/**
 * Compara dos cadenas de texto de forma segura usando hashing SHA-256 y timingSafeEqual.
 * Esto evita ataques de canal lateral basados en tiempo (Timing Attacks).
 */
export function secureCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Genera un token CSRF criptográficamente seguro de 32 bytes en formato hex.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface SessionPayload {
  authenticated: boolean;
  expiresAt: number;
  role?: 'trainer' | 'admin';
}

/**
 * Crea un token de sesión firmado criptográficamente de forma síncrona y sin estado.
 */
export function createSessionToken(role?: 'trainer' | 'admin'): string {
  const payload: SessionPayload = {
    authenticated: true,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // Expiración en 2 horas
    role,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

/**
 * Verifica un token de sesión firmado. Retorna true si es válido y no ha expirado.
 */
export function verifySessionToken(token?: string, expectedRole?: 'trainer' | 'admin'): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  try {
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      return false;
    }

    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadStr);

    if (payload.expiresAt < Date.now()) {
      return false;
    }

    if (expectedRole && payload.role !== expectedRole) {
      return false;
    }

    return payload.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * Limidador de velocidad en memoria para proteger contra fuerza bruta.
 */
interface RateLimitInfo {
  attempts: number;
  lockUntil: number;
}

class MemoryRateLimiter {
  private store = new Map<string, RateLimitInfo>();
  private readonly maxAttempts = 5;
  private readonly lockTime = 15 * 60 * 1000; // 15 minutos en milisegundos

  /**
   * Verifica si la IP está actualmente bloqueada.
   * Retorna un objeto indicando si está bloqueado y el tiempo de desbloqueo.
   */
  public check(ip: string): { isLocked: boolean; remainingMs: number } {
    const record = this.store.get(ip);
    if (!record) {
      return { isLocked: false, remainingMs: 0 };
    }

    const now = Date.now();
    if (record.lockUntil > now) {
      return { isLocked: true, remainingMs: record.lockUntil - now };
    }

    // Si ya pasó el tiempo de bloqueo, reseteamos
    if (record.lockUntil > 0) {
      this.store.delete(ip);
    }

    return { isLocked: false, remainingMs: 0 };
  }

  /**
   * Registra un intento fallido para la IP.
   * Retorna true si este intento causó un nuevo bloqueo.
   */
  public recordFailure(ip: string): boolean {
    const record = this.store.get(ip) || { attempts: 0, lockUntil: 0 };
    record.attempts += 1;

    if (record.attempts >= this.maxAttempts) {
      record.lockUntil = Date.now() + this.lockTime;
      this.store.set(ip, record);
      return true;
    }

    this.store.set(ip, record);
    return false;
  }

  /**
   * Resetea el contador de intentos para una IP tras un inicio de sesión exitoso.
   */
  public reset(ip: string): void {
    this.store.delete(ip);
  }
}

export const rateLimiter = new MemoryRateLimiter();
