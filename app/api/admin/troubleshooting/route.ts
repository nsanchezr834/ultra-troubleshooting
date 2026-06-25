import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifySessionToken } from '../../../lib/security';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

async function checkAdminAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session_id')?.value;
    return verifySessionToken(token, 'admin');
}

export async function POST(req: NextRequest) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, category, symptom, resolution_protocol, sop_reference, video_url } = body;

        if (!id || !category || !symptom || !resolution_protocol || !sop_reference) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('troubleshooting_knowledge')
            .upsert({
                id,
                category,
                symptom,
                root_cause: '',
                severity: 'LOW',
                resolution_protocol,
                sop_reference,
                video_url: video_url || null,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        // Dispatch broadcast notification dynamically
        try {
            const origin = req.nextUrl.origin;
            await fetch(`${origin}/api/notifications/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.WEBHOOK_SECRET || 'SUPER_SECRET_WEBHOOK_TOKEN'}`
                },
                body: JSON.stringify({
                    title: `Nueva Falla (${category.toUpperCase()}) ⚠️`,
                    body: symptom || 'Se ha registrado una nueva falla.',
                    url: `/troubleshooting?search=${id}`
                })
            });
        } catch (notifErr) {
            console.error('Failed to trigger broadcast notification:', notifErr);
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Error in POST /api/admin/troubleshooting:', err);
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID del elemento a eliminar' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('troubleshooting_knowledge')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error in DELETE /api/admin/troubleshooting:', err);
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}
