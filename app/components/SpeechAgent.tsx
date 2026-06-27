'use client';

// ═══════════════════════════════════════════════════════════════════
//  SpeechAgent v4 — Modo Conversacional (Turn-Based)
//
//  ARQUITECTURA:
//  El micrófono NUNCA está abierto mientras el sintetizador habla.
//  El flujo es estrictamente alternado:
//    MÁQUINA habla → MÁQUINA termina → USUARIO habla → USUARIO termina → MÁQUINA habla
//
//  Esto elimina el bucle de eco por diseño, sin necesidad de filtros
//  de timestamp ni ventanas de silencio.
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Loader2, AlertCircle, X } from 'lucide-react';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';

// ───────────────────────────────────────────────────────────────────
// TÍTULOS CORTOS — mapa de ID → etiqueta breve para lectura en voz
// Gemini y la UI muestran el título completo, pero el sintetizador
// lee la versión corta para no tardar 8 segundos por opción.
// ───────────────────────────────────────────────────────────────────
const SHORT_TITLES: Record<string, string> = {
  'ERR-KIN-001': 'Hombro visible, pérdida de alineación',
  'ERR-ROB-007': 'Brazo congelado',
  'ERR-ROB-008': 'Gripper no agarra',
  'ERR-ROB-009': 'Cámara sin señal',
  'ERR-ROB-010': 'Cuello trabado',
  'ERR-ROB-011': 'Pecho congelado',
  'ERR-ROB-012': 'Robot no se mueve',
  'ERR-MEC-002': 'Objeto cilíndrico',
  'ERR-MEC-013': 'Objeto caído',
  'ERR-MEC-014': 'Etiqueta no imprime — Bagger',
  'ERR-MEC-016': 'Etiqueta no sale — impresora manual',
  'ERR-NET-003': 'Red lenta o cámara congelada',
  'ERR-SW-004': 'Robot no se mueve en teleop',
  'ERR-SW-005': 'Robot bloqueado por software dev',
  'ERR-SEC-006': 'Persona en la celda',
  'ERR-BAG-001': 'Bagger sin bolsas',
  'ERR-BAG-002': 'Bolsa atascada en Bagger',
  'ERR-BAG-003': 'Bolsa mal sellada',
  'ERR-BIN-001': 'Paquete en bin equivocado',
  'ERR-BIN-002': 'Bin de salida lleno',
  'ERR-BIN-003': 'Bin de descarte lleno',
  'ERR-BIN-004': 'Bin mal alineado',
  'ERR-PRO-001': 'Sin producto — Out of Product',
  'ERR-SW-006': 'App del headset no funciona',
  'ERR-KIN-003': 'Cómo usar el modo AUTO',
  'ERR-MEC-015': 'Retirar etiqueta del gripper',
  'ERR-PED-001': 'Pedales no aparecen',
  'ERR-ROB-013': 'Producto no encontrado al escanear',
  'ERR-BAG-004': 'Bagger no sella — Monty',
};

function getShortTitle(entry: typeof TROUBLESHOOTING_DATABASE[0]): string {
  return SHORT_TITLES[entry.id] || entry.symptom.slice(0, 50);
}

