import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  console.log("Deleting test advice records...");
  const { data, error } = await supabase
    .from('advises')
    .delete()
    .like('id', 'test_advice_%')
    .select();
    
  console.log('Error:', error);
  console.log('Deleted rows:', data);
}

clean();
