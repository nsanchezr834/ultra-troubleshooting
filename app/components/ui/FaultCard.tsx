'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { TroubleshootingKnowledge } from '@/types/troubleshooting.types';

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
export interface ExtendedFault extends TroubleshootingKnowledge {
  clientKey?: string;
  robotName?: string;
}

interface FaultCardProps {
  item: ExtendedFault;
  isDarkMode?: boolean;
  onClick: (item: ExtendedFault) => void;
  /** Staggered entrance animation delay (ms = index * 40, max 200ms) */
  index?: number;
}

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────
const CLIENT_LOGO_MAP: Record<string, string> = {
  'manifest.eco': 'manifest_logo.png',
  'highline-commerce': 'highline_logo.png',
  'outerspace': 'outerspace_logo.png',
  'mountainy': 'mountainy_logo.png',
};

function getClientLogoSrc(key: string): string {
  return `/${CLIENT_LOGO_MAP[key] ?? `${key.replace('-', '_')}_logo.png`}`;
}

// ─────────────────────────────────────────────────────────────────
//  FaultCard — atomic, reusable, accessible
//
//  Accessibility:
//  - Native <button> for keyboard nav + Enter/Space activation.
//  - aria-label includes fault ID + full symptom text.
//  - focus-visible ring for keyboard users.
//  - Decorative images have aria-hidden.
// ─────────────────────────────────────────────────────────────────
export const FaultCard = React.memo(function FaultCard({
  item,
  isDarkMode = false,
  onClick,
  index = 0,
}: FaultCardProps) {
  const isAdvice = item.category === 'Consejos Operativos';
  const delayMs = Math.min(index * 40, 200);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      aria-label={`Abrir resolución: ${item.id} — ${item.symptom}`}
      className={[
        'w-full text-left border rounded-2xl p-4',
        'transition-all duration-200 ease-out',
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 group',
        'shadow-xs hover:shadow-md active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ultra-orange focus-visible:ring-offset-2',
        isAdvice
          ? isDarkMode
            ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600 hover:bg-amber-950/30'
            : 'bg-amber-50/25 border-amber-200 hover:border-amber-400 hover:bg-amber-50/60'
          : isDarkMode
            ? 'bg-neutral-800/40 border-neutral-700/50 hover:border-ultra-orange hover:bg-neutral-800/70'
            : 'bg-neutral-50/50 border-neutral-200/60 hover:border-ultra-orange hover:bg-white',
      ].join(' ')}
      style={{
        animation: `fadeSlideUp 220ms ease-out ${delayMs}ms forwards`,
        opacity: 0,
      }}
    >
      {/* Left — ID badge + symptom */}
      <div className="flex flex-col gap-1 pr-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={[
              'text-[10px] font-mono font-bold uppercase tracking-wider',
              isAdvice
                ? 'text-amber-600'
                : isDarkMode
                  ? 'text-neutral-500'
                  : 'text-neutral-400',
            ].join(' ')}
          >
            {item.id}
          </span>
          {isAdvice && (
            <Lightbulb
              aria-hidden="true"
              className="w-3.5 h-3.5 text-amber-500 fill-amber-100 flex-shrink-0"
            />
          )}
        </div>
        <h4
          className={[
            'text-sm font-bold leading-snug transition-colors mt-0.5 line-clamp-2',
            isDarkMode
              ? 'text-neutral-200 group-hover:text-white'
              : 'text-neutral-800 group-hover:text-neutral-900',
          ].join(' ')}
        >
          {item.symptom}
        </h4>
      </div>

      {/* Right — robot badge (advice) + category pill */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {isAdvice && item.clientKey && (
          <div
            className={[
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xs',
              isDarkMode
                ? 'bg-neutral-900 border-amber-800/40'
                : 'bg-white border-amber-200',
            ].join(' ')}
          >
            <img
              src={getClientLogoSrc(item.clientKey)}
              alt=""
              aria-hidden="true"
              className="w-5 h-5 object-contain rounded-md border border-neutral-100"
            />
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                Robot
              </span>
              <span
                className={[
                  'text-[11px] font-black uppercase tracking-tight',
                  isDarkMode ? 'text-neutral-200' : 'text-neutral-800',
                ].join(' ')}
              >
                {item.robotName}
              </span>
            </div>
          </div>
        )}

        <span
          className={[
            'text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border whitespace-nowrap',
            isAdvice
              ? 'text-amber-600 bg-amber-50 border-amber-200/50'
              : 'text-ultra-orange bg-ultra-orange/5 border-ultra-orange/15',
          ].join(' ')}
        >
          {item.category}
        </span>
      </div>
    </button>
  );
});

// ─────────────────────────────────────────────────────────────────
//  FaultCardSkeleton — pulsing placeholder for loading states
// ─────────────────────────────────────────────────────────────────
export function FaultCardSkeleton({
  count = 3,
  isDarkMode = false,
}: {
  count?: number;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Cargando fallas..."
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={[
            'w-full border rounded-2xl p-4 flex flex-col gap-2.5 animate-pulse',
            isDarkMode
              ? 'border-neutral-700/50 bg-neutral-800/30'
              : 'border-neutral-200/60 bg-neutral-50/50',
          ].join(' ')}
          style={{ animationDelay: `${i * 80}ms` }}
          aria-hidden="true"
        >
          <div
            className={[
              'h-3 w-16 rounded-full',
              isDarkMode ? 'bg-neutral-700' : 'bg-neutral-200',
            ].join(' ')}
          />
          <div
            className={[
              'h-4 w-3/4 rounded-md',
              isDarkMode ? 'bg-neutral-700' : 'bg-neutral-200',
            ].join(' ')}
          />
          <div
            className={[
              'h-3 w-1/2 rounded-md',
              isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100',
            ].join(' ')}
          />
        </div>
      ))}
      <span className="sr-only">Cargando resultados de búsqueda…</span>
    </div>
  );
}
