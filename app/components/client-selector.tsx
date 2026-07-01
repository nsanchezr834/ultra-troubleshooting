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
    isDarkMode?: boolean;
}

const CLIENT_LOGOS: Record<string, string> = {
    'manifest.eco': '/manifest_logo.png',
    'highline-commerce': '/highline_logo.png',
    'outerspace': '/outerspace_logo.png',
    'mountainy': '/mountainy_logo.png',
    'missouristar': '/missouristar_logo.png',
    'shipcube': '/shipcube_logo.png',
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
    isDarkMode = false,
}: ClientSelectorProps) {
    const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
    const clients = Object.values(CLIENTS_DATABASE);

    const handleClientSelect = (clientId: string) => {
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

    // Dark mode / Glassmorphism tokens
    const cardBg = isDarkMode 
        ? 'bg-[#12131a]/65 backdrop-blur-[24px] border-white/[0.07] shadow-none' 
        : 'bg-white/65 backdrop-blur-[24px] border-white/[0.6] shadow-xl shadow-slate-200/40';
    const labelColor = isDarkMode ? 'text-neutral-400' : 'text-neutral-500';
    const dividerColor = isDarkMode ? 'via-neutral-700' : 'via-neutral-200';
    const clientBtnInactive = isDarkMode
        ? 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.05]'
        : 'border-white/[0.5] bg-white/40 hover:border-neutral-400 hover:bg-white/80 hover:shadow-sm active:scale-[0.98]';
    const clientBtnActive = isDarkMode
        ? 'border-[#ff4f00] bg-[#ff4f00]/15 shadow-md scale-[1.02]'
        : 'border-[#ff4f00] bg-[#ff4f00]/5 shadow-md scale-[1.02]';
    const clientNameText = isDarkMode ? 'text-neutral-200' : 'text-neutral-700';
    const clientSubText = (isSelected: boolean) => isSelected
        ? 'text-[#ff4f00] font-bold'
        : (isDarkMode ? 'text-neutral-500' : 'text-neutral-400');
    const checkBg = 'bg-[#ff4f00]';

    const robotBtnInactive = isDarkMode
        ? 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.15] hover:shadow-sm active:scale-[0.99]'
        : 'border-white/[0.5] bg-white/40 hover:border-neutral-400 hover:bg-white/80 hover:shadow-sm active:scale-[0.99]';
    const robotBtnActive = isDarkMode
        ? 'border-[#ff4f00] bg-[#ff4f00]/15 shadow-sm'
        : 'border-[#ff4f00] bg-[#ff4f00]/5 shadow-sm';
    const robotNameText = (isSelected: boolean, isOffline: boolean) => {
        if (isOffline) return isDarkMode ? 'text-neutral-600' : 'text-neutral-400';
        return isSelected
            ? 'text-[#ff4f00]'
            : (isDarkMode ? 'text-neutral-200' : 'text-neutral-900');
    };

    return (
        <div className="w-full flex flex-col items-center justify-center gap-6 animate-scaleUp">
            <div className="w-full max-w-md transition-all duration-300">
                
                {/* TARJETA 1: SELECCIONAR CLIENTE */}
                {!currentClient && (
                    <div className={`w-full p-6 sm:p-8 rounded-3xl border flex flex-col justify-between animate-fadeIn ${cardBg}`}>
                        <div>
                            {/* Logo */}
                            <div className="flex flex-col items-center justify-center mb-6 text-center">
                                <div className="relative w-48 h-12 mb-2">
                                    <Image
                                        src="/ultra_logo.png"
                                        alt="ULTRA Logo"
                                        fill
                                        priority
                                        className={`object-contain ${isDarkMode ? 'brightness-0 invert' : ''}`}
                                    />
                                </div>
                                <div className={`h-[1px] w-full bg-gradient-to-r from-transparent ${dividerColor} to-transparent mt-4`} />
                            </div>

                            {/* Selección de cliente */}
                            <div className="flex flex-col gap-4">
                                <label className={`text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${labelColor}`}>
                                    <span className={`w-4 h-4 rounded-full ${checkBg} text-white text-[9px] font-black flex items-center justify-center`}>1</span>
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
                                                className={`relative flex flex-col items-center justify-center gap-2.5 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-left
                                                    ${isSelected ? clientBtnActive : clientBtnInactive}`}
                                            >
                                                {isSelected && (
                                                    <span className={`absolute top-2 right-2 w-4 h-4 rounded-full ${checkBg} flex items-center justify-center`}>
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
                                                            className={`object-contain ${isDarkMode ? 'brightness-0 invert opacity-80' : ''}`}
                                                            onError={() => setLogoErrors(prev => ({ ...prev, [client.id]: true }))}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className={`text-xs font-bold truncate ${clientNameText}`}>{client.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-mono uppercase tracking-wider ${clientSubText(isSelected)}`}>
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

                {/* TARJETA 2: SELECCIONAR ROBOT */}
                {currentClient && (
                    <div className={`w-full p-6 sm:p-8 rounded-3xl border flex flex-col justify-between animate-fadeIn ${cardBg}`}>
                        <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className={`text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${labelColor}`}>
                                        <span className={`w-4 h-4 rounded-full ${checkBg} text-white text-[9px] font-black flex items-center justify-center`}>2</span>
                                        Unidad Robótica
                                        <span className={`normal-case font-sans tracking-normal text-[10px] ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>— {currentClient.name}</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleClearClient}
                                        title="Atrás"
                                        className={`w-7 h-7 flex items-center justify-center rounded-full hover:opacity-80 active:scale-90 transition-all duration-150 text-white ${isDarkMode ? 'bg-neutral-700' : 'bg-neutral-900'}`}
                                    >
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
                                                        ? isDarkMode
                                                            ? 'border-neutral-800 bg-neutral-900/50 cursor-not-allowed opacity-40'
                                                            : 'border-neutral-100 bg-neutral-50/50 cursor-not-allowed opacity-50'
                                                        : isSelected
                                                            ? robotBtnActive
                                                            : robotBtnInactive
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOffline ? (isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300') : isSelected ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                                                    <span className={`text-sm font-semibold font-sans ${robotNameText(isSelected, isOffline)}`}>
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
                                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'text-neutral-600 bg-neutral-800 border border-neutral-700' : 'text-neutral-400 bg-neutral-100 border border-neutral-200'}`}>
                                                            OFFLINE
                                                        </span>
                                                    )}
                                                    {isSelected && !isOffline && (
                                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-[#ff4f00]' : 'text-neutral-900'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                    </div>
                )}
            </div>
        </div>
    );
}