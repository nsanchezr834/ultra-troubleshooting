import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { verifySessionToken } from '../../../lib/security';

// Cliente admin con service role key (bypass RLS para operaciones del Trainer)
function getAdminClient() {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY!;
    if (!url || !key) throw new Error('Faltan variables de entorno de Supabase admin.');
    return createClient(url, key);
}

// Genera un PIN numérico de 6 dígitos
function generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/trainer/create-session
 * Crea una nueva sesión de training con un PIN único.
 * Requiere cookie trainer_session_id válida.
 */
export async function POST(request: NextRequest) {
    // Verificar autenticación de Trainer
    const cookieStore = await cookies();
    const trainerToken = cookieStore.get('trainer_session_id')?.value;
    if (!verifySessionToken(trainerToken)) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, trainer, clientId, robotId } = body;

        if (!name?.trim() || !trainer?.trim()) {
            return NextResponse.json(
                { error: 'El nombre de la sesión y el nombre del Trainer son requeridos.' },
                { status: 400 }
            );
        }

        const supabaseAdmin = getAdminClient();

        // Generar PIN único (reintentar si ya existe)
        let pin = generatePin();
        let attempts = 0;
        while (attempts < 5) {
            const { data: existing } = await supabaseAdmin
                .from('training_sessions')
                .select('id')
                .eq('pin', pin)
                .single();

            if (!existing) break; // PIN único
            pin = generatePin();
            attempts++;
        }

        // Insertar la sesión
        const { data, error } = await supabaseAdmin
            .from('training_sessions')
            .insert({
                pin,
                name: name.trim(),
                trainer: trainer.trim(),
                client_id: clientId?.trim() || null,
                robot_id: robotId?.trim() || null,
                active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creando sesión:', error);
            return NextResponse.json({ error: 'Error al crear la sesión.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, session: data });
    } catch (err) {
        console.error('Error en create-session:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}

/**
 * PATCH /api/trainer/create-session
 * Cierra (desactiva) una sesión existente.
 */
export async function PATCH(request: NextRequest) {
    const cookieStore = await cookies();
    const trainerToken = cookieStore.get('trainer_session_id')?.value;
    if (!verifySessionToken(trainerToken)) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    try {
        const { sessionId } = await request.json();
        const supabaseAdmin = getAdminClient();

        const { error } = await supabaseAdmin
            .from('training_sessions')
            .update({ active: false, closed_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) return NextResponse.json({ error: 'No se pudo cerrar la sesión.' }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
    }
}
