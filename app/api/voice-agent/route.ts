import { NextRequest, NextResponse } from 'next/server';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';

export async function POST(req: NextRequest) {
    try {
        const { symptom } = await req.json();

        if (!symptom || typeof symptom !== 'string') {
            return NextResponse.json({ error: 'Symptom is required and must be a string' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'tu_api_key_aqui') {
            // Fallback elegante si la API Key no está configurada, devolviendo coincidencias locales básicas por palabras clave.
            console.warn('[VoiceAgent API] GEMINI_API_KEY no configurada. Usando búsqueda local básica.');
            const words = symptom.toLowerCase().split(/\s+/);
            const matches = TROUBLESHOOTING_DATABASE
                .filter(t => words.some(w => w.length > 2 && t.symptom.toLowerCase().includes(w)))
                .slice(0, 3)
                .map(t => t.symptom);

            return NextResponse.json({ coincidencias: matches });
        }

        // Obtener la lista de síntomas del catálogo local para proveer al modelo
        const catalogList = TROUBLESHOOTING_DATABASE.map(t => t.symptom);

        const prompt = `Analiza la siguiente descripción de falla del operador: "${symptom}".
Compara esta descripción con el siguiente catálogo de fallas de la celda de trabajo y devuelve un array JSON únicamente con los títulos/síntomas exactos que coincidan (máximo 3).

Catálogo de fallas:
${JSON.stringify(catalogList, null, 2)}

INSTRUCCIÓN CRÍTICA DE FORMATO:
Responde única y exclusivamente en formato JSON estructurado sin formato markdown (sin bloques de código \`\`\`json) siguiendo este esquema exacto:
{
  "coincidencias": ["Título exacto 1", "Título exacto 2"]
}
Si no encuentras ninguna coincidencia, devuelve el array vacío.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errText}`);
        }

        const resData = await response.json();
        const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        try {
            const parsed = JSON.parse(textResponse.trim());
            return NextResponse.json({ coincidencias: parsed.coincidencias || [] });
        } catch (jsonErr) {
            console.error('Error parsing Gemini JSON response:', textResponse, jsonErr);
            return NextResponse.json({ coincidencias: [] });
        }

    } catch (error: any) {
        console.error('[VoiceAgent API] Error processing request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
