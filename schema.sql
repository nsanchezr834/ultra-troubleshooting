-- ==========================================
-- SUPABASE POSTGRES SCHEMA & WEBHOOK TRIGGER
-- ==========================================

-- Habilitar extensión http o pg_net si no están activas
create extension if not exists pg_net;
create extension if not exists vector;

-- Crear tipo de severidad si no existe
do $$
begin
    if not exists (select 1 from pg_type where typname = 'severity_level') then
        create type severity_level as enum ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
    end if;
end$$;

-- Tabla de Base de Conocimientos de Troubleshooting (si no existe)
create table if not exists public.troubleshooting_knowledge (
    id varchar(50) primary key,
    category varchar(50) not null,
    symptom text not null,
    root_cause text not null,
    severity severity_level not null,
    resolution_protocol text not null,
    sop_reference varchar(100) not null,
    video_url text, -- Se agrega soporte opcional para url de video
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Agregar columna de embedding para búsqueda semántica (Gemini)
alter table public.troubleshooting_knowledge add column if not exists embedding vector(768);

-- Tabla de Suscripciones a Notificaciones Push
create table if not exists public.push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recrear tabla de Casos de Estudio para limpiar caché de PostgREST
drop table if exists public.casos_estudio cascade;

create table public.casos_estudio (
    id serial primary key,
    label_corto text not null,
    titulo text not null,
    descripcion text,
    recomendacion text,
    video_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Consejos (Advises)
create table if not exists public.advises (
    id varchar(50) primary key,
    robot_id varchar(50) not null,
    advice_number integer not null,
    content text not null,
    is_exception boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Logs de Acceso de Usuarios
create table if not exists public.user_access_logs (
    id uuid default gen_random_uuid() primary key,
    full_name varchar(100) not null,
    ip_address varchar(45) not null,
    location text,
    accessed_at timestamptz default now()
);

-- Tabla de Logs del Asistente (Telemetría)
create table if not exists public.assistant_logs (
    id uuid default gen_random_uuid() primary key,
    user_query text not null,
    ai_response text not null,
    is_resolved boolean default false,
    created_at timestamptz default now()
);

-- Habilitar RLS en tablas creadas
alter table public.push_subscriptions enable row level security;
alter table public.casos_estudio enable row level security;
alter table public.troubleshooting_knowledge enable row level security;
alter table public.advises enable row level security;
alter table public.user_access_logs enable row level security;
alter table public.assistant_logs enable row level security;

drop policy if exists "Permitir inserción pública de assistant_logs" on public.assistant_logs;
create policy "Permitir inserción pública de assistant_logs"
    on public.assistant_logs for insert
    with check (true);

-- Políticas de RLS
drop policy if exists "Permitir lectura pública de user_access_logs" on public.user_access_logs;
create policy "Permitir lectura pública de user_access_logs"
    on public.user_access_logs for select
    using (true);

drop policy if exists "Permitir inserción pública de user_access_logs" on public.user_access_logs;
create policy "Permitir inserción pública de user_access_logs"
    on public.user_access_logs for insert
    with check (true);
drop policy if exists "Permitir inserción pública de suscripciones" on public.push_subscriptions;
create policy "Permitir inserción pública de suscripciones" 
    on public.push_subscriptions for insert 
    with check (true);

drop policy if exists "Permitir lectura para operaciones del sistema" on public.push_subscriptions;
create policy "Permitir lectura para operaciones del sistema"
    on public.push_subscriptions for select
    using (true);

drop policy if exists "Permitir eliminación pública de suscripciones" on public.push_subscriptions;
create policy "Permitir eliminación pública de suscripciones"
    on public.push_subscriptions for delete
    using (true);

drop policy if exists "Permitir lectura pública de casos de estudio" on public.casos_estudio;
create policy "Permitir lectura pública de casos de estudio"
    on public.casos_estudio for select
    using (true);

drop policy if exists "Permitir lectura pública de conocimientos de troubleshooting" on public.troubleshooting_knowledge;
create policy "Permitir lectura pública de conocimientos de troubleshooting"
    on public.troubleshooting_knowledge for select
    using (true);

drop policy if exists "Permitir lectura pública de advises" on public.advises;
create policy "Permitir lectura pública de advises"
    on public.advises for select
    using (true);

-- Función del disparador para despachar Webhook HTTP a Next.js
create or replace function public.fn_on_new_record_broadcast()
returns trigger as $$
declare
    payload jsonb;
    next_api_url text := 'https://ultra-troubleshooting.vercel.app/api/notifications/broadcast';
    webhook_secret text := 'SUPER_SECRET_WEBHOOK_TOKEN'; -- Token de autenticación del webhook
begin
    -- Construir payload con base en el origen del trigger
    if TG_TABLE_NAME = 'casos_estudio' then
        payload := jsonb_build_object(
            'title', 'Nuevo Caso de Seguridad 🛡️',
            'body', coalesce(new.titulo, 'Un nuevo caso de estudio ha sido publicado.'),
            'url', '/cases/' || new.id
        );
    elsif TG_TABLE_NAME = 'troubleshooting_knowledge' then
        payload := jsonb_build_object(
            'title', 'Nueva Falla (' || upper(coalesce(new.category, 'General')) || ') ⚠️',
            'body', coalesce(new.symptom, 'Se ha registrado la solución de una falla.'),
            'url', '/troubleshooting?search=' || new.id
        );
    elsif TG_TABLE_NAME = 'advises' then
        payload := jsonb_build_object(
            'title', 'Nuevo Consejo (' || upper(coalesce(new.robot_id, 'General')) || ') 💡',
            'body', coalesce(new.content, 'Se ha registrado un nuevo consejo operativo.'),
            'url', '/'
        );
    end if;

    -- Enviar petición POST asíncrona a Next.js utilizando pg_net
    perform net.http_post(
        url := next_api_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || webhook_secret
        ),
        body := payload
    );

    return new;
end;
$$ language plpgsql security definer;

-- Triggers de inserción o actualización
drop trigger if exists tr_casos_estudio_broadcast on public.casos_estudio;
create trigger tr_casos_estudio_broadcast
    after insert or update on public.casos_estudio
    for each row execute function public.fn_on_new_record_broadcast();

drop trigger if exists tr_troubleshooting_knowledge_broadcast on public.troubleshooting_knowledge;
create trigger tr_troubleshooting_knowledge_broadcast
    after insert or update on public.troubleshooting_knowledge
    for each row execute function public.fn_on_new_record_broadcast();

drop trigger if exists tr_advises_broadcast on public.advises;
create trigger tr_advises_broadcast
    after insert or update on public.advises
    for each row execute function public.fn_on_new_record_broadcast();

-- Función RPC para buscar conocimientos similares (Cosine Similarity)
create or replace function match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id varchar,
  category varchar,
  symptom text,
  root_cause text,
  resolution_protocol text,
  similarity float
)
language sql stable
as $$
  select
    troubleshooting_knowledge.id,
    troubleshooting_knowledge.category,
    troubleshooting_knowledge.symptom,
    troubleshooting_knowledge.root_cause,
    troubleshooting_knowledge.resolution_protocol,
    1 - (troubleshooting_knowledge.embedding <=> query_embedding) as similarity
  from public.troubleshooting_knowledge
  where troubleshooting_knowledge.embedding is not null 
    and 1 - (troubleshooting_knowledge.embedding <=> query_embedding) > match_threshold
  order by troubleshooting_knowledge.embedding <=> query_embedding
  limit match_count;
$$;
