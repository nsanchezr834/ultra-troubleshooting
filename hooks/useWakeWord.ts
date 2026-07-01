"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AudioClassifier, FilesetResolver } from "@mediapipe/tasks-audio";

interface WakeWordResult {
  isListening: boolean;
  wakeWordDetected: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetDetection: () => void;
  error: string | null;
}

export function useWakeWord(
  modelAssetPath: string = "/models/wake_word.tflite",
  threshold: number = 0.85
): WakeWordResult {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classifierRef = useRef<AudioClassifier | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const initClassifier = useCallback(async () => {
    if (classifierRef.current) return;
    try {
      // Validar contexto seguro
      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error("MediaPipe requiere HTTPS o localhost (Secure Context) para WebAssembly y micrófono.");
      }
      
      const audio = await FilesetResolver.forAudioTasks(
        typeof window !== "undefined" ? window.location.origin + "/wasm/audio" : "/wasm/audio"
      );
      // Fetch the model manually to ensure it loads and avoid path resolution issues
      const modelResponse = await fetch(modelAssetPath);
      if (!modelResponse.ok) {
        throw new Error(`Failed to fetch model at ${modelAssetPath}: ${modelResponse.statusText}`);
      }
      const modelBuffer = await modelResponse.arrayBuffer();

      classifierRef.current = await AudioClassifier.createFromOptions(audio, {
        baseOptions: {
          modelAssetBuffer: new Uint8Array(modelBuffer),
        },
        maxResults: 2,
        scoreThreshold: threshold,
      });
    } catch (err: any) {
      let errText = err?.message || String(err);
      if (err instanceof Event) {
         errText = `Error de red al cargar el motor (¿CORS o HTTP?). Tipo de evento: ${err.type}`;
      }
      const msg = `MediaPipe Init Error: ${errText}`;
      console.error("DETALLE DEL ERROR:", err);
      throw new Error(msg);
    }
  }, [modelAssetPath, threshold]);

  const stopListening = useCallback(() => {
    setIsListening(false);

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const resetDetection = useCallback(() => {
    setWakeWordDetected(false);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setWakeWordDetected(false);

    try {
      await initClassifier();
      if (!classifierRef.current) throw new Error("Clasificador no instanciado");

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      // Load static worklet file to avoid blob: CSP blocking
      await audioContextRef.current.audioWorklet.addModule("/worklets/wake-word-processor.js");
      const sourceNode = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'wake-word-processor');
      sourceNode.connect(workletNodeRef.current);
      workletNodeRef.current.connect(audioContextRef.current.destination);

      let buffer: Float32Array = new Float32Array(0);

      workletNodeRef.current.port.onmessage = (event) => {
        if (!isListening || wakeWordDetected) return;
        
        // Append data to buffer
        const data = event.data as Float32Array;
        const newBuffer = new Float32Array(buffer.length + data.length);
        newBuffer.set(buffer);
        newBuffer.set(data, buffer.length);
        buffer = newBuffer;

        // MediaPipe typically needs chunks of a certain size (e.g., 4096 samples)
        if (buffer.length >= 4096) {
          const chunk = buffer.slice(0, 4096);
          buffer = buffer.slice(4096);
          
          if (classifierRef.current) {
            try {
              const results = classifierRef.current.classify(chunk, performance.now());
              if (results && results.length > 0) {
                const classifications = results[0].classifications;
                for (const classification of classifications) {
                  // Debug: Log the top category so the user can see it in F12 Console
                  if (classification.categories.length > 0) {
                     const topCat = classification.categories[0];
                     if (topCat.score > 0.1) {
                         console.log("Audio detectado:", topCat.categoryName, "Score:", topCat.score);
                     }
                  }

                  const wakeWordCat = classification.categories.find(c => c.categoryName === "Speech" || c.categoryName === "wake_word_ultra");
                  if (wakeWordCat && wakeWordCat.score > 0.4) { // Umbral ajustado para YAMNet
                    setWakeWordDetected(true);
                    stopListening();
                    break;
                  }
                }
              }
            } catch (e) {
              console.error("MediaPipe classify error:", e);
            }
          }
        }
      };

      setIsListening(true);

    } catch (err: any) {
      setError(`Error al iniciar micrófono: ${err.message}`);
      stopListening();
    }
  }, [initClassifier, stopListening, threshold, isListening, wakeWordDetected]);

  useEffect(() => {
    return () => {
      stopListening();
      if (classifierRef.current) {
        classifierRef.current.close();
        classifierRef.current = null;
      }
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
