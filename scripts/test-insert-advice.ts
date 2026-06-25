import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan variables de entorno de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertAdvice() {
  const testId = `test_advice_${Math.floor(Math.random() * 100000)}`;
  console.log(`Insertando consejo de prueba con ID: ${testId}...`);

  const { data, error } = await supabase
    .from('advises')
    .insert([
      {
        id: testId,
        robot_id: 'mercury',
        advice_number: 99,
        content: 'Prueba de Alerta: Agarre de bolsa correcto en Mercury 💡',
        is_exception: false
      }
    ])
    .select();

  if (error) {
    console.error('❌ Error al insertar consejo:', error.message);
  } else {
    console.log('✅ Consejo insertado con éxito:', data);
    console.log('Espera unos segundos para recibir la alerta push en tus dispositivos.');
  }
}

testInsertAdvice();
