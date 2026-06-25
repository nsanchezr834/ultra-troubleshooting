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

interface PushNotificationManagerProps {
    isDarkMode?: boolean;
}

export default function PushNotificationManager({ isDarkMode = false }: PushNotificationManagerProps) {
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
            const permission = await Notification.requestPermission();
            setPermissionState(permission);

            if (permission !== 'granted') {
                alert('Permiso de notificaciones denegado.');
                setLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const subJson = sub.toJSON();
            const p256dhString = subJson.keys?.p256dh;
            const authString = subJson.keys?.auth;

            if (!p256dhString || !authString) {
                throw new Error('No se pudieron obtener las llaves de la suscripción.');
            }

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
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);

            if (error) throw error;

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
        <button
            onClick={subscription ? unsubscribeFromPush : subscribeToPush}
            disabled={loading}
            title={subscription ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
            className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 active:scale-[0.92] shadow-sm ${
                subscription
                    ? isDarkMode
                        ? 'bg-neutral-800 border-neutral-700 text-green-400 hover:bg-neutral-700'
                        : 'bg-white border-neutral-200 text-green-600 hover:bg-neutral-50'
                    : isDarkMode
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                        : 'bg-white border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-[#ff4f00] hover:border-neutral-300'
            }`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : subscription ? (
                <>
                    <Bell className="w-4 h-4 fill-current animate-pulse" />
                    <span className={`absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white transition-all duration-300 ${
                        isDarkMode ? 'dark:border-neutral-800' : ''
                    }`} />
                </>
            ) : (
                <BellOff className="w-4 h-4" />
            )}
        </button>
    );
}
