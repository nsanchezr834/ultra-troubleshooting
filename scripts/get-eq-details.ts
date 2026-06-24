import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    // Vamos a consultar los detalles del path /exam_questions para ver qué columnas cree PostgREST que existen
    const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_SERVICE_KEY}`);
    const json = await res.json();
    const eqPath = json.paths['/exam_questions'];
    console.log('Parameters for GET /exam_questions:', eqPath.get.parameters.map((p: any) => p.name));
}

test();
