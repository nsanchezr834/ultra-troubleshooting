'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
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
// UTILIDAD: BÚSQUEDA FUZZY LOCAL
// ─────────────────────────────────────────────
function localFuzzySearch(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .split(/\s+/)
    .filter(t => t.length > 3); // ignora artículos cortos

  if (tokens.length === 0) return [];

  const scored = TROUBLESHOOTING_DATABASE.map(entry => {
    const keywordsField = (entry as any).keywords || '';
    const haystack = (entry.symptom + ' ' + keywordsField).toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const hits = tokens.filter(t => haystack.includes(t)).length;
    return { title: entry.symptom, score: hits };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // máximo 3 opciones
    .map(r => r.title);
}

const ECHO_SILENCE_MS = 1200;

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
  const setStepSafe = (s: AgentStep) => {
    stepRef.current = s;
    setStep(s);
  };

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakStartTimestampRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // ── REFERENCIAS DE TELEMETRÍA ──
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
      console.error('Failed to send telemetry:', err);
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
      const rec = new SR();
      rec.lang = 'es-MX';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
    } else {
      setErrorMessage('Navegador no compatible con reconocimiento de voz.');
    }

    return () => stopAll();
  }, []);

  // ─────────────────────────────────────────────
  // STOP GLOBAL
  // ─────────────────────────────────────────────
  const stopAll = useCallback(() => {
    isSpeakingRef.current = false;
    synthRef.current?.cancel();
    try { recognitionRef.current?.abort(); } catch (_) {}
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
    // Si se cancela/cierra mientras se sugerían opciones sin elegir
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
  }, [stopAll, sendTelemetry]);

  // ─────────────────────────────────────────────
  // PASO 1: CAPTURA DEL SÍNTOMA INICIAL
  // ─────────────────────────────────────────────
  const startInitialCapture = useCallback(() => {
    if (!recognitionRef.current) return;
    stopAll();
    setStepSafe('listening-symptom');
    setStatusText('Escuchando tu descripción...');
    setErrorMessage('');
    setIsListening(true);
    telemetrySentRef.current = false;
    selectedOptionRef.current = '';

    const rec = recognitionRef.current;

    rec.onresult = async (event: any) => {
      const result = event.results[event.results.length - 1];
      if (!result.isFinal) return;

      const transcript: string = result[0].transcript.trim();
      if (!transcript) return;

      setStatusText(`Procesando: "${transcript}"`);
      rec.abort();
      setIsListening(false);
      await processSymptom(transcript);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      setErrorMessage(`Error: ${e.error}`);
      resetAgent();
    };

    rec.onend = () => {
      if (stepRef.current === 'listening-symptom') {
        try { rec.start(); } catch (_) {}
      }
    };

    rec.start();
  }, [stopAll, resetAgent]);

  // ─────────────────────────────────────────────
  // PASO 2: BUSCAR COINCIDENCIAS
  // ─────────────────────────────────────────────
  const processSymptom = useCallback(async (symptomText: string) => {
    setLoading(true);
    
    // Si ya teníamos una búsqueda anterior activa y el usuario vuelve a buscar sin resolver, es un reintento
    if (lastQueryRef.current && !telemetrySentRef.current && selectedOptionRef.current === '') {
      sendTelemetry('retried', { queryText: lastQueryRef.current });
    }

    lastQueryRef.current = symptomText;
    telemetrySentRef.current = false;

    try {
      let matches = localFuzzySearch(symptomText);

      if (matches.length === 0) {
        const res = await fetch('/api/voice-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptom: symptomText }),
        });
        if (!res.ok) throw new Error('Error al conectar con la IA.');
        const data = await res.json();
        matches = data.coincidencias ?? [];
      }

      matchesCountRef.current = matches.length;

      if (matches.length === 0) {
        setStepSafe('speaking-resolution');
        setStatusText('No se encontraron fallas coincidentes.');
        speakText('No encontré fallas que coincidan. Intenta con otra descripción.', resetAgent);
        sendTelemetry('no_matches', { queryText: symptomText, matchesCount: 0 });
        return;
      }

      setOptionsMenu(matches);
      setStepSafe('speaking-menu');
      startTimeRef.current = Date.now();

      let speech = `Encontré ${matches.length} ${matches.length === 1 ? 'opción' : 'opciones'}. `;
      matches.forEach((title, i) => { speech += `Opción ${i + 1}: ${title}. `; });
      speech += 'Di el número de la opción que deseas.';

      setStatusText('Selecciona o di el número de opción.');

      setupSelectionListener(matches);
      speakText(speech);
    } catch (err: any) {
      setErrorMessage(err.message ?? 'Error de conexión.');
      resetAgent();
    } finally {
      setLoading(false);
    }
  }, [speakText, resetAgent, sendTelemetry]);

  // ─────────────────────────────────────────────
  // PASO 3: SELECCIÓN (BARGE-IN)
  // ─────────────────────────────────────────────
  const setupSelectionListener = useCallback((currentOptions: string[]) => {
    const rec = recognitionRef.current;
    if (!rec) return;

    setStepSafe('listening-selection');
    setIsListening(true);

    rec.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      if (!transcript || transcript.length < 2) return;

      const timeSinceSpeakStart = Date.now() - speakStartTimestampRef.current;
      if (isSpeakingRef.current && timeSinceSpeakStart < ECHO_SILENCE_MS) {
        return;
      }

      const numberMap: Record<string, number> = {
        uno: 0, '1': 0, primera: 0,
        dos: 1, '2': 1, segunda: 1,
        tres: 2, '3': 2, tercera: 2,
      };
      const cancelWords = ['cancelar', 'parar', 'detener', 'salir', 'stop'];

      if (cancelWords.some(w => transcript.includes(w))) {
        synthRef.current?.cancel();
        isSpeakingRef.current = false;
        speakText('Operación cancelada.', resetAgent);
        return;
      }

      let matchedIndex = -1;
      for (const [word, idx] of Object.entries(numberMap)) {
        if (transcript.includes(word)) { matchedIndex = idx; break; }
      }

      if (matchedIndex === -1) {
        currentOptions.forEach((opt, idx) => {
          if (transcript.includes(opt.toLowerCase().slice(0, 8))) {
            matchedIndex = idx;
          }
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
      setErrorMessage(`Error de micrófono: ${e.error}`);
    };

    rec.onend = () => {
      if (stepRef.current === 'listening-selection') {
        try { rec.start(); } catch (_) {}
      }
    };

    try { rec.start(); } catch (_) {}
  }, [speakText, resetAgent]);

  // ─────────────────────────────────────────────
  // PASO 4: EJECUTAR SELECCIÓN
  // ─────────────────────────────────────────────
  const executeSelection = useCallback((index: number, options: string[]) => {
    const selectedTitle = options[index];
    const fault = TROUBLESHOOTING_DATABASE.find(t => t.symptom === selectedTitle);

    if (!fault) {
      speakText('No encontré detalles para esa opción.', resetAgent);
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
  }, [speakText, resetAgent, onMatchFault, sendTelemetry]);

  // ─────────────────────────────────────────────
  // DISEÑO PREMIUM INTEGRADO EN EL INPUT
  // ─────────────────────────────────────────────
  const isActive = step !== 'idle';

  return (
    <>
      {/* Botón e indicador integrado */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4.5 z-20">
        {/* Leyenda powered by Autoryx AI */}
        <span className="hidden sm:inline-flex items-center gap-2 pointer-events-none select-none">
          <img src="/autoryx_badge_v2.svg" alt="Autoryx Logo" className="w-6 h-6 object-contain" />
          <span className="flex flex-col text-left leading-[1.1]">
            <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">powered by</span>
            <span className="text-[11px] font-black text-ultra-orange uppercase tracking-widest">Autoryx AI</span>
          </span>
        </span>

        {/* Separador sutil */}
        <div className="hidden sm:block w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800" />

        {/* Botón de Micrófono */}
        <button
          onClick={isActive ? resetAgent : startInitialCapture}
          className={`relative p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
            isActive 
              ? 'bg-ultra-orange text-white hover:scale-105 shadow-md shadow-ultra-orange/20' 
              : 'hover:bg-ultra-orange/5 dark:hover:bg-ultra-orange/10 text-ultra-orange'
          }`}
          title={isActive ? "Cancelar diagnóstico" : "Iniciar diagnóstico por voz"}
        >
          {isActive ? (
            <div className="relative">
              {/* Onda de pulso premium cuando está activo */}
              <span className="absolute inline-flex h-full w-full rounded-xl bg-ultra-orange opacity-75 animate-ping -left-0 -top-0 scale-150 pointer-events-none" />
              <X className="w-5.5 h-5.5 relative z-10" />
            </div>
          ) : (
            <Mic className="w-5.5 h-5.5 text-ultra-orange" />
          )}
        </button>
      </div>

      {/* Panel flotante de estado y opciones (Glassmorphism) */}
      {isActive && (
        <div className={`absolute left-0 right-0 top-full mt-3 z-50 rounded-2xl p-5 shadow-2xl border backdrop-blur-md transition-all duration-300 ${
          isDarkMode
            ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
            : 'bg-white/95 border-neutral-200/80 text-neutral-800'
        }`}>
          {/* Header del Panel */}
          <div className="flex items-center justify-between mb-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-emerald-400' : 'bg-ultra-orange'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-emerald-500' : 'bg-ultra-orange'}`}></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {step === 'listening-symptom' && 'Escuchando Síntoma'}
                {step === 'speaking-menu' && 'Presentando Opciones'}
                {step === 'listening-selection' && 'Esperando Selección'}
                {step === 'speaking-resolution' && 'Leyendo Resolución'}
              </span>
            </div>
            <button 
              onClick={resetAgent}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Estado de texto principal */}
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

          {/* Menú de opciones */}
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
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-semibold transition-all duration-200 ${
                    isDarkMode
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
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500 italic mt-3 flex items-center gap-1 justify-center">
                <span>💡 Di el número de opción o haz clic directamente</span>
              </div>
            </div>
          )}

          {/* Errores */}
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

