import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin
            .from('robots')
            .select('id, name, target_url, status')
            .eq('status', 'active')
            .not('target_url', 'is', null);

        if (error) throw error;

        const response = NextResponse.json({ success: true, data });
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    } catch (err: any) {
        console.error('Error in GET /api/robot-mirror/config:', err);
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
