/**
 * lib/supabase.ts
 * Cliente Supabase singleton para uso en el proyecto Ultra Platform.
 * 
 * - Para Server Components y Server Actions: usa createServerClient()
 * - Para Client Components: usa createBrowserClient()
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Cliente único reutilizable (browser + server con anon key)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);