// ───────────────────────────────────────────────────────────────────
// SANITIZAR — limpia el transcript antes de buscar
// ───────────────────────────────────────────────────────────────────
function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;!?¿¡]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ───────────────────────────────────────────────────────────────────
// BÚSQUEDA FUZZY LOCAL
// ───────────────────────────────────────────────────────────────────
function localFuzzySearch(query: string): typeof TROUBLESHOOTING_DATABASE {
  const tokens = sanitize(query).split(' ').filter(t => t.length > 2);
  if (!tokens.length) return [];

  const scored = TROUBLESHOOTING_DATABASE.map(entry => {
    const haystack = sanitize(
      entry.symptom + ' ' + ((entry as any).keywords || '')
    );
    const hits = tokens.filter(t => haystack.includes(t)).length;
    return { entry, score: hits };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(r => r.entry);
}

// ───────────────────────────────────────────────────────────────────
// TIPOS
// ───────────────────────────────────────────────────────────────────
type Turn = 'idle' | 'machine-speaking' | 'user-speaking' | 'processing';

interface SpeechAgentProps {
  onMatchFault?: (symptom: string) => void;
  isDarkMode?: boolean;
}

// ───────────────────────────────────────────────────────────────────
// COMPONENTE
// ───────────────────────────────────────────────────────────────────
export default function SpeechAgent({ onMatchFault, isDarkMode = false }: SpeechAgentProps) {
  const [turn, setTurn] = useState<Turn>('idle');
  const [statusText, setStatusText] = useState('');
  const [optionsMenu, setOptionsMenu] = useState<typeof TROUBLESHOOTING_DATABASE>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const turnRef = useRef<Turn>('idle');
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recRef = useRef<any>(null);
  const optionsRef = useRef<typeof TROUBLESHOOTING_DATABASE>([]);

  // Telemetría ligera
  const lastQueryRef = useRef('');

  const setTurnSafe = (t: Turn) => { turnRef.current = t; setTurn(t); };

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'es-MX';
      rec.continuous = false; // SIEMPRE false — turn-based
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recRef.current = rec;
    } else {
      setErrorMsg('Este navegador no soporta reconocimiento de voz.');
    }
    return () => hardStop();
  }, []);

  // ─────────────────────────────────────────────
  // HARD STOP — limpia todo sin efectos colaterales
  // ─────────────────────────────────────────────
  const hardStop = useCallback(() => {
    synthRef.current?.cancel();
    const rec = recRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch (_) { }
    }
  }, []);

  const resetAgent = useCallback(() => {
    hardStop();
    setTurnSafe('idle');
    setStatusText('');
    setOptionsMenu([]);
    optionsRef.current = [];
    setErrorMsg('');
  }, [hardStop]);

  // ─────────────────────────────────────────────
  // HABLAR — la máquina toma el turno
  // Al terminar llama onEnd para ceder el turno al usuario
  // ─────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd: () => void) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    setTurnSafe('machine-speaking');

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = 1.25;   // 25% más rápido — más natural y menos tardado
    u.pitch = 1.0;

    u.onend = () => onEnd();
    u.onerror = () => onEnd();

    synth.speak(u);
  }, []);

  // ─────────────────────────────────────────────
  // ESCUCHAR — el usuario toma el turno
  // El mic solo se abre aquí, NUNCA mientras la máquina habla
  // ─────────────────────────────────────────────
  const listenOnce = useCallback((
    onResult: (transcript: string) => void,
    label: string
  ) => {
    const rec = recRef.current;
    if (!rec) return;

    setTurnSafe('user-speaking');
    setStatusText(label);

    rec.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript?.trim() ?? '';
      if (t) onResult(t);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        // Silencio: volver a escuchar sin reiniciar todo el flujo
        try { rec.start(); } catch (_) { }
        return;
      }
      if (e.error === 'aborted') return;
      setErrorMsg(`Micrófono: ${e.error}`);
      resetAgent();
    };

    rec.onend = () => {
      // Si onresult ya se disparó, turnRef ya cambió a 'processing'
      // y no volvemos a iniciar. Si no hubo resultado (silencio largo),
      // onerror con 'no-speech' lo maneja arriba.
    };

    try { rec.start(); } catch (_) { }
  }, [resetAgent]);

  // ─────────────────────────────────────────────
  // PASO 1 — capturar síntoma del operario
  // ─────────────────────────────────────────────
  const startCapture = useCallback(() => {
    if (!recRef.current) return;
    hardStop();
    setErrorMsg('');
    optionsRef.current = [];
    setOptionsMenu([]);

    speak(
      '¿Cuál es el problema que tienes con el robot?',
      () => listenOnce(processSymptom, '🎙️ Describe el problema...')
    );
  }, [speak, hardStop]);

  // ─────────────────────────────────────────────
  // PASO 2 — buscar en DB + Gemini si falla local
  // ─────────────────────────────────────────────
  const processSymptom = useCallback(async (rawText: string) => {
    setTurnSafe('processing');
    setStatusText(`Buscando: "${rawText}"`);
    lastQueryRef.current = sanitize(rawText);

    let matches = localFuzzySearch(rawText);

    if (matches.length === 0) {
      try {
        const res = await fetch('/api/voice-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptom: sanitize(rawText) }),
        });
        if (res.ok) {
          const data = await res.json();
          const titles: string[] = data.coincidencias ?? [];
          matches = TROUBLESHOOTING_DATABASE.filter(e => titles.includes(e.symptom));
        }
      } catch (_) { }
    }

    if (matches.length === 0) {
      speak(
        'No encontré fallas relacionadas. Intenta describir el problema de otra forma.',
        () => listenOnce(processSymptom, '🎙️ Describe el problema...')
      );
      return;
    }

    if (matches.length === 1) {
      // Una sola coincidencia: ir directo sin menú
      readResolution(matches[0]);
      return;
    }

    // Múltiples opciones: leer menú
    optionsRef.current = matches;
    setOptionsMenu(matches);

    let speech = `Encontré ${matches.length} opciones. `;
    matches.forEach((m, i) => {
      speech += `${i + 1}: ${getShortTitle(m)}. `;
    });
    speech += '¿Cuál quieres? Di el número o el nombre.';

    setStatusText('Elige una opción por voz o toca la pantalla.');
    speak(speech, () => listenOnce(processSelection, '🎙️ Di el número o nombre de la opción...'));
  }, [speak, listenOnce]);

  // ─────────────────────────────────────────────
  // PASO 3 — interpretar selección del usuario
  // ─────────────────────────────────────────────
  const processSelection = useCallback((rawText: string) => {
    setTurnSafe('processing');
    const t = sanitize(rawText);
    const opts = optionsRef.current;

    const numberMap: Record<string, number> = {
      uno: 0, '1': 0, primera: 0, primero: 0,
      dos: 1, '2': 1, segunda: 1, segundo: 1,
      tres: 2, '3': 2, tercera: 2, tercero: 2,
    };

    // ¿Cancelar?
    if (['cancelar', 'parar', 'salir', 'stop', 'ninguna'].some(w => t.includes(w))) {
      speak('De acuerdo, cancelado.', resetAgent);
      return;
    }

    // ¿Número?
    let idx = -1;
    for (const [word, i] of Object.entries(numberMap)) {
      if (t.includes(word)) { idx = i; break; }
    }

    // ¿Nombre parcial?
    if (idx === -1) {
      opts.forEach((opt, i) => {
        const short = sanitize(getShortTitle(opt));
        const tokens = t.split(' ').filter(w => w.length > 2);
        if (tokens.some(w => short.includes(w))) idx = i;
      });
    }

    if (idx !== -1 && idx < opts.length) {
      readResolution(opts[idx]);
    } else {
      speak(
        'No entendí la selección. Di el número de la opción que quieres.',
        () => listenOnce(processSelection, '🎙️ Di el número de opción...')
      );
    }
  }, [speak, listenOnce, resetAgent]);

  // ─────────────────────────────────────────────
  // PASO 4 — leer resolución
  // ─────────────────────────────────────────────
  const readResolution = useCallback((entry: typeof TROUBLESHOOTING_DATABASE[0]) => {
    setTurnSafe('machine-speaking');
    setStatusText(`📋 ${getShortTitle(entry)}`);
    onMatchFault?.(entry.symptom);
    setOptionsMenu([]);
    optionsRef.current = [];

    // Leer solo los pasos, no el título completo (ya se mostró en pantalla)
    const speech = entry.resolution_protocol.replace(/\n/g, '. ');

    speak(speech, () => {
      speak(
        '¿Necesitas ayuda con otra falla?',
        () => listenOnce(handlePostResolution, '🎙️ Di "sí" para otra falla o "no" para terminar...')
      );
    });
  }, [speak, listenOnce, onMatchFault]);

  // ─────────────────────────────────────────────
  // PASO 5 — post resolución: ¿otra falla o terminar?
  // ─────────────────────────────────────────────
  const handlePostResolution = useCallback((rawText: string) => {
    const t = sanitize(rawText);
    const yes = ['si', 'sí', 'otra', 'otro', 'quiero', 'ayuda', 'problema'].some(w => t.includes(w));
    const no = ['no', 'listo', 'gracias', 'terminar', 'salir', 'ya'].some(w => t.includes(w));

    if (yes) {
      // Nueva búsqueda — preguntar directamente
      speak(
        '¿Cuál es el nuevo problema?',
        () => listenOnce(processSymptom, '🎙️ Describe el nuevo problema...')
      );
    } else if (no) {
      speak('Perfecto. Hasta luego.', resetAgent);
    } else {
      // No entendió: preguntar de nuevo
      speak(
        '¿Quieres buscar otra falla? Di sí o no.',
        () => listenOnce(handlePostResolution, '🎙️ Di "sí" o "no"...')
      );
    }
  }, [speak, listenOnce, resetAgent, processSymptom]);

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  const isActive = turn !== 'idle';
  const isMachineTurn = turn === 'machine-speaking' || turn === 'processing';
  const isUserTurn = turn === 'user-speaking';

  return (
    <>
      {/* ── Botón micrófono + badge ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4.5 z-20">
        <span className="hidden sm:inline-flex items-center gap-2 pointer-events-none select-none">
          <img src="/autoryx_badge_v2.svg" alt="Autoryx" className="w-6 h-6 object-contain" />
          <span className="flex flex-col text-left leading-[1.1]">
            <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">powered by</span>
            <span className="text-[11px] font-black text-ultra-orange uppercase tracking-widest">Autoryx AI</span>
          </span>
        </span>

        <div className="hidden sm:block w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800" />

        <button
          onClick={isActive ? resetAgent : startCapture}
          className={`relative p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-ultra-orange text-white hover:scale-105 shadow-md shadow-ultra-orange/20'
              : 'hover:bg-ultra-orange/5 dark:hover:bg-ultra-orange/10 text-ultra-orange'
            }`}
          title={isActive ? 'Cancelar' : 'Iniciar diagnóstico por voz'}
        >
          {isActive ? (
            <div className="relative">
              <span className="absolute inline-flex h-full w-full rounded-xl bg-ultra-orange opacity-75 animate-ping -left-0 -top-0 scale-150 pointer-events-none" />
              <X className="w-5.5 h-5.5 relative z-10" />
            </div>
          ) : (
            <Mic className="w-5.5 h-5.5 text-ultra-orange" />
          )}
        </button>
      </div>

      {/* ── Mobile badge ── */}
      {!isActive && (
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-[calc(100%+12px)] flex items-center gap-1.5 pointer-events-none select-none w-max z-10">
          <img src="/autoryx_badge_v2.svg" alt="Autoryx" className="w-4 h-4 object-contain" />
          <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">powered by</span>
          <span className="text-[10px] font-black text-ultra-orange uppercase tracking-widest">Autoryx AI</span>
        </div>
      )}

      {/* ── Panel flotante ── */}
      {isActive && (
        <div className={`absolute left-0 right-0 top-full mt-3 z-50 rounded-2xl p-5 shadow-2xl border backdrop-blur-md ${isDarkMode
            ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
            : 'bg-white/95 border-neutral-200/80 text-neutral-800'
          }`}>

          {/* Header con turno actual */}
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-neutral-200/50 dark:border-neutral-800/50">
            <div className="flex items-center gap-2">
              {/* Indicador de turno */}
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUserTurn ? 'bg-emerald-400' : 'bg-ultra-orange'
                  }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isUserTurn ? 'bg-emerald-500' : 'bg-ultra-orange'
                  }`} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {turn === 'machine-speaking' && 'Asistente hablando'}
                {turn === 'user-speaking' && 'Tu turno — escuchando'}
                {turn === 'processing' && 'Buscando falla...'}
              </span>
            </div>
            <button onClick={resetAgent} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Estado / mensaje */}
          <div className="flex items-start gap-3 mb-4">
            {turn === 'processing' ? (
              <Loader2 className="w-5 h-5 text-ultra-orange animate-spin flex-shrink-0 mt-0.5" />
            ) : isUserTurn ? (
              <Mic className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5 animate-pulse" />
            ) : (
              <Volume2 className="w-5 h-5 text-ultra-orange flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium leading-relaxed">{statusText || '...'}</p>
          </div>

          {/* Menú de opciones — siempre visible para toque táctil */}
          {optionsMenu.length > 0 && (
            <div className="space-y-2">
              {optionsMenu.map((opt, i) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    synthRef.current?.cancel();
                    const rec = recRef.current;
                    if (rec) { rec.onresult = null; rec.onerror = null; rec.onend = null; try { rec.abort(); } catch (_) { } }
                    readResolution(opt);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-semibold transition-all duration-200 ${isDarkMode
                      ? 'bg-neutral-800/40 border-neutral-700/50 hover:bg-neutral-800 hover:border-ultra-orange'
                      : 'bg-neutral-50/70 border-neutral-200/60 hover:bg-white hover:border-ultra-orange hover:shadow-sm'
                    }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ultra-orange/10 dark:bg-ultra-orange/20 text-ultra-orange flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </span>
                  <span className="flex-1">{getShortTitle(opt)}</span>
                </button>
              ))}
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic text-center mt-2">
                Toca una opción o di el número en voz alta
              </p>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}