import { pipeline, env } from '@xenova/transformers';

// Desactivar la lectura de modelos locales, forzar descarga desde el CDN de HuggingFace
env.allowLocalModels = false;

let transcriber: any = null;

self.addEventListener('message', async (e: MessageEvent) => {
    const { type, audioData } = e.data;

    if (type === 'TRANSCRIBE') {
        try {
            // 1. Inicializar de forma perezosa (Lazy Load) el modelo Whisper
            if (!transcriber) {
                // Notificar que inicia la carga
                self.postMessage({ type: 'INIT_MODEL' });
                
                // Usamos el modelo multilingüe para que pueda entender español
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                    progress_callback: (x: any) => {
                        if (x.status === 'progress') {
                            self.postMessage({ type: 'DOWNLOAD_PROGRESS', data: x });
                        } else if (x.status === 'ready') {
                            self.postMessage({ type: 'MODEL_READY' });
                        }
                    }
                });
            }

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
