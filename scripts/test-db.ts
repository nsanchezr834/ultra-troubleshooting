import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    const { data: robots, error: robotsError } = await supabase.from('robots').select('*').in('id', ['packasaurus', 'captain-pack-sparrow']);
    const { data: workflows, error: workflowsError } = await supabase.from('workflows').select('id, name').in('id', ['packasaurus', 'captain-pack-sparrow']);
    const { data: advises, error: advisesError } = await supabase.from('advises').select('*').in('robot_id', ['packasaurus', 'captain-pack-sparrow']);
    const { data: faults, error: faultsError } = await supabase.from('faults').select('*').in('robot_id', ['packasaurus', 'captain-pack-sparrow']);
    console.log('robots:', { robots, robotsError });
    console.log('workflows:', { workflows, workflowsError });
    console.log('advises count:', advises ? advises.length : 0, advisesError);
    console.log('faults count:', faults ? faults.length : 0, faultsError);
}

test();
