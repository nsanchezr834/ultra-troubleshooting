import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Intentemos recrear la caché insertando usando postgrest crudo con fetch o algo, o simplemente insertando y capturando columnas devueltas.
    // O tal vez la tabla no fue borrada y recreada correctamente.
    // Vamos a consultar la lista de columnas usando information_schema desde una consulta RPC si existe, o consultar la tabla con select().
    // Hagamos un insert simple sin el campo active a ver si funciona.
    const { data, error } = await supabase.from('exam_questions').insert({
        id: 'test-sync-1234',
        question: 'Test',
        options: ['A', 'B'],
        correct_index: 0,
        explanation: 'Test explanation',
        difficulty: 'easy',
        category: 'Training 1'
    }).select();
    console.log('Insert attempt:', data, error);
}

test();
