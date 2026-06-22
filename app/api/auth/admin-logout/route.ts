import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/admin-logout
 * Elimina la cookie admin_session_id para cerrar la sesión del Administrador.
 */
export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_session_id');
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Error al cerrar sesión.' }, { status: 500 });
    }
}
