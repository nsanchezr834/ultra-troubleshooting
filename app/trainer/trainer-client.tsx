'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users, TrendingUp, BookOpenCheck, LogOut,
    ChevronDown, BarChart3, Target, Clock, Award,
    Plus, X, Copy, Check, RefreshCw, ShieldOff,
    Download, ShieldAlert, Edit, Trash2, CheckCircle2,
    Eye, EyeOff
} from 'lucide-react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';

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
    training_sessions?: { name: string } | null;
    answers?: any;
}

interface DBQuestion {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
    difficulty: 'facil' | 'media' | 'dificil';
    is_active: boolean;
    created_at?: string;
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

function getExamLevel(r: ExamResult): string {
    if (r.answers && Array.isArray(r.answers)) {
        const levelObj = r.answers.find((ans: any) => ans.questionId === 'exam_level');
        if (levelObj) return levelObj.selectedText;
    }
    return 'Training'; // Fallback
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
                        <div className="flex flex-col items-center gap-6 py-2">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Check className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Sesión creada</p>
                                <h3 className="text-lg font-black text-white mb-1">{created.name}</h3>
                                <p className="text-xs text-neutral-500">Trainer: {created.trainer}</p>
                            </div>
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
    const [analyzingTrainee, setAnalyzingTrainee] = useState<{
        name: string;
        attempts: any[];
    } | null>(null);
    const [selectedFaultDetail, setSelectedFaultDetail] = useState<{
        questionText: string;
        correctText: string;
        isSim: boolean;
        count: number;
        wrongSelections: { text: string; count: number }[];
    } | null>(null);

    // Navegación de pestañas: 'results' (Resultados) o 'questions' (Banco de Preguntas)
    const [activeTab, setActiveTab] = useState<'results' | 'questions'>('results');

    // Estado para las Preguntas del Banco
    const [dbQuestions, setDbQuestions] = useState<DBQuestion[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Partial<DBQuestion> | null>(null);
    const [questionError, setQuestionError] = useState('');
    const [savingQuestion, setSavingQuestion] = useState(false);

    // Filtros de búsqueda para resultados
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
    const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'theory' | 'simulation'>('all');

    const formatDurationMinutes = (sec: number | null): string => {
        if (!sec) return '—';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    const fetchSessions = useCallback(async () => {
        const { data, error } = await supabase
            .from('training_sessions')
            .select('id, name, trainer, pin, active, created_at')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSessions(data);
            if (data.length > 0 && !selectedSessionId) {
                setSelectedSessionId('all');
            }
        }
        setLoadingSessions(false);
    }, [selectedSessionId]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    useEffect(() => {
        if (!selectedSessionId) return;
        setLoadingResults(true);

        async function fetchResults() {
            let query = supabase
                .from('exam_results')
                .select('*, trainees(full_name), training_sessions(name)');
            
            if (selectedSessionId !== 'all') {
                query = query.eq('session_id', selectedSessionId);
            }

            const { data, error } = await query.order('taken_at', { ascending: true });

            if (!error && data) setResults(data as ExamResult[]);
            setLoadingResults(false);
        }
        fetchResults();
    }, [selectedSessionId]);

    // Fetch Banco de Preguntas
    const fetchQuestions = useCallback(async () => {
        setLoadingQuestions(true);
        const { data, error } = await supabase
            .from('exam_questions')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) {
            setDbQuestions(data as DBQuestion[]);
        }
        setLoadingQuestions(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'questions') {
            fetchQuestions();
        }
    }, [activeTab, fetchQuestions]);

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

    // Filtrar los results según los criterios de búsqueda, fecha y tipo de examen
    const filteredResults = results.filter(r => {
        const name = r.trainees?.full_name ?? 'Sin nombre';
        if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        if (dateFilter !== 'all') {
            const takenDate = new Date(r.taken_at);
            const now = new Date();
            if (dateFilter === 'today') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (takenDate < today) return false;
            } else if (dateFilter === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (takenDate < oneWeekAgo) return false;
            } else if (dateFilter === 'month') {
                const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                if (takenDate < thisMonth) return false;
            }
        }

        if (examTypeFilter !== 'all') {
            const isSimulation = r.answers && Array.isArray(r.answers) && r.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
            if (examTypeFilter === 'theory' && isSimulation) return false;
            if (examTypeFilter === 'simulation' && !isSimulation) return false;
        }

        return true;
    });

    // Métricas basadas en resultados filtrados
    const totalAttempts = filteredResults.length;
    const uniqueTrainees = new Set(filteredResults.map(r => r.trainee_id)).size;
    const passRate = totalAttempts > 0
        ? Math.round((filteredResults.filter(r => r.passed).length / totalAttempts) * 100)
        : 0;
    const avgScore = totalAttempts > 0
        ? Math.round(filteredResults.reduce((acc, r) => acc + r.percentage, 0) / totalAttempts)
        : 0;

    const attemptsWithDuration = filteredResults.filter(r => r.duration_sec !== null);
    const avgDurationSec = attemptsWithDuration.length > 0
        ? Math.round(attemptsWithDuration.reduce((acc, r) => acc + (r.duration_sec ?? 0), 0) / attemptsWithDuration.length)
        : 0;

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    const traineeMap = new Map<string, { name: string; attempts: ExamResult[] }>();
    filteredResults.forEach(r => {
        const name = r.trainees?.full_name ?? 'Sin nombre';
        const cleanName = name.trim();
        const normalizedKey = cleanName.toLowerCase();
        
        if (!traineeMap.has(normalizedKey)) {
            const formattedDisplay = cleanName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            traineeMap.set(normalizedKey, { name: formattedDisplay, attempts: [] });
        }
        traineeMap.get(normalizedKey)!.attempts.push(r);
    });

    let traineesList = Array.from(traineeMap.entries());
    if (statusFilter !== 'all') {
        traineesList = traineesList.filter(([_, data]) => {
            const passed = data.attempts.some(a => a.passed);
            return statusFilter === 'passed' ? passed : !passed;
        });
    }

    const trainees = traineesList.sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
    );

