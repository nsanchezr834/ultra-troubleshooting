import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configurar llaves VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:support@autoryx.com';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'SUPER_SECRET_WEBHOOK_TOKEN';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_EMAIL,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

// Cliente Supabase con Service Role key para eliminar registros inactivos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        // 1. Validar autenticación del Webhook
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized Webhook request' }, { status: 401 });
        }

        // 2. Extraer Payload enviado por el Trigger de Postgres
        const payload = await req.json();
        const { title, body, url } = payload;

        if (!title || !body || !url) {
            return NextResponse.json({ error: 'Missing notification payload fields' }, { status: 400 });
        }

        // 3. Obtener todas las suscripciones de la base de datos
        const { data: subscriptions, error: fetchError } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, p256dh, auth');

        if (fetchError) {
            return NextResponse.json({ error: `Database fetch error: ${fetchError.message}` }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No active subscriptions found' }, { status: 200 });
        }

        // 4. Formatear y Enviar Notificaciones en Paralelo
        const notificationPayload = JSON.stringify({ title, body, url });

        const results = await Promise.all(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                try {
                    await webpush.sendNotification(pushSubscription, notificationPayload);
                    return { success: true, id: sub.id };
                } catch (err: any) {
                    // Si el dispositivo rechazó la notificación (410 Gone / 404 Not Found), la suscripción expiró
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', sub.id);
                        return { success: false, expired: true, id: sub.id };
                    }
                    return { success: false, error: err.message, id: sub.id };
                }
            })
        );

        const succeeded = results.filter(r => r.success).length;
        const expired = results.filter(r => r.expired).length;

        return NextResponse.json({
            message: 'Broadcast completed',
            total: subscriptions.length,
            sent: succeeded,
            cleaned: expired
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
