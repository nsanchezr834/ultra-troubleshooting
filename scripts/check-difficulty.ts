import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Vamos a consultar la definición DDL de la restricción check o los valores permitidos de difficulty en exam_questions
    // O simplemente consultamos los valores de una tabla si existe alguna fila
    const { data, error } = await supabase.from('exam_questions').select('difficulty').limit(5);
    console.log('Existing questions difficulties:', data, error);
}

test();