    // Calcular errores más comunes (Puntos de Refuerzo / Heatmaps)
    const getCommonFaults = () => {
        const errorCounts: Record<string, { count: number; correctText: string; isSim: boolean; wrongSelections: Record<string, number> }> = {};
        
        filteredResults.forEach(r => {
            if (r.answers && Array.isArray(r.answers)) {
                r.answers.forEach((ans: any) => {
                    if (ans.isCorrect === false) {
                        const key = ans.questionText || 'Pregunta';
                        const isSimulation = ans.questionId?.startsWith('sq');
                        if (!errorCounts[key]) {
                            errorCounts[key] = {
                                count: 0,
                                correctText: ans.correctText || 'N/A',
                                isSim: isSimulation,
                                wrongSelections: {}
                            };
                        }
                        errorCounts[key].count += 1;
                        if (ans.selectedText) {
                            errorCounts[key].wrongSelections[ans.selectedText] = (errorCounts[key].wrongSelections[ans.selectedText] || 0) + 1;
                        }
                    }
                });
            }
        });

        return Object.entries(errorCounts)
            .map(([questionText, data]) => {
                const wrongSelectionsArray = Object.entries(data.wrongSelections)
                    .sort((a, b) => b[1] - a[1])
                    .map(([text, count]) => ({ text, count }));
                return {
                    questionText,
                    count: data.count,
                    correctText: data.correctText,
                    isSim: data.isSim,
                    wrongSelections: wrongSelectionsArray
                };
            })
            .sort((a, b) => b.count - a.count);
    };

    const commonFaults = getCommonFaults().slice(0, 5);

    // 📄 GENERAR PDF DE RETROALIMENTACIÓN PARA ÁREAS DE REFUERZO (jsPDF)
    const handleGenerateFeedbackPDF = (traineeName: string, attempts: ExamResult[]) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 🎨 Paleta de colores Premium
        const primaryColor = [255, 79, 0]; // Naranja Ultra
        const darkBg = [22, 24, 32];
        const textColor = [255, 255, 255];
        const lightGray = [240, 242, 245];
        
        // --- PAGINA 1: Encabezado y Resumen Técnico ---
        // Header Banner Oscuro
        doc.setFillColor(22, 24, 32);
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('ULTRA PLATFORM', 15, 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text('REPORTE INDIVIDUAL DE RETROALIMENTACIÓN Y ÁREAS DE REFUERZO', 15, 27);
        
        // Fecha de emisión
        const currentDate = new Date().toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Fecha de Emisión: ${currentDate}`, 15, 35);
        
        // Separador Naranja
        doc.setFillColor(255, 79, 0);
        doc.rect(0, 45, 210, 2, 'F');
        
        // Datos del Trainee
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Información General del Participante', 15, 60);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre completo: ${traineeName}`, 15, 68);
        
        const totalIntentos = attempts.length;
        const bestScore = Math.max(...attempts.map(a => a.percentage));
        const passed = attempts.some(a => a.passed);
        
        doc.text(`Total de intentos registrados: ${totalIntentos}`, 15, 74);
        doc.text(`Mejor porcentaje alcanzado: ${bestScore}%`, 15, 80);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(passed ? 16 : 239, passed ? 185 : 68, passed ? 129 : 68);
        doc.text(`Estado de Acreditación Técnico: ${passed ? 'APROBADO ✓' : 'PENDIENTE DE APROBACIÓN ✗'}`, 15, 87);
        
        // Caja de Alerta si requiere refuerzo urgente
        if (totalIntentos >= 3 && !passed) {
            doc.setFillColor(254, 243, 199); // Amarillo claro
            doc.setDrawColor(245, 158, 11);
            doc.rect(15, 93, 180, 15, 'FD');
            doc.setTextColor(180, 83, 9);
            doc.setFontSize(8.5);
            doc.text('ATENCIÓN: Este participante ha fallado 3 o más intentos. Es imperativo revisar las sugerencias de', 20, 99);
            doc.text('estudio y videos de soporte abajo detallados antes de permitirle realizar una nueva evaluación.', 20, 103);
        }
        
        // --- SECCIÓN: Análisis de Preguntas Falladas y Sugerencias de Estudio ---
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Detección de Áreas Críticas & Conceptos Erróneos', 15, 120);
        
        // Obtener preguntas incorrectas y acumularlas
        const wrongQuestions: { text: string; correctText: string; selectedText: string; count: number }[] = [];
        attempts.forEach(a => {
            if (a.answers && Array.isArray(a.answers)) {
                a.answers.forEach((ans: any) => {
                    if (ans.isCorrect === false && ans.questionText) {
                        const existing = wrongQuestions.find(w => w.text === ans.questionText);
                        if (existing) {
                            existing.count++;
                        } else {
                            wrongQuestions.push({
                                text: ans.questionText,
                                correctText: ans.correctText || 'N/A',
                                selectedText: ans.selectedText || 'N/A',
                                count: 1
                            });
                        }
                    }
                });
            }
        });
        
        let yPos = 130;
        
