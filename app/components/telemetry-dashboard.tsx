'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ClientConfig, RobotConfig } from '../../config/robots-db';
import { WorkflowConfig } from '../../config/workflows-db';
import WorkflowVisualizer from './workflow-visualizer';
import VideoPlayer from './videos';
import WorkflowTabs, { TabType } from './workflow-tabs';
import { Sparkles, Activity, Clock, User, Truck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    'captain-pack-sparrow': 'captain-pack-sparrow',
    'packasaurus': 'packasaurus',
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
    'msqc': 'msqc',
    'siemens': 'siemens-workflow',
    'buddy': 'buddy-workflow',
    'max': 'max-workflow',
    'mojo': 'mojo-workflow',
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

    // Estados para Monitoreo de Empaque en Vivo (Realtime)
    const [latestOrders, setLatestOrders] = useState<any[]>([]);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [loadingLive, setLoadingLive] = useState(false);

    useEffect(() => {
        if (!currentRobot?.id) return;
        
        const fetchLiveStatus = async () => {
            setLoadingLive(true);
            try {
                const { data, error } = await supabase
                    .from('live_station_status')
                    .select('latest_orders, last_updated')
                    .eq('robot_id', currentRobot.id)
                    .maybeSingle();
                if (data) {
                    setLatestOrders(data.latest_orders || []);
                    setLastSync(data.last_updated);
                } else {
                    setLatestOrders([]);
                    setLastSync(null);
                }
            } catch (err) {
                console.error("Error fetching live status:", err);
            } finally {
                setLoadingLive(false);
            }
        };

        fetchLiveStatus();

        // Suscribirse a cambios en tiempo real con Supabase
        const channel = supabase
            .channel(`live_status_${currentRobot.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'live_station_status',
                filter: `robot_id=eq.${currentRobot.id}`
            }, (payload: any) => {
                if (payload.new) {
                    setLatestOrders(payload.new.latest_orders || []);
                    setLastSync(payload.new.last_updated);
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'live_station_status',
                filter: `robot_id=eq.${currentRobot.id}`
            }, (payload: any) => {
                if (payload.new) {
                    setLatestOrders(payload.new.latest_orders || []);
                    setLastSync(payload.new.last_updated);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentRobot?.id]);

    // Robots con material de vídeo disponible
    const ROBOTS_WITH_VIDEOS = ['future-2.0', 'phil', 'fleetwood-pack', 'fleetwood', 'packie-2.0', 'monty', 'venus', 'mercury', 'bagger-label', 'box-fold', 'pick-sort', 'tower-stack-unstack', 'mabel', 'captain-pack-sparrow', 'packasaurus', 'msqc'];
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

            {/* MONITOREO DE EMPAQUE EN VIVO (Supabase Realtime) */}
            {currentRobot?.id && (
                <div className={`w-full rounded-3xl border p-6 shadow-md text-left transition-colors duration-300 ${panelBg}`}>
                    <div className={`border-b pb-4 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 ${panelHeaderBorder}`}>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <h3 className={`text-xs font-sans font-black uppercase tracking-wider ${titleText}`}>
                                Monitoreo de Empaque en Vivo (Ultra Tech)
                            </h3>
                        </div>
                        {lastSync && (
                            <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${subtitleText}`}>
                                <Clock className="w-3.5 h-3.5" /> Última Sincronización: {new Date(lastSync).toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {loadingLive ? (
                        <div className="flex items-center justify-center py-6 text-neutral-500 gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#ff4f00]" />
                            <span className="text-xs">Cargando monitor en vivo...</span>
                        </div>
                    ) : latestOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-neutral-500 text-center">
                            <Activity className="w-8 h-8 text-neutral-400 mb-2 animate-pulse" />
                            <p className="text-xs font-semibold">Esperando telemetría del robot en vivo...</p>
                            <p className="text-[10px] text-neutral-400 mt-1">Abre el portal de Ultra Tech en una estación autorizada con la extensión activa.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Orden actual / en proceso (5 columnas) */}
                            <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col gap-4 ${
                                isDarkMode ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-neutral-50/50 border-neutral-200/60'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1.5">
                                        <div>
                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Pedido Actual</span>
                                            <h4 className="text-xl font-black text-[#ff4f00] mt-0.5">
                                                {latestOrders[0]?.order_number || 'Sin Número'}
                                            </h4>
                                        </div>
                                        {latestOrders[0]?.batch_id && (
                                            <div>
                                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Lote (Batch) Actual</span>
                                                <div className="text-xs font-mono font-black text-blue-400 mt-0.5">
                                                    {latestOrders[0]?.batch_id}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        latestOrders[0]?.status?.toUpperCase().includes('COMPLETED') || latestOrders[0]?.status?.toUpperCase().includes('PROCESADO')
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                    }`}>
                                        {latestOrders[0]?.status || 'Desconocido'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t pt-4 border-neutral-200 dark:border-neutral-800">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                            <User className="w-3 h-3 text-[#ff4f00]" /> Destino (Ship To)
                                        </span>
                                        <span className={`text-xs font-black mt-1 truncate ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                                            {latestOrders[0]?.ship_to || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                            <Truck className="w-3 h-3 text-[#ff4f00]" /> Carrier / Envío
                                        </span>
                                        <span className={`text-xs font-black mt-1 truncate ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                                            {latestOrders[0]?.carrier || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col border-t pt-3 border-neutral-200 dark:border-neutral-800">
                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                                        ID del Pedido / Número de Tracking (Interno)
                                    </span>
                                    <span className="text-xs font-mono text-[#00A8FC] font-bold mt-1 truncate">
                                        {latestOrders[0]?.order_id || 'No disponible (Ver detalle en portal)'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-auto border-t pt-2 border-neutral-200 dark:border-neutral-800">
                                    <span>Intento: {latestOrders[0]?.attempted_at || 'Hace un momento'}</span>
                                    <span>T. Ciclo: {latestOrders[0]?.time_s ? `${latestOrders[0]?.time_s}s` : 'N/A'}</span>
                                </div>
                            </div>

                            {/* Historial de cola (7 columnas) */}
                            <div className="lg:col-span-7 flex flex-col">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2.5">
                                    Historial de Órdenes Recientes (Cola)
                                </span>
                                <div className={`overflow-hidden rounded-xl border grow max-h-[220px] overflow-y-auto custom-scrollbar ${
                                    isDarkMode ? 'border-neutral-800/80' : 'border-neutral-200/80'
                                }`}>
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className={`${isDarkMode ? 'bg-[#141520] text-neutral-400 border-neutral-800/60' : 'bg-neutral-50 text-neutral-500 border-neutral-200'} border-b font-semibold`}>
                                                <th className="p-3">Batch/Pedido</th>
                                                <th className="p-3">Destinatario</th>
                                                <th className="p-3 text-center">Estatus</th>
                                                <th className="p-3">Hora</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDarkMode ? 'divide-neutral-800/40' : 'divide-neutral-100'}`}>
                                            {latestOrders.slice(1, 6).map((order, idx) => (
                                                <tr key={order.order_id || idx} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="p-3 font-mono font-bold text-[#ff4f00]">{order.order_number}</td>
                                                    <td className={`p-3 truncate max-w-[120px] ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>{order.ship_to}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                                            order.status?.toUpperCase().includes('COMPLETED') || order.status?.toUpperCase().includes('PROCESADO')
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-neutral-400 whitespace-nowrap">{order.attempted_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                            
                            // Detect YouTube URLs and extract video ID
                            const ytUrlRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                            const match = adv.content.match(ytUrlRegex);
                            let displayContent = adv.content;
                            let youtubeId: string | null = null;
                            let directVideoUrl: string | null = null;
                             
                            // Detectar URLs de video directo (.mp4)
                            const videoUrlRegex = /href=["']([^"']+\.mp4[^"']*)["']/i;
                            const videoMatch = adv.content.match(videoUrlRegex);
                             
                            if (match) {
                                youtubeId = match[1];
                                // Remove the link tags pointing to youtube
                                displayContent = adv.content.replace(/<a\s+[^>]*href="[^"]*youtube[^"]*"[^>]*>.*?<\/a>/gi, '');
                                // Clean up trailing colons or spaces
                                displayContent = displayContent.trim().replace(/:\s*$/, '');
                            } else if (videoMatch) {
                                directVideoUrl = videoMatch[1];
                                // Remove the link tags pointing to the direct video (.mp4)
                                displayContent = adv.content.replace(/<a\s+[^>]*href=["'][^"']+\.mp4[^"']*["'][^>]*>.*?<\/a>/gi, '');
                                displayContent = displayContent.trim().replace(/:\s*$/, '');
                            }

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
                                                __html: displayContent
                                                    .replace(/"FAIL JOB"/g, '<strong class="font-extrabold text-rose-900 bg-rose-100 px-1 py-0.5 rounded">"FAIL JOB"</strong>')
                                                    .replace(/FAIL JOB/g, '<strong class="font-extrabold text-rose-900 bg-rose-100 px-1 py-0.5 rounded">FAIL JOB</strong>')
                                            }}
                                        />
                                        {youtubeId && (
                                            <div className="mt-3 flex flex-col gap-2 max-w-md">
                                                <div className="aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-black">
                                                    <iframe
                                                        className="w-full h-full"
                                                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                                                        title="YouTube video player"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                    ></iframe>
                                                </div>
                                                <a 
                                                    href={`https://www.youtube.com/shorts/${youtubeId}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-ultra-orange hover:underline font-bold flex items-center gap-1 mt-1 self-start"
                                                >
                                                    Abrir directamente en YouTube ↗
                                                </a>
                                            </div>
                                        )}
                                        {directVideoUrl && (
                                            <div className="mt-3 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-black">
                                                <video
                                                    src={directVideoUrl}
                                                    controls
                                                    playsInline
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}
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