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

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [contextMatches, setContextMatches] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const isProcessingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref para SpeechRecognition (si está disponible en el navegador)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Auto-scroll para el chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Manejador centralizado de errores visuales
  const triggerError = (msg: string) => {
    console.error(msg);
    setHasError(true);
    setTimeout(() => setHasError(false), 4000);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onstart = () => {
        setIsDictating(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        setIsDictating(false);
        const transcript = event.results[0][0].transcript;
        handleProcessQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsDictating(false);
        triggerError(`Speech recognition error: ${event.error}`);
        setIsProcessing(false);
        resetDetection();
        
        setTimeout(() => {
          startListening();
        }, 500);
      };
      
      recognitionRef.current.onend = () => {
        setIsDictating(false);
        if (!isProcessingRef.current) {
          resetDetection();
          setTimeout(() => {
            startListening();
          }, 500);
        }
      };
    }
  }, [resetDetection, startListening]);

  useEffect(() => {
    if (wakeWordDetected) {
      if (!recognitionRef.current) {
        triggerError("Navegador no soporta reconocimiento de voz");
        return;
      }
      
      const beep = new Audio("/beep.mp3");
      beep.play().catch(() => {});
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        let initialMsg = "¿En qué te puedo ayudar?";
        if (messages.length > 0) {
            initialMsg = "Te escucho...";
        }

        const utterance = new SpeechSynthesisUtterance(initialMsg);
        utterance.lang = 'es-ES';
        
        utterance.onend = () => {
          try { recognitionRef.current.start(); } catch (e) {}
        };

        setTimeout(() => {
          if (!recognitionRef.current) return;
          try { recognitionRef.current.start(); } catch (e) {}
        }, 3000);

        window.speechSynthesis.speak(utterance);
      } else {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }
  }, [wakeWordDetected]); // Removido messages.length del array de dependencias para no disparar de nuevo

  const handleProcessQuery = async (text: string) => {
    const userText = text.trim();
    const lowerText = userText.toLowerCase();

    // Comandos locales
    if (lowerText.includes("cancelar") || lowerText.includes("cancela")) {
        setMessages([]);
        setContextMatches(null);
        resetDetection();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("Operación cancelada.");
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        }
        startListening();
        return;
    }

    if (lowerText.includes("repetir") || lowerText.includes("repite")) {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
        resetDetection();
        if (lastAssistantMessage && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content);
            utterance.lang = 'es-ES';
            utterance.onend = () => { 
                if (contextMatches && contextMatches.length > 0) {
                    try { recognitionRef.current.start(); } catch (e) {}
                } else {
                    startListening(); 
                }
            };
            window.speechSynthesis.speak(utterance);
        } else {
            startListening();
        }
        return;
    }

    // Agregar mensaje del usuario a la interfaz
    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/ultra/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            text: userText, 
            history: messages, // Enviamos el historial previo
            contextMatches: contextMatches 
        }),
      });
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Error HTTP ${res.status}`);
      }
      
      // Actualizar historial con la respuesta de la IA
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Actualizar contexto si lo devuelve el backend (puede ser null si ya resolvió o no hay opciones)
      if (data.matches !== undefined) {
          setContextMatches(data.matches);
      }
      
      // Si el backend dictamina que se canceló, limpiamos.
      if (data.response.includes("Operación cancelada")) {
          setMessages([]);
          setContextMatches(null);
      }

      const isExpectingAnswer = data.matches !== null && data.matches !== undefined && !data.response.includes("Operación cancelada");

      // Reproducir la respuesta vía TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = 'es-ES';
        utterance.onend = () => {
          if (isExpectingAnswer) {
             // Esperamos respuesta, encendemos el micrófono directo
             try { recognitionRef.current.start(); } catch (e) {}
          } else {
             // Terminamos, volvemos a esperar el "Ultra"
             resetDetection();
             startListening();
          }
        };
        
        // Timeout de seguridad en caso de que onend no dispare
        setTimeout(() => {
          if (isExpectingAnswer) {
             try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 5000);

        window.speechSynthesis.speak(utterance);
      } else {
        if (isExpectingAnswer) {
           try { recognitionRef.current.start(); } catch (e) {}
        } else {
           resetDetection();
           startListening();
        }
      }

    } catch (err: any) {
      triggerError(`API Error: ${err.message}`);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
      resetDetection();
      startListening();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-4">
      {/* Ventana de Chat */}
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
            
            {isProcessing && (
              <div className="flex items-center justify-center p-4 text-blue-500">
                <Loader2 className="w-6 h-6 animate-spin" />
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
