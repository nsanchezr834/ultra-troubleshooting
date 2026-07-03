console.warn("[WORKER] El archivo worker.ts se ha cargado e interpretado correctamente.");

let transformers: any;
let transcriberPromise: Promise<any> | null = null;

self.addEventListener('message', async (e: MessageEvent) => {
    const { type, audioData } = e.data;
    console.warn(`[WORKER] Recibido mensaje tipo: ${type}`);

    if (type === 'PRELOAD_MODEL' || type === 'TRANSCRIBE') {
        try {
            if (!transcriberPromise) {
                console.warn("[WORKER] Iniciando descarga del modelo Whisper...");
                self.postMessage({ type: 'INIT_MODEL' });
                
                transcriberPromise = (async () => {
                    if (!transformers) {
                        try {
                            // @ts-ignore
                            transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
                            transformers.env.allowLocalModels = false;
                            transformers.env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';
                            console.warn("[WORKER] Transformers.js cargado dinámicamente desde CDN.");
                        } catch (err) {
                            console.error("[WORKER] Error importando @xenova/transformers:", err);
                            throw err;
                        }
                    }
                    const { pipeline } = transformers;
                    
                    return await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                        progress_callback: (x: any) => {
                            if (x.status === 'progress') {
                                self.postMessage({ type: 'DOWNLOAD_PROGRESS', data: x });
                            } else if (x.status === 'ready') {
                                console.warn("[WORKER] Modelo descargado y listo.");
                                self.postMessage({ type: 'MODEL_READY' });
                            }
                        }
                    });
                })().catch(err => {
                    console.error("[WORKER] Error crítico cargando modelo:", err);
                    self.postMessage({ type: 'ERROR', message: `Fallo al cargar modelo: ${err.message}` });
                    transcriberPromise = null;
                    throw err;
                });
            }

            console.warn("[WORKER] Esperando a que la promesa del modelo se resuelva...");
            const transcriber = await transcriberPromise;
            console.warn("[WORKER] Promesa del modelo resuelta.");

            if (type === 'PRELOAD_MODEL') {
                console.warn("[WORKER] Preload finalizado, ignorando transcripción.");
                return;
            }

            console.warn(`[WORKER] Iniciando transcripción. Longitud del audio: ${audioData?.length}`);
            
            if (!audioData || audioData.length === 0) {
                 console.warn("[WORKER] ERROR: audioData está vacío.");
                 throw new Error("El arreglo de audio está vacío");
            }

            const result = await transcriber(audioData, {
                language: 'spanish',
                task: 'transcribe',
            });

            console.warn("[WORKER] Transcripción exitosa:", result.text);

            self.postMessage({
                type: 'TRANSCRIPT',
                text: result.text
            });
        } catch (error: any) {
            console.error("[WORKER] Error capturado:", error);
            self.postMessage({
                type: 'ERROR',
                message: error.message || 'Error desconocido durante la transcripción'
            });
        }
    }
});
