'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ClientConfig, RobotConfig } from '../../config/robots-db';
import { WorkflowConfig } from '../../config/workflows-db';
import WorkflowVisualizer from './workflow-visualizer';
import VideoPlayer from './videos';
import WorkflowTabs, { TabType } from './workflow-tabs';
import { Sparkles } from 'lucide-react';

interface TelemetryDashboardProps {
    currentClient: ClientConfig | undefined;
    currentRobot: RobotConfig | undefined;
    clientLogoSrc: string;
    logoError: boolean;
    setLogoError: (error: boolean) => void;
    selectedFault?: string | null;
    setSelectedFault?: (fault: string | null) => void;
    workflowsDatabase?: Record<string, WorkflowConfig>;
    onRobotChange?: (robotId: string) => void;
}

/**
 * Resuelve qué workflow mostrar según el robot activo.
 * Mapeo explícito robot.id → workflow key en WORKFLOWS_DATABASE.
 *
 * Workflows activos:
 *   packie-2.0        → Packie 2.0 - Embolsado Estándar
 *   future-2.0        → Future 2.0 - Embolsado Avanzado
 *   fleetwood-pack    → Highline Commerce - Fleetwood Pack
 *   fleetwood         → Highline Commerce - Fleetwood Pack (alias)
 */
const ROBOT_TO_WORKFLOW_MAP: Record<string, string> = {
    'packie-2.0': 'packie-2.0',
    'future-2.0': 'future-2.0',
    'fleetwood-pack': 'highline-fleetwood',
    'fleetwood': 'highline-fleetwood',
    // Robots de Highline Commerce → Phil
    'phil': 'highline-phil',
    'highline-phil': 'highline-phil',
    // Robots de Outerspace → Venus / Mercury
    'venus': 'outerspace-venus',
    'mercury': 'outerspace-mercury',
    // Robots de Mountainy → Mabel / Monty
    'mabel': 'mountainy-mabel',
    'monty': 'mountainy-monty',
    // Robots de Internal
    'box-fold':     'internal-box-fold',
    'pick-sort':    'internal-pick-sort',
    'tote':         'internal-tote',
    'bagger-label': 'internal-bagger-label',
    'tower-stack-unstack': 'internal-tower-stack',
};

