import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    const { text, history = [], contextMatches = null } = await req.json();

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
      }
    }
    
    processedText = words.join('');

    // Ajuste adicional para casos de 2 palabras como "la bagger"
    processedText = processedText.replace(/\bla bagger\b/gi, 'bagger');
    processedText = processedText.replace(/\bla bagre\b/gi, 'bagger');
    processedText = processedText.replace(/\blavager\b/gi, 'bagger');

    let finalResponse = "No encuentro esta falla. ¿Deseas que busque en manuales de robots o en el registro de consejos?";
    let isResolved = false;
    let newContextMatches = null;
    let matchesToLog: any[] = [];

    // FLUJO CONVERSACIONAL
    if (contextMatches && contextMatches.length > 0) {
      // 1. Fase de Desambiguación (Usando contexto previo)
      const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const options = contextMatches.map((m: any, index: number) => `Opción ${index + 1}: ${m.symptom || m.error_message || m.problem_description} \nCausa Raíz: ${m.root_cause} \nResolución: ${m.resolution_protocol}`).join('\n\n');
      
      const prompt = `
        Eres "Ultra", un asistente de voz técnico.
        El usuario estaba respondiendo a una pregunta de desambiguación para elegir su problema.
        Historial de la conversación reciente:
        ${JSON.stringify(history.slice(-4))}
        
        Última respuesta del usuario: "${processedText}"
        
        Opciones posibles que le diste a elegir:
        ${options}
        
        Tu tarea:
        1. Analiza la respuesta del usuario. Si el usuario dice algo como "cancelar", "ninguna", "salir" o que su problema no es ninguno, responde EXACTAMENTE y únicamente: "Operación cancelada."
        2. Si la respuesta del usuario indica claramente que no entendió o pide repetir, responde EXACTAMENTE: "No pude entender cuál opción elegiste. ¿Podrías repetirlo?"
        3. Si la respuesta del usuario elige una de las opciones (ya sea mencionando el número 1, 2, 3 o describiendo el síntoma de la opción), identifica cuál es.
        4. Si eligió una opción, formula una respuesta hablada (corta, natural, sin markdown) explicando la Causa Raíz y el Protocolo de Resolución de la opción elegida. Ve directo al grano.
      `;
      
      const aiResponse = await flashModel.generateContent(prompt);
      finalResponse = aiResponse.response.text().trim();
      
      if (!finalResponse.includes("Operación cancelada") && !finalResponse.includes("No pude entender")) {
        isResolved = true;
      }
      matchesToLog = contextMatches;
    } else {
      // 2. Fase Inicial (Sin Contexto) -> Vector Search
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const embeddingResult = await embeddingModel.embedContent(processedText);
      const embedding = embeddingResult.embedding.values.slice(0, 768);

      const { data: matches, error: rpcError } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.65,
        match_count: 10
      });

      if (rpcError) throw new Error(`RPC Error: ${rpcError.message}`);
      matchesToLog = matches || [];

      if (matchesToLog.length > 0) {
        const bestMatch = matchesToLog[0];
        const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Desambiguación si la confianza no es tan alta y hay múltiples opciones
        if (bestMatch.similarity < 0.78 && matchesToLog.length > 1) {
          const options = matchesToLog.map((m: any, index: number) => `Opción ${index + 1}: ${m.symptom || m.error_message || m.problem_description}`).join(' | ');
          const prompt = `
            Eres "Ultra", un asistente de voz técnico.
            Historial reciente de la conversación:
            ${JSON.stringify(history.slice(-4))}
            
            El usuario hizo una nueva consulta vaga: "${processedText}"
            Encontraste múltiples fallas posibles en la base de datos:
            ${options}
            
            Tu tarea: Genera una pregunta CORTA y hablada. Dile al usuario que encontraste varias opciones y pregúntale cuál de estas opciones es su problema real, resumiendo las opciones de forma súper breve para que el usuario pueda elegir (por número o síntoma).
            NO uses markdown.
          `;
          const aiResponse = await flashModel.generateContent(prompt);
          finalResponse = aiResponse.response.text();
          newContextMatches = matchesToLog; // Guardamos el contexto para la siguiente vuelta
        } else {
          // Alta confianza: Resolver directo
          isResolved = true;
          const prompt = `
            Eres "Ultra", un asistente de voz técnico.
            Historial reciente de la conversación:
            ${JSON.stringify(history.slice(-4))}
            
            El usuario reporta el siguiente problema: "${processedText}"
            La solución técnica encontrada es:
            - Causa Raíz: ${bestMatch.root_cause}
            - Protocolo de Resolución: ${bestMatch.resolution_protocol}
            
            Tu tarea: Genera una respuesta hablada, muy natural, conversacional y corta respondiendo al problema.
            NO uses markdown (ni negritas, ni listas). Usa puntuación clara para que un motor Text-to-Speech la lea bien.
            Ve directo al grano explicando qué causó el problema y qué debe hacer el usuario para resolverlo.
          `;
          const aiResponse = await flashModel.generateContent(prompt);
          finalResponse = aiResponse.response.text();
        }
      }
    }

    // 4. Telemetría y Retención Asíncrona (Agent C - Caja Negra)
    const cookieStore = await cookies();
    const operatorName = cookieStore.get('operator_name')?.value || 'Operador Desconocido';
    
    // Solo registrar en telemetría si NO fue una cancelación
    if (!finalResponse.includes("Operación cancelada")) {
      const displayQuery = `${operatorName} - "${processedText}"`;
      supabase.from('voice_telemetry').insert({
        query: displayQuery,
        matches_count: matchesToLog.length,
        selected_option: isResolved ? (matchesToLog.length > 0 ? matchesToLog[0].symptom || matchesToLog[0].error_message || 'Falla resuelta' : null) : null,
        time_spent_seconds: 0,
        status: isResolved ? 'resolved' : (newContextMatches ? 'pending_disambiguation' : 'no_matches'),
        source: 'ultra_ai_assistant',
        timestamp: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("Telemetry Logger Error:", error);
      });
    }

    return NextResponse.json({
      success: true,
      query: processedText,
      response: finalResponse,
      resolved: isResolved,
      matches: newContextMatches // Se enviará al cliente para guardar contexto
    });

  } catch (error: any) {
    console.error("Agent B Error:", error);
    
    // Devolver el error específico para que el Asistente lo lea en voz alta si ocurre algo
    return NextResponse.json(
      { error: `Error en la IA: ${error?.message || "Error desconocido al procesar la respuesta."}` },
      { status: 500 }
    );
  }
}
