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
            console.warn('[VoiceAgent API] GEMINI_API_KEY no configurada. Usando búsqueda local básica.');
            const words = symptom.toLowerCase().split(/\s+/);
            const matches = TROUBLESHOOTING_DATABASE
                .filter(t => words.some(w => w.length > 2 && t.symptom.toLowerCase().includes(w)))
                .slice(0, 3)
                .map(t => t.symptom);

            return NextResponse.json({ coincidencias: matches });
        }

        const catalogList = TROUBLESHOOTING_DATABASE.map(t => t.symptom);

        const prompt = `Actúas como un validador semántico determinista de fallas para celdas robóticas industriales.
Tu única tarea es recibir una frase de un operario y relacionarla con síntomas exactos del catálogo provisto.

REGLAS DE EMPAREJAMIENTO CRÍTICAS:
1. NO ALUCINES NI INFUTAS. Si el operario menciona un componente, pieza o acción que NO tiene una relación directa, causal y unívoca con los síntomas del catálogo, NO debes hacer match.
2. IGNORA PALABRAS GENÉRICAS. Frases que usen verbos como "funciona", "falla", "ayuda", "máquina" o "sistema" pero se refieran a objetos ajenos al catálogo (ej: "pedales", "perro", "silla") NO deben emparejarse con ninguna falla existente. Es preferible devolver un array vacío antes que un falso positivo.
3. El match debe basarse en la coincidencia del componente clave afectado (ej. Bagger, Etiqueta/Printer, Brazos/Robot, Gripper, Contenedor/Bin, Cámaras, Conectividad/Red/Latencia, Productos/Lote/Trabajo).
4. TRADUCCIÓN Y SINÓNIMOS LOGÍSTICOS: Identifica y traduce términos comunes de almacén en inglés o tecnicismos industriales (ej: "no job available" o "no active batch" equivalen semánticamente a "Falta de productos en la zona de alimentación (Out of Product) - Global", "bag jam" equivale a "Bolsa atascada en Bagger", "bad seal" a "Bolsa arrugada, quemada o mal sellada") y realiza la coincidencia con el síntoma en español correspondiente.

EJEMPLOS DE ENTRENAMIENTO (FEW-SHOT):
- Operario: "mis pedales no funcionan" -> Catálogo contiene fallas de brazos, grippers, bagger, etc. Ninguno menciona pedales ni se relaciona con la operación de la celda. -> {"coincidencias": []}
- Operario: "no job available" -> Equivale a sin lote cargado en el sistema, lo cual corresponde a "Falta de productos en la zona de alimentación (Out of Product) - Global". -> {"coincidencias": ["Falta de productos en la zona de alimentación (Out of Product) - Global"]}
- Operario: "se escapó mi perro" -> Fuera de dominio. -> {"coincidencias": []}
- Operario: "la impresora no saca la etiqueta" -> Coincidencia exacta de componente (etiqueta/impresora). -> {"coincidencias": ["Qué hacer en caso de que no imprima la etiqueta (Bagger / Impresora Integrada)", "Qué hacer en caso de que la impresora de etiquetas (pegado manual) no saque la etiqueta"]}
- Operario: "brazo congelado" -> Coincidencia directa de componente (brazos). -> {"coincidencias": ["Falla de brazos: Uno o ambos brazos del robot se quedan congelados, no responden a comandos o se mueven de forma errática."]}

Catálogo de fallas válidas (Títulos Exactos):
${JSON.stringify(catalogList, null, 2)}

Descripción del operario a analizar: "${symptom}"

INSTRUCCIÓN CRÍTICA DE FORMATO:
Responde única y exclusivamente en formato JSON estructurado sin formato markdown (sin bloques de código \`\`\`json) siguiendo este esquema exacto:
{
  "coincidencias": ["Título exacto 1", "Título exacto 2"]
}
Si no encuentras ninguna coincidencia estricta y segura, devuelve el array vacío: {"coincidencias": []}.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
                    temperature: 0.0
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
