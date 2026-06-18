-- DDL para crear la tabla de advises en Supabase
-- Ejecuta este script en el editor SQL de tu panel de Supabase.

CREATE TABLE IF NOT EXISTS public.advises (
    id TEXT PRIMARY KEY,
    robot_id TEXT NOT NULL REFERENCES public.robots(id) ON DELETE CASCADE,
    advice_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_exception BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.advises ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir que cualquiera (anónimo o autenticado) pueda leer los consejos
DROP POLICY IF EXISTS "Permitir lectura pública de consejos" ON public.advises;
CREATE POLICY "Permitir lectura pública de consejos" ON public.advises
    FOR SELECT USING (true);

-- Crear política para permitir que service_role realice cualquier operación (necesaria para el seed)
DROP POLICY IF EXISTS "Permitir gestión total a service_role" ON public.advises;
CREATE POLICY "Permitir gestión total a service_role" ON public.advises
    FOR ALL TO service_role USING (true) WITH CHECK (true);
