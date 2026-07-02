"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Declaración global para TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface WakeWordResult {
  isListening: boolean;
  wakeWordDetected: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetDetection: () => void;
  error: string | null;
}

export function useWakeWord(): WakeWordResult {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Mantener el ref sincronizado para usarlo en los eventos (handlers) asíncronos
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Tu navegador no soporta detección de voz nativa. Se requiere Google Chrome, Edge o Safari 14.1+.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-MX"; // Español de México

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const combinedText = (finalTranscript + " " + interimTranscript).toLowerCase();
      
      // Solo para debug en consola, podemos ver lo que Chrome entiende en modo guardia
      if (combinedText.trim()) {
         console.log("[WAKE WORD NATIVO]: ", combinedText);
      }

      // Detectar variaciones
      if (combinedText.includes("ultra") || combinedText.includes("oye ultra")) {
        console.warn("[WAKE WORD NATIVO]: ¡PALABRA CLAVE DETECTADA!");
        setWakeWordDetected(true);
        // Si detecta, detenemos la escucha para soltar el micrófono (evitar conflicto con Whisper)
        setIsListening(false);
        recognition.stop();
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" es normal cuando hay silencio, no queremos llenar la consola
      if (event.error !== 'no-speech') {
        console.warn("SpeechRecognition error:", event.error);
        if (event.error === 'not-allowed') {
            setError("Permisos de micrófono denegados.");
            setIsListening(false);
        }
      }
    };

    recognition.onend = () => {
      // Chrome detiene el reconocimiento automáticamente después de ~10 segundos de silencio.
      // Si el estado "isListening" sigue activo (NO lo apagamos nosotros),
      // lo volvemos a iniciar inmediatamente en un loop infinito silencioso.
      if (isListeningRef.current) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // Ignorar error si ya está arrancando
        }
      }
    };

    return recognition;
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
    }
  }, []);

  const resetDetection = useCallback(() => {
    setWakeWordDetected(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setWakeWordDetected(false);
    
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err: any) {
        // En caso de que ya estuviera corriendo, catch el error DOMException
      }
    }
  }, [initRecognition]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    wakeWordDetected,
    startListening,
    stopListening,
    resetDetection,
    error
  };
}
