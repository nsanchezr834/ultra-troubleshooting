'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users, TrendingUp, BookOpenCheck, LogOut,
    ChevronDown, BarChart3, Target, Clock, Award,
    Plus, X, Copy, Check, RefreshCw, ShieldOff,
} from 'lucide-react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingSession {
    id: string;
    name: string;
    trainer: string;
    pin: string;
    active: boolean;
    created_at: string;
}

interface ExamResult {
    id: string;
    trainee_id: string;
    session_id: string;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    duration_sec: number | null;
    attempt_number: number;
    taken_at: string;
    trainees: { full_name: string } | null;
    answers?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(sec: number | null): string {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── Modal Nueva Sesión ───────────────────────────────────────────────────────

interface NewSessionModalProps {
    onClose: () => void;
    onCreated: (session: TrainingSession) => void;
}

function NewSessionModal({ onClose, onCreated }: NewSessionModalProps) {
    const [name, setName] = useState('');
    const [trainer, setTrainer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState<TrainingSession | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/trainer/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, trainer }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear la sesión.');
            setCreated(data.session);
            onCreated(data.session);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error desconocido.');
        } finally {
            setLoading(false);
        }
    };

    const copyPin = () => {
        if (!created) return;
        navigator.clipboard.writeText(created.pin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#161820] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-black text-white text-base">Nueva Sesión de Training</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!created ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <p className="text-xs text-neutral-500">
                                Se generará un PIN de 6 dígitos automáticamente. Compártelo con tus trainees para que sus resultados queden registrados bajo esta sesión.
                            </p>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Nombre de la sesión *</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ej: Turno Mañana — Junio 2026"
                                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff4f00] transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tu nombre (Trainer) *</label>
                                <input
                                    required
                                    value={trainer}
                                    onChange={e => setTrainer(e.target.value)}
                                    placeholder="Nombre completo del Trainer"
                                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff4f00] transition-all"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Plus className="w-4 h-4" /> Crear sesión y generar PIN</>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* ── Sesión creada: mostrar PIN ── */
                        <div className="flex flex-col items-center gap-6 py-2">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Check className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Sesión creada</p>
                                <h3 className="text-lg font-black text-white mb-1">{created.name}</h3>
                                <p className="text-xs text-neutral-500">Trainer: {created.trainer}</p>
                            </div>

