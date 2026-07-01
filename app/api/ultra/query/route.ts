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

    // 0. Corrección Fonética de términos técnicos comunes usando distancia de Levenshtein (Cálculo Matemático)
    let processedText = text;
    
    const technicalTerms = {
      'bagger': ['lavager', 'vager', 'bager', 'bagre'],
      'tote': ['toute', 'toti', 'toti'],
      'autoryx': ['autorix', 'autori']
    };

    const words = processedText.split(/\b/);
    
    // Importación dinámica para evitar problemas en Edge (fastest-levenshtein es pure JS)
    const { distance } = require('fastest-levenshtein');

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      // Ignorar palabras muy cortas
      if (word.length < 4) continue;
      
      for (const [correctTerm, variations] of Object.entries(technicalTerms)) {
        // Si ya está bien escrito, saltar
        if (word === correctTerm) continue;

        // Validar contra las variaciones
        for (const variant of variations) {
          // Si la distancia matemática es 1 o 2 (pequeño error de dictado)
          if (distance(word, variant) <= 2) {
             words[i] = correctTerm;
             break;
          }
        }
        
        // También comparar contra la palabra correcta matemáticamente (por si dijo algo muy similar a bagger)
        if (distance(word, correctTerm) <= 2 && correctTerm.length > 4) {
           words[i] = correctTerm;
        }
      }
    }
    
    processedText = words.join('');

    // Ajuste adicional para casos de 2 palabras como "la bagger"
    processedText = processedText.replace(/\bla bagger\b/gi, 'bagger');
    processedText = processedText.replace(/\bla bagre\b/gi, 'bagger');
    processedText = processedText.replace(/\blavager\b/gi, 'bagger');

    // 1. Generar Embedding con Gemini (Agent B)
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(processedText);
    const embedding = embeddingResult.embedding.values.slice(0, 768);

    // 2. Buscar en Supabase (Agent B)
    const { data: matches, error: rpcError } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.65,
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
        El usuario reporta el siguiente problema: "${processedText}"
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
      user_query: processedText,
      ai_response: finalResponse,
      is_resolved: isResolved
    }).then(({ error }) => {
      if (error) console.error("Telemetry Logger Error:", error);
    });

    return NextResponse.json({ response: finalResponse });

  } catch (error: any) {
    console.error("Agent B Error:", error);
    return NextResponse.json(
      { error: error?.message || "Ha ocurrido un error desconocido con la IA." },
      { status: 500 }
    );
  }
}
