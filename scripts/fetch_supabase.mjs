import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllData() {
  const { data, error } = await supabase
    .from('troubleshooting_knowledge')
    .select('id, category, symptom')
    .order('category');
    
  if (error) {
    console.error("Error al consultar:", error);
  } else {
    // Write the output to a JSON file so the agent can read it
    fs.writeFileSync('scripts/db_report.json', JSON.stringify(data, null, 2));
    console.log(`Guardados ${data.length} registros en db_report.json`);
  }
}

getAllData();
