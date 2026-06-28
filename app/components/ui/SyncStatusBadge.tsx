'use client';

import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
//  SyncStatusBadge
//
//  Displays the real-time synchronization state of the troubleshooting
//  catalog (hook: useTroubleshootingDB).
//
//  States:
//  - loading:  Initial background fetch in progress.
//  - live:     Successfully synced from Supabase.
//  - local:    Using local static fallback (offline / timeout).
//  - stale:    Live data exists but lastSync > 10 min ago.
//
//  Usage:
//    <SyncStatusBadge isLive={isLive} lastSync={lastSync} />
// ─────────────────────────────────────────────────────────────────
interface SyncStatusBadgeProps {
  isLive: boolean;
  lastSync: Date | null;
  isDarkMode?: boolean;
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'hace un momento';
  if (diffMin === 1) return 'hace 1 min';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return diffH === 1 ? 'hace 1 h' : `hace ${diffH} h`;
}

export function SyncStatusBadge({
  isLive,
  lastSync,
  isDarkMode = false,
}: SyncStatusBadgeProps) {
  const isStale =
    lastSync !== null && Date.now() - lastSync.getTime() > 10 * 60_000;

  if (!isLive) {
    // Local fallback state
    return (
      <span
        title="Catálogo local — sin conexión con Supabase"
        className={[
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all',
          isDarkMode
            ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
            : 'bg-neutral-100 border-neutral-200 text-neutral-400',
        ].join(' ')}
        aria-label="Catálogo local sin conexión en vivo"
      >
        <CloudOff className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <span>Local</span>
      </span>
    );
  }

  if (isStale) {
    return (
      <span
        title={`Última sincronización: ${lastSync ? formatRelativeTime(lastSync) : '—'}`}
        className={[
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all animate-pulse',
          isDarkMode
            ? 'bg-amber-900/30 border-amber-800/40 text-amber-400'
            : 'bg-amber-50 border-amber-200 text-amber-600',
        ].join(' ')}
        aria-label="Catálogo en vivo pero desactualizado"
      >
        <RefreshCw className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <span>Desactualizado</span>
      </span>
    );
  }

  // Live & fresh
  return (
    <span
      title={`Sincronizado con Supabase ${lastSync ? formatRelativeTime(lastSync) : ''}`}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all',
        isDarkMode
          ? 'bg-emerald-900/30 border-emerald-800/40 text-emerald-400'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700',
      ].join(' ')}
      aria-label={`Catálogo en vivo, sincronizado ${lastSync ? formatRelativeTime(lastSync) : ''}`}
    >
      <CheckCircle2 className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      <span>En vivo</span>
    </span>
  );
}
