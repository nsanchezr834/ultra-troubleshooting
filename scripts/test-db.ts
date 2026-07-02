import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { count: c1 } = await supabase.from('casos_estudio').select('*', { count: 'exact', head: true });
  const { count: c2 } = await supabase.from('troubleshooting_knowledge').select('*', { count: 'exact', head: true });
  const { count: c3 } = await supabase.from('advises').select('*', { count: 'exact', head: true });
  console.log(`casos_estudio: ${c1}`);
  console.log(`troubleshooting_knowledge: ${c2}`);
  console.log(`advises: ${c3}`);
}
test();
