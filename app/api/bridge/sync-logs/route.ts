import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    };
}

export async function POST(req: NextRequest) {
    try {
        // En desarrollo no requerimos API key obligatoria para facilitar pruebas locales
        const apiKey = req.headers.get('x-api-key');
        const expectedApiKey = process.env.BRIDGE_API_KEY || 'SUPER_SECRET_BRIDGE_KEY_123';
        
        if (apiKey !== expectedApiKey && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders() });
        }

        const body = await req.json();
        const { station_id, robot_id, orders } = body;

        if (!station_id || !robot_id || !orders) {
            return NextResponse.json({ error: 'Faltan campos requeridos: station_id, robot_id u orders' }, { status: 400, headers: corsHeaders() });
        }

        // Guardar/actualizar el registro de logs en vivo en Supabase
        const { error } = await supabaseAdmin
            .from('live_station_status')
            .upsert({
                station_id,
                robot_id,
                latest_orders: orders,
                last_updated: new Date().toISOString()
            }, { onConflict: 'station_id' });

        if (error) {
            console.error('Error upserting live_station_status:', error);
            throw error;
        }

        const response = NextResponse.json({ success: true, updated_station: station_id, row_count: orders.length });
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;

    } catch (err: any) {
        console.error('Error en POST /api/bridge/sync-logs:', err);
        return NextResponse.json(
            { error: err.message || 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 200 });
    Object.entries(corsHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}
