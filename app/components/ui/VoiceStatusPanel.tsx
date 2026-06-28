'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, Volume2, Loader2, X, AlertCircle, WifiOff } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
export type VoiceTurn = 'idle' | 'machine-speaking' | 'user-speaking' | 'processing';

export interface VoiceOption {
  id: string;
  label: string;
}

interface VoiceStatusPanelProps {
  turn: VoiceTurn;
  statusText: string;
  options: VoiceOption[];
  errorMsg?: string;
  isDarkMode?: boolean;
  onOptionClick: (id: string) => void;
  onDismiss: () => void;
}

// ─────────────────────────────────────────────────────────────────
//  AudioWave — animated bars visualising the microphone level
//  Pure CSS animation — no Web Audio API required.
// ─────────────────────────────────────────────────────────────────
function AudioWave({ active }: { active: boolean }) {
  const BAR_COUNT = 5;
  return (
    <div
      className="flex items-center gap-[3px] h-6"
      role="img"
      aria-label="Indicador de escucha activa"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className={[
            'inline-block w-[3px] rounded-full transition-all duration-300',
            active ? 'bg-emerald-500' : 'bg-neutral-400/30',
          ].join(' ')}
          style={
            active
              ? {
                  animation: `audioBar 800ms ease-in-out ${i * 90}ms infinite alternate`,
                  height: '8px',
                }
              : { height: '4px' }
          }
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  VoiceStatusPanel — floating panel shown while SpeechAgent active
//
//  Improvements over original inline JSX:
//  - Extracted from SpeechAgent.tsx → independently testable.
//  - AudioWave replaces generic animate-pulse on the mic icon.
//  - Options list has staggered entrance animation.
//  - Full keyboard access: each option is a native <button>.
//  - aria-live region announces status changes to screen readers.
//  - Focus auto-moves to panel on mount for accessibility.
// ─────────────────────────────────────────────────────────────────
export function VoiceStatusPanel({
  turn,
  statusText,
  options,
  errorMsg,
  isDarkMode = false,
  onOptionClick,
  onDismiss,
}: VoiceStatusPanelProps) {
  const isProcessing = turn === 'processing';
  const isUserTurn = turn === 'user-speaking';
  const isMachineTurn = turn === 'machine-speaking';
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus inside the panel for keyboard users
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label="Panel de asistencia por voz"
      className={[
        'absolute right-0 sm:-right-2 w-[320px] sm:w-[450px] max-w-[85vw] top-full mt-6 z-50 rounded-2xl p-5 shadow-2xl border backdrop-blur-md outline-none',
        'transition-all duration-300 origin-top-right',
        isDarkMode
          ? 'bg-neutral-900/92 border-neutral-800 text-neutral-100'
          : 'bg-white/97 border-neutral-200/80 text-neutral-800',
      ].join(' ')}
      style={{ animation: 'fadeSlideDown 240ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-neutral-200/40 dark:border-neutral-800/50">
        <div className="flex items-center gap-2.5">
          {/* Status indicator dot */}
          <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
            <span
              className={[
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                isUserTurn ? 'bg-emerald-400' : 'bg-ultra-orange',
              ].join(' ')}
            />
            <span
              className={[
                'relative inline-flex rounded-full h-2.5 w-2.5',
                isUserTurn ? 'bg-emerald-500' : 'bg-ultra-orange',
              ].join(' ')}
            />
          </span>

          {/* Status label — announced by screen readers */}
          <span
            className="text-[11px] font-bold uppercase tracking-wider text-neutral-400"
            aria-live="polite"
            aria-atomic="true"
          >
            {isMachineTurn && 'Asistente hablando'}
            {isUserTurn && 'Tu turno — escuchando'}
            {isProcessing && 'Buscando falla…'}
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar asistente de voz"
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ultra-orange"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* ── Status message row ── */}
      <div className="flex items-center gap-3 mb-4">
        {isProcessing ? (
          <Loader2
            className="w-5 h-5 text-ultra-orange animate-spin flex-shrink-0"
            aria-hidden="true"
          />
        ) : isUserTurn ? (
          <AudioWave active />
        ) : (
          <Volume2
            className="w-5 h-5 text-ultra-orange flex-shrink-0"
            aria-hidden="true"
          />
        )}

        <p
          className="text-sm font-semibold leading-relaxed"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusText || '…'}
        </p>
      </div>

      {/* ── Options menu ── */}
      {options.length > 0 && (
        <div className="space-y-2" role="menu" aria-label="Opciones de falla disponibles">
          {options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              role="menuitem"
              onClick={() => onOptionClick(opt.id)}
              aria-label={`Opción ${i + 1}: ${opt.label}`}
              className={[
                'w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-semibold',
                'transition-all duration-200 active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ultra-orange focus-visible:ring-offset-1',
                isDarkMode
                  ? 'bg-neutral-800/40 border-neutral-700/50 hover:bg-neutral-800 hover:border-ultra-orange'
                  : 'bg-neutral-50/70 border-neutral-200/60 hover:bg-white hover:border-ultra-orange hover:shadow-sm',
              ].join(' ')}
              style={{
                animation: 'fadeSlideUp 200ms ease-out forwards',
                animationDelay: `${i * 50}ms`,
                opacity: 0,
              }}
            >
              {/* Number badge */}
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-ultra-orange/10 dark:bg-ultra-orange/20 text-ultra-orange flex items-center justify-center text-xs font-black"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="flex-1">{opt.label}</span>
            </button>
          ))}
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic text-center mt-1.5">
            Toca una opción o di el número en voz alta
          </p>
        </div>
      )}

      {/* ── Error state ── */}
      {errorMsg && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-500 text-xs"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MicButton — standalone, reusable mic toggle button
// ─────────────────────────────────────────────────────────────────
interface MicButtonProps {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ isActive, onClick, disabled }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isActive ? 'Cancelar asistente de voz' : 'Iniciar diagnóstico por voz'}
      aria-pressed={isActive}
      className={[
        'relative p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ultra-orange focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive
          ? 'bg-[#FF6A00] text-white hover:scale-105 shadow-md shadow-[#FF6A00]/25'
          : 'hover:bg-[#FF6A00]/10 text-[#FF6A00]',
      ].join(' ')}
    >
      {isActive ? (
        <div className="relative" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-xl bg-[#FF6A00] opacity-75 animate-ping -left-0 -top-0 scale-150 pointer-events-none" />
          <X className="w-5 h-5 relative z-10" />
        </div>
      ) : (
        <Mic className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}
