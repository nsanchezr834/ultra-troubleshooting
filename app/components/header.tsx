'use client';

import React from 'react';
import Image from 'next/image';
import { Moon, Sun, GraduationCap, Zap } from 'lucide-react';
import PushNotificationManager from './push-notification-manager';

interface HeaderProps {
    isNavigatedToDashboard: boolean;
    onResetFlow: () => void;
    activeModule?: 'menu' | 'asistencia' | 'troubleshooting' | 'test' | 'seguridad';
    onBackToMenu?: () => void;
    isTroubleNavigated?: boolean;
    onResetTroubleFlow?: () => void;
    isDarkMode?: boolean;
    onToggleDarkMode?: () => void;
    appMode?: 'capacitacion' | 'operativo';
    onToggleMode?: () => void;
    onLogout?: () => void;
}

export default function Header({ 
    isNavigatedToDashboard, 
    onResetFlow,
    activeModule = 'menu',
    onBackToMenu,
    isTroubleNavigated = false,
    onResetTroubleFlow,
    isDarkMode = false,
    onToggleDarkMode,
    appMode = 'capacitacion',
    onToggleMode,
    onLogout,
}: HeaderProps) {
    const showBackButton = activeModule !== 'menu';

    return (
        <header className={`w-full flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4 mb-6 z-10 transition-colors duration-300 ${
            isDarkMode ? 'border-neutral-800' : 'border-neutral-200/80'
        }`}>
            {/* Lado izquierdo — Toggle Modo Operativo */}
            <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
                {onToggleMode && (
                    <div className={`flex p-1 rounded-full border transition-all duration-300 shadow-inner ${
                        isDarkMode
                            ? 'bg-neutral-950 border-neutral-800'
                            : 'bg-neutral-100 border-neutral-200'
                    }`}>
                        <button
                            onClick={() => appMode !== 'capacitacion' && onToggleMode()}
                            title="Modo Capacitación: guías visuales y textos de ayuda visibles"
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide transition-all duration-300 ${
                                appMode === 'capacitacion'
                                    ? 'bg-[#ff4f00] text-white shadow-md shadow-[#ff4f00]/25 scale-[1.02]'
                                    : isDarkMode
                                        ? 'text-neutral-400 hover:text-neutral-200'
                                        : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Capacitación
                        </button>
                        <button
                            onClick={() => appMode !== 'operativo' && onToggleMode()}
                            title="Modo Operativo: interfaz compacta solo con Troubleshooting y Test"
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide transition-all duration-300 ${
                                appMode === 'operativo'
                                    ? 'bg-[#ff4f00] text-white shadow-md shadow-[#ff4f00]/25 scale-[1.02]'
                                    : isDarkMode
                                        ? 'text-neutral-400 hover:text-neutral-200'
                                        : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Operativo
                        </button>
                    </div>
                )}
            </div>

            {/* Acciones a la derecha */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3">

                {/* Botón Volver al Menú */}
                {showBackButton && (
                    <button
                        onClick={onBackToMenu}
                        className="flex items-center justify-center gap-1.5 bg-[#ff4f00] hover:bg-[#ff4f00]/95 active:scale-[0.98] text-white transition-all font-sans font-extrabold text-[11px] uppercase px-4 py-2.5 rounded-full tracking-wider shadow-sm grow sm:grow-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M9.53 4.47a.75.75 0 0 1 0 1.06L4.81 10.25H20a.75.75 0 0 1 0 1.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                        <span>Menú Principal</span>
                    </button>
                )}

                {/* Gestor de Notificaciones Push (Campana) */}
                <PushNotificationManager isDarkMode={isDarkMode} />

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

                {/* Cerrar Sesión */}
                {onLogout && (
                    <button
                        onClick={onLogout}
                        title="Cerrar sesión"
                        className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 active:scale-[0.92] shadow-sm ${
                            isDarkMode
                                ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-rose-900/40 hover:text-rose-400 hover:border-rose-800'
                                : 'bg-white border-neutral-200 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/>
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}