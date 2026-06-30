import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifySessionToken } from '../../../lib/security';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

async function checkAdminAuth(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session_id')?.value;
        const trainerToken = cookieStore.get('trainer_session_id')?.value;

        if (adminToken && verifySessionToken(adminToken, 'admin')) {
            return true;
        }
        if (trainerToken && verifySessionToken(trainerToken, 'trainer')) {
            return true;
        }

        console.warn('⚠️ Authentication failed: No valid admin or trainer token found.');
        return false;
    } catch (err) {
        console.error('Error during admin auth check:', err);
        return false;
    }
}

export async function GET(req: NextRequest) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('robots')
            .select('id, name, status, target_url, workflow_key')
            .order('name');

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Error in GET /api/admin/robots:', err);
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, target_url, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID del robot' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('robots')
            .update({
                target_url: target_url || null,
                status: status || 'inactive'
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Error in POST /api/admin/robots:', err);
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}
