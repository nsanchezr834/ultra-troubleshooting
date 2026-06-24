self.addEventListener('push', function (event) {
    const origin = self.location.origin;

    let title = 'Nueva Notificación 🛡️';
    let options = {
        body: 'Tienes una nueva alerta en el portal de Ultra.',
        icon: origin + '/manifest_logo.png',
        badge: origin + '/favicon.ico',
        data: {
            url: '/'
        }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || title;
            options.body = data.body || options.body;
            if (options.data && data.url) {
                options.data.url = data.url;
            }
        } catch (err) {
            console.error('[Service Worker] Error parsing JSON payload:', err);
            try {
                options.body = event.data.text() || options.body;
            } catch (textErr) {
                console.error('[Service Worker] Error reading text payload:', textErr);
            }
        }
    } else {
        console.warn('[Service Worker] Push event received but data is null (possibly decryption failed due to VAPID key mismatch).');
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(function (focusedClient) {
                        if ('navigate' in focusedClient) {
                            return focusedClient.navigate(targetUrl);
                        }
                    });
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});