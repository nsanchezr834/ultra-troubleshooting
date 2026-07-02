import { pipeline, env } from '@xenova/transformers';

// Desactivar la lectura de modelos locales, forzar descarga desde el CDN de HuggingFace
env.allowLocalModels = false;

let transcriberPromise: Promise<any> | null = null;

self.addEventListener('message', async (e: MessageEvent) => {
    const { type, audioData } = e.data;

    if (type === 'PRELOAD_MODEL' || type === 'TRANSCRIBE') {
        try {
            // 1. Inicializar de forma perezosa y segura contra concurrencia
            if (!transcriberPromise) {
                // Notificar que inicia la carga
                self.postMessage({ type: 'INIT_MODEL' });
                
                // Guardar la promesa para que futuras llamadas esperen a esta misma
                transcriberPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                    progress_callback: (x: any) => {
                        if (x.status === 'progress') {
                            self.postMessage({ type: 'DOWNLOAD_PROGRESS', data: x });
                        } else if (x.status === 'ready') {
                            self.postMessage({ type: 'MODEL_READY' });
                        }
                    }
                });
            }

            // Esperar a que el modelo cargue (ya sea la primera vez o si ya estaba cargando)
            const transcriber = await transcriberPromise;

            if (type === 'PRELOAD_MODEL') return;

            // 2. Ejecutar la transcripción
            // audioData ya debe ser un Float32Array a 16kHz enviado por el hilo principal
            const result = await transcriber(audioData, {
                language: 'spanish',
                task: 'transcribe',
            });

            // 3. Devolver la respuesta
            self.postMessage({
                type: 'TRANSCRIPT',
                text: result.text
            });
        } catch (error: any) {
            self.postMessage({
                type: 'ERROR',
                message: error.message || 'Error desconocido durante la transcripción'
            });
        }
    }
});
