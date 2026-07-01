import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CLIENTS_DATABASE } from '../config/robots-db';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function syncAdvices() {
  let count = 0;
  
  for (const client of Object.values(CLIENTS_DATABASE)) {
    for (const robot of client.robots) {
      if (robot.advises && robot.advises.length > 0) {
        for (const advice of robot.advises) {
          const cleanContent = advice.content.replace(/<[^>]*>/g, '');
          let rawId = `ADV-${client.id}-${robot.id}-${advice.id}`;
          if (rawId.length > 50) {
             rawId = `ADV-${advice.id}`; // advice.id is unique enough, e.g. "fleetwood-pack__1"
             if (rawId.length > 50) {
                rawId = rawId.substring(0, 50);
             }
          }
          const id = rawId;
          const symptom = `Consejo Operativo ${robot.name}: ${cleanContent.substring(0, 100)}`;
          const resolution = cleanContent;
          
          // Generar embedding
          const textToEmbed = `Síntoma/Pregunta: ${symptom}\n\nResolución: ${resolution}`;
          let embeddingValues = null;
          
          try {
             const result = await embeddingModel.embedContent(textToEmbed);
             embeddingValues = result.embedding.values.slice(0, 768);
          } catch(err) {
             console.error(`Error generando embedding para ${id}:`, err);
             continue;
          }

          // Insertar o actualizar en Supabase
          const { error } = await supabase
            .from('troubleshooting_knowledge')
            .upsert({
               id: id,
               category: 'Consejos Operativos',
               symptom: symptom,
               root_cause: 'Operating Tip',
               severity: 'LOW',
               resolution_protocol: resolution,
               sop_reference: 'Operating Tips',
               embedding: embeddingValues
            }, { onConflict: 'id' });
            
          if (error) {
             console.error(`Error guardando ${id} en Supabase:`, error);
          } else {
             console.log(`✅ Sincronizado consejo: ${id}`);
             count++;
          }
          
          // Evitar rate limits de Gemini
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }
  
  console.log(`\n¡Sincronización completada! ${count} consejos operativos insertados en Supabase.`);
}

syncAdvices();
