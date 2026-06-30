CREATE TABLE IF NOT EXISTS public.live_station_status (
    station_id TEXT PRIMARY KEY,
    robot_id TEXT,
    latest_orders JSONB NOT NULL DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.live_station_status ENABLE ROW LEVEL SECURITY;

-- Crear política de lectura pública (cualquiera que tenga la app puede ver el estatus)
CREATE POLICY "Permitir lectura publica de live_station_status"
    ON public.live_station_status
    FOR SELECT
    USING (true);

-- Agregar la tabla a la publicación de supabase_realtime para poder escuchar cambios en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_station_status;
