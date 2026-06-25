import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(url, serviceKey);

async function clean() {
  console.log('Using Service Key to delete test record with ID > 6...');
  const { data, error } = await supabase.from('casos_estudio').delete().gt('id', 6).select();
  console.log('Error:', error);
  console.log('Deleted rows:', data);
}

clean();
