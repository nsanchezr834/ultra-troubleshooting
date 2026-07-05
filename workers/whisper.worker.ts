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
                            const dynamicImport = new Function('url', 'return import(url)');
                            transformers = await dynamicImport('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
                            transformers.env.allowLocalModels = false;
                            transformers.env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';
                            console.warn("[WORKER] Transformers.js cargado dinámicamente desde CDN nativo.");
                        } catch (err) {
                            console.error("[WORKER] Error importando @xenova/transformers:", err);
                            throw err;
                        }
                    }
                    const { pipeline } = transformers;

                    return await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
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
                    console.error("[WORKER] Error crítico cargando modelo:", err, err?.stack);
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

            console.warn("[WORKER] Transcripción cruda:", result.text);

            // Post-procesamiento Fonético (Auto-corrector de palabras técnicas)
            let correctedText = result.text.toLowerCase()
                .replace(/\bcueyo\b/g, "cuello")
                .replace(/\bcuyo\b/g, "cuello")
                .replace(/\bvaya cuyo\b/g, "falla cuello")
                .replace(/\bfalla de cueyo\b/g, "falla de cuello")
                .replace(/\bvaya de cuyo\b/g, "falla de cuello")
                .replace(/\bvaya de cueyo\b/g, "falla de cuello")
                .replace(/\bvaya\b/g, "falla") // Si dice "vaya" en contexto de error
                .replace(/\bgríper\b/g, "gripper")
                .replace(/\bgriper\b/g, "gripper")
                .replace(/\bvager\b/g, "bagger")
                .replace(/\bbaguer\b/g, "bagger")
                .replace(/\bvaguer\b/g, "bagger")
                .replace(/\bvagre\b/g, "bagger")
                .replace(/\bpaki\b/g, "packie")
                .replace(/\bpaqui\b/g, "packie")
                .replace(/\bjome\b/g, "home")
                .replace(/\bgome\b/g, "home")
                .replace(/\bome\b/g, "home");



            console.warn("[WORKER] Transcripción corregida:", correctedText);

            self.postMessage({
                type: 'TRANSCRIPT',
                text: correctedText
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
