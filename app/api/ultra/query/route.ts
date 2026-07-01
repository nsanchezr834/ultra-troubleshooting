import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Inicializar clientes
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // 1. Generar Embedding con Gemini (Agent B)
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(text);
    const embedding = embeddingResult.embedding.values.slice(0, 768);

    // 2. Buscar en Supabase (Agent B)
    const { data: matches, error: rpcError } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 1
    });

    if (rpcError) {
      throw new Error(`RPC Error: ${rpcError.message}`);
    }

    let finalResponse = "No encuentro esta falla. ¿Deseas que busque en manuales de robots o en el registro de consejos?";
    let isResolved = false;

    // 3. Procesar Respuesta con Gemini 2.5 Flash si hay coincidencia (Agent B)
    if (matches && matches.length > 0) {
      const bestMatch = matches[0];
      isResolved = true;
      
      const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        Eres "Ultra", un asistente de voz técnico.
        El usuario reporta el siguiente problema: "${text}"
        La solución técnica encontrada es:
        - Causa Raíz: ${bestMatch.root_cause}
        - Protocolo de Resolución: ${bestMatch.resolution_protocol}
        
        Tu tarea: Genera una respuesta hablada, muy natural, conversacional y corta.
        NO uses markdown (ni negritas, ni listas). Usa puntuación clara para que un motor Text-to-Speech la lea bien.
        Ve directo al grano explicando qué causó el problema y qué debe hacer el usuario para resolverlo.
      `;

      const aiResponse = await flashModel.generateContent(prompt);
      finalResponse = aiResponse.response.text();
    }

    // 4. Telemetría y Retención Asíncrona (Agent C - Caja Negra)
    // Fire-and-forget promise
    supabase.from('assistant_logs').insert({
      user_query: text,
      ai_response: finalResponse,
      is_resolved: isResolved
    }).then(({ error }) => {
      if (error) console.error("Telemetry Logger Error:", error);
    });

    return NextResponse.json({ response: finalResponse });

  } catch (error: any) {
    console.error("Agent B Error:", error);
    return NextResponse.json(
      { response: "Ha ocurrido un error al procesar tu solicitud con el motor semántico." },
      { status: 500 }
    );
  }
}
