import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Veamos si podemos hacer un select de las tablas o si la tabla exam_questions realmente tiene las columnas.
    // Vamos a consultar la base de datos a ver qué tablas existen y sus columnas.
    // Como no podemos hacer SQL directo si no tenemos una función RPC, podemos intentar llamar a PostgREST /rest/v1/ de forma cruda para ver qué cabeceras o columnas ve.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/exam_questions?limit=1`, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Accept': 'application/json'
        }
    });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    try {
        console.log('Body:', await res.json());
    } catch (e) {
        console.log('Body text:', await res.text());
    }
}

test();
