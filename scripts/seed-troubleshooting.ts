import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { TROUBLESHOOTING_DATABASE } from '../config/troubleshooting-db';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan variables de entorno de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log(`Iniciando migración de ${TROUBLESHOOTING_DATABASE.length} fallas de Troubleshooting registradas...`);

  // Formatear los registros para asegurar compatibilidad con la base de datos
  const payload = TROUBLESHOOTING_DATABASE.map(item => {
    // Normalizar severidad a mayúsculas por si acaso
    const severity = (item.severity || 'LOW').toUpperCase();
    const root_cause = item.root_cause || '';
    
    // Asegurar que la categoría no esté vacía
    const category = item.category || 'General';

    return {
      id: item.id,
      category: category,
      symptom: item.symptom,
      resolution_protocol: item.resolution_protocol,
      sop_reference: item.sop_reference || 'SOP N/A',
      video_url: item.video_url || null
    };
  });

  const { error } = await supabase
    .from('troubleshooting_knowledge')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error al migrar fallas:', error.message, error.details);
    process.exit(1);
  }

  console.log('✅ Ingesta exitosa. La base de datos de troubleshooting en Supabase ha sido actualizada con todas las fallas registradas.');
}

seed();
