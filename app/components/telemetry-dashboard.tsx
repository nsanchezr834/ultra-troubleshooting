'use client';

import React, { useState, useEffect } from 'react';
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
    onBack?: () => void;
    isDarkMode?: boolean;
}

/**
 * Resuelve qué workflow mostrar según el robot activo.
 * Mapeo explícito robot.id → workflow key en WORKFLOWS_DATABASE.
 */
const ROBOT_TO_WORKFLOW_MAP: Record<string, string> = {
    'packie-2.0': 'packie-2.0',
    'future-2.0': 'future-2.0',
    'fleetwood-pack': 'highline-fleetwood',
    'fleetwood': 'highline-fleetwood',
    'phil': 'highline-phil',
    'highline-phil': 'highline-phil',
    'venus': 'outerspace-venus',
    'mercury': 'outerspace-mercury',
    'mabel': 'mountainy-mabel',
    'monty': 'mountainy-monty',
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
    onRobotChange,
    onBack,
    isDarkMode = false,
}: TelemetryDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('videos');

    // Robots con material de vídeo disponible
    const ROBOTS_WITH_VIDEOS = ['future-2.0', 'phil', 'fleetwood-pack', 'fleetwood', 'packie-2.0', 'monty', 'venus', 'bagger-label', 'box-fold', 'pick-sort', 'tower-stack-unstack', 'mabel'];
    const showVideoTab = !!(currentRobot?.id && ROBOTS_WITH_VIDEOS.includes(currentRobot.id));
    const showTipsTab = !!(currentRobot?.advises && currentRobot.advises.length > 0);

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

    // Dark mode tokens
    const barBg = isDarkMode
        ? 'bg-[#1a1b24] border-neutral-800'
        : 'bg-white border-neutral-200/80';
    const dividerColor = isDarkMode ? 'bg-neutral-700' : 'bg-neutral-200';
    const systemLabel = isDarkMode ? 'text-neutral-500' : 'text-neutral-600';
    const robotNameText = isDarkMode ? 'text-neutral-100' : 'text-neutral-900';
    const backBtnClass = isDarkMode
        ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white'
        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900';

    const panelBg = isDarkMode
        ? 'bg-[#1a1b24] border-neutral-800'
        : 'bg-white border-neutral-200';
    const panelHeaderBorder = isDarkMode ? 'border-neutral-800' : 'border-neutral-100';
    const titleText = isDarkMode ? 'text-neutral-100' : 'text-neutral-900';
    const subtitleText = isDarkMode ? 'text-neutral-400' : 'text-neutral-500';

    return (
        <div className="w-full flex flex-col items-center gap-6 max-w-5xl">

            {/* BARRA SUPERIOR — Sticky mobile-first: back button en top-left en móvil */}
            <div className={`w-full sticky top-0 z-20 rounded-2xl border shadow-sm transition-colors duration-300 ${barBg}`}>
                {/* Mobile only: botón atrás en fila superior izquierda */}
                {onBack && (
                    <div className="flex sm:hidden items-center px-4 pt-3 pb-1">
                        <button
                            type="button"
                            onClick={onBack}
                            title="Volver a selección de clientes"
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold font-sans transition-all duration-150 active:scale-[0.97] ${backBtnClass}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="currentColor">
                                <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/>
                            </svg>
                            <span>Selección</span>
                        </button>
                    </div>
                )}

                {/* Fila principal: logo + robot | back (desktop) */}
                <div className="flex flex-row items-center justify-between px-5 py-3 gap-4">
                    {/* Izquierda: logo cliente + nombre robot */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center min-h-[24px]">
                            {clientLogoSrc && !logoError ? (
                                <div className="relative w-32 h-8">
                                    <Image
                                        src={clientLogoSrc}
                                        alt="Logo"
                                        fill
                                        className={`object-contain ${isDarkMode ? 'brightness-0 invert opacity-80' : ''}`}
                                        onError={() => setLogoError(true)}
                                    />
                                </div>
                            ) : (
                                <span className={`text-xs font-mono font-black uppercase ${isDarkMode ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {currentClient?.name}
                                </span>
                            )}
                        </div>
                        <div className={`hidden sm:block h-4 w-[1px] ${dividerColor}`} />
                        <span className={`text-xs font-mono font-bold ${systemLabel}`}>
                            Robot activo: <span className={`font-sans font-bold ${robotNameText}`}>{currentRobot?.name}</span>
                        </span>
                    </div>

                    {/* Derecha: botón atrás (solo desktop) */}
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            title="Volver a selección de clientes"
                            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold font-sans transition-all duration-150 active:scale-[0.97] ${backBtnClass}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                                <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/>
                            </svg>
                            <span>Selección</span>
                        </button>
                    )}
                </div>
            </div>

            {/* SELECCIÓN DE PESTAÑAS */}
            <WorkflowTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showWorkflowTabs={showWorkflowTabs}
                showVideoTab={showVideoTab}
                showTipsTab={showTipsTab}
                isDarkMode={isDarkMode}
            />

            {/* CONTENIDO PRINCIPAL */}
            {activeTab === 'videos' && showVideoTab ? (
                /* VISTA VIDEOS */
                <div className="w-full animate-fadeIn">
                    <VideoPlayer robotId={currentRobot?.id} />
                </div>
            ) : activeTab === 'tips' && showTipsTab ? (
                /* VISTA CONSEJOS */
                <div className={`w-full rounded-3xl border p-6 shadow-md animate-fadeIn text-left ${panelBg}`}>
                    <div className={`border-b pb-4 mb-6 ${panelHeaderBorder}`}>
                        <div className="flex items-center gap-2">
                            <span className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#ff4f00]/10 text-[#ff4f00]' : 'bg-orange-50 text-[#ff4f00]'}`}>
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </span>
                            <div>
                                <h3 className={`text-base font-sans font-extrabold tracking-tight ${titleText}`}>
                                    Consejos de Operación — {currentRobot?.name}
                                </h3>
                                <p className={`text-xs font-medium mt-0.5 ${subtitleText}`}>
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
                                            ? isDarkMode
                                                ? 'border-rose-800/50 bg-rose-900/20 hover:bg-rose-900/30 md:col-span-2'
                                                : 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/60 hover:border-rose-300 md:col-span-2'
                                            : isDarkMode
                                                ? 'border-neutral-700 bg-neutral-800/40 hover:bg-neutral-800/60 hover:border-neutral-600'
                                                : 'border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-200'
                                    }`}
                                >
                                    <div
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                            isException
                                                ? isDarkMode ? 'bg-rose-900/50 text-rose-400' : 'bg-rose-100 text-rose-600'
                                                : isDarkMode ? 'bg-[#ff4f00]/15 text-[#ff4f00]' : 'bg-orange-100 text-[#ff4f00]'
                                        }`}
                                    >
                                        {isException ? '⚠️' : adv.adviceNumber}
                                    </div>
                                    <div className="grow">
                                        {isException && (
                                            <h4 className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-800'}`}>
                                                Problemas con la Orden / Excepciones
                                            </h4>
                                        )}
                                        <p
                                            className={`text-xs leading-relaxed ${
                                                isException
                                                    ? isDarkMode ? 'text-rose-300' : 'text-rose-700'
                                                    : isDarkMode ? 'text-neutral-300 font-semibold' : 'text-neutral-800 font-semibold'
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
                /* VISTA WORKFLOW */
                activeWorkflow?.rootNode && (
                    <div className={`w-full rounded-3xl border p-6 shadow-md animate-fadeIn text-left ${panelBg}`}>
                        <div className={`border-b pb-4 mb-4 ${panelHeaderBorder}`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`text-base font-sans font-extrabold tracking-tight ${titleText}`}>
                                    {activeWorkflow.name}
                                </h3>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                    v{activeWorkflow.version}
                                </span>
                            </div>
                            <p className={`text-xs font-medium mt-1 ${subtitleText}`}>
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