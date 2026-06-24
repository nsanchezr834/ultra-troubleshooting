import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan variables de entorno de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestRecord() {
  const testId = Math.floor(Math.random() * 100000);
  console.log(`Paso 1: Insertando fila de prueba en 'casos_estudio' con ID: ${testId}...`);

  const { data, error } = await supabase
    .from('casos_estudio')
    .insert([
      {
        id: testId,
        label_corto: `Prueba Celular #${testId}`,
        titulo: `Notificación en Celular Exitosa 🎉`,
        descripcion: `Esta es una prueba de integración real. El webhook de Supabase se activó y envió esta alerta a tu dispositivo móvil.`,
        recomendacion: `¡Felicitaciones! Todo el flujo desde base de datos, backend y cliente PWA está completado.`,
        video_url: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/atoramiento%20robot.mp4'
      }
    ]);

  if (error) {
    console.error('❌ Error al insertar en la base de datos:', error.message);
  } else {
    console.log('✅ Fila insertada exitosamente en Supabase.');
    console.log('Paso 2: Espera unos segundos en tu celular y computadora para recibir la notificación push.');
  }
}

insertTestRecord();
