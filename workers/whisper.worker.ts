import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let transcriberPromise: Promise<any> | null = null;

self.addEventListener('message', async (e: MessageEvent) => {
    const { type, audioData } = e.data;
    console.log(`[WORKER] Recibido mensaje tipo: ${type}`);

    if (type === 'PRELOAD_MODEL' || type === 'TRANSCRIBE') {
        try {
            if (!transcriberPromise) {
                console.log("[WORKER] Iniciando descarga del modelo Whisper...");
                self.postMessage({ type: 'INIT_MODEL' });
                
                transcriberPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                    progress_callback: (x: any) => {
                        if (x.status === 'progress') {
                            self.postMessage({ type: 'DOWNLOAD_PROGRESS', data: x });
                        } else if (x.status === 'ready') {
                            console.log("[WORKER] Modelo descargado y listo.");
                            self.postMessage({ type: 'MODEL_READY' });
                        }
                    }
                });
            }

            console.log("[WORKER] Esperando a que la promesa del modelo se resuelva...");
            const transcriber = await transcriberPromise;
            console.log("[WORKER] Promesa del modelo resuelta.");

            if (type === 'PRELOAD_MODEL') {
                console.log("[WORKER] Preload finalizado, ignorando transcripción.");
                return;
            }

            console.log(`[WORKER] Iniciando transcripción. Longitud del audio: ${audioData?.length}`);
            
            if (!audioData || audioData.length === 0) {
                 console.log("[WORKER] ERROR: audioData está vacío.");
                 throw new Error("El arreglo de audio está vacío");
            }

            const result = await transcriber(audioData, {
                language: 'spanish',
                task: 'transcribe',
            });

            console.log("[WORKER] Transcripción exitosa:", result.text);

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
