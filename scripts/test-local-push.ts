import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'SUPER_SECRET_WEBHOOK_TOKEN';
const LOCAL_API_URL = 'http://localhost:3000/api/notifications/broadcast';

async function sendTestNotification() {
    console.log('Enviando notificación push de prueba local a:', LOCAL_API_URL);

    const payload = {
        title: 'Caso de Prueba Local 🚀',
        body: '¡Excelente! El sistema de notificaciones Web Push se ha configurado y está listo.',
        url: '/troubleshooting?search=ERR-KIN-001'
    };

    try {
        const response = await fetch(LOCAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_SECRET}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Notificación enviada con éxito:', data);
        } else {
            console.error('❌ Error en el servidor al enviar la notificación:', data);
        }
    } catch (err) {
        console.error('❌ Error al conectar con el servidor local de Next.js:', err);
    }
}

sendTestNotification();
