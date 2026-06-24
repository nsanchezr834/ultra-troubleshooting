import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Probemos las otras dificultades posibles para encontrar cuáles acepta ('baja', 'alta' o 'fácil', 'difícil')
    const diffs = ['facil', 'fácil', 'alta', 'baja', 'dificil', 'difícil', 'hard', 'easy'];
    for (const d of diffs) {
        const { error } = await supabase.from('exam_questions').insert({
            id: '00000000-0000-4000-a000-000000000002',
            question: 'Test',
            options: ['A'],
            correct_index: 0,
            explanation: 'Test',
            difficulty: d,
            is_active: true
        });
        if (!error) {
            console.log(`Accepted: ${d}`);
            // Limpiar
            await supabase.from('exam_questions').delete().eq('id', '00000000-0000-4000-a000-000000000002');
        } else {
            console.log(`Rejected: ${d} - ${error.message}`);
        }
    }
}

test();
