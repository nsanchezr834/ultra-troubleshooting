import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Vamos a consultar pg_attribute para ver exactamente cuáles son las columnas reales de la tabla exam_questions en postgres
    const { data, error } = await supabase.rpc('empty_schema_cache_dummy'); // No existe
    // Haremos una llamada HTTP a PostgREST /rest/v1/ especificando la cabecera Prefer: params=single-object
    // O mejor, listamos las tablas usando postgrest:
    const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_SERVICE_KEY}`);
    const json = await res.json();
    console.log('Tables in schema:', Object.keys(json.paths));
}

test();
