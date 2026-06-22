'use client';

import React, { useState } from 'react';
import { Siren, AlertOctagon, Film, Eye, ShieldAlert, AlertTriangle } from 'lucide-react';

interface SafetyCasesProps {
    isDarkMode?: boolean;
}

export default function SafetyCases({ isDarkMode = false }: SafetyCasesProps) {
    const [activeCase, setActiveCase] = useState<1 | 2>(1);

    const descTextClass = isDarkMode ? 'text-neutral-300' : 'text-neutral-700';
    const bgContainerClass = isDarkMode 
        ? 'bg-[#12131a]/65 backdrop-blur-[20px] border-white/[0.08] text-neutral-100'
        : 'bg-white/65 backdrop-blur-[20px] border-white/[0.6] text-neutral-900 shadow-slate-200/50';

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

            {/* Selector de Casos */}
            <div className={`flex flex-col sm:flex-row p-1 rounded-2xl max-w-md mx-auto w-full border gap-1 sm:gap-0 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}>
                <button
                    onClick={() => setActiveCase(1)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3.5 rounded-xl text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 ${
                        activeCase === 1
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/20 scale-[1.02]'
                            : isDarkMode
                                ? 'text-neutral-400 hover:text-neutral-200'
                                : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                >
                    <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Caso 1: Robot Atorado
                </button>
                <button
                    onClick={() => setActiveCase(2)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3.5 rounded-xl text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 ${
                        activeCase === 2
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/20 scale-[1.02]'
                            : isDarkMode
                                ? 'text-neutral-400 hover:text-neutral-200'
                                : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                >
                    <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Caso 2: Caída de Impresora
                </button>
            </div>

            {/* Detalle del Caso Activo */}
            <div className={`border rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-8 transition-all duration-500 shadow-lg ${bgContainerClass}`}>
                {activeCase === 1 ? (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/atoramiento%20robot.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Robot Atorado
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Colisión y Forzado de Motores
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    En el video se observa un atoramiento debajo de la mesa provocando que se haya movido la mesa el operador trata de regresar a posicion de home pero como el robot estaba mal posicionado jala la mesa y empieza a forzar motores.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        Es de suma importancia tener conciente que cuando se presente una posicion donde esta muy comprometido el robot es imperative sin ninguna otra alternativa mencionarle al suoervisor en turno que el robot se encuentra en esa posicion, el tiene toda la capacidad de poder ayudar a resolver el problema y evitar escalaciones.
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Resultados No Deseados */}
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
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/impresorasecae.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Caída de Impresora
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Desprendimiento de Componentes de la Estación
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    En este video se muestra como el operador tuvo un accidente con una impresora ya que por los movimientos realizados la tiro de su posicion, esto puede provocar daños no solo a la impresora en si, si no alguna persona que se encuentre al rededor o que caiga en algun otro objeto sea dañandolo o proyectandolo.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        Es importante escalar cualquier situacion de riesgo de forma imperativa a el supervisor en turno.
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
