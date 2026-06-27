import { NextRequest, NextResponse } from 'next/server';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';

export async function POST(req: NextRequest) {
    try {
        const { symptom } = await req.json();

        if (!symptom || typeof symptom !== 'string') {
            return NextResponse.json(
                { error: 'Symptom is required and must be a string' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // ── Fallback sin API key ──────────────────────────────────────────────────
        if (!apiKey || apiKey === 'tu_api_key_aqui') {
            console.warn('[VoiceAgent] GEMINI_API_KEY no configurada. Búsqueda local básica.');
            const words = symptom.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const matches = TROUBLESHOOTING_DATABASE
                .filter(t => {
                    const haystack = (t.symptom + ' ' + ((t as any).keywords || '')).toLowerCase();
                    return words.some(w => haystack.includes(w));
                })
                .slice(0, 3)
                .map(t => t.symptom);
            return NextResponse.json({ coincidencias: matches });
        }

        // ── Catálogo para Gemini: título + keywords de cada falla ────────────────
        // Le damos a Gemini los sinónimos operativos reales para que pueda hacer
        // el matching semántico sin alucinar. Más contexto = mejor precisión.
        const catalogForGemini = TROUBLESHOOTING_DATABASE.map(t => ({
            titulo: t.symptom,
            sinonimos: (t as any).keywords || '',
        }));

        // ── Prompt mejorado con few-shot de tu catálogo real ────────────────────
        const prompt = `Eres un asistente de diagnóstico para operarios de celdas robóticas industriales.
Tu tarea es recibir la descripción en voz natural de un operario y encontrar las fallas del catálogo que mejor coincidan.

REGLAS:
1. El operario habla en lenguaje coloquial. Traduce sus palabras al componente técnico afectado.
2. Usa los SINÓNIMOS del catálogo para hacer el match, no solo el título.
3. Devuelve entre 1 y 3 coincidencias ordenadas de mayor a menor relevancia.
4. Si ninguna falla tiene relación directa con lo descrito, devuelve array vacío.
5. NUNCA inventes títulos. Solo usa los títulos exactos del catálogo.

EJEMPLOS DE TRADUCCIÓN (lo que dice el operario → componente real):
- "no quiere sacar bolsas" / "se acabaron las bolsas" / "bagger no dispensa" → Bagger / Out of Bags
- "bolsa trabada" / "se atoró la bolsa" / "bag jam" → Bag Jam en Bagger
- "bolsa quemada" / "sello feo" / "mal sellado" / "bad seal" → Bad Seal
- "brazo congelado" / "brazo no mueve" / "arm frozen" → Falla de brazos
- "pinza no agarra" / "gripper flojo" / "no cierra" → Falla de grippers
- "sin video" / "cámara negra" / "perdí la imagen" → Falla de cámaras
- "cuello trabado" / "no voltea" / "neck frozen" → Falla de cuello
- "pecho congelado" / "torso no gira" / "chest frozen" → Falla en chest
- "no hay producto" / "banda vacía" / "no job available" / "sin lote" → Out of Product
- "bin equivocado" / "paquete en lugar incorrecto" → Package Dropped in Wrong Bin
- "bin lleno" / "contenedor lleno" → Package Bin Full o Hospital Bin Full
- "etiqueta no sale" / "no imprime" / "out of labels" → Falla de etiqueta/impresora
- "internet lento" / "cámara congelada por red" / "latencia" → Alta latencia / red
- "no me muevo en manual" / "teleop no funciona" → Robot no se mueve en teleop
- "app se cerró" / "headset congelado" → App Not Working
- "pedales no aparecen" / "sin pedales" → No aparece el botón de los pedales
- "no escanea" / "producto no encontrado" / "skip" → El workflow solicita escanear

CATÁLOGO DE FALLAS (título exacto + sinónimos):
${JSON.stringify(catalogForGemini, null, 2)}

DESCRIPCIÓN DEL OPERARIO: "${symptom}"

RESPONDE ÚNICAMENTE con este JSON (sin markdown, sin texto extra):
{"coincidencias": ["Título exacto de la falla 1", "Título exacto de la falla 2"]}

Si no hay coincidencias: {"coincidencias": []}`;

        // ── Llamada a Gemini ─────────────────────────────────────────────────────
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,    // era 0.0 → 0.1 da flexibilidad semántica sin alucinar
                    maxOutputTokens: 256, // respuesta corta garantizada, ahorro de tokens
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errText}`);
        }

        const resData = await response.json();
        const textResponse =
            resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        try {
            // Limpiar posibles backticks por si Gemini los añade de todas formas
            const cleaned = textResponse.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            // Validar que los títulos devueltos existen en el catálogo real
            // (previene alucinaciones parciales aunque sean raras con temperature 0.1)
            const validTitles = TROUBLESHOOTING_DATABASE.map(t => t.symptom);
            const safeMatches = (parsed.coincidencias || []).filter(
                (title: string) => validTitles.includes(title)
            );

            return NextResponse.json({ coincidencias: safeMatches });
        } catch (jsonErr) {
            console.error('[VoiceAgent] Error parsing Gemini JSON:', textResponse, jsonErr);
            return NextResponse.json({ coincidencias: [] });
        }
    } catch (error: any) {
        console.error('[VoiceAgent API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}