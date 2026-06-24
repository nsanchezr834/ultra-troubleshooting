import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Intentar borrar la cache enviando una petición HTTP NOTIFY o similar, o simplemente intentando recrear una función RPC temporal para ejecutar SQL que limpie la caché.
    // Supabase a veces tiene un botón en Database -> Schema -> "Reload schema" o se arregla haciendo cualquier cambio DDL por el editor de SQL.
    // Intentemos forzar al postgrest recargando la caché creando y destruyendo una tabla tonta:
    const { data: d1, error: e1 } = await supabase.from('dummy_table_to_force_cache_reload').select('*').limit(1);
    console.log('Dummy select:', d1, e1);
}

test();
