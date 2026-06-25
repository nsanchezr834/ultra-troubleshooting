import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:support@autoryx.com';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'SUPER_SECRET_WEBHOOK_TOKEN';

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        try {
            webpush.setVapidDetails(
                VAPID_EMAIL,
                VAPID_PUBLIC_KEY,
                VAPID_PRIVATE_KEY
            );
        } catch (err: any) {
            console.error('Error setting VAPID details:', err.message);
        }
    }

    try {
        // 1. Validar autenticación del Webhook
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized Webhook request' }, { status: 401 });
        }

        // 2. Extraer Payload
        const payload = await req.json();
        let title = payload.title;
        let body = payload.body;
        let url = payload.url;

        if (payload.record) {
            const record = payload.record;
            if (payload.table === 'casos_estudio') {
                title = 'Nuevo Caso de Seguridad 🛡️';
                body = record.titulo || record.label_corto || 'Un nuevo caso de estudio ha sido publicado.';
                url = `/cases/${record.id}`;
            } else if (payload.table === 'troubleshooting_knowledge') {
                title = 'Nueva Falla Registrada ⚠️';
                body = record.symptom || 'Se ha registrado una nueva falla en el sistema.';
                url = `/troubleshooting?search=${record.id}`;
            } else if (payload.table === 'advises') {
                title = 'Nuevo Consejo de Operación 💡';
                body = record.content || 'Se ha registrado un nuevo consejo operativo.';
                url = `/`;
            }
        }

        if (!title || !body || !url) {
            return NextResponse.json({ error: 'Missing notification payload fields (title, body, url)' }, { status: 400 });
        }

        // 3. Obtener suscripciones activas
        const { data: subscriptions, error: fetchError } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, p256dh, auth');

        if (fetchError) {
            return NextResponse.json({ error: `Database fetch error: ${fetchError.message}` }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No active subscriptions found' }, { status: 200 });
        }

        // 4. Enviar notificaciones con TTL y urgency
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

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Push notification timeout')), 3000)
                );

                try {
                    await Promise.race([
                        webpush.sendNotification(pushSubscription, notificationPayload, {
                            TTL: 86400,       // 24 horas — tiempo máximo para entregar si el dispositivo está offline
                            urgency: 'high',  // Prioridad alta — entrega inmediata en Android y iOS
                        }),
                        timeoutPromise
                    ]);
                    return { success: true, id: sub.id };
                } catch (err: any) {
                    console.error(`Error sending push to subscription ${sub.id}:`, err.message);
                    if (err.statusCode === 410 || err.statusCode === 404 || err.message.includes('timeout')) {
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', sub.id);
                        return { success: false, expired: true, id: sub.id };
                    }
                    return { success: false, error: `${err.statusCode || 'NO_STATUS'}: ${err.message}`, body: err.body, id: sub.id };
                }
            })
        );

        const succeeded = results.filter(r => r.success).length;
        const expired = results.filter(r => r.expired).length;
        const failed = results.filter(r => !r.success && !r.expired);

        return NextResponse.json({
            message: 'Broadcast completed',
            total: subscriptions.length,
            sent: succeeded,
            cleaned: expired,
            errors: failed.map(f => ({ id: f.id, error: f.error })),
            vapid_configured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}