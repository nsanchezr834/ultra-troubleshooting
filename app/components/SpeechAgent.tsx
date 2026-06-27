'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Loader2, AlertCircle, X } from 'lucide-react';
import { TROUBLESHOOTING_DATABASE } from '@/config/troubleshooting-db';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
type AgentStep =
  | 'idle'
  | 'listening-symptom'
  | 'speaking-menu'
  | 'listening-selection'
  | 'speaking-resolution';

interface SpeechAgentProps {
  onMatchFault?: (symptom: string) => void;
  isDarkMode?: boolean;
}

// ─────────────────────────────────────────────
// UTILIDAD: SANITIZAR TRANSCRIPT
//
// FIX #4: Limpia el texto antes de búsqueda local Y antes de enviarlo a Gemini.
// La Web Speech API devuelve "Brazo congelado." con mayúscula y punto.
// Con temperature: 0.0 Gemini es literal — esta limpieza evita falsos negativos.
// ─────────────────────────────────────────────
function sanitizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar tildes
    .replace(/[.,;!?¿¡]/g, '')         // quitar puntuación
    .replace(/\s+/g, ' ')              // normalizar espacios
    .trim();
}

// ─────────────────────────────────────────────
// UTILIDAD: BÚSQUEDA FUZZY LOCAL
//
// FIX #2: El filtro era t.length > 3 (excluía palabras de 3 chars como
// "jam", "bin", "mal", "red"). Cambiado a t.length > 2 para incluirlas.
// Además se aplica sanitizeTranscript() tanto al query como al haystack.
// ─────────────────────────────────────────────
function localFuzzySearch(query: string): string[] {
  const clean = sanitizeTranscript(query);
  const tokens = clean
    .split(/\s+/)
    .filter(t => t.length > 2); // era > 3, ahora > 2

  if (tokens.length === 0) return [];

  const scored = TROUBLESHOOTING_DATABASE.map(entry => {
    const keywordsField = (entry as any).keywords || '';
    const haystack = sanitizeTranscript(entry.symptom + ' ' + keywordsField);
    const hits = tokens.filter(t => haystack.includes(t)).length;
    return { title: entry.symptom, score: hits };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(r => r.title);
}

const ECHO_SILENCE_MS = 1400;

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function SpeechAgent({ onMatchFault, isDarkMode = false }: SpeechAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [optionsMenu, setOptionsMenu] = useState<string[]>([]);
  const [step, setStep] = useState<AgentStep>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const stepRef = useRef<AgentStep>('idle');
  const setStepSafe = useCallback((s: AgentStep) => {
    stepRef.current = s;
    setStep(s);
  }, []);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakStartTimestampRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  const lastQueryRef = useRef<string>('');
  const matchesCountRef = useRef<number>(0);
  const selectedOptionRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const telemetrySentRef = useRef<boolean>(false);

  const sendTelemetry = useCallback(async (
    status: 'resolved' | 'no_matches' | 'abandoned' | 'retried',
    details?: { selectedOption?: string; matchesCount?: number; timeSpent?: number; queryText?: string }
  ) => {
    const query = details?.queryText || lastQueryRef.current;
    if (!query) return;
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          matches_count: details?.matchesCount ?? matchesCountRef.current,
          selected_option: details?.selectedOption ?? selectedOptionRef.current,
          time_spent_seconds: details?.timeSpent ?? 0,
          status,
        }),
      });
      telemetrySentRef.current = true;
    } catch (err) {
      console.error('Telemetry error:', err);
    }
  }, []);

  // ─────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      // FIX #1: Una sola instancia, nunca creamos dos.
      const rec = new SR();
      rec.lang = 'es-MX';
      rec.continuous = false;    // modo síntoma por defecto
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
    } else {
      setErrorMessage('Navegador no compatible con reconocimiento de voz.');
    }

    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  // STOP GLOBAL
  // FIX #1: Limpiamos handlers ANTES de abort para evitar
  // que onend reinicie el recognition de forma fantasma.
  // ─────────────────────────────────────────────
  const stopAll = useCallback(() => {
    isSpeakingRef.current = false;
    synthRef.current?.cancel();
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch (_) { }
    }
    setIsListening(false);
  }, []);

  // ─────────────────────────────────────────────
  // SÍNTESIS DE VOZ
  // ─────────────────────────────────────────────
  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    speakStartTimestampRef.current = Date.now();
    isSpeakingRef.current = true;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      onEnd?.();
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      onEnd?.();
    };

    synthRef.current.speak(utterance);
  }, []);

  // ─────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────
  const resetAgent = useCallback(() => {
    if (
      (stepRef.current === 'speaking-menu' || stepRef.current === 'listening-selection') &&
      !telemetrySentRef.current
    ) {
      sendTelemetry('abandoned');
    }
    stopAll();
    setStepSafe('idle');
    setStatusText('');
    setOptionsMenu([]);
  }, [stopAll, setStepSafe, sendTelemetry]);

  // ─────────────────────────────────────────────
  // PASO 4: EJECUTAR SELECCIÓN
  // Declarado antes de setupSelectionListener (dependencia directa).
  // ─────────────────────────────────────────────
  const executeSelection = useCallback((index: number, options: string[]) => {
    // Limpiar handlers antes de cualquier otra operación
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch (_) { }
    }
    setIsListening(false);

    const selectedTitle = options[index];
    const fault = TROUBLESHOOTING_DATABASE.find(t => t.symptom === selectedTitle);

    if (!fault) {
      speakText('No encontre detalles para esa opcion.', resetAgent);
      return;
    }

    setStepSafe('speaking-resolution');
    setStatusText(`Resolución: ${selectedTitle}`);
    onMatchFault?.(selectedTitle);

    selectedOptionRef.current = selectedTitle;
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    sendTelemetry('resolved', { selectedOption: selectedTitle, timeSpent });

    const speech = `Falla: ${fault.symptom}. Protocolo: ${fault.resolution_protocol}.`;
    speakText(speech, resetAgent);
  }, [speakText, resetAgent, setStepSafe, onMatchFault, sendTelemetry]);

  // ─────────────────────────────────────────────
  // PASO 3: SELECCIÓN CON BARGE-IN
  //
  // FIX #1 CORE: Esta función recibe el texto a hablar y coordina
  // INTERNAMENTE la secuencia: hablar → (onend) → arrancar recognition.
  // Esto elimina la race condition donde rec.start() se llamaba dos veces
  // simultáneamente (una desde aquí y otra desde onend del síntoma).
  //
  // FIX #3: continuous = true solo durante esta etapa.
  // ─────────────────────────────────────────────
  const setupSelectionListener = useCallback((currentOptions: string[], speechText: string) => {
    const rec = recognitionRef.current;
    if (!rec) return;

    setStepSafe('listening-selection');

    rec.continuous = true;
    rec.interimResults = true;

    const numberMap: Record<string, number> = {
      uno: 0, '1': 0, primera: 0,
      dos: 1, '2': 1, segunda: 1,
      tres: 2, '3': 2, tercera: 2,
    };
    const cancelWords = ['cancelar', 'parar', 'detener', 'salir', 'stop'];

    rec.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      if (!transcript || transcript.length < 2) return;

      // FIX #1: Filtro de eco por ventana temporal
      const timeSinceSpeakStart = Date.now() - speakStartTimestampRef.current;
      if (isSpeakingRef.current && timeSinceSpeakStart < ECHO_SILENCE_MS) {
        return;
      }

      if (cancelWords.some(w => transcript.includes(w))) {
        synthRef.current?.cancel();
        isSpeakingRef.current = false;
        speakText('Operacion cancelada.', resetAgent);
        return;
      }

      let matchedIndex = -1;
      for (const [word, idx] of Object.entries(numberMap)) {
        if (transcript.includes(word)) { matchedIndex = idx; break; }
      }

      if (matchedIndex === -1) {
        currentOptions.forEach((opt, idx) => {
          const optClean = sanitizeTranscript(opt).slice(0, 10);
          if (transcript.includes(optClean)) matchedIndex = idx;
        });
      }

      if (matchedIndex !== -1 && matchedIndex < currentOptions.length) {
        synthRef.current?.cancel();
        isSpeakingRef.current = false;
        executeSelection(matchedIndex, currentOptions);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      if (e.error === 'aborted') return;
      setErrorMessage(`Error de microfono: ${e.error}`);
    };

    rec.onend = () => {
      if (stepRef.current === 'listening-selection') {
        try { rec.start(); } catch (_) { }
      }
    };

    // FIX #1 CORE: Primero hablamos, LUEGO arrancamos el recognition
    // dentro del onend de la síntesis con setTimeout(0).
    // Esto garantiza que React haya procesado todos los setState
    // antes de que el recognition empiece a capturar audio.
    speakText(speechText, () => {
      if (stepRef.current === 'listening-selection') {
        setIsListening(true);
        setTimeout(() => {
          if (stepRef.current === 'listening-selection') {
            try { rec.start(); } catch (_) { }
          }
        }, 0);
      }
    });
  }, [speakText, resetAgent, setStepSafe, executeSelection]);

  // ─────────────────────────────────────────────
  // PASO 1: CAPTURA DEL SÍNTOMA INICIAL
  // ─────────────────────────────────────────────
  const startInitialCapture = useCallback(() => {
    if (!recognitionRef.current) return;
    stopAll();

    setStepSafe('listening-symptom');
    setStatusText('Escuchando tu descripcion...');
    setErrorMessage('');
    setIsListening(true);
    telemetrySentRef.current = false;
    selectedOptionRef.current = '';

    const rec = recognitionRef.current;
    rec.continuous = false;    // queremos UNA frase completa
    rec.interimResults = false;

    rec.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript.trim();
      if (!transcript) return;
      setStatusText(`Procesando: "${transcript}"`);
      setIsListening(false);
      processSymptom(transcript);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        try { rec.start(); } catch (_) { }
        return;
      }
      if (e.error === 'aborted') return;
      setErrorMessage(`Error: ${e.error}`);
      resetAgent();
    };

    // FIX #1: Con continuous = false, onend solo dispara cuando
    // el recognition se detiene SIN resultado (silencio). En ese
    // caso reiniciamos. Si hubo resultado, onresult ya lo manejó
    // y stepRef ya no es 'listening-symptom'.
    rec.onend = () => {
      if (stepRef.current === 'listening-symptom') {
        try { rec.start(); } catch (_) { }
      }
    };

    try { rec.start(); } catch (_) { }
  }, [stopAll, setStepSafe, resetAgent]);

  // ─────────────────────────────────────────────
  // PASO 2: BUSCAR COINCIDENCIAS
  //
  // FIX #4: sanitizeTranscript() antes de todo — local search Y Gemini.
  // FIX #1: setStepSafe('speaking-menu') ANTES del await para que
  //         el onend del síntoma no reinicie el recognition.
  // ─────────────────────────────────────────────
  const processSymptom = useCallback(async (rawTranscript: string) => {
    setLoading(true);
    // Salimos de listening-symptom ANTES del await para que
    // ningún onend fantasma intente reiniciar el recognition
    setStepSafe('speaking-menu');

    if (lastQueryRef.current && !telemetrySentRef.current && selectedOptionRef.current === '') {
      sendTelemetry('retried', { queryText: lastQueryRef.current });
    }

    const symptomText = sanitizeTranscript(rawTranscript); // FIX #4
    lastQueryRef.current = symptomText;
    telemetrySentRef.current = false;

    try {
      let matches = localFuzzySearch(symptomText);

      if (matches.length === 0) {
        const res = await fetch('/api/voice-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptom: symptomText }), // sanitizado
        });
        if (!res.ok) throw new Error('Error al conectar con la IA.');
        const data = await res.json();
        matches = data.coincidencias ?? [];
      }

      matchesCountRef.current = matches.length;

      if (matches.length === 0) {
        setStepSafe('speaking-resolution');
        setStatusText('No se encontraron fallas coincidentes.');
        speakText('No encontre fallas que coincidan. Intenta con otra descripcion.', resetAgent);
        sendTelemetry('no_matches', { queryText: symptomText, matchesCount: 0 });
        return;
      }

      setOptionsMenu(matches);
      startTimeRef.current = Date.now();

      let speech = `Encontre ${matches.length} ${matches.length === 1 ? 'opcion' : 'opciones'}. `;
      matches.forEach((title, i) => { speech += `Opcion ${i + 1}: ${title}. `; });
      speech += 'Di el numero de la opcion que deseas.';

      setStatusText('Selecciona o di el numero de opcion.');

      // FIX #1 CORE: setupSelectionListener coordina hablar → escuchar
      setupSelectionListener(matches, speech);

    } catch (err: any) {
      setErrorMessage(err.message ?? 'Error de conexion.');
      resetAgent();
    } finally {
      setLoading(false);
    }
  }, [speakText, resetAgent, setStepSafe, sendTelemetry, setupSelectionListener]);

  // ─────────────────────────────────────────────
  // UI — diseño idéntico al original
  // ─────────────────────────────────────────────
  const isActive = step !== 'idle';

  return (
    <>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4.5 z-20">
        <span className="hidden sm:inline-flex items-center gap-2 pointer-events-none select-none">
          <img src="/autoryx_badge_v2.svg" alt="Autoryx Logo" className="w-6 h-6 object-contain" />
          <span className="flex flex-col text-left leading-[1.1]">
            <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">powered by</span>
            <span className="text-[11px] font-black text-ultra-orange uppercase tracking-widest">Autoryx AI</span>
          </span>
        </span>

        <div className="hidden sm:block w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800" />

        <button
          onClick={isActive ? resetAgent : startInitialCapture}
          className={`relative p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-ultra-orange text-white hover:scale-105 shadow-md shadow-ultra-orange/20'
              : 'hover:bg-ultra-orange/5 dark:hover:bg-ultra-orange/10 text-ultra-orange'
            }`}
          title={isActive ? 'Cancelar diagnostico' : 'Iniciar diagnostico por voz'}
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

      {!isActive && (
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-[calc(100%+12px)] flex items-center gap-1.5 pointer-events-none select-none w-max z-10">
          <img src="/autoryx_badge_v2.svg" alt="Autoryx Logo" className="w-4 h-4 object-contain" />
          <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">powered by</span>
          <span className="text-[10px] font-black text-ultra-orange uppercase tracking-widest">Autoryx AI</span>
        </div>
      )}

      {isActive && (
        <div className={`absolute left-0 right-0 top-full mt-3 z-50 rounded-2xl p-5 shadow-2xl border backdrop-blur-md transition-all duration-300 ${isDarkMode
            ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
            : 'bg-white/95 border-neutral-200/80 text-neutral-800'
          }`}>
          <div className="flex items-center justify-between mb-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-emerald-400' : 'bg-ultra-orange'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-emerald-500' : 'bg-ultra-orange'}`}></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {step === 'listening-symptom' && 'Escuchando Sintoma'}
                {step === 'speaking-menu' && 'Presentando Opciones'}
                {step === 'listening-selection' && 'Esperando Seleccion'}
                {step === 'speaking-resolution' && 'Leyendo Resolucion'}
              </span>
            </div>
            <button onClick={resetAgent} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4">
            {loading ? (
              <Loader2 className="w-5 h-5 text-ultra-orange animate-spin flex-shrink-0 mt-0.5" />
            ) : isListening ? (
              <Mic className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5 animate-pulse" />
            ) : (
              <Volume2 className="w-5 h-5 text-ultra-orange flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium leading-relaxed">
              {statusText || 'Iniciando agente de voz...'}
            </p>
          </div>

          {optionsMenu.length > 0 && (
            <div className="space-y-2 mt-2">
              {optionsMenu.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    synthRef.current?.cancel();
                    isSpeakingRef.current = false;
                    executeSelection(i, optionsMenu);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-semibold transition-all duration-200 ${isDarkMode
                      ? 'bg-neutral-800/40 border-neutral-700/50 hover:bg-neutral-800 hover:border-ultra-orange'
                      : 'bg-neutral-50/70 border-neutral-200/60 hover:bg-white hover:border-ultra-orange hover:shadow-sm'
                    }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ultra-orange/10 dark:bg-ultra-orange/20 text-ultra-orange flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{option}</span>
                </button>
              ))}
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic mt-3 text-center">
                Di el numero de opcion o haz clic directamente
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}