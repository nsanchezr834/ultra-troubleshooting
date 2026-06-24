-- DDL para crear la tabla de exam_questions en Supabase
-- Ejecuta este script en el editor SQL de tu panel de Supabase.

CREATE TABLE IF NOT EXISTS public.exam_questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT NOT NULL CHECK (category IN ('Training 1', 'Training 2', 'Training 3', 'DC', 'Customer')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de preguntas (para los exámenes y el dashboard)
DROP POLICY IF EXISTS "Permitir lectura pública de preguntas" ON public.exam_questions;
CREATE POLICY "Permitir lectura pública de preguntas" ON public.exam_questions
    FOR SELECT USING (true);

-- Permitir gestión total a service_role (necesaria para el seed de inicio)
DROP POLICY IF EXISTS "Permitir gestión total a service_role" ON public.exam_questions;
CREATE POLICY "Permitir gestión total a service_role" ON public.exam_questions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permitir escritura pública (necesaria para edición directa desde el frontend del Trainer con anon key)
DROP POLICY IF EXISTS "Permitir inserción pública de preguntas" ON public.exam_questions;
CREATE POLICY "Permitir inserción pública de preguntas" ON public.exam_questions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualización pública de preguntas" ON public.exam_questions;
CREATE POLICY "Permitir actualización pública de preguntas" ON public.exam_questions
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir borrado público de preguntas" ON public.exam_questions;
CREATE POLICY "Permitir borrado público de preguntas" ON public.exam_questions
    FOR DELETE USING (true);
