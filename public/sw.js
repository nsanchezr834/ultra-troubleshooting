self.addEventListener('push', function(event) {
    if (!event.data) {
        console.warn('[Service Worker] Push event received but no data payload.');
        return;
    }

    try {
        const data = event.data.json();
        const title = data.title || 'Nueva Notificación';
        const options = {
            body: data.body || 'Tienes un nuevo mensaje.',
            icon: '/manifest_logo.png', // Icono de la app
            badge: '/favicon.ico',      // Badge pequeño
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (err) {
        console.error('[Service Worker] Error parsing push data:', err);
        
        // Caída de respaldo si no es JSON válido
        const text = event.data.text();
        event.waitUntil(
            self.registration.showNotification('Nueva Notificación', {
                body: text,
                icon: '/manifest_logo.png',
                data: {
                    url: '/'
                }
            })
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Intentar reusar una pestaña existente abierta en el mismo origen
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(function(focusedClient) {
                        if ('navigate' in focusedClient) {
                            return focusedClient.navigate(targetUrl);
                        }
                    });
                }
            }
            // Si no hay pestañas abiertas, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
