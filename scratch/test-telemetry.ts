import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ── Cargar variables de entorno de .env.local manualmente ──
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const parts = trimmedLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Usar service key para evadir RLS en la ejecución de scripts
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: No se encontraron las credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Datos de Prueba ──
const mockTelemetry = [
  // 2 resolved
  {
    query: 'como reiniciar la impresora bagger',
    matches_count: 2,
    selected_option: 'Qué hacer en caso de que no imprima la etiqueta (Bagger / Impresora Integrada)',
    time_spent_seconds: 28,
    status: 'resolved'
  },
  {
    query: 'falla en brazos del robot',
    matches_count: 1,
    selected_option: 'Falla de brazos: Uno o ambos brazos del robot se quedan congelados',
    time_spent_seconds: 42,
    status: 'resolved'
  },
  // 2 no_matches
  {
    query: 'el sensor de la banda transportadora huele a quemado',
    matches_count: 0,
    selected_option: null,
    time_spent_seconds: 0,
    status: 'no_matches'
  },
  {
    query: 'el robot Fleetwood tiro aceite en la celda',
    matches_count: 0,
    selected_option: null,
    time_spent_seconds: 0,
    status: 'no_matches'
  },
  // 2 abandoned
  {
    query: 'no abre la pinza o gripper',
    matches_count: 3,
    selected_option: null,
    time_spent_seconds: 0,
    status: 'abandoned'
  },
  {
    query: 'problema de red del visor',
    matches_count: 2,
    selected_option: null,
    time_spent_seconds: 0,
    status: 'abandoned'
  },
  // 2 retried
  {
    query: 'camara rota del robot',
    matches_count: 1,
    selected_option: null,
    time_spent_seconds: 0,
    status: 'retried'
  },
  {
    query: 'brazo congelado',
    matches_count: 3,
    selected_option: null,
    time_spent_seconds: 0,
    status: 'retried'
  }
];

async function runTest() {
  console.log('Iniciando inserción de 8 registros de prueba en voice_telemetry...');

  for (const log of mockTelemetry) {
    const { data, error } = await supabase
      .from('voice_telemetry')
      .insert([log])
      .select();

    if (error) {
      console.error(`❌ Error insertando registro con status "${log.status}":`, error.message);
    } else {
      console.log(`✅ Inserción exitosa (${log.status}): "${log.query}"`);
    }
  }

  console.log('\nPrueba finalizada. Por favor revisa tu tabla en Supabase.');
}

runTest();