export default function TelemetryDashboard({
    currentClient,
    currentRobot,
    clientLogoSrc,
    logoError,
    setLogoError,
    workflowsDatabase,
    onRobotChange
}: TelemetryDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('workflow');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Robots con material de vídeo disponible
    const ROBOTS_WITH_VIDEOS = ['future-2.0', 'phil', 'fleetwood-pack', 'fleetwood', 'packie-2.0', 'monty', 'venus', 'bagger-label', 'box-fold', 'pick-sort', 'tower-stack-unstack'];
    const showVideoTab = !!(currentRobot?.id && ROBOTS_WITH_VIDEOS.includes(currentRobot.id));
    const showTipsTab = !!(currentRobot?.advises && currentRobot.advises.length > 0);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeTab === 'videos' && !showVideoTab) {
            setActiveTab('workflow');
        }
        if (activeTab === 'tips' && !showTipsTab) {
            setActiveTab('workflow');
        }
    }, [currentRobot, showVideoTab, showTipsTab, activeTab]);

    // Resolver el workflow key desde el mapa
    const workflowKey = currentRobot?.id
        ? (ROBOT_TO_WORKFLOW_MAP[currentRobot.id] ?? null)
        : null;

    const activeWorkflow: WorkflowConfig | null = workflowKey
        ? (workflowsDatabase?.[workflowKey] ?? null)
        : null;

    // Mostrar tabs solo si existe un workflow resuelto para este robot
    const showWorkflowTabs = !!activeWorkflow;

    return (
        <div className="w-full flex flex-col items-center gap-6 max-w-5xl">

            {/* BARRA SUPERIOR: Logo + Robot + Tabs + Estado */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 px-5 py-3 rounded-2xl bg-white border border-neutral-200/80 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
                    <div className="flex items-center justify-center min-h-[24px]">
                        {clientLogoSrc && !logoError ? (
                            <div className="relative w-32 h-8">
                                <Image
                                    src={clientLogoSrc}
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                    onError={() => setLogoError(true)}
                                />
                            </div>
                        ) : (
                            <span className="text-xs font-mono font-black text-neutral-500 uppercase">
                                {currentClient?.name}
                            </span>
                        )}
                    </div>
                    <div className="hidden sm:block h-4 w-[1px] bg-neutral-200" />
                    <span className="text-xs font-mono font-bold text-neutral-600 text-center sm:text-left">
                        SISTEMA: <span className="text-neutral-900 font-sans font-bold">{currentRobot?.name}</span>
                    </span>

                    {/* Botón Cambiar Robot */}
                    {onRobotChange && currentClient && (
                        <div className="relative ml-0 sm:ml-2" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="px-4 py-1.5 rounded-full text-white text-xs font-bold font-sans transition-transform hover:scale-105 shadow-sm flex items-center gap-2"
                                style={{ backgroundColor: '#ff4f00' }}
                            >
                                Cambiar Robot
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute top-full mt-2 left-0 w-48 bg-black rounded-xl shadow-lg border border-neutral-800 z-50 overflow-hidden">
                                    <div className="py-1">
                                        {currentClient.robots.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => {
                                                    onRobotChange(r.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-xs font-sans font-semibold transition-colors ${
                                                    r.id === currentRobot?.id 
                                                    ? 'bg-neutral-800 text-[#ff4f00]' 
                                                    : 'text-white hover:bg-neutral-900 hover:text-neutral-200'
                                                }`}
                                            >
                                                {r.name} {r.id === currentRobot?.id && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* TABS — solo si hay workflow resuelto */}
                <WorkflowTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    showWorkflowTabs={showWorkflowTabs}
                    showVideoTab={showVideoTab}
                    showTipsTab={showTipsTab}
                />
            </div>

            {/* CONTENIDO PRINCIPAL */}
            {activeTab === 'videos' && showVideoTab ? (
                /* VISTA VIDEOS: reproductor HTML5 */
                <div className="w-full animate-fadeIn">
                    <VideoPlayer robotId={currentRobot?.id} />
                </div>
            ) : activeTab === 'tips' && showTipsTab ? (
                /* VISTA CONSEJOS: Consejos para el workflow del robot activo */
                <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 shadow-md animate-fadeIn text-left">
                    <div className="border-b border-neutral-100 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-orange-50 text-[#ff4f00] rounded-lg">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </span>
                            <div>
                                <h3 className="text-base font-sans font-extrabold text-neutral-900 tracking-tight">
                                    Consejos de Operación — {currentRobot?.name}
                                </h3>
                                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                                    Sigue estas directrices clave durante el proceso del workflow para garantizar la máxima eficiencia y evitar fallas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(currentRobot?.advises ?? []).map((adv) => {
                            const isException = adv.isException;
                            return (
                                <div
                                    key={adv.id}
                                    className={`p-4 rounded-2xl border transition-all flex gap-3 ${
                                        isException
                                            ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/60 hover:border-rose-300 md:col-span-2'
                                            : 'border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-200'
                                    }`}
                                >
                                    <div
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                            isException ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-[#ff4f00]'
                                        }`}
                                    >
                                        {isException ? '⚠️' : adv.adviceNumber}
                                    </div>
                                    <div className="grow">
                                        {isException && (
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-rose-800 mb-1">
                                                Problemas con la Orden / Excepciones
                                            </h4>
                                        )}
                                        <p
                                            className={`text-xs leading-relaxed ${
                                                isException
                                                    ? 'text-rose-700'
                                                    : 'text-neutral-800 font-semibold'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: adv.content
                                                    .replace(/"FAIL JOB"/g, '<strong class="font-extrabold text-rose-900 bg-rose-100 px-1 py-0.5 rounded">"FAIL JOB"</strong>')
                                                    .replace(/FAIL JOB/g, '<strong class="font-extrabold text-rose-900 bg-rose-100 px-1 py-0.5 rounded">FAIL JOB</strong>')
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* VISTA WORKFLOW: árbol jerárquico del flujo */
                activeWorkflow?.rootNode && (
                    <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 shadow-md animate-fadeIn text-left">
                        <div className="border-b border-neutral-100 pb-4 mb-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-sans font-extrabold text-neutral-900 tracking-tight">
                                    {activeWorkflow.name}
                                </h3>
                                <span className="text-[10px] font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                                    v{activeWorkflow.version}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 font-medium mt-1">
                                {activeWorkflow.description}
                            </p>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto pr-2">
                            <WorkflowVisualizer node={activeWorkflow.rootNode} />
                        </div>
                    </div>
                )
            )}
        </div>
    );
}