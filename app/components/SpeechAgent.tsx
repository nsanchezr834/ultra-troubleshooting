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

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';
import { logSearch } from '../lib/telemetry';
import { VoiceStatusPanel, MicButton, VoiceOption } from './ui';

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
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);

  const turnRef = useRef<Turn>('idle');
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recRef = useRef<any>(null);
  const wakeWordRecRef = useRef<any>(null);
  const optionsRef = useRef<typeof TROUBLESHOOTING_DATABASE>([]);

  // Telemetría ligera
  const lastQueryRef = useRef('');
  const lastMatchesCountRef = useRef(0);
  const currentVoiceSearchRef = useRef<any>(null);

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
      
      const wakeRec = new SR();
      wakeRec.lang = 'es-MX';
      wakeRec.continuous = true;
      wakeRec.interimResults = true;
      wakeRec.maxAlternatives = 1;
      wakeWordRecRef.current = wakeRec;
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
  // WAKE WORD LISTENER — "Oye Autoryx"
  // ─────────────────────────────────────────────
  useEffect(() => {
    const wakeRec = wakeWordRecRef.current;
    if (!wakeRec) {
      console.log('⚠️ [WakeWord] wakeRec es null. No soportado?');
      return;
    }

    console.log(`🔄 [WakeWord] Effect ejecutado. enabled: ${isWakeWordEnabled}, turn: ${turn}`);

    if (!isWakeWordEnabled || turn !== 'idle') {
      console.log('🛑 [WakeWord] Apagando escucha de fondo.');
      try { wakeRec.abort(); } catch (e) { console.log('Error al abortar:', e); }
      return;
    }

    wakeRec.onresult = (e: any) => {
      let fullTranscript = '';
      for (let i = 0; i < e.results.length; ++i) {
        fullTranscript += e.results[i][0].transcript + ' ';
      }
      
      const t = sanitize(fullTranscript);
      console.log('🗣️ [WakeWord] Escuchando:', t);
      
      // Búsqueda más flexible (Fuzzy) porque el navegador a veces escribe "autorix", "auto rix", "oye autoris", etc.
      const hasOye = t.includes('oye') || t.includes('oy ') || t.includes('hoy ') || t.includes('hola ');
      const hasAuto = t.includes('autor') || t.includes('auto') || t.includes('ultra');
      const exactMatch = ['autoryx', 'autorix', 'ayuda ultra', 'oye ultra'].some(w => t.includes(w));
      
      if ((hasOye && hasAuto) || exactMatch) {
        console.log('✅ [WakeWord] ¡Palabra clave detectada!');
        wakeRec.abort();
        startCapture();
      }
    };
    
    wakeRec.onerror = (e: any) => {
      console.log('❌ [WakeWord] Error disparado:', e.error);
      if (e.error === 'not-allowed' || e.error === 'aborted') return;
      if (isWakeWordEnabled && turn === 'idle') {
         console.log('🔄 [WakeWord] Reiniciando tras error no fatal en 1s...');
         setTimeout(() => {
           try { wakeRec.start(); } catch (err) { }
         }, 1000);
      }
    };

    wakeRec.onend = () => {
      console.log('🏁 [WakeWord] onend disparado (el micrófono se apagó).');
      if (isWakeWordEnabled && turn === 'idle') {
         console.log('🔄 [WakeWord] Reiniciando escucha en 1s...');
         setTimeout(() => {
           try { wakeRec.start(); } catch (err) { }
         }, 1000);
      }
    };

    console.log('▶️ [WakeWord] Intentando iniciar micrófono...');
    try { 
      wakeRec.start(); 
      console.log('✅ [WakeWord] Micrófono iniciado correctamente.');
    } catch (err) { 
      console.error('❌ [WakeWord] Excepción al hacer wakeRec.start():', err); 
    }

    return () => {
      console.log('🧹 [WakeWord] Limpiando efecto...');
      wakeRec.onresult = null;
      wakeRec.onerror = null;
      wakeRec.onend = null;
      try { wakeRec.abort(); } catch (_) { }
    };
  }, [turn, isWakeWordEnabled, startCapture]);

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
      logSearch({
        query: rawText,
        matches_count: 0,
        status: 'no_matches',
        source: 'speech_agent'
      });

      speak(
        'No encontré fallas relacionadas. Intenta describir el problema de otra forma.',
        () => listenOnce(processSymptom, '🎙️ Describe el problema...')
      );
      return;
    }

    lastMatchesCountRef.current = matches.length;

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
      logSearch({
        query: lastQueryRef.current,
        matches_count: opts.length,
        status: 'abandoned',
        source: 'speech_agent'
      });
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
  // PASO 4.5 — procesar respuesta de feedback del usuario
  // ─────────────────────────────────────────────
  const handleFeedbackResponse = useCallback((rawText: string) => {
    const t = sanitize(rawText);
    const solved = ['si', 'sí', 'correcto', 'funciono', 'funciona', 'resuelto', 'bien', 'util', 'sirvio'].some(w => t.includes(w));
    const notSolved = ['no', 'fallo', 'mal', 'incorrecto', 'tampoco', 'toda', 'nada', 'sirve'].some(w => t.includes(w));

    if (currentVoiceSearchRef.current) {
      const status = solved ? 'resolved' : 'no_matches';
      logSearch({
        ...currentVoiceSearchRef.current,
        status: status
      });
    }

    if (solved) {
      speak(
        'Excelente. ¿Necesitas ayuda con otra falla?',
        () => listenOnce(handlePostResolution, '🎙️ Di "sí" para otra falla o "no" para terminar...')
      );
    } else {
      speak(
        'Entendido, marcaré la falla como no solucionada. ¿Necesitas ayuda con otra falla?',
        () => listenOnce(handlePostResolution, '🎙️ Di "sí" para otra falla o "no" para terminar...')
      );
    }
  }, [speak, listenOnce, handlePostResolution]);

  // ─────────────────────────────────────────────
  // PASO 4 — leer resolución (paso a paso interactivo)
  // ─────────────────────────────────────────────
  const readResolution = useCallback((entry: typeof TROUBLESHOOTING_DATABASE[0]) => {
    setTurnSafe('machine-speaking');
    setStatusText(`📋 ${getShortTitle(entry)}`);
    onMatchFault?.(entry.symptom);
    setOptionsMenu([]);
    optionsRef.current = [];

    // Almacenar los parámetros de búsqueda temporalmente
    currentVoiceSearchRef.current = {
      query: lastQueryRef.current || entry.symptom,
      matches_count: lastMatchesCountRef.current || 1,
      selected_option: entry.symptom,
      source: 'speech_agent'
    };

    // Separar los pasos por salto de línea
    const steps = entry.resolution_protocol
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s !== '.' && s !== '-');

    const executeStep = (index: number) => {
      if (index >= steps.length) {
        speak(
          'He terminado los pasos. ¿Esta información resolvió tu problema? Di sí o no.',
          () => listenOnce(handleFeedbackResponse, '🎙️ Di "sí" para solucionado o "no" para no solucionado...')
        );
        return;
      }
      
      const stepText = steps[index].replace(/^[0-9]+\.\s*/, '');
      
      speak(`${stepText}. ¿Listo?`, () => {
        listenOnce((rawText) => {
          const t = sanitize(rawText);
          const next = ['si', 'sí', 'listo', 'siguiente', 'ok', 'ya', 'claro', 'continuar'].some(w => t.includes(w));
          const repeat = ['repetir', 'repite', 'que', 'como', 'otra vez', 'nuevo'].some(w => t.includes(w));
          const stop = ['salir', 'parar', 'no', 'cancelar', 'alto'].some(w => t.includes(w));
          
          if (stop) {
            speak('De acuerdo, diagnóstico cancelado.', resetAgent);
          } else if (repeat) {
            executeStep(index);
          } else if (next) {
            executeStep(index + 1);
          } else {
            speak('No te escuché bien. Di "listo" para avanzar, "repetir" o "cancelar".', () => {
               executeStep(index);
            });
          }
        }, `🎙️ Paso ${index + 1} de ${steps.length}: Di "listo", "repetir" o "cancelar"...`);
      });
    };

    executeStep(0);
  }, [speak, listenOnce, onMatchFault, handleFeedbackResponse, resetAgent]);

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  const isActive = turn !== 'idle';

  // Build the options list for VoiceStatusPanel (memoised to avoid allocation on every render)
  const voiceOptions: VoiceOption[] = useMemo(
    () => optionsMenu.map((opt) => ({ id: opt.id, label: getShortTitle(opt) })),
    [optionsMenu]
  );

  const handleOptionClick = useCallback(
    (id: string) => {
      const opt = optionsMenu.find((o) => o.id === id);
      if (!opt) return;
      synthRef.current?.cancel();
      const rec = recRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try { rec.abort(); } catch (_) { }
      }
      readResolution(opt);
    },
    [optionsMenu, readResolution]
  );

  return (
    <>
      {/* ── Botón micrófono + badge Autoryx ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 sm:gap-4 z-20">
        {/* Badge — desktop only */}
        <span className="hidden sm:inline-flex items-center gap-2 pointer-events-none select-none shrink-0">
          <img src="/autoryx_badge_v2.svg" alt="Autoryx" className={`w-6 h-6 object-contain shrink-0 ${isDarkMode ? 'invert opacity-80' : ''}`} />
          <span className="flex flex-col text-left leading-[1.1] whitespace-nowrap shrink-0">
            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-neutral-400' : 'text-neutral-400'}`}>powered by</span>
            <span className="text-[11px] font-black text-[#FF6A00] uppercase tracking-widest">Autoryx AI</span>
          </span>
        </span>
        <div className={`hidden sm:block w-[1px] h-6 shrink-0 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} aria-hidden="true" />

        {/* Wake Word Toggle (Desktop) */}
        <label className="hidden sm:flex flex-col items-center gap-1 cursor-pointer group" title='Modo manos libres ("Oye Autoryx")'>
          <div className={`relative w-7 h-3.5 rounded-full p-0.5 transition-colors ${isWakeWordEnabled ? 'bg-[#FF6A00]' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
             <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${isWakeWordEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
          </div>
          <span className={`text-[8px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${isWakeWordEnabled ? 'text-[#FF6A00]' : 'text-neutral-400 group-hover:text-neutral-500'}`}>
             Oye Autoryx
          </span>
          <input type="checkbox" className="hidden" checked={isWakeWordEnabled} onChange={(e) => setIsWakeWordEnabled(e.target.checked)} />
        </label>
        
        {/* Wake Word Toggle (Mobile Fixed Bottom) */}
        <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-neutral-900 p-3 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center gap-2">
          <label className="flex items-center gap-3 cursor-pointer group" title='Modo manos libres'>
            <div className={`relative w-10 h-5 rounded-full p-0.5 transition-colors ${isWakeWordEnabled ? 'bg-[#FF6A00]' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isWakeWordEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${isWakeWordEnabled ? 'text-[#FF6A00]' : 'text-neutral-400'}`}>
               Oye Ultra
            </span>
            <input type="checkbox" className="hidden" checked={isWakeWordEnabled} onChange={(e) => setIsWakeWordEnabled(e.target.checked)} />
          </label>
        </div>

        <div className={`hidden sm:block w-[1px] h-6 shrink-0 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} aria-hidden="true" />

        {/* Accessible mic button */}
        <MicButton
          isActive={isActive}
          onClick={isActive ? resetAgent : startCapture}
        />
      </div>

      {/* ── Floating voice panel (premium, accessible) ── */}
      {isActive && (
        <VoiceStatusPanel
          turn={turn}
          statusText={statusText}
          options={voiceOptions}
          errorMsg={errorMsg}
          isDarkMode={isDarkMode}
          onOptionClick={handleOptionClick}
          onDismiss={resetAgent}
        />
      )}
    </>
  );
}