        if (wrongQuestions.length === 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Excelente desempeño. El participante no registra errores conceptuales persistentes.', 15, yPos);
        } else {
            // Listar hasta 3 errores con recomendaciones de SOP / Videos
            wrongQuestions.slice(0, 3).forEach((wq, index) => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFillColor(248, 249, 250);
                doc.setDrawColor(220, 224, 230);
                doc.rect(15, yPos, 180, 38, 'FD');
                
                doc.setTextColor(255, 79, 0);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.text(`Punto de Refuerzo #${index + 1} (Fallo detectado ${wq.count} vez/veces)`, 18, yPos + 6);
                
                doc.setTextColor(60, 60, 60);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                
                // Truncar textos largos para que quepan
                const cleanText = wq.text.length > 95 ? wq.text.substring(0, 92) + '...' : wq.text;
                const cleanCorrect = wq.correctText.length > 90 ? wq.correctText.substring(0, 87) + '...' : wq.correctText;
                const cleanSelected = wq.selectedText.length > 90 ? wq.selectedText.substring(0, 87) + '...' : wq.selectedText;
                
                doc.text(`Pregunta: ${cleanText}`, 18, yPos + 12);
                doc.text(`Respuesta Correcta: ${cleanCorrect}`, 18, yPos + 18);
                doc.setTextColor(239, 68, 68);
                doc.text(`Respuesta Seleccionada: ${cleanSelected}`, 18, yPos + 23);
                
                // Mapear temas a Videos / Guías / SOPs específicos de Ultra
                doc.setTextColor(50, 50, 50);
                doc.setFont('helvetica', 'bold');
                let recommendation = "Recomendación: Repasar el Manual de Operación Básico.";
                if (wq.text.toLowerCase().includes('auto') || wq.text.toLowerCase().includes('joystick') || wq.text.toLowerCase().includes('intervenir')) {
                    recommendation = "Recomendación: Repasar Video de Sincronización del Joystick en Modo AUTO (Caso 3).";
                } else if (wq.text.toLowerCase().includes('batería') || wq.text.toLowerCase().includes('headset') || wq.text.toLowerCase().includes('cargador') || wq.text.toLowerCase().includes('apaga')) {
                    recommendation = "Recomendación: Validar SOP de carga y conexión de Headset / Tomas de corriente naranja.";
                } else if (wq.text.toLowerCase().includes('brazo') || wq.text.toLowerCase().includes('desprendio') || wq.text.toLowerCase().includes('seguridad')) {
                    recommendation = "Recomendación: Estudiar el Caso de Seguridad 4 sobre desprendimiento de brazo y Home.";
                } else if (wq.text.toLowerCase().includes('mismatch') || wq.text.toLowerCase().includes('modo auto')) {
                    recommendation = "Recomendación: Estudiar caso 3 (Operator & AUTO mismatch) e instrucciones de Joystick 'A'.";
                }
                
                doc.text(recommendation, 18, yPos + 31);
                yPos += 44;
            });
        }
        
        // --- SECCIÓN: Videos y SOPs a Revisar ---
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Material Multimedia y Guías de Apoyo Mandatorias', 15, yPos + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Indique al participante repasar los siguientes recursos antes de reprogramar su examen:', 15, yPos + 11);
        
        // Recursos recomendados
        let resourceY = yPos + 18;
        const resources = [
            '• Video Caso 3: Mala sincronización / Joystick letra A en modo AUTO.',
            '• Video Caso 4: Desprendimiento del brazo físico y protocolo seguro de HOME.',
            '• Sección de Consejos de la estación en el simulador.',
            '• SOP de Conexión Naranja Regulada para alimentación del visor.'
        ];
        
        resources.forEach(r => {
            doc.text(r, 20, resourceY);
            resourceY += 6;
        });
        
        // Footer final del reporte
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 280, 210, 17, 'F');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Ultra Platform — Reporte Automatizado de Áreas de Refuerzo para Instructores y Trainers.', 15, 287);
        doc.text('Confidencial. Para uso exclusivo del departamento de Capacitación de Ultra.', 15, 291);

        // Descargar PDF
        const pdfFileName = `Retroalimentacion_${traineeName.replace(/\s+/g, '_')}.pdf`;
        doc.save(pdfFileName);
    };

    // --- ACCIONES DEL BANCO DE PREGUNTAS (Visual No-Code) ---
    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuestionError('');
        setSavingQuestion(true);

        const q = editingQuestion;
        if (!q || !q.question || !q.options || q.options.length < 2 || q.correct_index === undefined) {
            setQuestionError('Completa todos los campos obligatorios. Debes ingresar al menos 2 opciones de respuesta.');
            setSavingQuestion(false);
            return;
        }

        try {
            if (q.id) {
                // Modificar pregunta existente
                const { error } = await supabase
                    .from('exam_questions')
                    .update({
                        question: q.question,
                        options: q.options,
                        correct_index: q.correct_index,
                        explanation: q.explanation || '',
                        difficulty: q.difficulty || 'media',
                        is_active: q.is_active !== undefined ? q.is_active : true
                    })
                    .eq('id', q.id);
                if (error) throw error;
            } else {
                // Crear nueva pregunta (generando un UUID en postgres o localmente)
                const newId = crypto.randomUUID();
                const { error } = await supabase
                    .from('exam_questions')
                    .insert({
                        id: newId,
                        question: q.question,
                        options: q.options,
                        correct_index: q.correct_index,
                        explanation: q.explanation || '',
                        difficulty: q.difficulty || 'media',
                        is_active: true
                    });
                if (error) throw error;
            }
            setEditingQuestion(null);
            fetchQuestions();
        } catch (err: any) {
            setQuestionError(err.message || 'Error al guardar la pregunta.');
        } finally {
            setSavingQuestion(false);
        }
    };

    const handleToggleQuestionActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('exam_questions')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            if (error) throw error;
            setDbQuestions(prev => prev.map(q => q.id === id ? { ...q, is_active: !currentStatus } : q));
        } catch (err: any) {
            alert('Error al actualizar el estado de la pregunta: ' + err.message);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        const confirm = window.confirm('¿Seguro que deseas eliminar esta pregunta del banco permanentemente?');
        if (!confirm) return;
        try {
            const { error } = await supabase
                .from('exam_questions')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setDbQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err: any) {
            alert('Error al eliminar la pregunta: ' + err.message);
        }
    };

    const renderAnalysisModal = () => {
        if (!analyzingTrainee) return null;

        const { name, attempts } = analyzingTrainee;

        const questionStats: Record<string, {
            questionText: string;
            times: number[];
            correctCount: number;
            totalCount: number;
            lastCorrect: boolean;
            isSim: boolean;
        }> = {};

        attempts.forEach(a => {
            if (a.answers && Array.isArray(a.answers)) {
                const isSim = a.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
                a.answers.forEach((ans: any) => {
                    if (ans.questionId === 'exam_level' || ans.questionId === 'feedback_rating') return;
                    if (typeof ans.timeSpentSeconds === 'number') {
                        const key = ans.questionText || ans.questionId;
                        if (!questionStats[key]) {
                            questionStats[key] = {
                                questionText: ans.questionText,
                                times: [],
                                correctCount: 0,
                                totalCount: 0,
                                lastCorrect: ans.isCorrect,
                                isSim
                            };
                        }
                        questionStats[key].times.push(ans.timeSpentSeconds);
                        questionStats[key].totalCount += 1;
                        if (ans.isCorrect) {
                            questionStats[key].correctCount += 1;
                        }
                        questionStats[key].lastCorrect = ans.isCorrect;
                    }
                });
            }
        });

        const sortedQuestions = Object.values(questionStats)
            .map(q => {
                const avgTime = q.times.reduce((sum, t) => sum + t, 0) / q.times.length;
                return { ...q, avgTime };
            })
            .sort((a, b) => b.avgTime - a.avgTime);

        const questionsWithTimes = sortedQuestions.filter(q => q.avgTime > 0);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#161820] border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                        <div>
                            <h2 className="font-black text-white text-base">Análisis de Dudas y Tiempos</h2>
                            <p className="text-xs text-[#ff4f00] font-bold mt-0.5">{name}</p>
                        </div>
                        <button onClick={() => setAnalyzingTrainee(null)} className="text-neutral-500 hover:text-white transition-colors p-1 rounded-full hover:bg-neutral-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex flex-col gap-6">
                        {/* BOTÓN REPORTE GENERATIVO PDF */}
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reporte de Retroalimentación Técnica</h4>
                                <p className="text-[11px] text-neutral-500 mt-0.5">Genera un PDF con las debilidades del participante y recomendaciones de videos.</p>
                            </div>
                            <button
                                onClick={() => handleGenerateFeedbackPDF(name, attempts)}
                                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Generar reporte de retroalimentación para áreas de refuerzo
                            </button>
                        </div>

                        {questionsWithTimes.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                                <Clock className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
                                <p className="font-bold text-sm">Sin datos de tiempo por pregunta</p>
                                <p className="text-xs text-neutral-600 mt-1 max-w-xs mx-auto">
                                    Los intentos cargados no tienen registro de tiempo por pregunta o son anteriores a la actualización.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Preguntas con Mayor Tiempo de Respuesta</h3>
                                    <div className="flex flex-col gap-4">
                                        {questionsWithTimes.slice(0, 3).map((q, idx) => {
                                            const isWrong = !q.lastCorrect;
                                            let severityColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                                            let advice = "";

                                            if (isWrong) {
                                                severityColor = "bg-red-500/10 border-red-500/20 text-red-400";
                                                advice = "🔴 Alto riesgo de duda conceptual: El alumno pasó mucho tiempo analizando esta pregunta y su última respuesta fue incorrecta. Se sugiere repasar este tema con el participante.";
                                            } else if (q.avgTime > 15) {
                                                severityColor = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
                                                advice = "🟡 Posible inseguridad: El alumno respondió correctamente, pero le tomó bastante tiempo decidirse. Puede que dude o no esté 100% seguro del concepto.";
                                            } else {
                                                advice = "🟢 Proceso normal: El alumno domina este concepto aunque le tomó un momento leerlo.";
                                            }

                                            return (
                                                <div key={idx} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span className="text-xs font-black text-[#ff4f00]">Top {idx + 1}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-neutral-400 font-bold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                                                                {q.isSim ? 'Simulación' : 'Teórico'}
                                                            </span>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${severityColor}`}>
                                                                Tiempo prom: {Math.round(q.avgTime)}s
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-white leading-relaxed">{q.questionText}</p>
                                                    <div className="text-xs text-neutral-400 bg-neutral-950/40 p-2.5 rounded border border-neutral-800/80">
                                                        <p className="font-medium mb-1">
                                                            Precisión histórica: <span className={q.correctCount === q.totalCount ? 'text-emerald-400 font-bold' : 'text-neutral-300'}>{q.correctCount}/{q.totalCount} aciertos</span>
                                                        </p>
                                                        <p className="text-[11px] leading-relaxed text-neutral-500 mt-1.5">{advice}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t border-neutral-800 pt-4">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Recomendación General</h3>
                                    <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                        Analizar las preguntas donde el trainee se tarda más tiempo permite identificar temas específicos que le causan confusión o inseguridad en la toma de decisiones, incluso si al final responde de manera correcta. Agenda una sesión corta de retroalimentación enfocándose en los conceptos resaltados arriba.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-neutral-900/50 border-t border-neutral-800 px-6 py-4 flex justify-end shrink-0">
                        <button onClick={() => setAnalyzingTrainee(null)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-5 py-2 rounded-xl transition-all text-xs">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Exportar datos filtrados a CSV para Google Sheets
    const handleExportCSV = () => {
        const headers = [
            'Nombre del Participante',
            'Grupo de Estudio (Sesión)',
            'Tipo de Examen',
            'Fecha y Hora',
            'Aciertos',
            'Preguntas Totales',
            'Precisión %',
            'Resultado',
            'Duración',
            'Intento #'
        ];

        const csvRows = filteredResults.map(r => {
            const name = r.trainees?.full_name ?? 'Sin nombre';
            const groupName = r.training_sessions?.name ?? 'Sin Grupo';
            
            const isSimulation = r.answers && Array.isArray(r.answers) && r.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
            const level = getExamLevel(r);
            const examType = `${isSimulation ? 'Simulación Práctica' : 'Teórico'} — ${level}`;
            const dateStr = formatDate(r.taken_at);
            const resultStatus = r.passed ? 'APROBADO' : 'FALLADO';
            
            return [
                `"${name.replace(/"/g, '""')}"`,
                `"${groupName.replace(/"/g, '""')}"`,
                `"${examType}"`,
                `"${dateStr}"`,
                r.score,
                r.max_score,
                r.percentage,
                resultStatus,
                formatDuration(r.duration_sec),
                r.attempt_number
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_Capacitacion_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col font-sans select-none antialiased">
            {/* Header */}
            <header className="bg-[#161820] border-b border-neutral-800 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-neutral-700 bg-neutral-900 flex items-center justify-center">
                        <span className="text-[#ff4f00] font-black text-lg">U</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-wider uppercase">Trainer Dashboard</h1>
                        <p className="text-[10px] text-[#ff4f00] font-bold">Ultra Troubleshooting Capacitación</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLogout}
                        className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* Pestañas de Navegación del Trainer */}
            <div className="bg-[#161820]/50 border-b border-neutral-800 px-6 flex items-center justify-start gap-4">
                <button
                    onClick={() => setActiveTab('results')}
                    className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all px-2 ${
                        activeTab === 'results' ? 'border-[#ff4f00] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-350'
                    }`}
                >
                    Resultados de Alumnos
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all px-2 ${
                        activeTab === 'questions' ? 'border-[#ff4f00] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-350'
                    }`}
                >
                    Banco de Preguntas (No-Code)
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-7xl w-full mx-auto">
                
                {activeTab === 'questions' ? (
                    // ─── TAB: BANCO DE PREGUNTAS (NO-CODE EDITOR) ───
                    <div className="flex flex-col gap-6 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-white">Administración del Banco de Preguntas</h2>
                                <p className="text-xs text-neutral-500">Agrega, edita o desactiva preguntas que se muestran en el examen dinámicamente.</p>
                            </div>
                            <button
                                onClick={() => setEditingQuestion({ question: '', options: ['', ''], correct_index: 0, explanation: '', difficulty: 'media', is_active: true })}
                                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" /> Agregar Pregunta
                            </button>
                        </div>

                        {loadingQuestions ? (
                            <div className="text-center py-12 text-neutral-500">Cargando preguntas de Supabase...</div>
                        ) : dbQuestions.length === 0 ? (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-500">
                                <ShieldOff className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
                                <p className="font-bold text-sm">No hay preguntas registradas en el banco</p>
                                <p className="text-xs text-neutral-600 mt-1">Haz clic en "Agregar Pregunta" para crear la primera.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dbQuestions.map((q) => (
                                    <div key={q.id} className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col gap-3.5 transition-all ${q.is_active ? 'border-neutral-800' : 'border-neutral-800/30 opacity-50'}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                                                    q.difficulty === 'facil' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    q.difficulty === 'media' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                                }`}>
                                                    {q.difficulty}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                                                    q.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                                                }`}>
                                                    {q.is_active ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggleQuestionActive(q.id, q.is_active)}
                                                    className="p-1.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all"
                                                    title={q.is_active ? 'Desactivar pregunta' : 'Activar pregunta'}
                                                >
                                                    {q.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => setEditingQuestion(q)}
                                                    className="p-1.5 bg-neutral-850 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-400 hover:text-[#ff4f00] transition-all"
                                                    title="Editar pregunta"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="p-1.5 bg-neutral-850 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-all"
                                                    title="Eliminar pregunta"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-white leading-relaxed">{q.question}</h4>
                                            <ul className="flex flex-col gap-1.5 mt-3">
                                                {q.options.map((opt, idx) => (
                                                    <li key={idx} className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-2.5 ${
                                                        idx === q.correct_index
                                                            ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400 font-bold'
                                                            : 'bg-neutral-950/40 border-neutral-800/40 text-neutral-400'
                                                    }`}>
                                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                                                            idx === q.correct_index ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                                                        }`}>{idx + 1}</span>
                                                        {opt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {q.explanation && (
                                            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-[11px] text-neutral-500 leading-relaxed">
                                                <strong className="text-neutral-400">Explicación:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Modal para crear o editar preguntas */}
                        {editingQuestion && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-[#161820] border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
                                        <h2 className="font-black text-white text-base">
                                            {editingQuestion.id ? 'Editar Pregunta' : 'Nueva Pregunta del Examen'}
                                        </h2>
                                        <button onClick={() => setEditingQuestion(null)} className="text-neutral-500 hover:text-white transition-colors p-1">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto flex flex-col gap-4">
                                        
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Enunciado de la Pregunta *</label>
                                            <textarea
                                                required
                                                rows={2}
                                                value={editingQuestion.question || ''}
                                                onChange={e => setEditingQuestion(prev => ({ ...prev, question: e.target.value }))}
                                                placeholder="Ej: ¿Qué paso se debe seguir si el visor no recibe alimentación eléctrica regulada?"
                                                className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff4f00] transition-all resize-none"
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Dificultad</label>
                                                <select
                                                    value={editingQuestion.difficulty || 'media'}
                                                    onChange={e => setEditingQuestion(prev => ({ ...prev, difficulty: e.target.value as any }))}
                                                    className="bg-neutral-900 border border-neutral-700 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4f00] transition-all cursor-pointer"
                                                >
                                                    <option value="facil">Fácil</option>
                                                    <option value="media">Media</option>
                                                    <option value="dificil">Difícil</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Respuesta Correcta *</label>
                                                <select
                                                    value={editingQuestion.correct_index !== undefined ? editingQuestion.correct_index : 0}
                                                    onChange={e => setEditingQuestion(prev => ({ ...prev, correct_index: parseInt(e.target.value) }))}
                                                    className="bg-neutral-900 border border-neutral-700 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4f00] transition-all cursor-pointer"
                                                >
                                                    {(editingQuestion.options || []).map((_, idx) => (
                                                        <option key={idx} value={idx}>Opción #{idx + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Opciones de Respuesta * (Mínimo 2)</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingQuestion(prev => prev ? ({ ...prev, options: [...(prev.options || []), ''] }) : null)}
                                                    className="text-[10px] font-black uppercase text-[#ff4f00] hover:underline"
                                                >
                                                    + Añadir Opción
                                                </button>
                                            </div>
                                            {(editingQuestion.options || []).map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="text-xs text-neutral-500 font-bold w-4">{idx + 1}.</span>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={opt}
                                                        onChange={e => {
                                                            const nextOpts = [...(editingQuestion.options || [])];
                                                            nextOpts[idx] = e.target.value;
                                                            setEditingQuestion(prev => prev ? ({ ...prev, options: nextOpts }) : null);
                                                        }}
                                                        placeholder={`Opción ${idx + 1}`}
                                                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff4f00] transition-all"
                                                    />
                                                    {(editingQuestion.options || []).length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextOpts = (editingQuestion.options || []).filter((_, i) => i !== idx);
                                                                let nextCorrect = editingQuestion.correct_index || 0;
                                                                if (nextCorrect >= nextOpts.length) {
                                                                    nextCorrect = nextOpts.length - 1;
                                                                }
                                                                setEditingQuestion(prev => prev ? ({ ...prev, options: nextOpts, correct_index: nextCorrect }) : null);
                                                            }}
                                                            className="text-neutral-500 hover:text-red-400 p-2"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Retroalimentación / Explicación</label>
                                            <textarea
                                                rows={2}
                                                value={editingQuestion.explanation || ''}
                                                onChange={e => setEditingQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                                placeholder="Ej: Es indispensable revisar el estado de la batería para evitar apagones y desalineación física."
                                                className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff4f00] transition-all resize-none"
                                            />
                                        </div>

                                        {questionError && (
                                            <p className="text-red-400 text-xs bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2">{questionError}</p>
                                        )}

                                        <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setEditingQuestion(null)}
                                                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={savingQuestion}
                                                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold px-5 py-2 rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {savingQuestion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Guardar Pregunta'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // ─── TAB: RESULTADOS DE ALUMNOS (VISTA TRADICIONAL) ───
                    <div className="flex flex-col gap-6">
                        {/* Selector de Sesión */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Grupo de Estudio / Sesión</label>
                                {loadingSessions ? (
                                    <span className="text-xs text-neutral-500">Cargando sesiones...</span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <select
                                            value={selectedSessionId}
                                            onChange={e => setSelectedSessionId(e.target.value)}
                                            className="bg-neutral-950 border border-neutral-800 text-sm font-bold text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4f00] cursor-pointer"
                                        >
                                            <option value="all">Todos los grupos reunidos</option>
                                            {sessions.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} {s.active ? '(Activo)' : '(Cerrado)'}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        {selectedSessionId !== 'all' && selectedSession && selectedSession.active && (
                                            <div className="flex items-center gap-1 bg-[#ff4f00]/10 border border-[#ff4f00]/30 rounded-xl px-4 py-2 text-xs text-[#ff4f00] font-black">
                                                PIN: <span className="font-mono text-sm tracking-wider select-text ml-1">{selectedSession.pin}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {selectedSessionId !== 'all' && selectedSession && selectedSession.active && (
                                    <button
                                        onClick={handleCloseSession}
                                        disabled={closingSession}
                                        className="bg-neutral-800 hover:bg-red-950/20 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 text-neutral-350 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        <ShieldOff className="w-4 h-4" />
                                        Cerrar Sesión (Desactivar PIN)
                                    </button>
                                )}
                                <button
                                    onClick={handleExportCSV}
                                    disabled={filteredResults.length === 0}
                                    className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar a Google Sheets
                                </button>
                                <button
                                    onClick={() => setShowNewSession(true)}
                                    className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva Sesión
                                </button>
                            </div>
                        </div>

                        {/* ── Métricas ────────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {[
                                { icon: Users, label: 'Participantes', value: uniqueTrainees, color: 'text-blue-400' },
                                { icon: BookOpenCheck, label: 'Intentos totales', value: totalAttempts, color: 'text-purple-400' },
                                { icon: Target, label: '% Aprobación', value: `${passRate}%`, color: passRate >= 80 ? 'text-emerald-400' : 'text-red-400' },
                                { icon: BarChart3, label: 'Precisión Promedio', value: `${avgScore}%`, color: 'text-[#ff4f00]' },
                                { icon: Clock, label: 'Tiempo Promedio', value: formatDurationMinutes(avgDurationSec), color: 'text-amber-400' },
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

                        {/* ── Barra de Búsqueda y Filtros ─────────────────────────── */}
                        {sessions.length > 0 && !loadingResults && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Buscar Participante</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Buscar por nombre..."
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff4f00] transition-all"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs font-bold animate-in fade-in"
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full md:w-48 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Filtrar por Fecha</label>
                                    <select
                                        value={dateFilter}
                                        onChange={e => setDateFilter(e.target.value as any)}
                                        className="bg-neutral-950 border border-neutral-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4f00] transition-all cursor-pointer"
                                    >
                                        <option value="all">Todas las fechas</option>
                                        <option value="today">Hoy</option>
                                        <option value="week">Últimos 7 días</option>
                                        <option value="month">Este mes</option>
                                    </select>
                                </div>

                                <div className="w-full md:w-48 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Estado de Acreditación</label>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value as any)}
                                        className="bg-neutral-950 border border-neutral-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4f00] transition-all cursor-pointer"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="passed">Aprobado</option>
                                        <option value="failed">Pendiente</option>
                                    </select>
                                </div>

                                <div className="w-full md:w-48 flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Tipo de Examen</label>
                                    <select
                                        value={examTypeFilter}
                                        onChange={e => setExamTypeFilter(e.target.value as any)}
                                        className="bg-neutral-950 border border-neutral-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4f00] transition-all cursor-pointer"
                                    >
                                        <option value="all">Todos los exámenes</option>
                                        <option value="theory">Teórico</option>
                                        <option value="simulation">Simulación Práctica</option>
                                    </select>
                                </div>
                            </div>
                        )}

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
                        ) : results.length === 0 ? (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
                                <TrendingUp className="w-10 h-10 text-neutral-700" />
                                <p className="text-neutral-500 text-sm">Aún no hay resultados en esta sesión.</p>
                                {selectedSession && (
                                    <p className="text-neutral-600 text-xs max-w-xs">
                                        Comparte el PIN <span className="font-mono font-black text-[#ff4f00]">{selectedSession.pin}</span> con tus trainees. Los resultados aparecerán aquí cuando completen el examen.
                                    </p>
                                )}
                            </div>
                        ) : trainees.length === 0 ? (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
                                <X className="w-10 h-10 text-neutral-700" />
                                <p className="text-neutral-400 font-bold">Sin coincidencias</p>
                                <p className="text-neutral-500 text-sm max-w-sm">
                                    No se encontraron participantes que coincidan con los filtros de búsqueda establecidos.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setDateFilter('all');
                                        setStatusFilter('all');
                                    }}
                                    className="mt-2 text-xs font-bold text-[#ff4f00] hover:text-[#e04500] underline animate-pulse"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
                                <div className="flex-1 w-full flex flex-col gap-6 animate-fadeIn">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                                        Resultados por participante — {trainees.length} trainee{trainees.length !== 1 ? 's' : ''}
                                    </h2>
                                    {trainees.map(([traineeId, { name, attempts }]) => {
                                        const best = Math.max(...attempts.map(a => a.percentage));
                                        const last = attempts[attempts.length - 1];
                                        const passed = attempts.some(a => a.passed);
                                        const needsAttention = attempts.length >= 3 && !passed;

                                        let simCount = 0;
                                        let theoryCount = 0;
                                        const attemptsWithCategorizedIndexes = attempts.map(a => {
                                            const isSim = a.answers && Array.isArray(a.answers) && a.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
                                            const index = isSim ? ++simCount : ++theoryCount;
                                            return { ...a, categorizedIndex: index, isSim };
                                        });

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
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setAnalyzingTrainee({ name, attempts: attemptsWithCategorizedIndexes })}
                                                                    className="text-sm font-bold text-white hover:text-[#ff4f00] flex items-center gap-2 text-left transition-colors cursor-pointer"
                                                                    title="Ver análisis y reporte PDF de este alumno"
                                                                >
                                                                    {name}
                                                                    <BarChart3 className="w-3.5 h-3.5 text-neutral-500 hover:text-[#ff4f00] shrink-0" />
                                                                </button>
                                                                {needsAttention && (
                                                                    <span 
                                                                        className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md animate-pulse"
                                                                        title="Tutoría recomendada (3+ intentos pendientes)."
                                                                    >
                                                                        <ShieldAlert className="w-3 h-3" />
                                                                        Atención
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                                                <p className="text-[11px] text-neutral-500">
                                                                    {attemptsWithCategorizedIndexes.filter(a => !a.isSim).length} teóricos • {attemptsWithCategorizedIndexes.filter(a => a.isSim).length} simulados
                                                                </p>
                                                                {selectedSessionId === 'all' && last?.training_sessions?.name && (
                                                                    <>
                                                                        <span className="text-neutral-700">•</span>
                                                                        <span className="text-[10px] text-[#ff4f00] font-bold bg-[#ff4f00]/5 px-2 py-0.5 rounded border border-[#ff4f00]/10">
                                                                            {last.training_sessions.name}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
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
                                                            {(() => {
                                                                if (!passed) return '✗ Pendiente';
                                                                const approvedLevelsList = Array.from(new Set(
                                                                    attempts.filter(a => a.passed).map(a => getExamLevel(a))
                                                                ));
                                                                return `✓ Aprobado: ${approvedLevelsList.join(', ')}`;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="px-5 py-4">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-3">Progresión de intentos</p>
                                                    <div className="flex items-end gap-2 h-16">
                                                        {attemptsWithCategorizedIndexes.map((a) => (
                                                            <div key={a.id} className="flex flex-col items-center gap-1 flex-1 min-w-0 group cursor-default" title={`Intento ${a.isSim ? 'Práctico' : 'Teórico'} #${a.categorizedIndex}: ${a.percentage}%`}>
                                                                <span className="text-[9px] text-neutral-500 font-bold group-hover:text-white transition-colors">{a.percentage}%</span>
                                                                <div
                                                                    className={`w-full rounded-t transition-all group-hover:opacity-80 ${a.passed ? 'bg-emerald-500' : a.percentage >= 60 ? 'bg-amber-500' : 'bg-[#ff4f00]'}`}
                                                                    style={{ height: `${Math.max(4, (a.percentage / 100) * 40)}px` }}
                                                                />
                                                                <span className="text-[9px] text-neutral-700">#{a.categorizedIndex}</span>
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
                                                        {(() => {
                                                            const isSim = last.answers && Array.isArray(last.answers) && last.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
                                                            return (
                                                                <span className="text-[10px] text-neutral-400 font-bold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                                                                    {isSim ? 'Simulación' : 'Teórico'}
                                                                </span>
                                                            );
                                                        })()}
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDuration(last.duration_sec)}
                                                        </span>
                                                        <span>{formatDate(last.taken_at)}</span>
                                                    </div>
                                                )}

                                                <div className="px-5 py-4 border-t border-neutral-800/50 bg-neutral-950/20 flex flex-col gap-5">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Intentos Teóricos</p>
                                                        <div className="flex flex-col gap-2">
                                                            {attemptsWithCategorizedIndexes.filter(a => !a.isSim).length === 0 ? (
                                                                <p className="text-xs text-neutral-600 italic py-1">No se registran intentos teóricos.</p>
                                                            ) : (
                                                                attemptsWithCategorizedIndexes.filter(a => !a.isSim).map((a) => {
                                                                    const isExpanded = expandedAttemptId === a.id;
                                                                    return (
                                                                        <div key={a.id} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
                                                                            <button
                                                                                onClick={() => setExpandedAttemptId(isExpanded ? null : a.id)}
                                                                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/40 transition-colors text-left"
                                                                            >
                                                                                <div className="flex items-center gap-3.5">
                                                                                    <span className="text-xs font-bold text-neutral-400">Intento #{a.categorizedIndex}</span>
                                                                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                                                                                        a.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                                                    }`}>
                                                                                        {a.percentage}%
                                                                                    </span>
                                                                                    <span className="text-[11px] text-neutral-500 hidden sm:inline">
                                                                                        ({a.score}/{a.max_score} aciertos)
                                                                                    </span>
                                                                                    {(() => {
                                                                                        const level = getExamLevel(a);
                                                                                        return (
                                                                                            <span className="text-[10px] text-neutral-400 font-bold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                                                                                                Teórico — {level}
                                                                                            </span>
                                                                                        );
                                                                                    })()}
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
                                                                                        a.answers.map((ans: any, qIdx: number) => {
                                                                                            if (ans.questionId === 'exam_level' || ans.questionId === 'feedback_rating') return null;
                                                                                            return (
                                                                                                <div key={ans.questionId || qIdx} className="text-xs border-b border-neutral-800/40 pb-2.5 last:border-0 last:pb-0">
                                                                                                    <p className="font-bold text-neutral-300 mb-1">
                                                                                                        {qIdx + 1}. {ans.questionText}
                                                                                                    </p>
                                                                                                    <div className="flex flex-col gap-0.5 pl-3">
                                                                                                        <p className={ans.isCorrect ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                                                                                                            <span className="font-bold text-neutral-500">Seleccionado:</span> {ans.selectedText}
                                                                                                            {ans.isCorrect ? ' ✓' : ' ✗'}
                                                                                                            {typeof ans.timeSpentSeconds === 'number' && (
                                                                                                                <span className="text-neutral-500 text-[10px] ml-2">({ans.timeSpentSeconds}s)</span>
                                                                                                            )}
                                                                                                        </p>
                                                                                                        {!ans.isCorrect && (
                                                                                                            <p className="text-emerald-400 font-medium">
                                                                                                                <span className="font-bold text-neutral-500">Correcta:</span> {ans.correctText}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <p className="text-xs text-neutral-500">No hay detalles de respuestas guardados para este intento.</p>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Intentos de Simulación Práctica</p>
                                                        <div className="flex flex-col gap-2">
                                                            {attemptsWithCategorizedIndexes.filter(a => a.isSim).length === 0 ? (
                                                                <p className="text-xs text-neutral-600 italic py-1">No se registran intentos de simulación.</p>
                                                            ) : (
                                                                attemptsWithCategorizedIndexes.filter(a => a.isSim).map((a) => {
                                                                    const isExpanded = expandedAttemptId === a.id;
                                                                    return (
                                                                        <div key={a.id} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
                                                                            <button
                                                                                onClick={() => setExpandedAttemptId(isExpanded ? null : a.id)}
                                                                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/40 transition-colors text-left"
                                                                            >
                                                                                <div className="flex items-center gap-3.5">
                                                                                    <span className="text-xs font-bold text-neutral-400">Intento #{a.categorizedIndex}</span>
                                                                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                                                                                        a.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                                                    }`}>
                                                                                        {a.percentage}%
                                                                                    </span>
                                                                                    <span className="text-[11px] text-neutral-500 hidden sm:inline">
                                                                                        ({a.score}/{a.max_score} aciertos)
                                                                                    </span>
                                                                                    {(() => {
                                                                                        const level = getExamLevel(a);
                                                                                        return (
                                                                                            <span className="text-[10px] text-neutral-400 font-bold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                                                                                                Simulación — {level}
                                                                                            </span>
                                                                                        );
                                                                                    })()}
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
                                                                                        a.answers.map((ans: any, qIdx: number) => {
                                                                                            if (ans.questionId === 'exam_level' || ans.questionId === 'feedback_rating') return null;
                                                                                            return (
                                                                                                <div key={ans.questionId || qIdx} className="text-xs border-b border-neutral-800/40 pb-2.5 last:border-0 last:pb-0">
                                                                                                    <p className="font-bold text-neutral-300 mb-1">
                                                                                                        {qIdx + 1}. {ans.questionText}
                                                                                                    </p>
                                                                                                    <div className="flex flex-col gap-0.5 pl-3">
                                                                                                        <p className={ans.isCorrect ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                                                                                                            <span className="font-bold text-neutral-500">Seleccionado:</span> {ans.selectedText}
                                                                                                            {ans.isCorrect ? ' ✓' : ' ✗'}
                                                                                                            {typeof ans.timeSpentSeconds === 'number' && (
                                                                                                                <span className="text-neutral-500 text-[10px] ml-2">({ans.timeSpentSeconds}s)</span>
                                                                                                            )}
                                                                                                        </p>
                                                                                                        {!ans.isCorrect && (
                                                                                                            <p className="text-emerald-400 font-medium">
                                                                                                                <span className="font-bold text-neutral-500">Correcta:</span> {ans.correctText}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <p className="text-xs text-neutral-500">No hay detalles de respuestas guardados para este intento.</p>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Panel de Refuerzo (Heatmaps de Fallas del Grupo) */}
                                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 animate-fadeIn">
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#ff4f00] mb-4 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-amber-400" />
                                            Fallas de Cuellos de Botella (Grupo)
                                        </h3>
                                        <p className="text-xs text-neutral-500 mb-4 leading-relaxed font-medium">
                                            Gráficos analíticos que resaltan qué temas y preguntas causan el mayor porcentaje de fallas a nivel grupal.
                                        </p>
                                        
                                        {commonFaults.length === 0 ? (
                                            <p className="text-xs text-neutral-600 italic text-center py-4">
                                                No se registran errores en el grupo de datos filtrado.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-3.5">
                                                {commonFaults.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => setSelectedFaultDetail(item)}
                                                        className="bg-neutral-950 border border-neutral-800/40 hover:border-[#ff4f00]/30 hover:bg-neutral-900/40 rounded-xl p-3 flex flex-col gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="text-[10px] font-bold text-neutral-600 uppercase">
                                                                Top #{index + 1} • {item.isSim ? 'Simulación' : 'Teórico'}
                                                            </span>
                                                            <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                                                                {item.count} error{item.count !== 1 ? 'es' : ''}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-semibold text-neutral-300 line-clamp-2" title={item.questionText}>
                                                            {item.questionText}
                                                        </p>
                                                        <p className="text-[11px] text-emerald-400 font-medium">
                                                            <span className="font-bold text-neutral-500">Correcta:</span> {item.correctText}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modales de soporte */}
            {selectedFaultDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#161820] border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
                            <h2 className="font-black text-white text-base flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold bg-[#ff4f00]/10 border border-[#ff4f00]/25 text-[#ff4f00] px-2 py-0.5 rounded">
                                    Detalle del Punto de Refuerzo
                                </span>
                            </h2>
                            <button onClick={() => setSelectedFaultDetail(null)} className="text-neutral-500 hover:text-white transition-colors p-1 rounded-full hover:bg-neutral-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">Pregunta / Escenario</h4>
                                <p className="text-sm font-bold text-white leading-relaxed">
                                    {selectedFaultDetail.questionText}
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">Respuesta Correcta</h4>
                                <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3.5 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 font-bold">✓</div>
                                    <p className="text-xs font-bold text-emerald-400">{selectedFaultDetail.correctText}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Respuestas Incorrectas Frecuentes</h4>
                                {selectedFaultDetail.wrongSelections.length === 0 ? (
                                    <p className="text-xs text-neutral-500 italic">No hay registros de selecciones incorrectas.</p>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {selectedFaultDetail.wrongSelections.map((sel, idx) => {
                                            const totalErrors = selectedFaultDetail.count;
                                            const percentage = Math.round((sel.count / totalErrors) * 100);
                                            return (
                                                <div key={idx} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-neutral-305 pr-4">{sel.text}</span>
                                                        <span className="text-neutral-500 shrink-0">{sel.count} {sel.count === 1 ? 'fallo' : 'fallos'} ({percentage}%)</span>
                                                    </div>
                                                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                                                        <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedFaultDetail(null)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-5 py-2 rounded-xl transition-all text-xs"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNewSession && (
                <NewSessionModal
                    onClose={() => setShowNewSession(false)}
                    onCreated={handleSessionCreated}
                />
            )}

            {analyzingTrainee && renderAnalysisModal()}
        </div>
    );
}
