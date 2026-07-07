import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI SDK with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured.' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { applicantName, score, total, examLevel, passed, incorrectQuestions } = body;

        if (!applicantName || score === undefined || total === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: applicantName, score, total.' },
                { status: 400 }
            );
        }

        // Initialize the model (using gemini-1.5-flash as requested by the user)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Construct the context about what the user got wrong
        const incorrectContext = incorrectQuestions && incorrectQuestions.length > 0
            ? `Preguntas en las que falló:\n${incorrectQuestions.map((q: any) => `- Falló en una pregunta sobre: "${q.questionText}". Eligió: "${q.selectedText}". La correcta era: "${q.correctText}".`).join('\n')}`
            : 'No tuvo errores, respondió todo correctamente.';

        // System prompt and instruction
        const prompt = `Actúa como un instructor/tutor experto del sistema Ultra.
Acabas de evaluar a un operador llamado ${applicantName} en el examen teórico de nivel "${examLevel}".
Obtuvo ${score} de ${total} aciertos (${passed ? 'Aprobado' : 'No Aprobado'}).

${incorrectContext}

Tu tarea: Genera un párrafo corto (máximo 4 oraciones) de retroalimentación directa y personalizada para ${applicantName}.
Reglas estrictas:
1. Dirígete a ${applicantName} por su nombre.
2. Mantén un tono profesional, motivador y empático.
3. Si tuvo errores, sugiere brevemente enfocarse en esos conceptos específicos para mejorar en su trabajo diario.
4. Si no tuvo errores, felicítalo por su excelencia técnica.
5. No uses saludos formales largos ni firmas, ve directo al grano.
6. Devuelve únicamente el texto de la retroalimentación, sin markdown, ni viñetas, solo texto plano.`;

        // Call the Gemini API
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({
            success: true,
            suggestions: responseText.trim()
        });

    } catch (error: any) {
        console.error('Error generating report with Gemini:', error);
        return NextResponse.json(
            { error: 'Failed to generate report suggestions.', details: error.message },
            { status: 500 }
        );
    }
}
