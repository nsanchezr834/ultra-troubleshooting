"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWakeWord } from "@/hooks/useWakeWord";
import { Loader2 } from "lucide-react";
import Image from "next/image";

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
          
          workerRef.current.postMessage({ type: 'TRANSCRIBE', audioData: float32Data });
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
        resetDetection();
        startListening();
        return;
    }

    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setIsProcessing(true);

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

      const isExpectingAnswer = !data.response.includes("Operación cancelada") && newMessages.filter(m => m.role === 'user').length < 10;

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
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
      resetDetection();
      startListening();
      resetSleepTimer();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-4">
      {(wakeWordDetected || messages.length > 0 || isProcessing) && (
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-4 w-80 border border-gray-100 transition-all duration-300 transform origin-bottom-right flex flex-col max-h-96">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasError ? 'bg-red-400' : isProcessing ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${hasError ? 'bg-red-500' : isProcessing ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
              </span>
              Asistente Ultra
            </h3>
            <button onClick={() => {
              if (isDictating) stopDictation();
              resetDetection();
              setMessages([]);
              setContextMatches(null);
              startListening();
            }} className="text-gray-400 hover:text-gray-600 text-sm">
              Cerrar
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 text-sm leading-relaxed max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-gray-100 text-gray-800 italic' 
                    : hasError 
                      ? 'bg-red-50 text-red-900' 
                      : 'bg-blue-50 text-blue-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isDictating && (
              <div className="flex flex-col items-center justify-center p-4 text-blue-500 space-y-2 animate-pulse">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full animate-[bounce_1s_infinite_100ms]"></div>
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full animate-[bounce_1s_infinite_300ms]"></div>
                </div>
                <span className="text-xs font-semibold">Te escucho...</span>
              </div>
            )}

            {isProcessing && downloadProgress === null && (
              <div className="flex flex-col items-center justify-center p-4 text-blue-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs text-blue-400">Procesando audio...</span>
              </div>
            )}

            {downloadProgress !== null && (
              <div className="flex flex-col items-center justify-center p-4 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-xs font-semibold text-purple-600 text-center">
                  Iniciando motor de IA<br/>(Descargando modelo: {downloadProgress}%)
                </span>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Contenedor del Botón y Leyenda */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#0c0d14]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/[0.08] hidden sm:flex items-center gap-1.5 opacity-70 hover:opacity-100 hover:border-white/[0.2] hover:shadow-[0_0_15px_rgba(255,90,0,0.15)] transition-all duration-300 cursor-default">
          <span className="text-gray-500">Powered by</span>
          <span className="text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A00] animate-pulse shadow-[0_0_5px_#FF5A00]" />
            Autoryx IA
          </span>
        </span>
        
        {/* Botón Flotante */}
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
          className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 bg-white`}
        >
          <Image 
            src="/autoryx_badge_v2.svg" 
            alt="Ultra Assistant Logo" 
            width={32} 
            height={32} 
            className={`transition-all duration-300 ${
              hasError 
                ? 'brightness-0 invert-[.2] sepia-[1] hue-rotate-[320deg] saturate-[5000%] contrast-[110%] drop-shadow-md' 
                : (isListening || isDictating)
                  ? 'brightness-0 sepia-[1] hue-rotate-[190deg] saturate-[500%] contrast-[105%] drop-shadow-md' 
                  : 'brightness-0 opacity-80'
            }`} 
          />
          {(isListening || isDictating || hasError) && (
            <span className={`absolute -inset-1 rounded-full border-2 animate-pulse opacity-50 ${hasError ? 'border-red-500' : 'border-blue-500'}`}></span>
          )}
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
