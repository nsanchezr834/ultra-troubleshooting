import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error("Faltan credenciales en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function generateEmbeddings() {
  console.log("Buscando registros sin embedding...");
  
  // Obtener filas donde el embedding es nulo
  const { data: rows, error: fetchError } = await supabase
    .from('troubleshooting_knowledge')
    .select('id, symptom, root_cause, resolution_protocol')
    .is('embedding', null);

  if (fetchError) {
    console.error("Error al obtener registros:", fetchError);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log("¡Todos los registros ya tienen embeddings!");
    return;
  }

  console.log(`Generando embeddings para ${rows.length} registros...`);
  const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  for (const row of rows) {
    // Combinar el síntoma y la resolución para que el vector tenga todo el contexto
    const textToEmbed = `Síntoma: ${row.symptom}. Causa: ${row.root_cause}. Solución: ${row.resolution_protocol}`;
    
    try {
      const result = await embeddingModel.embedContent(textToEmbed);
      // gemini-embedding-001 returns 3072, but DB expects 768. 
      const embedding = result.embedding.values.slice(0, 768);

      // Actualizar la fila en Supabase
      const { error: updateError } = await supabase
        .from('troubleshooting_knowledge')
        .update({ embedding })
        .eq('id', row.id);

      if (updateError) throw updateError;
      console.log(`✅ Embedding generado para: ${row.id}`);
      
    } catch (err) {
      console.error(`❌ Error con ${row.id}:`, err);
    }
  }
  
  console.log("Proceso terminado.");
}

generateEmbeddings();
