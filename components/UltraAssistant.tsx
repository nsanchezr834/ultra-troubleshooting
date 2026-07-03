"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWakeWord } from "@/hooks/useWakeWord";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { TROUBLESHOOTING_DATABASE } from "@/config/troubleshooting-db";

export function UltraAssistant() {
  const { 
    isListening, 
    wakeWordDetected, 
    startListening, 
    stopListening, 
    resetDetection,
    error: wakeWordError 
  } = useWakeWord();

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [contextMatches, setContextMatches] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [lastTelemetryId, setLastTelemetryId] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const isProcessingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sleepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const transcriberReadyRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const resetSleepTimer = useCallback(() => {
    if (sleepTimeoutRef.current) {
      clearTimeout(sleepTimeoutRef.current);
    }
    sleepTimeoutRef.current = setTimeout(() => {
      console.warn("[MAIN] 5 minutos de inactividad. Apagando Ultra...");
      setIsAsleep(true);
      stopListening();
    }, 300000);
  }, [stopListening]);

  useEffect(() => {
    resetSleepTimer();
    return () => {
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    };
  }, [resetSleepTimer]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const triggerError = (msg: string) => {
    console.error(msg);
    setHasError(true);
    setTimeout(() => setHasError(false), 4000);
  };

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url));
    workerRef.current.postMessage({ type: 'PRELOAD_MODEL' });
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.onmessage = (e) => {
      const { type, data, text, message } = e.data;
      if (type === 'INIT_MODEL') {
        setDownloadProgress(0);
      } else if (type === 'DOWNLOAD_PROGRESS') {
        setDownloadProgress(Math.round(data.progress));
      } else if (type === 'MODEL_READY') {
        setDownloadProgress(null);
        transcriberReadyRef.current = true;
      } else if (type === 'TRANSCRIPT') {
        if (text?.trim()) {
          handleProcessQuery(text.trim());
        } else {
          triggerError("No entendí.");
          setIsProcessing(false);
          resetDetection();
          setTimeout(() => startListening(), 500);
        }
      } else if (type === 'ERROR') {
        triggerError(message || "Error procesando.");
        setIsProcessing(false);
        resetDetection();
        setTimeout(() => startListening(), 500);
      }
    };
  });

  const startDictation = async () => {
    resetSleepTimer();
    console.warn("[MAIN] startDictation llamado!");

    if (!transcriberReadyRef.current || !workerRef.current) {
      triggerError("Aún estoy despertando, dame unos segundos...");
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("Todavía estoy cargando, dame un momento.");
        u.lang = 'es-ES';
        window.speechSynthesis.speak(u);
      }
      resetDetection();
      setTimeout(() => startListening(), 1500);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      setIsDictating(true);
      
      const vadContext = new window.AudioContext();
      const source = vadContext.createMediaStreamSource(stream);
      const analyser = vadContext.createAnalyser();
      analyser.minDecibels = -45;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = performance.now();
      let hasSpoken = false;
      let vadAnimationId: number;

      const checkSilence = () => {
        if (recorder.state === 'inactive') return;
        analyser.getByteFrequencyData(dataArray);
        const isSpeaking = dataArray.some(val => val > 0);
        
        if (isSpeaking) {
          hasSpoken = true;
          silenceStart = performance.now();
        } else if (hasSpoken && performance.now() - silenceStart > 1500) {
           recorder.stop();
           return;
        } else if (!hasSpoken && performance.now() - silenceStart > 7000) {
           recorder.stop();
           return;
        }
        vadAnimationId = requestAnimationFrame(checkSilence);
      };

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        setIsDictating(false);
        cancelAnimationFrame(vadAnimationId);
        vadContext.close().catch(() => {});
        
        if (!hasSpoken) {
           triggerError("No detecté tu voz.");
           stream.getTracks().forEach(t => t.stop());
           resetDetection();
           setTimeout(() => startListening(), 500);
           return;
        }

        setIsProcessing(true);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const decodeContext = new window.AudioContext({ sampleRate: 16000 });
          const audioBuffer = await decodeContext.decodeAudioData(arrayBuffer);
          const float32Data = audioBuffer.getChannelData(0);
          
          workerRef.current?.postMessage({ type: 'TRANSCRIBE', audioData: float32Data });
        } catch (err: any) {
          triggerError(err.message || "Error procesando.");
          setIsProcessing(false);
          resetDetection();
          setTimeout(() => startListening(), 500);
        }
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      checkSilence();
    } catch (err) {
      triggerError("Error al iniciar grabación.");
    }
  };

  const stopDictation = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (wakeWordDetected) {
      resetSleepTimer();
      const beep = new Audio("/beep.mp3");
      beep.play().catch(() => {});
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(messages.length > 0 ? "Te escucho..." : "¿En qué te puedo ayudar?");
        utterance.lang = 'es-ES';
        const checkSpeakingGreeting = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkSpeakingGreeting);
            startDictation();
          }
        }, 1000);
        utterance.onend = () => { clearInterval(checkSpeakingGreeting); startDictation(); };
        window.speechSynthesis.speak(utterance);
      } else {
        startDictation();
      }
    }
  }, [wakeWordDetected, resetSleepTimer]);

  const handleProcessQuery = async (text: string) => {
    resetSleepTimer();
    const userText = text.trim();
    const lowerText = userText.toLowerCase();

    if (lowerText.includes("cancelar") || lowerText.includes("cancela")) {
        setMessages([]);
        setContextMatches(null);
        setLastTelemetryId(null);
        setIsFallbackMode(false);
        resetDetection();
        startListening();
        return;
    }

    // Interceptar feedback si la IA acaba de preguntar si resolvió el problema
    if (lastTelemetryId && (lowerText === "sí" || lowerText === "si" || lowerText === "no" || lowerText === "simón" || lowerText === "simon" || lowerText === "negativo" || lowerText.includes("si me sirvió") || lowerText.includes("no me sirvió"))) {
      const userFeedback = lowerText.includes("sí") || lowerText.includes("si") || lowerText.includes("simón") || lowerText.includes("simon") || lowerText.includes("sirvió");
      
      fetch("/api/telemetry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lastTelemetryId, user_feedback: userFeedback })
      }).catch(err => console.error("Error updating telemetry:", err));

      setMessages(prev => [...prev, { role: 'user', content: userText }, { role: 'assistant', content: "Gracias." }]);
      setLastTelemetryId(null);
      setIsFallbackMode(false);
      
      const closePopup = () => {
          setTimeout(() => {
              setMessages([]);
              setContextMatches(null);
              resetDetection();
              startListening(); // Mantener wake word activo pero cerrar popup
              resetSleepTimer();
          }, 1500); // Dar un segundo para leer "Gracias"
      };

      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const utterance = new SpeechSynthesisUtterance("Gracias.");
         utterance.lang = 'es-ES';
         utterance.onend = closePopup;
         window.speechSynthesis.speak(utterance);
      } else {
         closePopup();
      }
      return;
    }

    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setIsProcessing(true);

    if (isFallbackMode) {
      setTimeout(() => {
        const words = lowerText.split(/\s+/).filter(w => w.length > 3);
        const candidates = contextMatches ? contextMatches : TROUBLESHOOTING_DATABASE;
        
        const results = candidates.map(item => {
            const keywords = (item.keywords || '').toLowerCase();
            let hits = 0;
            words.forEach(w => { if(keywords.includes(w)) hits++; });
            return { ...item, hits };
        }).filter(item => item.hits > 0).sort((a: any, b: any) => b.hits - a.hits);

        let responseText = "";
        let newMatches = null;
        let expectingAnswer = true;

        if (results.length > 5) {
            responseText = `Encontré varias opciones. Necesito que seas más específico. ¿Se trata de un problema de ${results[0].symptom}, o ${results[1].symptom}?`;
            newMatches = results;
        } else if (results.length > 1) {
            responseText = `Encontré algunas opciones. ¿Es un problema de ${results[0].symptom}, o ${results[1].symptom}?`;
            newMatches = results;
        } else if (results.length === 1) {
            responseText = `${results[0].resolution_protocol}. ¿Resolvió esto tu problema? Responde sí o no.`;
            newMatches = null;
            
            // Log to telemetry to allow feedback loop
            fetch("/api/telemetry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: lowerText,
                    matches_count: 1,
                    selected_option: results[0].resolution_protocol.substring(0, 50) + "...",
                    time_spent_seconds: 1,
                    status: 'RESUELTO',
                    source: 'VOZ (FALLBACK)',
                    operator_name: 'Fallback Mode',
                    ai_response: responseText
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.data && data.data.length > 0) {
                    setLastTelemetryId(data.data[0].id);
                }
            })
            .catch(err => console.error("Error logging fallback telemetry:", err));
        } else {
            responseText = "No encontré coincidencias. Intenta dictarme palabras clave distintas o más específicas.";
            newMatches = contextMatches;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        setContextMatches(newMatches);
        setIsProcessing(false);

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(responseText);
          utterance.lang = 'es-ES';
          const checkSpeaking = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              clearInterval(checkSpeaking);
              if (expectingAnswer) startDictation();
            }
          }, 1000);
          utterance.onend = () => {
            clearInterval(checkSpeaking);
            if (expectingAnswer) startDictation();
            else { resetDetection(); startListening(); resetSleepTimer(); }
          };
          window.speechSynthesis.speak(utterance);
        } else {
          startDictation();
        }
      }, 500);
      return;
    }

    try {
      const res = await fetch("/api/ultra/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText, history: messages, contextMatches: contextMatches }),
      });
      
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.matches !== undefined) setContextMatches(data.matches);
      if (data.telemetryId) setLastTelemetryId(data.telemetryId);

      const isExpectingAnswer = (!data.response.includes("Operación cancelada") && newMessages.filter(m => m.role === 'user').length < 10) || data.response.includes("¿Resolvió esto tu problema?");

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = 'es-ES';
        const checkSpeaking = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkSpeaking);
            if (isExpectingAnswer) startDictation();
          }
        }, 1000);
        utterance.onend = () => {
          clearInterval(checkSpeaking);
          if (isExpectingAnswer) startDictation();
          else { resetDetection(); startListening(); resetSleepTimer(); }
        };
        window.speechSynthesis.speak(utterance);
      } else {
        if (isExpectingAnswer) startDictation();
        else { resetDetection(); startListening(); resetSleepTimer(); }
      }
    } catch (err: any) {
      triggerError(`API Error: ${err.message}`);
      setMessages(prev => [...prev, { role: 'assistant', content: "Necesito que seas más específico." }]);
      setIsFallbackMode(true);
      setIsProcessing(false);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Necesito que seas más específico.");
        utterance.lang = 'es-ES';
        const checkSpeaking = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkSpeaking);
            startDictation();
          }
        }, 1000);
        utterance.onend = () => { clearInterval(checkSpeaking); startDictation(); };
        window.speechSynthesis.speak(utterance);
      } else {
        startDictation();
      }

      resetSleepTimer();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-4">
      {(wakeWordDetected || messages.length > 0 || isProcessing) && (
        <div className="bg-[#0c0d14]/80 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,90,0,0.15)] rounded-3xl p-5 w-80 border border-[#FF5A00]/20 transition-all duration-300 transform origin-bottom-right flex flex-col max-h-96 animate-in zoom-in-95 slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-4 flex-shrink-0 border-b border-white/[0.05] pb-3">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm tracking-widest uppercase">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasError ? 'bg-red-400' : 'bg-[#FF5A00]'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasError ? 'bg-red-500' : 'bg-[#FF5A00]'}`}></span>
              </span>
              Autoryx IA
            </h3>
            <button onClick={() => {
              if (isDictating) stopDictation();
              resetDetection();
              setMessages([]);
              setContextMatches(null);
              startListening();
            }} className="text-gray-400 hover:text-[#FF5A00] p-1.5 rounded-full bg-white/5 hover:bg-[#FF5A00]/10 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl p-3.5 text-sm leading-relaxed max-w-[85%] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-white/5 text-gray-300 italic border border-white/10 rounded-tr-sm' 
                    : hasError 
                      ? 'bg-red-500/10 text-red-200 border border-red-500/20 rounded-tl-sm' 
                      : 'bg-gradient-to-br from-[#FF5A00]/20 to-[#FF5A00]/5 text-white border border-[#FF5A00]/30 rounded-tl-sm shadow-[0_0_15px_rgba(255,90,0,0.1)]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isDictating && (
              <div className="flex flex-col items-center justify-center p-4 text-[#FF5A00] space-y-3 animate-pulse">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-4 bg-[#FF5A00] rounded-full animate-[bounce_1s_infinite_100ms] shadow-[0_0_8px_#FF5A00]"></div>
                  <div className="w-1.5 h-6 bg-[#FF5A00] rounded-full animate-[bounce_1s_infinite_200ms] shadow-[0_0_8px_#FF5A00]"></div>
                  <div className="w-1.5 h-4 bg-[#FF5A00] rounded-full animate-[bounce_1s_infinite_300ms] shadow-[0_0_8px_#FF5A00]"></div>
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-[#FF5A00]/80">Escuchando...</span>
              </div>
            )}

            {isProcessing && downloadProgress === null && (
              <div className="flex flex-col items-center justify-center p-4 text-[#FF5A00] space-y-3">
                <Loader2 className="w-6 h-6 animate-spin drop-shadow-[0_0_8px_rgba(255,90,0,0.5)]" />
                <span className="text-xs font-bold tracking-wider uppercase text-[#FF5A00]/80">Procesando audio...</span>
              </div>
            )}

            {downloadProgress !== null && (
              <div className="flex flex-col items-center justify-center p-4 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A00] drop-shadow-[0_0_8px_rgba(255,90,0,0.5)]" />
                <span className="text-xs font-bold tracking-wider uppercase text-[#FF5A00]/80 text-center leading-relaxed">
                  Iniciando motor de IA<br/><span className="text-gray-400 font-medium">Descargando modelo: {downloadProgress}%</span>
                </span>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
                  <div className="bg-[#FF5A00] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#FF5A00]" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Botón Flotante (Píldora + Orbe) */}
      <div className="flex items-center">
        <button
          onClick={() => {
            if (isDictating) {
              stopDictation();
            } else if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
          className={`relative group flex items-center gap-3 p-1.5 rounded-full shadow-2xl transition-all duration-500 hover:scale-105 border bg-[#0c0d14]/90 backdrop-blur-xl ${
            (isListening || isDictating) 
              ? 'border-[#FF5A00]/50 shadow-[0_0_30px_rgba(255,90,0,0.3)]' 
              : hasError
                ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                : 'border-white/[0.1] hover:border-white/[0.2]'
          }`}
        >
          {/* Círculo del Zorro (Orbe) */}
          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden z-10 bg-white transition-all duration-300 ${
            (isListening || isDictating) ? 'shadow-[0_0_20px_#FF5A00]' : ''
          }`}>
            <Image 
              src="/autoryx_robotic.png" 
              alt="Autoryx Robotic Fox" 
              fill
              className="object-cover scale-110"
            />
            {/* Anillos de Orbe cuando está escuchando */}
            {(isListening || isDictating) && (
              <>
                <span className="absolute inset-0 rounded-full border-[3px] border-[#FF5A00] animate-ping opacity-75 mix-blend-screen"></span>
                <span className="absolute inset-0 rounded-full border-2 border-[#FF5A00] shadow-[inset_0_0_15px_#FF5A00] animate-pulse mix-blend-screen"></span>
              </>
            )}
            {hasError && (
              <span className="absolute inset-0 rounded-full border-[3px] border-red-500 animate-ping opacity-75 mix-blend-screen"></span>
            )}
          </div>

          {/* Área de texto que se expande */}
          <div className="flex flex-col items-start justify-center pr-5 overflow-hidden whitespace-nowrap">
             <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5 mb-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (isListening || isDictating) 
                    ? 'bg-[#FF5A00] shadow-[0_0_8px_#FF5A00] animate-pulse' 
                    : hasError 
                      ? 'bg-red-500 shadow-[0_0_8px_red]' 
                      : 'bg-gray-600'
                }`} />
                Autoryx IA
             </div>
             <div className="text-sm font-semibold text-white transition-all duration-300">
                {isListening ? 'Escuchando...' : isProcessing ? 'Buscando solución...' : hasError ? 'Error en IA' : 'Hablar con Ultra'}
             </div>
          </div>
        </button>
      </div>
      
      {wakeWordError && (
        <div className="bg-red-100 text-red-600 text-xs p-2 rounded-lg max-w-[200px] text-center shadow">
          {wakeWordError}
        </div>
      )}
    </div>
  );
}
