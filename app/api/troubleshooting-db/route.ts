// ─────────────────────────────────────────────────────────────────
//  app/api/troubleshooting-db/route.ts
//
//  Endpoint que el hook useTroubleshootingDB llama cada 5 minutos.
//  Lee de Supabase y devuelve el catálogo completo al cliente.
//
//  Incluye:
//  - Cache de 60s en Vercel Edge (evita golpear Supabase en cada request)
//  - Fallback: si Supabase falla, devuelve el catálogo estático local
//  - Merge: combina fallas de Supabase con el local para no perder
//    entradas que aún no se hayan migrado
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('troubleshooting_knowledge')
            .select('*')
            .order('id');

        if (error) throw error;

        if (!data || data.length === 0) {
            // Supabase vacío → devolver catálogo local como fallback
            return NextResponse.json(TROUBLESHOOTING_DATABASE, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                },
            });
        }

        // Merge: IDs que están en local pero NO en Supabase todavía
        // (durante la transición, hasta que el admin migre todo)
        const supabaseIds = new Set(data.map((f: any) => f.id));
        const localOnlyFaults = TROUBLESHOOTING_DATABASE.filter(
            f => !supabaseIds.has(f.id)
        );

        const merged = [...data, ...localOnlyFaults];

        return NextResponse.json(merged, {
            headers: {
                // Cache 60s en Vercel CDN — reduce llamadas a Supabase
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });

    } catch (error: any) {
        console.error('[troubleshooting-db API] Error:', error.message);

        // Fallback total al catálogo estático local
        return NextResponse.json(TROUBLESHOOTING_DATABASE, {
            headers: {
                'Cache-Control': 'public, s-maxage=30',
            },
        });
    }
}