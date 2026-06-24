import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function test() {
    const { data, error } = await supabase.rpc('empty_schema_cache_dummy').select('*').limit(1).maybeSingle();
    // Alternativamente, forzar la recarga del esquema cache consultando PostgREST
    const { data: cols, error: colError } = await supabase.from('exam_questions').select('*').limit(1);
    console.log('Cols:', cols, 'Error:', colError);
}

test();
