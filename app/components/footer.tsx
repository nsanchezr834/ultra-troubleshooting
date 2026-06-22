'use client';

import React from 'react';

interface FooterProps {
    isDarkMode?: boolean;
}

export default function Footer({ isDarkMode = false }: FooterProps) {
    return (
        <footer className={`w-full text-center py-6 border-t mt-8 z-10 flex flex-col items-center gap-3 transition-colors duration-500 ${
            isDarkMode ? 'border-neutral-800/60' : 'border-neutral-200/60'
        }`}>
            <p className={`text-[10px] font-mono font-bold tracking-widest uppercase transition-colors duration-500 ${
                isDarkMode ? 'text-neutral-500' : 'text-neutral-400'
            }`}>
                Remotics 2026
            </p>
            <div className="flex items-center justify-center gap-5 mt-1">
                {/* Logo Remotics */}
                <div className="relative w-28 h-8 flex items-center justify-center">
                    <img
                        src="/remotics_logo.webp"
                        alt="Remotics Logo"
                        className="object-contain max-h-7 transition-all duration-300"
                        style={{
                            filter: isDarkMode 
                                ? 'brightness(0) invert(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))' 
                                : 'none'
                        }}
                    />
                </div>
                
                {/* Separador */}
                <div className={`h-6 w-[1px] transition-colors duration-500 ${
                    isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'
                }`} />
                
                {/* Logo Autoryx */}
                <div className="relative w-28 h-8 flex items-center justify-center">
                    <img
                        src="/autoryx_logo.webp"
                        alt="Autoryx Logo"
                        className="object-contain max-h-7 transition-all duration-300"
                        style={{
                            filter: isDarkMode 
                                ? 'brightness(0) invert(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))' 
                                : 'none'
                        }}
                    />
                </div>
            </div>
        </footer>
    );
}