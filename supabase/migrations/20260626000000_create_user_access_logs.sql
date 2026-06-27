-- Migration: Create user_access_logs table

CREATE TABLE IF NOT EXISTS public.user_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    location TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de user_access_logs" ON public.user_access_logs;
CREATE POLICY "Permitir lectura pública de user_access_logs"
    ON public.user_access_logs FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserción pública de user_access_logs" ON public.user_access_logs;
CREATE POLICY "Permitir inserción pública de user_access_logs"
    ON public.user_access_logs FOR INSERT
    WITH CHECK (true);