                            {/* PIN destacado */}
                            <div className="w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-5 flex flex-col items-center gap-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">PIN de Sesión</p>
                                <div className="text-5xl font-black tracking-[0.4em] text-[#ff4f00]">
                                    {created.pin}
                                </div>
                                <button
                                    onClick={copyPin}
                                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                                        copied
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                                    }`}
                                >
                                    {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar PIN</>}
                                </button>
                                <p className="text-[11px] text-neutral-600 text-center max-w-xs">
                                    Comparte este PIN con tus trainees. Lo usarán junto a su nombre al iniciar el examen.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                            >
                                Ver en el dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TrainerClient() {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [showNewSession, setShowNewSession] = useState(false);
    const [closingSession, setClosingSession] = useState(false);
    const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        const { data, error } = await supabase
            .from('training_sessions')
            .select('id, name, trainer, pin, active, created_at')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSessions(data);
            if (data.length > 0 && !selectedSessionId) {
                setSelectedSessionId(data[0].id);
            }
        }
        setLoadingSessions(false);
    }, [selectedSessionId]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    useEffect(() => {
        if (!selectedSessionId) return;
        setLoadingResults(true);

        async function fetchResults() {
            const { data, error } = await supabase
                .from('exam_results')
                .select('*, trainees(full_name)')
                .eq('session_id', selectedSessionId)
                .order('taken_at', { ascending: true });

            if (!error && data) setResults(data as ExamResult[]);
            setLoadingResults(false);
        }
        fetchResults();
    }, [selectedSessionId]);

    const handleSessionCreated = (session: TrainingSession) => {
        setSessions(prev => [session, ...prev]);
        setSelectedSessionId(session.id);
    };

    const handleCloseSession = async () => {
        if (!selectedSessionId || closingSession) return;
        const confirm = window.confirm('¿Cerrar esta sesión? Los trainees ya no podrán registrar nuevos resultados con este PIN.');
        if (!confirm) return;

        setClosingSession(true);
        try {
            await fetch('/api/trainer/create-session', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: selectedSessionId }),
            });
            setSessions(prev => prev.map(s =>
                s.id === selectedSessionId ? { ...s, active: false } : s
            ));
        } finally {
            setClosingSession(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/trainer-logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/trainer';
    };

    // Métricas
    const totalAttempts = results.length;
    const uniqueTrainees = new Set(results.map(r => r.trainee_id)).size;
    const passRate = totalAttempts > 0
        ? Math.round((results.filter(r => r.passed).length / totalAttempts) * 100)
        : 0;
    const avgScore = totalAttempts > 0
        ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalAttempts)
        : 0;

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    // Agrupar por trainee
    const traineeMap = new Map<string, { name: string; attempts: ExamResult[] }>();
    results.forEach(r => {
        const name = r.trainees?.full_name ?? 'Sin nombre';
        if (!traineeMap.has(r.trainee_id)) {
            traineeMap.set(r.trainee_id, { name, attempts: [] });
        }
        traineeMap.get(r.trainee_id)!.attempts.push(r);
    });
    const trainees = Array.from(traineeMap.entries()).sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
    );

    return (
        <div className="min-h-screen bg-[#0f1015] text-neutral-100 font-sans">
            {showNewSession && (
                <NewSessionModal
                    onClose={() => setShowNewSession(false)}
                    onCreated={handleSessionCreated}
                />
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-[#0f1015]/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-28 h-8">
                        <Image
                            src="/ultra_logo.png"
                            alt="Ultra Logo"
                            fill
                            sizes="112px"
                            className="object-contain brightness-0 invert"
                            priority
                        />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#ff4f00] border border-[#ff4f00]/30 px-2 py-0.5 rounded-md">
                        Trainer
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                </button>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

                {/* ── Título + controles de sesión ───────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-black text-white">Dashboard de Training</h1>
                        <p className="text-sm text-neutral-500">Curva de aprendizaje y métricas por sesión.</p>
                    </div>

                    <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
                        {/* PIN de la sesión seleccionada */}
                        {selectedSession && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                                selectedSession.active
                                    ? 'border-[#ff4f00]/30 bg-[#ff4f00]/5 text-[#ff4f00]'
                                    : 'border-neutral-700 bg-neutral-800/50 text-neutral-500'
                            }`}>
                                PIN: {selectedSession.pin}
                                {selectedSession.active ? ' 🟢' : ' ⛔'}
                            </div>
                        )}

                        {/* Selector de sesión */}
                        <div className="relative">
                            <select
                                value={selectedSessionId}
                                onChange={e => setSelectedSessionId(e.target.value)}
                                disabled={loadingSessions}
                                className="appearance-none bg-neutral-900 border border-neutral-700 text-sm text-white rounded-xl px-4 py-2.5 pr-9 focus:outline-none focus:border-[#ff4f00] transition-all cursor-pointer"
                            >
                                {loadingSessions && <option>Cargando...</option>}
                                {sessions.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.active ? '' : '(cerrada)'}
                                    </option>
                                ))}
                                {!loadingSessions && sessions.length === 0 && (
                                    <option value="">Sin sesiones</option>
                                )}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>

                        {/* Cerrar sesión activa */}
                        {selectedSession?.active && (
                            <button
                                onClick={handleCloseSession}
                                disabled={closingSession}
                                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 border border-neutral-700 hover:border-red-500/30 px-3 py-2.5 rounded-xl transition-all"
                                title="Cerrar sesión (deshabilitar PIN)"
                            >
                                <ShieldOff className="w-3.5 h-3.5" />
                                Cerrar sesión
                            </button>
                        )}

                        {/* Nueva sesión */}
                        <button
                            onClick={() => setShowNewSession(true)}
                            className="flex items-center gap-2 text-sm font-bold bg-[#ff4f00] hover:bg-[#e04500] text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva sesión
                        </button>
                    </div>
                </div>

                {/* ── Métricas ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: 'Participantes', value: uniqueTrainees, color: 'text-blue-400' },
                        { icon: BookOpenCheck, label: 'Intentos totales', value: totalAttempts, color: 'text-purple-400' },
                        { icon: Target, label: '% Aprobación', value: `${passRate}%`, color: passRate >= 80 ? 'text-emerald-400' : 'text-red-400' },
                        { icon: BarChart3, label: 'Promedio', value: `${avgScore}%`, color: 'text-[#ff4f00]' },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
                            </div>
                            <span className={`text-3xl font-black ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* ── Resultados por trainee ─────────────────────────────── */}
                {loadingResults ? (
                    <div className="text-center py-16 text-neutral-500 text-sm">Cargando resultados...</div>
                ) : sessions.length === 0 ? (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
                        <Plus className="w-10 h-10 text-neutral-700" />
                        <p className="text-neutral-400 font-bold">No hay sesiones creadas aún</p>
                        <p className="text-neutral-600 text-sm max-w-sm">Crea tu primera sesión de training con el botón <strong className="text-neutral-400">"Nueva sesión"</strong> para generar un PIN y comenzar a registrar métricas.</p>
                        <button
                            onClick={() => setShowNewSession(true)}
                            className="mt-2 flex items-center gap-2 text-sm font-bold bg-[#ff4f00] hover:bg-[#e04500] text-white px-5 py-2.5 rounded-xl transition-all"
                        >
                            <Plus className="w-4 h-4" /> Crear primera sesión
                        </button>
                    </div>
                ) : trainees.length === 0 ? (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
                        <TrendingUp className="w-10 h-10 text-neutral-700" />
                        <p className="text-neutral-500 text-sm">Aún no hay resultados en esta sesión.</p>
                        {selectedSession && (
                            <p className="text-neutral-600 text-xs max-w-xs">
                                Comparte el PIN <span className="font-mono font-black text-[#ff4f00]">{selectedSession.pin}</span> con tus trainees. Los resultados aparecerán aquí cuando completen el examen.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                            Resultados por participante — {trainees.length} trainee{trainees.length !== 1 ? 's' : ''}
                        </h2>
                        {trainees.map(([traineeId, { name, attempts }]) => {
                            const best = Math.max(...attempts.map(a => a.percentage));
                            const last = attempts[attempts.length - 1];
                            const passed = attempts.some(a => a.passed);
                            return (
                                <div key={traineeId} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${
                                                passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{name}</p>
                                                <p className="text-[11px] text-neutral-500">{attempts.length} intento{attempts.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] text-neutral-600 uppercase font-bold">Mejor</p>
                                                <p className={`text-xl font-black ${best >= 80 ? 'text-emerald-400' : 'text-red-400'}`}>{best}%</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                                {passed ? '✓ Aprobado' : '✗ Pendiente'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Curva de aprendizaje */}
                                    <div className="px-5 py-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-3">Progresión de intentos</p>
                                        <div className="flex items-end gap-2 h-16">
                                            {attempts.map((a, idx) => (
                                                <div key={a.id} className="flex flex-col items-center gap-1 flex-1 min-w-0 group cursor-default" title={`Intento ${idx + 1}: ${a.percentage}% — ${formatDate(a.taken_at)}`}>
                                                    <span className="text-[9px] text-neutral-500 font-bold group-hover:text-white transition-colors">{a.percentage}%</span>
                                                    <div
                                                        className={`w-full rounded-t transition-all group-hover:opacity-80 ${a.passed ? 'bg-emerald-500' : a.percentage >= 60 ? 'bg-amber-500' : 'bg-[#ff4f00]'}`}
                                                        style={{ height: `${Math.max(4, (a.percentage / 100) * 40)}px` }}
                                                    />
                                                    <span className="text-[9px] text-neutral-700">#{idx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {last && (
                                        <div className="px-5 pb-4 flex flex-wrap gap-4 text-[11px] text-neutral-500">
                                            <span className="flex items-center gap-1.5">
                                                <Award className="w-3 h-3" />
                                                Último: {last.score}/{last.max_score} ({last.percentage}%)
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {formatDuration(last.duration_sec)}
                                            </span>
                                            <span>{formatDate(last.taken_at)}</span>
                                        </div>
                                    )}

                                    {/* Desglose por Intento (Preguntas correctas e incorrectas) */}
                                    <div className="px-5 py-3 border-t border-neutral-800/50 bg-neutral-950/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Respuestas por intento</p>
                                        <div className="flex flex-col gap-2">
                                            {attempts.map((a, idx) => {
                                                const isExpanded = expandedAttemptId === a.id;
                                                return (
                                                    <div key={a.id} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
                                                        <button
                                                            onClick={() => setExpandedAttemptId(isExpanded ? null : a.id)}
                                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/40 transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-3.5">
                                                                <span className="text-xs font-bold text-neutral-400">Intento #{idx + 1}</span>
                                                                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                                                                    a.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                                }`}>
                                                                    {a.percentage}%
                                                                </span>
                                                                <span className="text-[11px] text-neutral-500 hidden sm:inline">
                                                                    ({a.score}/{a.max_score} aciertos)
                                                                </span>
                                                                <span className="text-xs text-neutral-600">
                                                                    {formatDuration(a.duration_sec)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[11px] text-neutral-600 hidden md:inline">
                                                                    {formatDate(a.taken_at)}
                                                                </span>
                                                                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="px-4 pb-4 pt-2 border-t border-neutral-800 bg-[#0d0e12]/60 flex flex-col gap-3">
                                                                {a.answers && Array.isArray(a.answers) && a.answers.length > 0 ? (
                                                                    a.answers.map((ans: any, qIdx: number) => (
                                                                        <div key={ans.questionId || qIdx} className="text-xs border-b border-neutral-800/40 pb-2.5 last:border-0 last:pb-0">
                                                                            <p className="font-bold text-neutral-300 mb-1">
                                                                                {qIdx + 1}. {ans.questionText}
                                                                            </p>
                                                                            <div className="flex flex-col gap-0.5 pl-3">
                                                                                <p className={ans.isCorrect ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                                                                                    <span className="font-bold text-neutral-500">Seleccionado:</span> {ans.selectedText}
                                                                                    {ans.isCorrect ? ' ✓' : ' ✗'}
                                                                                </p>
                                                                                {!ans.isCorrect && (
                                                                                    <p className="text-emerald-400 font-medium">
                                                                                        <span className="font-bold text-neutral-500">Correcta:</span> {ans.correctText}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-xs text-neutral-500">No hay detalles de respuestas guardados para este intento.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
