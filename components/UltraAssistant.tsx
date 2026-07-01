"use client";

import { useState, useRef, useEffect } from "react";
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

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isProcessingRef = useRef(false);
  
  // Ref para SpeechRecognition (si está disponible en el navegador)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Manejador centralizado de errores visuales
  const triggerError = (msg: string) => {
    console.error(msg);
    setHasError(true);
    setTimeout(() => setHasError(false), 4000); // El rojo dura 4 segundos
  };

  useEffect(() => {
    // Inicializar SpeechRecognition para cuando se detecte el Wake Word
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleProcessQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        triggerError(`Speech recognition error: ${event.error}`);
        setIsProcessing(false);
        resetDetection();
        
        // Re-iniciar el detector de wake word si ocurre un error de dictado
        setTimeout(() => {
          startListening();
        }, 500);
      };
      
      recognitionRef.current.onend = () => {
        // Si el reconocimiento termina pero no estamos procesando nada, 
        // significa que se abortó o hubo silencio. Reiniciamos el wake word.
        if (!isProcessingRef.current) {
          resetDetection();
          setTimeout(() => {
            startListening();
          }, 500);
        }
      };
    }
  }, [resetDetection, startListening]);

  // Si se detecta el wake word, iniciamos el dictado activo
  useEffect(() => {
    if (wakeWordDetected) {
      if (!recognitionRef.current) {
        console.error("Speech recognition not supported in this browser");
        setResponse("Error: Tu navegador no soporta reconocimiento de voz (Usa Google Chrome).");
        return;
      }
      
      // Feedback sonoro opcional
      const beep = new Audio("/beep.mp3"); // Asumiendo que existe
      beep.play().catch(() => {});
      
      setResponse(null);
      setQuery("Escuchando...");
      
      // Decir en voz alta en qué te puedo ayudar, y luego iniciar el micrófono
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Detener cualquier cosa que esté hablando
        const utterance = new SpeechSynthesisUtterance("¿En qué te puedo ayudar?");
        utterance.lang = 'es-ES';
        
        utterance.onend = () => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error("Error al iniciar reconocimiento activo", e);
          }
        };

        // Fallback en caso de que el evento onend no dispare
        setTimeout(() => {
          if (!recognitionRef.current) return;
          try {
            recognitionRef.current.start();
          } catch (e) {
            // ignore si ya empezó
          }
        }, 3000);

        window.speechSynthesis.speak(utterance);
      } else {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error al iniciar reconocimiento activo", e);
        }
      }
    }
  }, [wakeWordDetected]);

  const handleProcessQuery = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/ultra/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Error HTTP ${res.status}`);
      }
      
      setResponse(data.response);
      
      // Reproducir la respuesta vía TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = 'es-ES';
        utterance.onend = () => {
          resetDetection(); // Volver a esperar el wake word
          startListening();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        resetDetection();
        startListening();
      }

    } catch (err: any) {
      triggerError(`API Error: ${err.message}`);
      setResponse(`Error: ${err.message}`);
      resetDetection();
      startListening();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-4">
      {/* Ventana de Chat */}
      {(wakeWordDetected || response || isProcessing) && (
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-6 w-80 border border-gray-100 transition-all duration-300 transform origin-bottom-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasError ? 'bg-red-400' : isProcessing ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${hasError ? 'bg-red-500' : isProcessing ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
              </span>
              Asistente Ultra
            </h3>
            <button onClick={() => {
              resetDetection();
              setResponse(null);
              startListening();
            }} className="text-gray-400 hover:text-gray-600 text-sm">
              Cerrar
            </button>
          </div>
          
          <div className="space-y-3">
            {query && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic">
                "{query}"
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center p-4 text-blue-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}

            {response && (
              <div className={`rounded-lg p-3 text-sm leading-relaxed ${hasError ? 'bg-red-50 text-red-900' : 'bg-blue-50 text-blue-900'}`}>
                {response}
              </div>
            )}
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
          onClick={isListening ? stopListening : startListening}
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
                : isListening 
                  ? 'brightness-0 sepia-[1] hue-rotate-[190deg] saturate-[500%] contrast-[105%] drop-shadow-md' 
                  : 'brightness-0 opacity-80'
            }`} 
          />
          {(isListening || hasError) && (
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
