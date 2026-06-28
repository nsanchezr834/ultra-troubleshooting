// ─────────────────────────────────────────────────────────────────
//  hooks/useTroubleshootingDB.ts
//
//  P0: Sincronización en caliente del catálogo de fallas.
//
//  ESTRATEGIA:
//  1. Sirve inmediatamente el catálogo estático local (0ms de espera,
//     el operario tiene datos al instante).
//  2. En background, fetch a Supabase para ver si hay fallas nuevas
//     o actualizadas por el admin.
//  3. Si Supabase responde OK → reemplaza el catálogo en memoria.
//  4. Si Supabase falla (red, timeout, error) → mantiene el local
//     sin interrumpir al operario.
//  5. Refresca cada 5 minutos mientras la tab está abierta.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';
import { TroubleshootingKnowledge } from '@/types/troubleshooting.types';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const FETCH_TIMEOUT_MS = 4000;           // 4s máximo — si tarda más, usa local

export function useTroubleshootingDB() {
    // Estado inicial = catálogo local estático (disponible inmediatamente)
    const [db, setDb] = useState<TroubleshootingKnowledge[]>(TROUBLESHOOTING_DATABASE);
    const [isLive, setIsLive] = useState(false);   // true cuando viene de Supabase
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchFromSupabase = async () => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            const res = await fetch('/api/troubleshooting-db', {
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeout);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data: TroubleshootingKnowledge[] = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                setDb(data);
                setIsLive(true);
                setLastSync(new Date());
                console.log(`[useTroubleshootingDB] Catálogo actualizado desde Supabase: ${data.length} fallas`);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.warn('[useTroubleshootingDB] Timeout — usando catálogo local');
            } else {
                console.warn('[useTroubleshootingDB] Error de red — usando catálogo local:', err.message);
            }
            // No tocar el estado — mantener el catálogo que ya tiene (local o el último de Supabase)
        }
    };

    useEffect(() => {
        // Primer fetch en background al montar
        fetchFromSupabase();

        // Refrescar cada 5 minutos
        intervalRef.current = setInterval(fetchFromSupabase, REFRESH_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return { db, isLive, lastSync };
}