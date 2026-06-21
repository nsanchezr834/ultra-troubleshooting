'use client';

import React, { useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoInteraction {
    id: string;
    pauseAtSecond: number;
    question: string;
    options: string[];
    correctOptionIndex: number;
    feedbackMessage?: string;
}

interface VideoEntry {
    title: string;
    description: string;
    src: string;
    badge?: string;
    badgeColor?: 'emerald' | 'amber' | 'blue' | 'red';
    interactions?: VideoInteraction[];
}

// ─── Video Library ────────────────────────────────────────────────────────────
// Add new robots here. Set layout: 'grid' to display all videos simultaneously
// in a responsive CSS Grid (1 col mobile / 2 col desktop).
// Set layout: 'carousel' (default) to show a single video with a selector.

interface RobotVideoConfig {
    layout: 'grid' | 'carousel';
    videos: VideoEntry[];
}

const VIDEO_LIBRARY: Record<string, RobotVideoConfig> = {
    'fleetwood-pack': {
        layout: 'carousel',
        videos: [
            {
                title: 'Proceso Completo — Fleetwood',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Fleetwood.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_fleetwood.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'fleetwood': {
        layout: 'carousel',
        videos: [
            {
                title: 'Proceso Completo — Fleetwood',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Fleetwood.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_fleetwood.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'future-2.0': {
        layout: 'grid',
        videos: [
            {
                title: 'Proceso Completo — Future 2.0',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Future 2.0: desde la recepción del pedido hasta el depósito final de la bolsa.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_future.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
            {
                title: 'Falla — Bolsa Fuera de Posición',
                description:
                    'La bolsa queda fuera de posición dentro de la bagger durante el proceso de embolsado, interrumpiendo el ciclo operativo.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/falla_future.mp4',
                badge: 'ERROR',
                badgeColor: 'red',
            },
        ],
    },
    'monty': {
        layout: 'carousel',
        videos: [
            {
                title: 'Proceso Completo — Monty',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Monty con prueba interactiva.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_monty.mp4',
                badge: 'INTERACTIVO',
                badgeColor: 'blue',
                interactions: [
                    {
                        id: 'monty-q1',
                        pauseAtSecond: 5,
                        question: '¿Qué componente se debe inspeccionar primero al iniciar el ciclo?',
                        options: ['Los pedales de control', 'El sensor de seguridad', 'La torreta de luz'],
                        correctOptionIndex: 1,
                        feedbackMessage: 'Incorrecto. El sensor de seguridad es prioritario antes de arrancar.'
                    },
                    {
                        id: 'monty-q2',
                        pauseAtSecond: 12,
                        question: '¿Qué acción confirma que el artículo ha sido colocado correctamente?',
                        options: ['Escanear el artículo', 'Presionar el pedal', 'Esperar a que la banda avance'],
                        correctOptionIndex: 0,
                        feedbackMessage: 'Recuerda que el sistema necesita registrar el artículo mediante el escáner.'
                    }
                ]
            },
        ],
    },
    'venus': {
        layout: 'carousel',
        videos: [
            {
                title: 'Proceso Completo — Venus',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Venus.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_venus.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'packie-2.0': {
        layout: 'grid',
        videos: [
            {
                title: 'Proceso Completo — Packie',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Packie.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_packie.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
            {
                title: 'Proceso Fallido — Packie',
                description:
                    'Demostración de un error durante el proceso operativo del robot Packie.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_tower_completo.mp4',
                badge: 'ERROR',
                badgeColor: 'red',
            },
            {
                title: 'Gripper — Producto Grande',
                description:
                    'Vista desde el gripper demostrando el proceso de ingreso y manejo de un producto de gran tamaño.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Proceso%20Packie%20Grande.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'phil': {
        layout: 'grid',
        videos: [
            {
                title: 'Proceso Completo',
                description:
                    'Ciclo operativo estándar de Phil: escaneo de tote, colocación de artículos, sellado y finalización de pedido.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Proceso%20Completo%20_Phil.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
            {
                title: 'Error: Producto Pasado',
                description:
                    'Caso de manejo de error cuando el sistema detecta un producto fuera del rango de fecha. Incluye ruta de excepción completa.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/error_producto_pasado_phil.mp4',
                badge: 'ERROR',
                badgeColor: 'red',
            },
        ],
    },
    'bagger-label': {
        layout: 'grid',
        videos: [
            {
                title: 'Proceso Completo',
                description:
                    'Proceso correcto de cómo hacer el laboratorio del robot Bagger Label.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_bagger_label.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'box-fold': {
        layout: 'grid',
        videos: [
            {
                title: 'Proceso Completo',
                description:
                    'Proceso correcto del flujo completo para armar y depositar cajas.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_box.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'pick-sort': {
        layout: 'grid',
        videos: [
            {
                title: 'Proceso Completo',
                description:
                    'Proceso correcto del flujo completo de clasificación Pick Sort.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_pick.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
    'tower-stack-unstack': {
        layout: 'carousel',
        videos: [
            {
                title: 'Proceso Completo — Tower Stack/Unstack',
                description:
                    'Recorrido operativo completo del ciclo de trabajo del robot Tower Stack/Unstack: apilado y desapilado de producto.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_tower_completo.mp4',
                badge: 'OPERATIVO',
                badgeColor: 'emerald',
            },
        ],
    },
};

// ─── Badge color map ──────────────────────────────────────────────────────────

const BADGE_STYLES: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber:   'bg-amber-100   text-amber-700',
    blue:    'bg-blue-100    text-blue-700',
    red:     'bg-red-100     text-red-700',
};

// ─── Single video card ────────────────────────────────────────────────────────

function VideoCard({ entry }: { entry: VideoEntry }) {
    const badgeClass = BADGE_STYLES[entry.badgeColor ?? 'emerald'];
    const videoRef = useRef<HTMLVideoElement>(null);

    // Interactive state
    const [activeInteraction, setActiveInteraction] = useState<VideoInteraction | null>(null);
    const [completedInteractions, setCompletedInteractions] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);

    // Usamos un ref para evitar cierres (closures) obsoletos en los eventos rápidos del video
    const activeInteractionIdRef = useRef<string | null>(null);

    const handleTimeUpdate = () => {
        if (!entry.interactions || !videoRef.current) return;

        const currentTime = videoRef.current.currentTime;
        
        const interaction = entry.interactions.find(i =>
            currentTime >= i.pauseAtSecond &&
            !completedInteractions.has(i.id)
        );

        if (interaction && activeInteractionIdRef.current !== interaction.id) {
            activeInteractionIdRef.current = interaction.id; // Marcar inmediatamente
            videoRef.current.pause();
            setActiveInteraction(interaction);
            setFeedback(null);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (!activeInteraction) return;

        if (index === activeInteraction.correctOptionIndex) {
            setFeedback({ type: 'success', message: '¡Correcto!' });
            setTimeout(() => {
                setCompletedInteractions(prev => new Set(prev).add(activeInteraction.id));
                setActiveInteraction(null);
                activeInteractionIdRef.current = null; // Liberar el ref para futuras interacciones
                setFeedback(null);
                videoRef.current?.play();
            }, 1000);
        } else {
            setFeedback({
                type: 'error',
                message: activeInteraction.feedbackMessage || 'Incorrecto, intenta de nuevo.'
            });
        }
    };

    return (
        <div className="flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden relative">
            {/* Card header */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">🎬</span>
                    <h3 className="text-sm font-sans font-extrabold text-neutral-900 tracking-tight leading-tight">
                        {entry.title}
                    </h3>
                    {entry.badge && (
                        <span
                            className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0 ${badgeClass}`}
                        >
                            {entry.badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-neutral-500 font-medium pl-5 leading-snug">
                    {entry.description}
                </p>
            </div>

            {/* Video player — aspect-video prevents CLS; rounded-md clips corners */}
            <div className="aspect-video w-full bg-neutral-950 rounded-md overflow-hidden relative">
                <video
                    ref={videoRef}
                    key={entry.src}
                    src={entry.src}
                    controls={!activeInteraction} // Hide controls when interaction is active
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                    aria-label={entry.title}
                    onTimeUpdate={handleTimeUpdate}
                    onError={(e) => {
                        console.error('[VideoCard] Error al cargar el vídeo:', entry.src, e);
                    }}
                >
                    Tu navegador no soporta reproducción de vídeo HTML5.
                </video>

                {/* Interactive Overlay */}
                {activeInteraction && (
                    <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-6 z-10 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                            <h4 className="text-lg font-bold text-neutral-900 leading-tight">
                                {activeInteraction.question}
                            </h4>
                            
                            <div className="flex flex-col gap-2 mt-2">
                                {activeInteraction.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        className="w-full text-left px-4 py-3 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors text-sm font-medium text-neutral-700"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>

                            {feedback && (
                                <div className={`px-4 py-3 rounded-lg text-sm font-semibold mt-2 ${
                                    feedback.type === 'success' 
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                    {feedback.message}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    Archivo:
                </span>
                <code className="text-[10px] font-mono text-neutral-600 bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md truncate">
                    {entry.src}
                </code>
            </div>
        </div>
    );
}

// ─── Grid layout (multi-video) ────────────────────────────────────────────────

function VideoGrid({ videos }: { videos: VideoEntry[] }) {
    return (
        /*
         * Responsive CSS Grid:
         *   - Mobile  : 1 column
         *   - Desktop : 2 columns (md breakpoint)
         * gap-5 keeps breathing room between cards without overflow.
         */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full animate-fadeIn">
            {videos.map((v) => (
                <VideoCard key={v.src} entry={v} />
            ))}
        </div>
    );
}

// ─── Carousel layout (single-video with selector) ─────────────────────────────

function VideoCarousel({ videos }: { videos: VideoEntry[] }) {
    const [activeIdx, setActiveIdx] = React.useState(0);
    const activeVideo = videos[activeIdx];

    return (
        <div className="w-full flex flex-col gap-4 animate-fadeIn">
            {/* Tab selector — only shown when more than one video */}
            {videos.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {videos.map((v, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all border ${
                                activeIdx === idx
                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
                            }`}
                        >
                            {v.title}
                        </button>
                    ))}
                </div>
            )}

            <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🎬</span>
                            <h3 className="text-sm font-sans font-extrabold text-neutral-900 tracking-tight">
                                {activeVideo.title}
                            </h3>
                            {activeVideo.badge && (
                                <span
                                    className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${BADGE_STYLES[activeVideo.badgeColor ?? 'emerald']}`}
                                >
                                    {activeVideo.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 font-medium pl-6">
                            {activeVideo.description}
                        </p>
                    </div>
                </div>

                {/* Player — aspect-video prevents CLS */}
                <div className="aspect-video w-full bg-neutral-950">
                    <video
                        key={activeVideo.src}
                        src={activeVideo.src}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                        aria-label={activeVideo.title}
                        onError={(e) => {
                            console.error('[VideoCarousel] Error al cargar el vídeo:', activeVideo.src, e);
                        }}
                    >
                        Tu navegador no soporta reproducción de vídeo HTML5.
                    </video>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                        Archivo:
                    </span>
                    <code className="text-[10px] font-mono text-neutral-600 bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md">
                        {activeVideo.src}
                    </code>
                </div>
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface VideoPlayerProps {
    robotId: string | undefined;
}

export default function VideoPlayer({ robotId }: VideoPlayerProps) {
    const config: RobotVideoConfig | undefined = robotId ? VIDEO_LIBRARY[robotId] : undefined;

    if (!config || config.videos.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-20 text-center gap-3">
                <span className="text-4xl">🎬</span>
                <p className="text-sm font-sans font-semibold text-neutral-500">
                    No hay vídeos disponibles para este robot todavía.
                </p>
            </div>
        );
    }

    return config.layout === 'grid' ? (
        <VideoGrid videos={config.videos} />
    ) : (
        <VideoCarousel videos={config.videos} />
    );
}
