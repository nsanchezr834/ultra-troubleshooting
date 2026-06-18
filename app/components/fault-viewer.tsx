'use client';

import React, { useState, useEffect } from 'react';
import { FaultConfig, RobotConfig } from '../../config/robots-db';

interface FaultViewerProps {
    selectedRobot: RobotConfig;
}

export default function FaultViewer({ selectedRobot }: FaultViewerProps) {
    const [activeFault, setActiveFault] = useState<FaultConfig | null>(null);

    useEffect(() => {
        setActiveFault(null);
    }, [selectedRobot]);

    if (!selectedRobot.faults || selectedRobot.faults.length === 0) {
        return (
            <div className="w-full text-center p-12 bg-neutral-900 rounded-[2rem] border border-white/10 font-mono text-sm text-white/60 uppercase tracking-widest">
        // NO SE ENCONTRARON PROTOCOLOS DE FALLAS DISPONIBLES PARA ESTA UNIDAD
            </div>
        );
    }

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* TARJETA IZQUIERDA: SELECTOR DE FALLAS DETECTADAS (Toma 5 columnas) */}
            <section className="p-6 bg-neutral-900 rounded-[2rem] border border-white/10 flex flex-col gap-4 lg:col-span-5 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-1">
                    <h3 className="text-white text-xs font-mono font-bold tracking-wider uppercase">
                        FALLAS DETECTADAS EN WORKFLOW
                    </h3>
                    <span className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {selectedRobot.faults.length} disponibles
                    </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {selectedRobot.faults.map((fault: FaultConfig) => {
                        const isActive = activeFault?.id === fault.id;
                        const severityStyles: Record<string, { dot: string; label: string; badge: string }> = {
                            'alta':  { dot: 'bg-red-500',    label: 'text-red-400',    badge: isActive ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-400' },
                            'media': { dot: 'bg-amber-400',  label: 'text-amber-400',  badge: isActive ? 'bg-amber-600 text-white' : 'bg-amber-500/20 text-amber-300' },
                            'baja':  { dot: 'bg-sky-400',    label: 'text-sky-400',    badge: isActive ? 'bg-sky-600 text-white' : 'bg-sky-500/20 text-sky-400' },
                        };
                        const sev = severityStyles[fault.severity] ?? severityStyles['baja'];
                        return (
                            <button
                                key={fault.id}
                                onClick={() => setActiveFault(fault)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 ${
                                    isActive
                                        ? 'bg-white text-neutral-950 border-white shadow-xl translate-x-1'
                                        : 'bg-white/5 text-white border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
                                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                                            isActive ? 'text-neutral-500' : sev.label
                                        }`}>
                                            {fault.severity}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${sev.badge}`}>
                                        {fault.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="font-sans font-bold text-sm tracking-tight leading-snug">
                                    {fault.issue}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* TARJETA DERECHA: GUÍA DE TROUBLESHOOTING AVANZADA (Toma 7 columnas) */}
            <section className="p-8 bg-neutral-900 rounded-[2rem] border border-white/10 shadow-2xl lg:col-span-7 min-h-[450px] flex flex-col justify-between">
                {activeFault ? (
                    <div className="space-y-6 animate-fadeIn">

                        {/* Encabezado del reporte de la Guía */}
                        {(() => {
                            const headerSev: Record<string, { bg: string; text: string; border: string; label: string }> = {
                                'alta':  { bg: 'bg-red-500/10',   text: 'text-red-400',   border: 'border-red-400/20',   label: 'ALTA' },
                                'media': { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-400/20', label: 'MEDIA' },
                                'baja':  { bg: 'bg-sky-500/10',   text: 'text-sky-400',   border: 'border-sky-400/20',   label: 'BAJA' },
                            };
                            const hs = headerSev[activeFault.severity] ?? headerSev['baja'];
                            return (
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block mb-1 ${hs.text}`}>
                                            GUÍA DE AUTO-SERVICIO OPERATIVO
                                        </span>
                                        <h4 className="text-white text-xl font-bold font-sans tracking-tight">
                                            {activeFault.issue}
                                        </h4>
                                    </div>
                                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${hs.bg} ${hs.text} ${hs.border}`}>
                                        {hs.label}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Síntoma Técnico en Pantalla */}
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                            <span className="text-white/40 text-[9px] font-mono font-bold uppercase tracking-wider block">
                                SÍNTOMA TÉCNICO EN PANTALLA
                            </span>
                            <p className="text-white/80 text-xs font-sans leading-relaxed">
                                {activeFault.description}
                            </p>
                        </div>

                        <div className="h-[1px] w-full bg-white/10" />

                        {/* Listado Secuencial de Pasos */}
                        <div className="space-y-3">
                            <span className="text-white/40 text-[9px] font-mono font-bold uppercase tracking-wider block mb-1">
                                INSTRUCCIONES DE RESOLUCIÓN (SIGA LOS PASOS EN ORDEN)
                            </span>

                            <div className="space-y-3">
                                {activeFault.troubleshooting.map((step: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 transition-all hover:bg-white/[0.07]"
                                    >
                                        <div className="flex items-center justify-center bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm w-7 h-7 rounded-lg shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <p className="text-white/90 text-xs font-mono leading-relaxed pt-0.5">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bloque Inferior de Advertencia y Escalación */}
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-2 font-mono text-[11px] text-white/50">
                            <div className="flex items-center gap-2 text-amber-400/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-xs">
                                <span className="text-sm">⚠️</span>
                                <p>Si tras completar estos pasos el robot no reanuda su flujo, solicite soporte de nivel 2.</p>
                            </div>
                            <div className="mt-2 pl-1">
                                <span className="text-white/30 uppercase font-bold">Escalación Externa:</span>{' '}
                                <span className="text-white/80 underline decoration-white/10">{activeFault.escalation}</span>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 font-mono text-xs text-white/30 tracking-widest space-y-2 my-auto">
                        <span>[ EN ESPERA DE COMANDO ]</span>
                        <span className="text-[10px] text-white/10">SELECCIONE UNA FALLA ACTIVA DEL PANEL IZQUIERDO</span>
                    </div>
                )}
            </section>

        </div>
    );
}