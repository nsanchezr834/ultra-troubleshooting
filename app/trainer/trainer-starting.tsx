'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TrainerStartingPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchCsrf() {
            try {
                const res = await fetch('/api/auth/csrf');
                if (res.ok) {
                    const data = await res.json();
                    setCsrfToken(data.csrfToken);
                } else {
                    setError('Error de inicialización de seguridad.');
                }
            } catch {
                setError('Error de conexión segura.');
            }
        }
        fetchCsrf();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/trainer-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, csrfToken }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(true);
                setTimeout(() => window.location.reload(), 800);
            } else {
                setError(data.error || 'Credenciales incorrectas.');
                setLoading(false);
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen w-full flex items-center justify-center bg-[#090a0f] overflow-hidden font-sans select-none">
            {/* Fondo */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.10] blur-[150px]" style={{ backgroundColor: '#FF5A00' }} />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[120px]" style={{ backgroundColor: '#FF5A00' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10 w-full max-w-[420px] mx-4">
                <div className="bg-[#12131a]/65 backdrop-blur-[24px] rounded-2xl border border-white/[0.07] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-4 relative group">
                            <div className="absolute inset-0 rounded-full bg-[#FF5A00] opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-300" />
                            <ShieldCheck className="w-6 h-6 text-[#FF5A00]" />
                        </div>
                        <h1 className="text-xl font-semibold text-white tracking-wide">Acceso Trainer</h1>
                        <p className="text-xs text-gray-400 mt-1.5 text-center px-4">
                            Ingresa tu clave de Trainer para acceder al dashboard de curva de aprendizaje.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="trainer-password" className="text-xs font-medium text-gray-300 tracking-wider uppercase pl-0.5">
                                Contraseña Trainer
                            </label>
                            <div className="relative w-full">
                                <input
                                    id="trainer-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading || success}
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#0d0e12]/80 border border-white/[0.08] focus:border-[#FF5A00]/70 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-300 pr-11 shadow-inner shadow-black/40"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="relative overflow-hidden w-full bg-[#FF5A00] hover:bg-[#E04F00] active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-75 shadow-lg shadow-[#FF5A00]/25 mt-2 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : success ? (
                                <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                            ) : (
                                'Entrar al Dashboard'
                            )}
                            {success && <span>Acceso Autorizado</span>}
                        </button>
                    </form>

                    <div className="h-10 mt-4 flex items-center justify-center w-full">
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-md text-xs w-full justify-center">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Volver al inicio */}
                    <a href="/" className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                        ← Volver al acceso de operador
                    </a>
                </div>
            </div>
        </main>
    );
}
