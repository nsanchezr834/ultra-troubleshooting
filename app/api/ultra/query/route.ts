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
  const startTime = performance.now();
  try {
    const { text, history = [], contextMatches = null } = await req.json();

    // Helper function to retry Gemini API calls
    const generateContentWithRetry = async (model: any, prompt: string, retries = 2) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await model.generateContent(prompt);
        } catch (error: any) {
          if (i === retries - 1) throw error;
          if (error?.message?.includes("503") || error?.message?.includes("429")) {
            await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s before retrying
          } else {
            throw error;
          }
        }
      }
    };

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
      const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const options = contextMatches.map((m: any, index: number) => `Opción ${index + 1}: ${m.symptom || m.error_message || m.problem_description} \nCausa Raíz: ${m.root_cause} \nResolución: ${m.resolution_protocol}`).join('\n\n');

      const prompt = `
        Eres "Ultra", un asistente de voz técnico para operarios.
        El usuario estaba respondiendo a una pregunta tuya para elegir su problema.
        Historial reciente: ${JSON.stringify(history.slice(-4))}
        Última respuesta del usuario: "${processedText}"
        Opciones posibles: ${options}
        
        Tu tarea:
        1. Si el usuario dice "cancelar", "ninguna", responde EXACTAMENTE: "Operación cancelada."
        2. Si no entendiste, responde EXACTAMENTE: "No pude entender cuál opción elegiste. ¿Podrías repetirlo?"
        3. Si elige una opción, dale la solución exacta al operario.
        
        Reglas de voz estrictas:
        - NO saludes ni pierdas tiempo.
        - NO digas de dónde sacaste la información (nada de "según los consejos operativos" ni "en la base de datos").
        - Si la solución incluye varios pasos, enúmeralos diciendo explícitamente "Paso 1...", "Paso 2...". Si no, dila de corrido.
        - Sé claro, fluido y ve directo al grano.
        - NO uses markdown. Usa signos de puntuación claros para el Text-to-Speech.
        - IMPORTANTE: Al final de dar tu solución, DEBES terminar diciendo exactamente: "¿Resolvió esto tu problema? Responde sí o no."
      `;

      const aiResponse = await generateContentWithRetry(flashModel, prompt);
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
        match_threshold: 0.40, // Bajamos el umbral para incluir más resultados
        match_count: 10
      });

      if (rpcError) throw new Error(`RPC Error: ${rpcError.message}`);
      matchesToLog = matches || [];

      if (matchesToLog.length > 0) {
        const bestMatch = matchesToLog[0];
        const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Desambiguación si hay múltiples opciones
        if (matchesToLog.length > 1) {
          const options = matchesToLog.map((m: any, index: number) => `Opción ${index + 1}: ${m.symptom || m.error_message || m.problem_description} (Tipo: ${m.category})`).join('\n');
          const prompt = `
            Eres "Ultra", un asistente de voz técnico para operarios.
            Historial reciente: ${JSON.stringify(history.slice(-4))}
            Problema del usuario: "${processedText}"
            Opciones encontradas en el sistema:
            ${options}
            
            Tu tarea:
            1. Si solo una opción resuelve exactamente el problema, dale la solución directamente.
            2. Si hay varias opciones válidas (ej. el usuario dice "no se mueve"), hazle una pregunta CORTA y directa para aclarar. Por ejemplo: "¿No se mueve completamente, o una parte en específico?".
            
            Reglas de voz estrictas:
            - NO saludes ni pierdas el tiempo.
            - NO digas de dónde sacaste la información.
            - Si vas a dar la solución y tiene pasos, indícalos diciendo "Paso 1...", "Paso 2...".
            - Sé claro y fluido. NO uses markdown.
          `;
          const aiResponse = await generateContentWithRetry(flashModel, prompt);
          finalResponse = aiResponse.response.text();
          newContextMatches = matchesToLog; // Guardamos el contexto para la siguiente vuelta
        } else {
          // Alta confianza o solo 1 resultado: Resolver directo
          isResolved = true;
          const prompt = `
            Eres "Ultra", un asistente de voz técnico para operarios.
            Historial reciente: ${JSON.stringify(history.slice(-4))}
            Problema del usuario: "${processedText}"
            
            Información técnica a usar:
            - Causa Raíz: ${bestMatch.root_cause}
            - Resolución: ${bestMatch.resolution_protocol}
            
            Tu tarea: Dale la solución al problema usando la información técnica anterior.
            
            Reglas de voz estrictas:
            - NO saludes.
            - NO digas cosas como "Según la base de datos" o "Encontré un consejo". Ve directo a la respuesta.
            - Si la solución implica una secuencia, numérala diciendo explícitamente "Paso 1.", "Paso 2.". Si es una sola acción, léele el texto de corrido.
            - Habla de forma clara, directa y fluida. 
            - NO uses markdown (ni negritas, ni asteriscos). Usa comas y puntos para que el motor de voz haga las pausas correctas.
            - IMPORTANTE: Al final de dar tu solución, DEBES terminar diciendo exactamente: "¿Resolvió esto tu problema? Responde sí o no."
          `;
          const aiResponse = await generateContentWithRetry(flashModel, prompt);
          finalResponse = aiResponse.response.text();
        }
      }
    }

    // 4. Telemetría y Retención Asíncrona (Agent C - Caja Negra)
    const cookieStore = await cookies();
    const operatorName = cookieStore.get('operator_name')?.value || 'Operador Desconocido';
    let telemetryId = null;

    // Solo registrar en telemetría si NO fue una cancelación
    if (!finalResponse.includes("Operación cancelada")) {
      const displayQuery = `${processedText}`; // Ahora guardamos solo el texto de búsqueda real
      
      const telemetryPayload = {
        query: displayQuery,
        matches_count: matchesToLog ? matchesToLog.length : 0,
        selected_option: (matchesToLog && matchesToLog.length > 0) ? matchesToLog[0].resolution_protocol.substring(0, 50) + "..." : null,
        time_spent_seconds: Math.floor((performance.now() - startTime) / 1000),
        status: isResolved ? 'RESUELTO' : 'SIN SOLUCIÓN',
        source: 'VOZ',
        operator_name: operatorName,
        ai_response: finalResponse
      };
      
      // Guardar log en formato legacy
      supabase.from('assistant_logs').insert({
        user_query: `${operatorName} (Por Voz) - "${processedText}"`,
        ai_response: finalResponse,
        is_resolved: isResolved
      }).then(({ error }) => {
        if (error) console.error("Assistant Logger Error:", error);
      });

      // Guardar en nueva telemetría y obtener el ID
      try {
        const telRes = await fetch(new URL('/api/telemetry', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telemetryPayload)
        });
        if (telRes.ok) {
          const telJson = await telRes.json();
          if (telJson.data && telJson.data.length > 0) {
            telemetryId = telJson.data[0].id;
          }
        }
      } catch (err) {
        console.error("Agent C Error (Telemetry):", err);
      }
    }

    return NextResponse.json({
      success: true,
      query: processedText,
      response: finalResponse,
      resolved: isResolved,
      matches: newContextMatches, // Se enviará al cliente para guardar contexto
      telemetryId: telemetryId // ID devuelto para que el frontend pueda hacer PATCH del feedback
    });

  } catch (error: any) {
    console.error("Agent B Error:", error);

    // Mandar el error técnico al dashboard del Admin para registro
    const cookieStore = await cookies();
    const operatorName = cookieStore.get('operator_name')?.value || 'Operador Desconocido';
    const technicalError = error?.message || "Error desconocido al procesar la respuesta.";

    supabase.from('assistant_logs').insert({
      user_query: `${operatorName} (Por Voz) - Error Técnico`,
      ai_response: `ERROR: ${technicalError}`,
      is_resolved: false
    }).then(({ error: logError }) => {
      if (logError) console.error("Error logging failure:", logError);
    });

    // Devolver un mensaje genérico y amigable al usuario final
    return NextResponse.json(
      { error: "Lo siento, mis servidores de Inteligencia Artificial están en mantenimiento. Por favor, inténtalo más tarde." },
      { status: 500 }
    );
  }
}
