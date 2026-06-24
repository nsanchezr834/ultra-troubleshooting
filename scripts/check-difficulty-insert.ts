import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Busquemos las restricciones del schema public.exam_questions consultando pg_constraint
    // mediante fetch crudo no podemos hacer SQL, pero veamos si hay un RPC para ver restricciones, o si la definición swagger nos da una pista.
    // La respuesta anterior de get-eq-properties.ts decía:
    // difficulty: { default: 'media', format: 'text', type: 'string' }
    // Nota que dice default: 'media' (en español, con "a" al final).
    // ¡Es posible que la restricción CHECK de difficulty permita ('fácil', 'media', 'difícil') o ('facil', 'media', 'dificil') o ('alta', 'media', 'baja')!
    // Probemos insertar una pregunta con difficulty = 'media' y ver si pasa la restricción.
    const { error } = await supabase.from('exam_questions').insert({
        id: '00000000-0000-4000-a000-000000000001',
        question: 'Test',
        options: ['A'],
        correct_index: 0,
        explanation: 'Test',
        difficulty: 'media',
        is_active: true
    });
    console.log('Insert test with difficulty "media":', error);
}

test();
