'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CLIENTS_DATABASE, ClientConfig, RobotConfig } from '../../config/robots-db';

interface ClientSelectorProps {
    selectedClientKey: string;
    selectedRobotId: string;
    onClientChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onRobotChange: (id: string) => void;
    currentClient: ClientConfig | undefined;
    currentRobot: RobotConfig | undefined;
    onAccessDashboard: (e: React.FormEvent) => void;
    mode?: 'asistencia' | 'troubleshooting';
}

const CLIENT_LOGOS: Record<string, string> = {
    'manifest.eco': '/manifest_logo.png',
    'highline-commerce': '/highline_logo.png',
    'outerspace': '/outerspace_logo.png',
    'mountainy': '/mountainy_logo.png',
};

export default function ClientSelector({
    selectedClientKey,
    selectedRobotId,
    onClientChange,
    onRobotChange,
    currentClient,
    currentRobot,
    onAccessDashboard,
    mode = 'asistencia',
}: ClientSelectorProps) {
    const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
    const clients = Object.values(CLIENTS_DATABASE);

    const handleClientSelect = (clientId: string) => {
        // Simulate the ChangeEvent to keep parent API intact
        const syntheticEvent = {
            target: { value: clientId },
        } as React.ChangeEvent<HTMLSelectElement>;
        onClientChange(syntheticEvent);
    };

    const handleClearClient = () => {
        const syntheticEvent = {
            target: { value: '' },
        } as React.ChangeEvent<HTMLSelectElement>;
        onClientChange(syntheticEvent);
    };

    const activeRobots = currentClient?.robots.filter(r => r.status === 'active') ?? [];
    const offlineRobots = currentClient?.robots.filter(r => r.status === 'offline') ?? [];
    const allRobots = [...activeRobots, ...offlineRobots];

    const isReady = currentRobot && currentRobot.status === 'active';

    return (
        <div className="w-full flex flex-col items-center justify-center gap-6 animate-scaleUp">
            {/* Contenedor Principal con animación */}
            <div className="w-full max-w-md transition-all duration-300">
                
                {/* TARJETA 1: SELECCIONAR CLIENTE */}
                {!currentClient && (
                    <div className="w-full p-6 sm:p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xl shadow-neutral-200/30 flex flex-col justify-between animate-fadeIn">
                        <div>
                            {/* Logo */}
                            <div className="flex flex-col items-center justify-center mb-6 text-center">
                                <div className="relative w-48 h-12 mb-2">
                                    <Image
                                        src="/ultra_logo.png"
                                        alt="ULTRA Logo"
                                        fill
                                        priority
                                        className="object-contain"
                                    />
                                </div>
                                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent mt-4" />
                            </div>

                            {/* Selección de cliente */}
                            <div className="flex flex-col gap-4">
                                <label className="text-neutral-500 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-black flex items-center justify-center">1</span>
                                    Seleccione Cliente
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {clients.map((client: ClientConfig) => {
                                        const isSelected = selectedClientKey === client.id;
                                        const logoSrc = CLIENT_LOGOS[client.id];
                                        const hasLogoError = logoErrors[client.id];
                                        return (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => handleClientSelect(client.id)}
                                                className={`relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-left
                                                    ${isSelected
                                                        ? 'border-neutral-900 bg-neutral-900/5 shadow-md scale-[1.02]'
                                                        : 'border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-white hover:shadow-sm active:scale-[0.98]'
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                                <div className="relative w-full h-8">
                                                    {logoSrc && !hasLogoError ? (
                                                        <Image
                                                            src={logoSrc}
                                                            alt={client.name}
                                                            fill
                                                            className="object-contain"
                                                            onError={() => setLogoErrors(prev => ({ ...prev, [client.id]: true }))}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-xs font-bold text-neutral-700 truncate">{client.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-mono uppercase tracking-wider ${isSelected ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}>
                                                    {client.robots.filter(r => r.status === 'active').length} robots activos
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TARJETA 2: SELECCIONAR ROBOT (Solo si hay cliente seleccionado) */}
                {currentClient && (
                    <div className="w-full p-6 sm:p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xl shadow-neutral-200/30 flex flex-col justify-between animate-fadeIn">
                        <form onSubmit={onAccessDashboard} className="space-y-6 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-neutral-500 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-black flex items-center justify-center">2</span>
                                        Unidad Robótica
                                        <span className="text-neutral-400 normal-case font-sans tracking-normal text-[10px]">— {currentClient.name}</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleClearClient}
                                        title="Atrás"
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-700 active:scale-90 transition-all duration-150 text-white"
                                    >
                                        {/* Material Design arrow_back */}
                                        <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                            <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                    {allRobots.map((robot: RobotConfig) => {
                                        const isSelected = selectedRobotId === robot.id;
                                        const isOffline = robot.status === 'offline';
                                        return (
                                            <button
                                                key={robot.id}
                                                type="button"
                                                disabled={isOffline}
                                                onClick={() => !isOffline && onRobotChange(robot.id)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 text-left
                                                    ${isOffline
                                                        ? 'border-neutral-100 bg-neutral-50/50 cursor-not-allowed opacity-50'
                                                        : isSelected
                                                            ? 'border-neutral-900 bg-neutral-900/5 shadow-sm'
                                                            : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm active:scale-[0.99]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOffline ? 'bg-neutral-300' : isSelected ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                                                    <span className={`text-sm font-semibold font-sans ${isOffline ? 'text-neutral-400' : 'text-neutral-900'}`}>
                                                        {robot.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!isOffline && (
                                                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                            ONLINE
                                                        </span>
                                                    )}
                                                    {isOffline && (
                                                        <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                                                            OFFLINE
                                                        </span>
                                                    )}
                                                    {isSelected && !isOffline && (
                                                        <svg className="w-4 h-4 text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BOTÓN DE ACCESO */}
                            <button
                                type="submit"
                                disabled={!isReady}
                                className={`w-full py-3.5 mt-auto rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm
                                    ${isReady
                                        ? 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.99] hover:shadow-md'
                                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/40'
                                    }`}
                            >
                                {isReady 
                                    ? mode === 'troubleshooting'
                                        ? `Ver Troubleshooting → ${currentRobot?.name}`
                                        : `Acceder → ${currentRobot?.name}`
                                    : mode === 'troubleshooting'
                                        ? 'Ver Troubleshooting'
                                        : 'Acceder al Módulo'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}