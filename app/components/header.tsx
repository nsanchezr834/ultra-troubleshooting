'use client';

import React from 'react';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
    isNavigatedToDashboard: boolean;
    onResetFlow: () => void;
    activeModule?: 'menu' | 'asistencia' | 'troubleshooting' | 'test';
    onBackToMenu?: () => void;
    isTroubleNavigated?: boolean;
    onResetTroubleFlow?: () => void;
    isDarkMode?: boolean;
    onToggleDarkMode?: () => void;
}

export default function Header({ 
    isNavigatedToDashboard, 
    onResetFlow,
    activeModule = 'menu',
    onBackToMenu,
    isTroubleNavigated = false,
    onResetTroubleFlow,
    isDarkMode = false,
    onToggleDarkMode
}: HeaderProps) {
    const showBackButton = activeModule !== 'menu';

    return (
        <header className={`w-full flex flex-row justify-between items-center border-b pb-4 mb-6 z-10 transition-colors duration-300 ${
            isDarkMode ? 'border-neutral-800' : 'border-neutral-200/80'
        }`}>
            {/* Lado izquierdo */}
            <div className="flex items-center gap-2" />

            {/* Acciones a la derecha */}
            <div className="flex items-center gap-2 sm:gap-3">

                {/* Botón Cambiar Robot (Asistencia) */}
                {activeModule === 'asistencia' && isNavigatedToDashboard && (
                    <button
                        onClick={onResetFlow}
                        className={`flex items-center gap-1.5 active:scale-[0.98] border shadow-sm transition-all font-sans font-semibold text-xs px-3.5 py-2 rounded-full ${
                            isDarkMode
                                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100'
                                : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800'
                        }`}
                    >
                        <span>Cambiar Robot</span>
                    </button>
                )}

                {/* Botón Cambiar Robot (Troubleshooting) */}
                {activeModule === 'troubleshooting' && isTroubleNavigated && onResetTroubleFlow && (
                    <button
                        onClick={onResetTroubleFlow}
                        className={`flex items-center gap-1.5 active:scale-[0.98] border shadow-sm transition-all font-sans font-semibold text-xs px-3.5 py-2 rounded-full ${
                            isDarkMode
                                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100'
                                : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800'
                        }`}
                    >
                        <span>Cambiar Robot</span>
                    </button>
                )}

                {/* Botón Volver al Menú */}
                {showBackButton && (
                    <button
                        onClick={onBackToMenu}
                        className="flex items-center gap-1.5 bg-[#ff4f00] hover:bg-[#ff4f00]/95 active:scale-[0.98] text-white transition-all font-sans font-extrabold text-[11px] uppercase px-4 py-2 rounded-full tracking-wider shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M9.53 4.47a.75.75 0 0 1 0 1.06L4.81 10.25H20a.75.75 0 0 1 0 1.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                        <span>Menú Principal</span>
                    </button>
                )}

                {/* Toggle Modo Oscuro */}
                {onToggleDarkMode && (
                    <button
                        onClick={onToggleDarkMode}
                        title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                        className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 active:scale-[0.92] shadow-sm ${
                            isDarkMode
                                ? 'bg-neutral-800 border-neutral-700 text-yellow-400 hover:bg-neutral-700'
                                : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                        }`}
                    >
                        {isDarkMode
                            ? <Sun className="w-4 h-4" />
                            : <Moon className="w-4 h-4" />
                        }
                    </button>
                )}
            </div>
        </header>
    );
}