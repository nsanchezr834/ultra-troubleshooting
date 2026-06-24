'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermissionState(Notification.permission);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    async function checkSubscription() {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const sub = await registration.pushManager.getSubscription();
                setSubscription(sub);
            }
        } catch (err) {
            console.error('Error checking push subscription:', err);
        } finally {
            setLoading(false);
        }
    }

    async function subscribeToPush() {
        if (!VAPID_PUBLIC_KEY) {
            alert('Error: Llave pública VAPID no configurada en las variables de entorno.');
            return;
        }

        setLoading(true);
        try {
            // 1. Solicitar permisos de notificación
            const permission = await Notification.requestPermission();
            setPermissionState(permission);

            if (permission !== 'granted') {
                alert('Permiso de notificaciones denegado.');
                setLoading(false);
                return;
            }

            // 2. Registrar/obtener service worker y suscribir al push manager
            const registration = await navigator.serviceWorker.register('/sw.js');
            // Esperar que esté listo
            await navigator.serviceWorker.ready;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // 3. Serializar llaves para guardarlas en Supabase
            const p256dh = sub.getKey('p256dh');
            const auth = sub.getKey('auth');

            if (!p256dh || !auth) {
                throw new Error('No se pudieron obtener las llaves de la suscripción.');
            }

            const p256dhString = btoa(String.fromCharCode(...new Uint8Array(p256dh)));
            const authString = btoa(String.fromCharCode(...new Uint8Array(auth)));

            // 4. Guardar suscripción en la base de datos de Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    endpoint: sub.endpoint,
                    p256dh: p256dhString,
                    auth: authString
                }, { onConflict: 'endpoint' });

            if (error) throw error;

            setSubscription(sub);
        } catch (err: any) {
            console.error('Error al suscribirse a notificaciones push:', err);
            alert(`Error al activar notificaciones: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        if (!subscription) return;
        setLoading(true);
        try {
            // 1. Eliminar de la base de datos de Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);

            if (error) throw error;

            // 2. Desuscribir en el navegador
            await subscription.unsubscribe();
            setSubscription(null);
            setPermissionState(Notification.permission);
        } catch (err: any) {
            console.error('Error al desactivar las notificaciones push:', err);
            alert(`Error al desactivar: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    }

    if (!isSupported) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {subscription ? (
                <button
                    onClick={unsubscribeFromPush}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-green-400 border border-green-500/20 text-xs font-black tracking-wider uppercase transition-all duration-300 backdrop-blur-md shadow-lg"
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    )}
                    Notificaciones Activas
                </button>
            ) : (
                <button
                    onClick={subscribeToPush}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-wider uppercase transition-all duration-300 shadow-md shadow-red-600/20 animate-bounce"
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Bell className="w-3.5 h-3.5" />
                    )}
                    Activar Notificaciones
                </button>
            )}
        </div>
    );
}
