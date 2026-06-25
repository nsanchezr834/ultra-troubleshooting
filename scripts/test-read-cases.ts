import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, anonKey);

async function check() {
  const { data, error } = await supabase.from('casos_estudio').select('*');
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : null);
  console.log('Data sample:', data);
}

check();
