import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/trainer-logout
 * Elimina la cookie trainer_session_id para cerrar la sesión del Trainer.
 */
export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('trainer_session_id');
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Error al cerrar sesión.' }, { status: 500 });
    }
}
