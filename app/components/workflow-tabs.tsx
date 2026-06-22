'use client';

import React, { useState, useEffect } from 'react';
import { Video, Lightbulb, GitFork } from 'lucide-react';

export type TabType = 'faults' | 'workflow' | 'videos' | 'tips';

interface WorkflowTabsProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    showWorkflowTabs: boolean;
    showVideoTab: boolean;
    showTipsTab?: boolean;
    isDarkMode?: boolean;
}

export default function WorkflowTabs({
    activeTab,
    setActiveTab,
    showWorkflowTabs,
    showVideoTab,
    showTipsTab = false,
    isDarkMode = false,
}: WorkflowTabsProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Evita problemas de hidratación en Server Side Rendering
    if (!isMounted || !showWorkflowTabs) {
        return null;
    }

    const inactiveBg = isDarkMode
        ? 'bg-[#1a1b24] border-neutral-800 hover:border-neutral-600'
        : 'bg-white border-neutral-200/80 hover:border-neutral-300 hover:shadow-sm';

    const activeBg = isDarkMode
        ? 'bg-[#1a1b24] border-[#ff4f00] shadow-[0_4px_20px_rgba(255,79,0,0.08)]'
        : 'bg-orange-500/[0.02] border-[#ff4f00] shadow-[0_4px_20px_rgba(255,79,0,0.06)]';

    const descText = isDarkMode ? 'text-neutral-400' : 'text-neutral-500';
    const titleText = isDarkMode ? 'text-neutral-100' : 'text-neutral-900';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2">
            {/* 1. VIDEOS */}
            <button
                type="button"
                onClick={() => showVideoTab && setActiveTab('videos')}
                disabled={!showVideoTab}
                className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeTab === 'videos' ? activeBg : inactiveBg
                }`}
            >
                {/* Indicador de pestaña activa en el borde lateral */}
                {activeTab === 'videos' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#ff4f00]" />
                )}
                
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        activeTab === 'videos' 
                            ? 'bg-[#ff4f00]/10 text-[#ff4f00] scale-105' 
                            : isDarkMode
                                ? 'bg-neutral-800 text-neutral-400 group-hover:scale-105 group-hover:bg-[#ff4f00]/10 group-hover:text-[#ff4f00]'
                                : 'bg-neutral-100 text-neutral-500 group-hover:scale-105 group-hover:bg-[#ff4f00]/5 group-hover:text-[#ff4f00]'
                    }`}>
                        <Video className="w-5 h-5" />
                    </div>
                    <span className={`font-sans font-extrabold text-sm tracking-tight ${titleText}`}>
                        Videos
                    </span>
                </div>
                <p className={`text-[11px] font-medium leading-relaxed ${descText}`}>
                    Material audiovisual interactivo y demostraciones de procesos y excepciones operativas del robot.
                </p>
            </button>

            {/* 2. CONSEJOS */}
            <button
                type="button"
                onClick={() => showTipsTab && setActiveTab('tips')}
                disabled={!showTipsTab}
                className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeTab === 'tips' ? activeBg : inactiveBg
                }`}
            >
                {/* Indicador de pestaña activa en el borde lateral */}
                {activeTab === 'tips' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#ff4f00]" />
                )}
                
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        activeTab === 'tips' 
                            ? 'bg-[#ff4f00]/10 text-[#ff4f00] scale-105' 
                            : isDarkMode
                                ? 'bg-neutral-800 text-neutral-400 group-hover:scale-105 group-hover:bg-[#ff4f00]/10 group-hover:text-[#ff4f00]'
                                : 'bg-neutral-100 text-neutral-500 group-hover:scale-105 group-hover:bg-[#ff4f00]/5 group-hover:text-[#ff4f00]'
                    }`}>
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <span className={`font-sans font-extrabold text-sm tracking-tight ${titleText}`}>
                        Consejos
                    </span>
                </div>
                <p className={`text-[11px] font-medium leading-relaxed ${descText}`}>
                    Directrices de seguridad, consejos prácticos y buenas prácticas recomendadas para la operación diaria.
                </p>
            </button>

            {/* 3. WORKFLOW */}
            <button
                type="button"
                onClick={() => setActiveTab('workflow')}
                className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                    activeTab === 'workflow' ? activeBg : inactiveBg
                }`}
            >
                {/* Indicador de pestaña activa en el borde lateral */}
                {activeTab === 'workflow' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#ff4f00]" />
                )}
                
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        activeTab === 'workflow' 
                            ? 'bg-[#ff4f00]/10 text-[#ff4f00] scale-105' 
                            : isDarkMode
                                ? 'bg-neutral-800 text-neutral-400 group-hover:scale-105 group-hover:bg-[#ff4f00]/10 group-hover:text-[#ff4f00]'
                                : 'bg-neutral-100 text-neutral-500 group-hover:scale-105 group-hover:bg-[#ff4f00]/5 group-hover:text-[#ff4f00]'
                    }`}>
                        <GitFork className="w-5 h-5 rotate-90" />
                    </div>
                    <span className={`font-sans font-extrabold text-sm tracking-tight ${titleText}`}>
                        Workflow
                    </span>
                </div>
                <p className={`text-[11px] font-medium leading-relaxed ${descText}`}>
                    Mapa de flujo estructurado del ciclo operativo estándar y flujos de decisión del sistema robótico.
                </p>
            </button>
        </div>
    );
}
