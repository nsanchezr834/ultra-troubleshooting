import { useEffect, useRef } from 'react';

export function useTelemetry(currentSection: string) {
    const sectionRef = useRef<string>(currentSection);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        // Si la sección cambia, enviar la telemetría de la sección anterior
        if (sectionRef.current !== currentSection) {
            const endTime = Date.now();
            const durationSeconds = (endTime - startTimeRef.current) / 1000;

            if (durationSeconds > 1) { // Solo registrar si estuvo más de 1 segundo
                sendTelemetry(sectionRef.current, startTimeRef.current, endTime, durationSeconds);
            }

            // Actualizar referencias para la nueva sección
            sectionRef.current = currentSection;
            startTimeRef.current = Date.now();
        }
    }, [currentSection]);

    useEffect(() => {
        // Enviar al cerrar la pestaña o navegar fuera de la SPA
        const handleBeforeUnload = () => {
            const endTime = Date.now();
            const durationSeconds = (endTime - startTimeRef.current) / 1000;
            if (durationSeconds > 1) {
                // sendBeacon es mejor para requests al cerrar la página, pero fetch con keepalive también funciona.
                // Aquí intentamos enviar los datos de forma sincrónica o usando keepalive
                const payload = JSON.stringify({
                    section: sectionRef.current,
                    startTime: new Date(startTimeRef.current).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    durationSeconds
                });
                
                try {
                    navigator.sendBeacon('/api/telemetry/session', payload);
                } catch (e) {
                    fetch('/api/telemetry/session', {
                        method: 'POST',
                        body: payload,
                        headers: { 'Content-Type': 'application/json' },
                        keepalive: true
                    }).catch(() => {});
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);
}

function sendTelemetry(section: string, startMs: number, endMs: number, durationSeconds: number) {
    fetch('/api/telemetry/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            section,
            startTime: new Date(startMs).toISOString(),
            endTime: new Date(endMs).toISOString(),
            durationSeconds
        })
    }).catch(err => {
        console.error('Failed to send telemetry:', err);
    });
}
