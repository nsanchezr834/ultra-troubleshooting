import { NextRequest, NextResponse } from 'next/server';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';

// ─────────────────────────────────────────────────────────────────
//  /api/notifications/broadcast — POST
//
//  CALLERS:
//    - /api/admin/troubleshooting  → { title, body: symptom, url }
//    - /api/admin/advises          → { title, body: content,  url }
//
//  FIX P0-2: El route anterior leía { symptom } pero los callers
//  mandan { title, body, url }. Ahora leemos correctamente.
//
//  FLUJO:
//    1. Recibe { title, body, url } de los callers admin
//    2. Usa `body` como texto a analizar semánticamente
//    3. Busca fallas relacionadas en el catálogo (local → Gemini)
//    4. Enriquece la notificación push con las fallas encontradas
//    5. Envía la notificación a todos los suscriptores via Supabase
// ─────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'SUPER_SECRET_WEBHOOK_TOKEN';

// Auth interna entre rutas
function verifyWebhookAuth(req: NextRequest): boolean {
    const auth = req.headers.get('Authorization');
    return auth === `Bearer ${WEBHOOK_SECRET}`;
}

// Búsqueda local con keywords — misma lógica que voice-agent
function localFuzzySearch(query: string): string[] {
    const tokens = query
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,;!?¿¡]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2);

    if (!tokens.length) return [];

    const scored = TROUBLESHOOTING_DATABASE.map(entry => {
        const haystack = (
            entry.symptom + ' ' + ((entry as any).keywords || '')
        ).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const hits = tokens.filter(t => haystack.includes(t)).length;
        return { title: entry.symptom, score: hits };
    });

    return scored
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(r => r.title);
}

export async function POST(req: NextRequest) {
    // Verificar que viene de nuestras rutas admin internas
    if (!verifyWebhookAuth(req)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // FIX P0-2: Leer { title, body, url } — lo que realmente mandan los callers
        const { title, body, url } = await req.json();

        if (!title || typeof title !== 'string') {
            return NextResponse.json(
                { error: 'title is required and must be a string' },
                { status: 400 }
            );
        }

        // `body` es el texto a analizar (symptom o content según el caller)
        const textToAnalyze = body || '';

        // ── Paso 1: Buscar fallas relacionadas (local primero) ──────────────
        let relatedFaults: string[] = [];

        if (textToAnalyze) {
            relatedFaults = localFuzzySearch(textToAnalyze);

            // ── Paso 2: Fallback a Gemini si local no encontró nada ─────────
            if (relatedFaults.length === 0) {
                const apiKey = process.env.GEMINI_API_KEY;

                if (apiKey && apiKey !== 'tu_api_key_aqui') {
                    try {
                        // P1-b: JSON.stringify sin pretty-print → ahorra ~200 tokens
                        const catalogForGemini = TROUBLESHOOTING_DATABASE.map(t => ({
                            titulo: t.symptom,
                            sinonimos: (t as any).keywords || '',
                        }));

                        const prompt = `Eres un asistente de diagnóstico para operarios de celdas robóticas industriales.
Recibe el texto de una notificación y encuentra las fallas del catálogo más relacionadas.

REGLAS:
1. Usa los sinónimos del catálogo para hacer el match.
2. Devuelve entre 0 y 3 coincidencias ordenadas por relevancia.
3. NUNCA inventes títulos. Solo usa los títulos exactos del catálogo.
4. Si el texto no corresponde a ninguna falla técnica, devuelve array vacío.

CATÁLOGO (título + sinónimos):
${JSON.stringify(catalogForGemini)}

TEXTO A ANALIZAR: "${textToAnalyze}"

RESPONDE ÚNICAMENTE con este JSON:
{"coincidencias": ["Título exacto 1", "Título exacto 2"]}`;

                        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                        const geminiRes = await fetch(geminiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: {
                                    responseMimeType: 'application/json',
                                    temperature: 0.1,
                                    maxOutputTokens: 256,
                                },
                            }),
                        });

                        if (geminiRes.ok) {
                            const geminiData = await geminiRes.json();
                            const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                            const cleaned = raw.replace(/```json|```/g, '').trim();
                            const parsed = JSON.parse(cleaned);

                            // Validación anti-alucinación — P0-2 fix
                            const validTitles = TROUBLESHOOTING_DATABASE.map(t => t.symptom);
                            relatedFaults = (parsed.coincidencias || []).filter(
                                (t: string) => validTitles.includes(t)
                            );
                        }
                    } catch (geminiErr) {
                        // Gemini falla → continuar sin fallas relacionadas, no bloquear la notificación
                        console.error('[Broadcast] Gemini error (non-fatal):', geminiErr);
                    }
                }
            }
        }

        // ── Paso 3: Construir payload de notificación enriquecido ──────────
        const notificationPayload = {
            title,
            body: textToAnalyze,
            url: url || '/',
            // Datos extra para el SW — fallas relacionadas visibles en la notif
            data: {
                related_faults: relatedFaults,
                fault_count: relatedFaults.length,
                timestamp: new Date().toISOString(),
            },
        };

        // ── Paso 4: Enviar a suscriptores via Supabase ─────────────────────
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_KEY || ''
        );

        const { data: subscribers, error: subError } = await supabase
            .from('push_subscriptions')
            .select('subscription');

        if (subError) {
            console.error('[Broadcast] Error fetching subscribers:', subError);
            // No lanzar error — la falla de notificaciones no debe bloquear el guardado del admin
            return NextResponse.json({
                success: true,
                sent: 0,
                related_faults: relatedFaults,
                warning: 'Could not fetch subscribers',
            });
        }

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                related_faults: relatedFaults,
            });
        }

        // Enviar push a cada suscriptor
        const webpush = await import('web-push');
        webpush.default.setVapidDetails(
            `mailto:${process.env.VAPID_EMAIL || 'admin@autoryx.com'}`,
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );

        const results = await Promise.allSettled(
            subscribers.map(({ subscription }) =>
                webpush.default.sendNotification(
                    subscription,
                    JSON.stringify(notificationPayload)
                )
            )
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`[Broadcast] Sent: ${sent}, Failed: ${failed}, Related faults: ${relatedFaults.length}`);

        return NextResponse.json({
            success: true,
            sent,
            failed,
            related_faults: relatedFaults,
        });

    } catch (error: any) {
        console.error('[Broadcast] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}