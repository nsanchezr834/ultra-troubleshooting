-- Migration: Add target_url to robots table
-- Habilita la configuración dinámica de la URL del portal de Ultra

ALTER TABLE public.robots ADD COLUMN IF NOT EXISTS target_url TEXT;
