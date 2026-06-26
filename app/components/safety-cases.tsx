'use client';

import React, { useState, useEffect } from 'react';
import { Siren, AlertOctagon, Film, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

interface SafetyCasesProps {
    isDarkMode?: boolean;
}

interface SafetyCase {
    id: number;
    label_corto: string;
    titulo: string;
    descripcion: string;
    recomendacion: string;
    video_url: string;
}

export default function SafetyCases({ isDarkMode = false }: SafetyCasesProps) {
    const [cases, setCases] = useState<SafetyCase[]>([]);
    const [activeCaseId, setActiveCaseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCases() {
            try {
                const { data, error } = await supabase
                    .from('casos_estudio')
                    .select('*')
                    .order('id', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    setCases(data);
                    setActiveCaseId(data[0].id);
                }
            } catch (err) {
                console.error('Error fetching safety cases:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCases();
    }, []);

    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const handlePrev = () => {
        if (cases.length === 0) return;
        const currentIndex = cases.findIndex(c => c.id === activeCaseId);
        const prevIndex = (currentIndex - 1 + cases.length) % cases.length;
        setActiveCaseId(cases[prevIndex].id);
    };

    const handleNext = () => {
        if (cases.length === 0) return;
        const currentIndex = cases.findIndex(c => c.id === activeCaseId);
        const nextIndex = (currentIndex + 1) % cases.length;
        setActiveCaseId(cases[nextIndex].id);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;

        // Deslizar izquierda -> Siguiente. Deslizar derecha -> Anterior.
        if (diffX > 50) {
            handleNext();
        } else if (diffX < -50) {
            handlePrev();
        }
        setTouchStartX(null);
    };

    const descTextClass = isDarkMode ? 'text-neutral-300' : 'text-neutral-700';
    const bgContainerClass = isDarkMode 
        ? 'bg-[#12131a]/65 backdrop-blur-[20px] border-white/[0.08] text-neutral-100'
        : 'bg-white/65 backdrop-blur-[20px] border-white/[0.6] text-neutral-900 shadow-slate-200/50';

    const activeCase = cases.find(c => c.id === activeCaseId);

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-fadeIn">
            {/* Encabezado del Módulo */}
            <div className="text-center space-y-2 mb-4">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
                    <Siren className="w-3.5 h-3.5" />
                    Protocolos y Prevención de Riesgos
                </span>
                <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    Casos de Estudio de Seguridad
                </h3>
                <p className={`text-xs max-w-md mx-auto font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Analiza incidentes reales para comprender la importancia de las escalaciones oportunas y la seguridad física.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                </div>
            ) : cases.length === 0 ? (
                <div className="text-center py-12 text-sm text-neutral-500 font-medium">
                    No se encontraron casos de estudio de seguridad registrados.
                </div>
            ) : (
                <>
                    {/* Selector de Casos en Carrusel */}
                    <div className="flex items-center justify-between w-full max-w-xl mx-auto mb-2 px-4 gap-4">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className={`p-2.5 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 ${
                                isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-neutral-300 hover:text-white hover:bg-neutral-800' 
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 shadow-xs'
                            }`}
                            aria-label="Caso anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-red-500">
                                Caso {cases.findIndex(c => c.id === activeCaseId) + 1} de {cases.length}
                            </span>
                            <span className={`text-xs font-bold tracking-tight ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                {activeCase?.label_corto}
                            </span>
                            
                            {/* Dots de navegación */}
                            <div className="flex gap-1.5 mt-1">
                                {cases.map((c, idx) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setActiveCaseId(c.id)}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            activeCaseId === c.id 
                                                ? 'bg-red-600 w-5' 
                                                : isDarkMode 
                                                    ? 'bg-neutral-800 hover:bg-neutral-700 w-2' 
                                                    : 'bg-neutral-300 hover:bg-neutral-450 w-2'
                                        }`}
                                        aria-label={`Ir al caso ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleNext}
                            className={`p-2.5 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 ${
                                isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-neutral-300 hover:text-white hover:bg-neutral-800' 
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 shadow-xs'
                            }`}
                            aria-label="Siguiente caso"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Detalle del Caso Activo */}
                    {activeCase && (
                        <div 
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            className={`border rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-8 transition-all duration-500 shadow-lg ${bgContainerClass}`}
                        >
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                {/* Fila del Video y la Descripción */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    {/* Video */}
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                        <video 
                                            key={activeCase.video_url}
                                            src={activeCase.video_url}
                                            controls
                                            playsInline
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <div className="flex flex-col justify-center h-full gap-4">
                                        <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                            <AlertTriangle className="w-4 h-4" />
                                            Análisis del Incidente — {activeCase.label_corto}
                                        </div>
                                        <h4 className="text-xl font-extrabold tracking-tight">
                                            {activeCase.titulo}
                                        </h4>
                                        <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                            {activeCase.descripcion}
                                        </p>
                                        {activeCase.recomendacion && (
                                            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                                <strong>
                                                    {activeCase.recomendacion}
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resultados No Deseados (Mapeado específico para el Caso 1) */}
                                {activeCase.id === 1 && (
                                    <div className="border-t border-neutral-200/20 pt-6 mt-2">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                                            <AlertOctagon className="w-4 h-4 text-red-600" />
                                            Resultados no deseados
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            {[
                                                { src: '/brazo1.webp', alt: 'Daño Físico Brazo 1', label: 'Estructura forzada' },
                                                { src: '/brazo2.webp', alt: 'Daño Físico Brazo 2', label: 'Deformación del soporte' },
                                                { src: '/brazo3.webp', alt: 'Daño Físico Brazo 3', label: 'Articulación averiada' }
                                            ].map((img, idx) => (
                                                <div key={idx} className="flex flex-col gap-2 group cursor-pointer">
                                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-250/20 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg bg-neutral-900 flex items-center justify-center">
                                                        <img 
                                                            src={img.src} 
                                                            alt={img.alt} 
                                                            className="w-full h-full object-cover group-hover:opacity-90"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-neutral-500 text-center uppercase tracking-wider group-hover:text-red-500 transition-colors">
                                                        {img.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
