import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const name = "TEST3";
    const trainer = "Raul Jimenez";
    
    console.log("Checking if pin exists for pin:", pin);
    const { data: existing, error: checkError } = await supabaseAdmin
        .from('training_sessions')
        .select('id')
        .eq('pin', pin)
        .single();
    console.log("Check result:", { existing, checkError });

    console.log("Inserting training session...");
    const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .insert({
            pin,
            name: name.trim(),
            trainer: trainer.trim(),
            client_id: null,
            robot_id: null,
            active: true,
        })
        .select()
        .single();
        
    console.log("Insert result:", { data, error });
}

test();
