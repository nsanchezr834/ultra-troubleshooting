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
import Fuse from 'fuse.js';
import { distance } from 'fastest-levenshtein';
import { logSearch } from '../lib/telemetry';
import { VoiceStatusPanel, MicButton, VoiceOption } from './ui';

function soundex(word: string): string {
  const w = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!w) return '';
  
  const firstLetter = w[0];
  const mapping: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };
  
  let code = firstLetter;
  let lastCode = mapping[firstLetter] || '0';
  
  for (let i = 1; i < w.length && code.length < 4; i++) {
    const c = mapping[w[i]] || '0';
    if (c !== '0' && c !== lastCode) {
      code += c;
      lastCode = c;
    } else if (c !== '0') {
      lastCode = c;
    }
  }
  
  return (code + '000').substring(0, 4);
}

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

function getShortTitle(entry: any): string {
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
function localFuzzySearch(query: string, knowledgeBase: any[]): any[] {
  const sanitizedQuery = sanitize(query);
  const queryWords = sanitizedQuery.split(' ').filter(w => w.length > 2);
  const querySoundex = queryWords.map(w => soundex(w));
  
  // 1. Fuse tradicional
  const fuse = new Fuse(knowledgeBase, {
    keys: ['title', 'symptom', 'keywords', 'id', 'resolution_protocol'],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });
  const fuseResults = fuse.search(sanitizedQuery);
  
  // 2. Soundex + Levenshtein — detecta variantes fonéticas
  const phoneticMatches: Array<{item: any, score: number}> = [];
  
  knowledgeBase.forEach(entry => {
    const entryWords = sanitize(entry.symptom).split(' ').filter(w => w.length > 2);
    const entrySoundex = entryWords.map(w => soundex(w));
    
    let soundexScore = 0;
    querySoundex.forEach(qsx => {
      if (entrySoundex.includes(qsx)) soundexScore += 1;
    });
    
    if (soundexScore > 0) {
      const levScores = queryWords.map(qw => {
        const minLev = Math.min(
          ...entryWords.map(ew => distance(qw, ew))
        );
        return minLev <= 2 ? (2 - minLev) / 2 : 0;
      });
      
      const avgLev = levScores.reduce((a, b) => a + b, 0) / queryWords.length;
      const phoneticScore = (soundexScore / querySoundex.length) * 0.7 + avgLev * 0.3;
      
      if (phoneticScore > 0.4) {
        phoneticMatches.push({ item: entry, score: phoneticScore });
      }
    }
  });
  
  // 3. Combinar: Fuse + Phonetic
  const combined = new Map<string, {item: any, score: number}>();
  
  fuseResults.slice(0, 5).forEach(r => {
    combined.set(r.item.id, { item: r.item, score: 1 - (r.score ?? 0) });
  });
  
  phoneticMatches.forEach(pm => {
    if (!combined.has(pm.item.id)) {
      combined.set(pm.item.id, pm);
    }
  });
  
  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(m => m.item);
}

// ───────────────────────────────────────────────────────────────────
// TIPOS
// ───────────────────────────────────────────────────────────────────
type Turn = 'idle' | 'machine-speaking' | 'user-speaking' | 'processing';

interface SpeechAgentProps {
  onMatchFault?: (symptom: string) => void;
  isDarkMode?: boolean;
  knowledgeBase?: any[];
}

// ───────────────────────────────────────────────────────────────────
// COMPONENTE
// ───────────────────────────────────────────────────────────────────
export default function SpeechAgent({ onMatchFault, isDarkMode = false, knowledgeBase = [] }: SpeechAgentProps) {
  const [turn, setTurn] = useState<Turn>('idle');
  const [statusText, setStatusText] = useState('');
  const [optionsMenu, setOptionsMenu] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);

  const turnRef = useRef<Turn>('idle');
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recRef = useRef<any>(null);
  const wakeWordRecRef = useRef<any>(null);
  const optionsRef = useRef<any[]>([]);

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
    if (!synth) {
      onEnd();
      return;
    }
    synth.cancel();
    setTurnSafe('machine-speaking');

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = 1.25;
    u.pitch = 1.0;

    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      onEnd();
    };

    u.onend = finish;
    u.onerror = finish;

    synth.speak(u);

    // Fallback de seguridad: si el motor de voz del navegador falla en disparar los eventos
    // (común en móviles), calculamos el tiempo de lectura (aprox 75ms por letra + 2s base)
    const estimatedTimeout = Math.max(2000, text.length * 75 + 1500);
    setTimeout(() => {
      if (!ended) {
        console.warn('SpeechSynthesis timeout disparado. Avanzando forzosamente.');
        finish();
      }
    }, estimatedTimeout);
  }, []);

  // ─────────────────────────────────────────────
  // ESCUCHAR — el usuario toma el turno
  // El mic solo se abre aquí, NUNCA mientras la máquina habla
  // ─────────────────────────────────────────────
  const listenOnce = useCallback((
    onResult: (transcripts: string[]) => void,
    label: string,
    grammarType?: 'selection'
  ) => {
    const rec = recRef.current;
    if (!rec) return;

    const SGL = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    if (grammarType === 'selection' && SGL) {
      const nums = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'cancelar', 'salir', 'parar', 'ninguna'];
      const grammarString = `#JSGF V1.0; grammar sel; public <sel> = ${nums.join(' | ')};`;
      const list = new SGL();
      list.addFromString(grammarString, 1);
      try { rec.grammars = list; } catch (e) { console.error('Error setting grammars:', e); }
    } else if (SGL) {
      try { rec.grammars = new SGL(); } catch (e) { console.error('Error clearing grammars:', e); }
    }

    rec.interimResults = true;
    rec.maxAlternatives = 5;

    setTurnSafe('user-speaking');
    setStatusText(label);

    rec.onresult = (e: any) => {
      // FIX #1: GUARDAR ESTADO EN LISTENERS
      if (turnRef.current !== 'user-speaking') return;

      // 2. Interim Results UI
      const interim = Array.from(e.results)
        .filter((r: any) => !r.isFinal)
        .map((r: any) => r[0].transcript)
        .join('');
      if (interim) {
        setStatusText(`🎙️ ${interim}...`);
      }

      // Check for final result
      const finalResult: any = Array.from(e.results).find((r: any) => r.isFinal);
      if (finalResult) {
        // 1. Confidence threshold
        if (finalResult[0].confidence < 0.35) { // 0.35 threshold is more realistic for noisy environments
          speak('No te escuché bien. ¿Puedes repetirlo?', () => listenOnce(onResult, label, grammarType));
          return;
        }
        
        // FIX #2: FORZAR rec.stop() EXPLÍCITO
        try { rec.stop(); } catch (err) {}

        // 4. Max Alternatives
        const alts = [];
        for (let i = 0; i < finalResult.length; i++) {
          const t = finalResult[i].transcript?.trim();
          if (t) alts.push(t);
        }
        
        if (alts.length > 0) {
          onResult(alts);
        }
      }
    };

    rec.onerror = (e: any) => {
      // FIX #1: GUARDAR ESTADO EN LISTENERS
      if (turnRef.current !== 'user-speaking') return;

      if (e.error === 'no-speech') {
        try { rec.start(); } catch (_) { }
        return;
      }
      if (e.error === 'aborted') return;
      setErrorMsg(`Micrófono: ${e.error}`);
      resetAgent();
    };

    rec.onend = () => {};

    try { rec.start(); } catch (_) { }
  }, [resetAgent]);

  const playPing = useCallback((onEnd?: () => void) => {
    let endedCalled = false;
    const finish = () => {
      if (endedCalled) return;
      endedCalled = true;
      if (onEnd) onEnd();
    };

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        finish();
        return;
      }
      const ctx = new AudioContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.log);
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.onended = () => {
        ctx.close().catch(console.error);
        finish();
      };
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);

      // Fallback in case AudioContext is suspended and never fires onended
      setTimeout(() => {
        if (ctx.state !== 'closed') {
          ctx.close().catch(console.error);
        }
        finish();
      }, 300);
    } catch (e) {
      console.log('No se pudo reproducir el ping:', e);
      finish();
    }
  }, []);

  // ─────────────────────────────────────────────
  // PASO 1 — capturar síntoma del operario
  // ─────────────────────────────────────────────
  const startCapture = useCallback(() => {
    if (!recRef.current) return;
    hardStop();
    setErrorMsg('');
    optionsRef.current = [];
    setOptionsMenu([]);
    setTurnSafe('user-speaking');

    // Usamos el callback del ping para iniciar el mic justo cuando termina el sonido
    playPing(() => {
      listenOnce(processSymptom, '🎙️ Describe el problema...');
    });
  }, [hardStop, listenOnce, playPing]);

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
      if (isWakeWordEnabled && turnRef.current === 'idle') {
         console.log('🔄 [WakeWord] Reiniciando tras error no fatal en 1s...');
         setTimeout(() => {
           try { wakeRec.start(); } catch (err) { }
         }, 1000);
      }
    };

    wakeRec.onend = () => {
      console.log('🏁 [WakeWord] onend disparado (el micrófono se apagó).');
      if (isWakeWordEnabled && turnRef.current === 'idle') {
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
  const processSymptom = useCallback(async (transcripts: string[]) => {
    let rawText = transcripts[0];

    // 6. Memoria a corto plazo (Contexto)
    const lastSymptom = sessionStorage.getItem('ultra_last_symptom');
    const isContextualRef = ['lo mismo', 'sigue fallando', 'igual', 'no se arregla', 'otra vez', 'el mismo'].some(w => rawText.toLowerCase().includes(w));
    
    if (isContextualRef && lastSymptom) {
      rawText = lastSymptom;
    } else {
      sessionStorage.setItem('ultra_last_symptom', rawText);
    }

    setTurnSafe('processing');
    setStatusText(`Buscando: "${rawText}"`);
    lastQueryRef.current = sanitize(rawText);

    let matches = localFuzzySearch(rawText, knowledgeBase);

    const debugInfo = {
      rawTranscript: rawText,
      sanitized: lastQueryRef.current,
      soundexTokens: lastQueryRef.current.split(' ').map(w => `${w}→${soundex(w)}`),
      fuzzyMatches: matches.length
    };
    console.log('🔍 [Phonetic Search]', JSON.stringify(debugInfo, null, 2));

    if (matches.length === 0) {
      try {
        // FIX #3: ABORTAR FETCH CON TIMEOUT
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('/api/voice-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptom: sanitize(rawText) }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const titles: string[] = data.coincidencias ?? [];
          matches = knowledgeBase.filter(e => titles.includes(e.symptom));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('Gemini fetch timeout');
          speak('No pude conectar. Intenta de nuevo.', resetAgent);
          return;
        }
      }
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
  const processSelection = useCallback((transcripts: string[]) => {
    setTurnSafe('processing');
    const opts = optionsRef.current;

    const numberMap: Record<string, number> = {
      uno: 0, '1': 0, primera: 0, primero: 0,
      dos: 1, '2': 1, segunda: 1, segundo: 1,
      tres: 2, '3': 2, tercera: 2, tercero: 2,
    };

    let idx = -1;
    let cancel = false;

    // 4. Evaluar múltiples alternativas
    for (const rawText of transcripts) {
      const t = sanitize(rawText);
      const tokens = t.split(' ').filter(Boolean);

      // ¿Cancelar?
      if (['cancelar', 'parar', 'salir', 'stop', 'ninguna', 'ninguno'].some(w => tokens.includes(w))) {
        cancel = true;
        break;
      }

      // ¿Número?
      for (const [word, i] of Object.entries(numberMap)) {
        if (tokens.includes(word)) { idx = i; break; }
      }
      if (idx !== -1) break;

      // ¿Nombre parcial?
      opts.forEach((opt, i) => {
        const short = sanitize(getShortTitle(opt));
        const importantTokens = tokens.filter(w => w.length > 1 || /^[A-Z0-9]+$/i.test(w));
        if (importantTokens.some(w => short.includes(w))) idx = i;
      });
      if (idx !== -1) break;
    }

    if (cancel) {
      logSearch({
        query: lastQueryRef.current,
        matches_count: opts.length,
        status: 'abandoned',
        source: 'speech_agent'
      });
      speak('De acuerdo, cancelado.', resetAgent);
      return;
    }

    if (idx !== -1 && idx < opts.length) {
      readResolution(opts[idx]);
    } else {
      speak(
        'No entendí la selección. Di el número de la opción que quieres.',
        () => listenOnce(processSelection, '🎙️ Di el número de opción...', 'selection')
      );
    }
  }, [speak, listenOnce, resetAgent]);

  // ─────────────────────────────────────────────
  // PASO 5 — post resolución: ¿otra falla o terminar?
  // ─────────────────────────────────────────────
  const handlePostResolution = useCallback((transcripts: string[]) => {
    let yes = false, no = false;
    for (const rawText of transcripts) {
      const t = sanitize(rawText);
      if (['si', 'sí', 'otra', 'otro', 'quiero', 'ayuda', 'problema'].some(w => t.includes(w))) yes = true;
      if (['no', 'listo', 'gracias', 'terminar', 'salir', 'ya'].some(w => t.includes(w))) no = true;
    }

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
  const handleFeedbackResponse = useCallback((transcripts: string[]) => {
    let solved = false, notSolved = false;
    for (const rawText of transcripts) {
      const t = sanitize(rawText);
      if (['si', 'sí', 'correcto', 'funciono', 'funciona', 'resuelto', 'bien', 'util', 'sirvio'].some(w => t.includes(w))) solved = true;
      if (['no', 'fallo', 'mal', 'incorrecto', 'tampoco', 'toda', 'nada', 'sirve'].some(w => t.includes(w))) notSolved = true;
    }

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
  const readResolution = useCallback((entry: any) => {
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
    const steps = String(entry.resolution_protocol || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && s !== '.' && s !== '-');

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
        listenOnce((transcripts: string[]) => {
          const t = sanitize(transcripts[0] || '');
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
      {/* ── Botón micrófono (Desktop only, SearchBar has its own for mobile) ── */}
      <div className="hidden sm:flex absolute right-4 top-[34px] -translate-y-1/2 items-center z-20">
        <MicButton
          isActive={isActive}
          onClick={isActive ? resetAgent : startCapture}
        />
      </div>

      {/* ── Nuevo Activador Oye Autoryx (Badge Animado Radar) ── */}
      <div className="relative mt-8 sm:mt-10 flex flex-col items-center w-full">
        {/* Instruction Card (shows when active but idle) */}
        {isWakeWordEnabled && turn === 'idle' && (
          <div className={`absolute -top-14 animate-[fadeSlideDown_0.3s_ease-out] flex items-center gap-2.5 px-4 py-2 rounded-2xl shadow-xl z-20 whitespace-nowrap text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-neutral-800 text-neutral-200 shadow-black/50 border border-neutral-700' : 'bg-white text-neutral-700 shadow-neutral-200/50 border border-neutral-100'}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6A00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6A00]"></span>
            </span>
            <span>Para iniciar, di <strong className="text-[#FF6A00] font-black">"Oye Ultra"</strong></span>
            
            {/* Tooltip pointer */}
            <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-b border-r ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-100'}`} />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (!isWakeWordEnabled) {
              try {
                // Unlock SpeechSynthesis on first user gesture
                const u = new SpeechSynthesisUtterance('');
                u.volume = 0;
                window.speechSynthesis.speak(u);
              } catch (e) {}
            }
            setIsWakeWordEnabled(!isWakeWordEnabled);
          }}
          className="flex flex-col items-center gap-1 cursor-pointer group outline-none"
          title='Activar asistente por voz'
          aria-pressed={isWakeWordEnabled}
        >
          <div className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-300 ${isWakeWordEnabled ? 'bg-[#FF6A00]/15 shadow-[0_0_20px_rgba(255,106,0,0.4)]' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
            {/* Orange Radar Effect (when inactive) */}
            {!isWakeWordEnabled && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-[#FF6A00] opacity-75 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute inset-0 rounded-full border-2 border-[#FF6A00] opacity-75 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_1s_infinite]" />
              </>
            )}
            {/* Logo */}
            <img 
              src="/autoryx_badge_v2.svg" 
              alt="Autoryx AI" 
              className={`w-10 h-10 sm:w-9 sm:h-9 object-contain transition-all duration-300 relative z-10 ${isWakeWordEnabled ? 'scale-[1.15] drop-shadow-md' : 'scale-100'} ${isDarkMode ? 'invert opacity-80' : ''}`}
            />
          </div>
          <div className="flex flex-col items-center leading-none mt-1">
             <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>powered by</span>
             <span className="text-[10px] sm:text-[11px] font-black text-[#FF6A00] uppercase tracking-widest mt-0.5">Autoryx AI</span>
          </div>
        </button>
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