'use client';

/**
 * app/components/home-client.tsx
 * Versión Client Component del page.tsx original.
 * Recibe clientsDatabase y workflowsDatabase como props desde page.tsx (Server Component).
 * Optimizado bajo el protocolo estricto Autoryx (Next.js/Tailwind).
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Header from './header';
import Footer from './footer';
import ClientSelector from './client-selector';
import TelemetryDashboard from './telemetry-dashboard';
import TroubleshootingSearch from './troubleshooting-search';
import ExamModal from './exam-modal';
import SimulatorModal from './simulator-modal';

import { ClientConfig, RobotConfig } from '@/config/robots-db';
import { WorkflowConfig } from '@/config/workflows-db';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';
import { BookOpenCheck, MonitorPlay, Activity, Wrench, GraduationCap, ChevronRight, Settings, Server, ShieldAlert, Cpu } from 'lucide-react';

interface HomeClientProps {
    clientsDatabase: Record<string, ClientConfig>;
    workflowsDatabase: Record<string, WorkflowConfig>;
}

type ClientWithLogo = ClientConfig & { logo_url?: string };

export default function HomeClient({ clientsDatabase, workflowsDatabase }: HomeClientProps) {
    const [activeModule, setActiveModule] = useState<'menu' | 'asistencia' | 'troubleshooting' | 'test'>('menu');

    // ESTADOS DE ASISTENCIA
    const [selectedClientKey, setSelectedClientKey] = useState<string>('');
    const [selectedRobotId, setSelectedRobotId] = useState<string>('');
    const [isNavigatedToDashboard, setIsNavigatedToDashboard] = useState<boolean>(false);
    const [logoError, setLogoError] = useState<boolean>(false);
    const [selectedFault, setSelectedFault] = useState<string | null>(null);

    // ESTADOS DE TROUBLESHOOTING
    const [selectedTroubleCategory, setSelectedTroubleCategory] = useState<string | null>(null);

    // ESTADOS DE TEST / PRÁCTICA
    const [isExamOpen, setIsExamOpen] = useState<boolean>(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
    const [simulatorMode, setSimulatorMode] = useState<'free' | 'exam'>('free');

    // MODO OSCURO
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    // Handlers para Asistencia
    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedClientKey(e.target.value);
        setSelectedRobotId('');
        setLogoError(false);
    };

    const currentClient: ClientConfig | undefined = clientsDatabase[selectedClientKey];
    const currentRobot: RobotConfig | undefined = currentClient?.robots.find(
        (r: RobotConfig) => r.id === selectedRobotId
    );

    const handleAccessDashboard = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentRobot && currentRobot.status === 'active') {
            setIsNavigatedToDashboard(true);
            setSelectedFault(null);
        }
    };

    const handleResetFlow = () => {
        setIsNavigatedToDashboard(false);
        setSelectedRobotId('');
        setSelectedFault(null);
        setLogoError(false);
    };

    // Handlers para Troubleshooting
    const handleCategorySelect = (category: string) => {
        setSelectedTroubleCategory(category);
    };

    const handleResetTroubleFlow = () => {
        setSelectedTroubleCategory(null);
    };

    // Handler para volver al menú principal
    const handleBackToMenu = () => {
        setActiveModule('menu');
    };

    // Obtiene el logo desde Supabase Storage (logo_url), con fallback al path local
    const getClientLogoSrc = (key: string): string => {
        if (!key) return '';
        const client = clientsDatabase[key] as ClientWithLogo | undefined;
        if (client?.logo_url) return client.logo_url;

        // Fallback local
        const logoMap: Record<string, string> = {
            'manifest.eco': 'manifest_logo.png',
            'highline-commerce': 'highline_logo.png',
            'outerspace': 'outerspace_logo.png',
            'mountainy': 'mountainy_logo.png'
        };
        return `/${logoMap[key] || `${key.replace('-', '_')}_logo.png`}`;
    };

    const clientLogoSrc = getClientLogoSrc(selectedClientKey);

    return (
        <div className={`min-h-screen text-neutral-900 flex flex-col justify-between font-sans antialiased p-4 sm:p-6 md:p-8 relative overflow-hidden transition-colors duration-500 ${
            isDarkMode ? 'bg-neutral-950' : 'bg-slate-50'
        }`}>

            {/* CAPA DE DECORACIÓN LUMÍNICA */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

            {/* HEADER */}
            <Header
                isNavigatedToDashboard={isNavigatedToDashboard}
                onResetFlow={handleResetFlow}
                activeModule={activeModule}
                onBackToMenu={handleBackToMenu}
                isTroubleNavigated={selectedTroubleCategory !== null}
                onResetTroubleFlow={handleResetTroubleFlow}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
            />

            {/* CONTENEDOR CENTRAL */}
            <div className="w-full max-w-6xl mx-auto my-auto flex flex-col items-center justify-center py-4 z-10 relative">
                
                {activeModule === 'menu' && (
                    <div className="flex flex-col items-center gap-8 w-full animate-fadeIn">
                        {/* Banner de Bienvenida */}
                        <div className="text-center space-y-3 max-w-xl flex flex-col items-center">

                            {/* Logo Ultra — con filtro blanco en modo oscuro */}
                            <div className="relative w-56 h-14 mt-1 mb-1 animate-scaleUp">
                                <Image
                                    src="/ultra_logo.png"
                                    alt="Ultra Logo"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority
                                    className={`object-contain transition-all duration-300 ${
                                        isDarkMode ? 'brightness-0 invert' : ''
                                    }`}
                                />
                            </div>
                            <p className={`text-xs sm:text-sm font-medium max-w-md mx-auto ${
                                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                            }`}>
                                Selecciona uno de los módulos para comenzar con el soporte asistido, guías de troubleshooting o certificación.
                            </p>
                        </div>

                        {/* Grid de 3 grandes módulos (Mobile-First) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-5xl mx-auto px-2 mt-2">
                            
                            {/* 1. ASISTENCIA */}
                            <div 
                                onClick={() => setActiveModule('asistencia')}
                                className={`border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out shadow-md hover:shadow-[0_20px_40px_rgba(255,79,0,0.4)] hover:bg-[#ff4f00] hover:border-[#ff4f00] hover:text-white hover:scale-105 hover:skew-x-2 hover:skew-y-1 hover:-rotate-1 cursor-pointer group min-h-[280px] sm:min-h-[320px] ${
                                    isDarkMode
                                        ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                                        : 'bg-white border-neutral-200 text-neutral-900'
                                }`}
                            >
                                <div className="flex flex-col gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-[#ff4f00] transition-all duration-300 ${
                                        isDarkMode ? 'bg-[#ff4f00]/20 text-[#ff4f00]' : 'bg-[#ff4f00]/10 text-[#ff4f00]'
                                    }`}>
                                        <Activity className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black font-sans tracking-tight mb-2 group-hover:text-white transition-colors duration-300">
                                            ASISTENCIA
                                        </h3>
                                        <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                                            Consulta el Workflow Específico y visualiza los videos de la operación.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 group-hover:text-white transition-colors mt-6">
                                    <span>Ingresar al módulo</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>

                            {/* 2. TROUBLESHOOTING */}
                            <div 
                                onClick={() => setActiveModule('troubleshooting')}
                                className={`border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out shadow-md hover:shadow-[0_20px_40px_rgba(255,79,0,0.4)] hover:bg-[#ff4f00] hover:border-[#ff4f00] hover:text-white hover:scale-105 hover:skew-x-2 hover:skew-y-1 hover:-rotate-1 cursor-pointer group min-h-[280px] sm:min-h-[320px] ${
                                    isDarkMode
                                        ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                                        : 'bg-white border-neutral-200 text-neutral-900'
                                }`}
                            >
                                <div className="flex flex-col gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-[#ff4f00] transition-all duration-300 ${
                                        isDarkMode ? 'bg-[#ff4f00]/20 text-[#ff4f00]' : 'bg-[#ff4f00]/10 text-[#ff4f00]'
                                    }`}>
                                        <Wrench className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black font-sans tracking-tight mb-2 group-hover:text-white transition-colors duration-300">
                                            TROUBLESHOOTING
                                        </h3>
                                        <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                                            Diagnostica y soluciona fallas mecánicas y de software. Sigue paso a paso las guías de auto-servicio y consulta los canales de escalación.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 group-hover:text-white transition-colors mt-6">
                                    <span>Ver guías de fallas</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>

                            {/* 3. TEST */}
                            <div 
                                onClick={() => setActiveModule('test')}
                                className={`border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out shadow-md hover:shadow-[0_20px_40px_rgba(255,79,0,0.4)] hover:bg-[#ff4f00] hover:border-[#ff4f00] hover:text-white hover:scale-105 hover:skew-x-2 hover:skew-y-1 hover:-rotate-1 cursor-pointer group min-h-[280px] sm:min-h-[320px] ${
                                    isDarkMode
                                        ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                                        : 'bg-white border-neutral-200 text-neutral-900'
                                }`}
                            >
                                <div className="flex flex-col gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-[#ff4f00] transition-all duration-300 ${
                                        isDarkMode ? 'bg-[#ff4f00]/20 text-[#ff4f00]' : 'bg-[#ff4f00]/10 text-[#ff4f00]'
                                    }`}>
                                        <GraduationCap className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black font-sans tracking-tight mb-2 group-hover:text-white transition-colors duration-300">
                                            TEST
                                        </h3>
                                        <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                                            Pon a prueba tus conocimientos con el examen teórico-práctico de certificación y practica de forma interactiva en el simulador de headsets.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 group-hover:text-white transition-colors mt-6">
                                    <span>Zona de certificación</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {activeModule === 'asistencia' && (
                    <div className="w-full flex flex-col items-center gap-4 animate-fadeIn">
                        {!isNavigatedToDashboard ? (
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="text-center space-y-1 mb-2">
                                    <span className="text-[10px] font-bold text-ultra-orange uppercase tracking-widest">Módulo Asistencia</span>
                                    <h3 className="text-2xl font-black text-neutral-900">Selección de Unidad</h3>
                                </div>
                                <ClientSelector
                                    selectedClientKey={selectedClientKey}
                                    selectedRobotId={selectedRobotId}
                                    onClientChange={handleClientChange}
                                    onRobotChange={setSelectedRobotId}
                                    currentClient={currentClient}
                                    currentRobot={currentRobot}
                                    onAccessDashboard={handleAccessDashboard}
                                    mode="asistencia"
                                    {...({ clientsDatabase } as any)}
                                />
                            </div>
                        ) : (
                            <TelemetryDashboard
                                currentClient={currentClient}
                                currentRobot={currentRobot}
                                clientLogoSrc={clientLogoSrc}
                                logoError={logoError}
                                setLogoError={setLogoError}
                                selectedFault={selectedFault}
                                setSelectedFault={setSelectedFault}
                                workflowsDatabase={workflowsDatabase}
                                onRobotChange={setSelectedRobotId}
                            />
                        )}
                    </div>
                )}

                {activeModule === 'troubleshooting' && (
                    <div className="w-full flex flex-col items-center gap-4 animate-fadeIn max-w-5xl">
                        <TroubleshootingSearch 
                            knowledgeBase={TROUBLESHOOTING_DATABASE}
                            selectedCategory={selectedTroubleCategory}
                            onCategorySelect={setSelectedTroubleCategory}
                        />
                    </div>
                )}

                {activeModule === 'test' && (
                    <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
                        <div className="text-center space-y-1 mb-2">
                            <span className="text-[10px] font-bold text-ultra-orange uppercase tracking-widest">Zona de Práctica</span>
                            <h3 className="text-2xl font-black text-neutral-900">Certificación y Simulación</h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-medium">
                                Evalúa tus capacidades o inicia un entorno interactivo en 3D para practicar comandos robóticos.
                            </p>
                        </div>

                        {/* Layout Responsivo para las 2 tarjetas de Test */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-4 mt-2">
                            {/* TARJETA DE EXAMEN */}
                            <div 
                                onClick={() => setIsExamOpen(true)}
                                className="bg-white border border-neutral-200 text-neutral-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out shadow-md hover:shadow-[0_20px_40px_rgba(255,79,0,0.4)] hover:bg-[#ff4f00] hover:border-[#ff4f00] hover:text-white hover:scale-105 hover:skew-x-2 hover:skew-y-1 hover:-rotate-1 cursor-pointer group min-h-[240px] sm:min-h-[260px]"
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-[#ff4f00] transition-all duration-300">
                                        <BookOpenCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black font-sans tracking-tight mb-2 group-hover:text-white transition-colors duration-300">
                                            EXAMEN TRAINING
                                        </h3>
                                        <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                                            Completa el test aleatorio de 10 preguntas basado en protocolos operativos reales. Requiere 80% para aprobar el entrenamiento.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 group-hover:text-white transition-colors mt-6">
                                    <span>Comenzar examen</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>

                            {/* TARJETA DE SIMULADOR */}
                            <div 
                                onClick={() => {
                                    setSimulatorMode('free');
                                    setIsSimulatorOpen(true);
                                }}
                                className="bg-white border border-neutral-200 text-neutral-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out shadow-md hover:shadow-[0_20px_40px_rgba(255,79,0,0.4)] hover:bg-[#ff4f00] hover:border-[#ff4f00] hover:text-white hover:scale-105 hover:skew-x-2 hover:skew-y-1 hover:-rotate-1 cursor-pointer group min-h-[240px] sm:min-h-[260px]"
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-[#ff4f00] transition-all duration-300">
                                        <MonitorPlay className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black font-sans tracking-tight mb-2 group-hover:text-white transition-colors duration-300">
                                            SIMULADOR
                                        </h3>
                                        <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                                            Inicia el simulador interactivo de visor headset para practicar el control de autonomía y comandos de fallas de la celda.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 group-hover:text-white transition-colors mt-6">
                                    <span>Abrir simulador</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* FOOTER */}
            <Footer />

            {/* MODAL DE EXAMEN */}
            {isExamOpen && (
                <ExamModal 
                    onClose={() => setIsExamOpen(false)} 
                    onLaunchSimulatorExam={() => {
                        setIsExamOpen(false);
                        setSimulatorMode('exam');
                        setIsSimulatorOpen(true);
                    }}
                />
            )}

            {/* MODAL DEL SIMULADOR */}
            {isSimulatorOpen && (
                <SimulatorModal 
                    onClose={() => setIsSimulatorOpen(false)} 
                    isExamMode={simulatorMode === 'exam'}
                />
            )}
        </div>
    );
}