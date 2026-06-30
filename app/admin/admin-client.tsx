'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users, TrendingUp, BookOpenCheck, LogOut,
    ChevronDown, BarChart3, Target, Clock, Award,
    X, Check, Download, ShieldAlert, Star, Shield, ArrowLeft, RefreshCw, HelpCircle,
    Wrench, Plus, Trash2, Edit
} from 'lucide-react';
import Image from 'next/image';
import { CLIENTS_DATABASE } from '../../config/robots-db';

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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminClient() {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

    // Estados del Gestor de Contenidos (Fallas y Consejos)
    const [view, setView] = useState<'analytics' | 'editor'>('analytics');
    const [editorTab, setEditorTab] = useState<'faults' | 'advises' | 'telemetry' | 'access' | 'robots'>('faults');

    // Estados para la gestión de robots/estaciones
    const [robotsList, setRobotsList] = useState<any[]>([]);
    const [loadingRobots, setLoadingRobots] = useState(false);
    
    const [editorRobots, setEditorRobots] = useState<any[]>([]);
    const [selectedEditorRobotId, setSelectedEditorRobotId] = useState<string>('');
    const [editorFaults, setEditorFaults] = useState<any[]>([]);
    const [editorAdvises, setEditorAdvises] = useState<any[]>([]);
    const [telemetryList, setTelemetryList] = useState<any[]>([]);
    const [accessLogsList, setAccessLogsList] = useState<any[]>([]);
    const [loadingTelemetry, setLoadingTelemetry] = useState(false);
    const [loadingAccessLogs, setLoadingAccessLogs] = useState(false);
    const [loadingEditor, setLoadingEditor] = useState(false);
    const [selectedTelemetryIds, setSelectedTelemetryIds] = useState<string[]>([]);
    const [expandedAccessLogUser, setExpandedAccessLogUser] = useState<string | null>(null);
    
    const [faultModalOpen, setFaultModalOpen] = useState(false);
    const [selectedFault, setSelectedFault] = useState<any | null>(null);
    const [faultForm, setFaultForm] = useState({
        id: '',
        category: 'Problemas con el robot',
        symptom: '',
        resolution_protocol: '',
        sop_reference: '',
        video_url: ''
    });

    const [adviceModalOpen, setAdviceModalOpen] = useState(false);
    const [selectedAdvice, setSelectedAdvice] = useState<any | null>(null);
    const [adviceForm, setAdviceForm] = useState({
        id: '',
        robot_id: '',
        advice_number: 1,
        content: '',
        is_exception: false
    });

    const fetchEditorData = useCallback(async () => {
        setLoadingEditor(true);
        try {
            const robotsList: { id: string; name: string }[] = [];
            Object.values(CLIENTS_DATABASE).forEach(client => {
                client.robots.forEach(robot => {
                    if (!robotsList.some(r => r.id === robot.id)) {
                        robotsList.push({ id: robot.id, name: robot.name });
                    }
                });
            });
            setEditorRobots(robotsList);
            if (robotsList.length > 0 && !selectedEditorRobotId) {
                setSelectedEditorRobotId(robotsList[0].id);
            }

            const { data: faultsData } = await supabase
                .from('troubleshooting_knowledge')
                .select('*')
                .order('id');
            if (faultsData) setEditorFaults(faultsData);
        } catch (err) {
            console.error('Error fetching editor data:', err);
        } finally {
            setLoadingEditor(false);
        }
    }, [selectedEditorRobotId]);

    const fetchEditorAdvises = useCallback(async () => {
        if (!selectedEditorRobotId) return;
        const { data: advisesData } = await supabase
            .from('advises')
            .select('*')
            .eq('robot_id', selectedEditorRobotId)
            .order('advice_number');
        if (advisesData) setEditorAdvises(advisesData);
    }, [selectedEditorRobotId]);

    const fetchTelemetry = useCallback(async () => {
        setLoadingTelemetry(true);
        try {
            const res = await fetch('/api/telemetry');
            if (res.ok) {
                const json = await res.json();
                setTelemetryList(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching telemetry:', err);
        } finally {
            setLoadingTelemetry(false);
        }
    }, []);

    const handleDeleteTelemetry = useCallback(async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro de búsqueda de forma permanente?')) return;
        try {
            const res = await fetch(`/api/telemetry?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                fetchTelemetry();
                alert('Registro de búsqueda eliminado exitosamente');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error deleting telemetry:', err);
            alert('Error al intentar eliminar el registro de búsqueda');
        }
    }, [fetchTelemetry]);

    const handleToggleTelemetrySelect = (id: string) => {
        setSelectedTelemetryIds(prev => 
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handleToggleAllTelemetry = () => {
        if (selectedTelemetryIds.length === telemetryList.length && telemetryList.length > 0) {
            setSelectedTelemetryIds([]);
        } else {
            setSelectedTelemetryIds(telemetryList.map(t => t.id));
        }
    };

    const handleBulkDeleteTelemetry = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedTelemetryIds.length} registros de forma permanente?`)) return;
        
        try {
            await Promise.all(selectedTelemetryIds.map(id => 
                fetch(`/api/telemetry?id=${id}`, { method: 'DELETE' })
            ));
            
            setSelectedTelemetryIds([]);
            fetchTelemetry();
            alert('Registros eliminados exitosamente');
        } catch (err) {
            console.error('Error in bulk delete:', err);
            alert('Error al intentar eliminar los registros');
        }
    };

    const fetchAccessLogs = useCallback(async () => {
        setLoadingAccessLogs(true);
        try {
            const { data, error } = await supabase
                .from('user_access_logs')
                .select('*')
                .order('accessed_at', { ascending: false });
            if (data) {
                setAccessLogsList(data);
            } else if (error) {
                console.error('Error fetching access logs:', error);
            }
        } catch (err) {
            console.error('Error fetching access logs:', err);
        } finally {
            setLoadingAccessLogs(false);
        }
    }, []);

    const todayAccessCount = useMemo(() => {
        const todayStr = new Date().toDateString();
        return accessLogsList.filter(log => log.accessed_at && new Date(log.accessed_at).toDateString() === todayStr).length;
    }, [accessLogsList]);

    const uniqueUsersCount = useMemo(() => {
        const uniqueNames: string[] = [];
        accessLogsList.forEach(log => {
            if (!log.full_name) return;
            
            const cleanName = log.full_name.trim().toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            if (!cleanName) return;

            const words = cleanName.split(/\s+/).filter((w: string) => w.length > 2);
            
            let foundSimilar = false;
            for (const existingName of uniqueNames) {
                const cleanExisting = existingName.trim().toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                // 1. Coincidencia exacta insensible a mayúsculas/acentos
                if (cleanName === cleanExisting) {
                    foundSimilar = true;
                    break;
                }
                
                // 2. Coincidencia similar (ej: "Nahum Sanchez" y "Nahum Sanchez Romero")
                if (cleanExisting.includes(cleanName) || cleanName.includes(cleanExisting)) {
                    const existingWords = cleanExisting.split(/\s+/).filter((w: string) => w.length > 2);
                    const intersection = words.filter((w: string) => existingWords.includes(w));
                    const minWords = Math.min(words.length, existingWords.length);
                    
                    if (intersection.length >= Math.max(2, minWords)) {
                        foundSimilar = true;
                        break;
                    }
                }
            }
            if (!foundSimilar) {
                uniqueNames.push(log.full_name);
            }
        });
        return uniqueNames.length;
    }, [accessLogsList]);

    const dailyAccessStats = useMemo(() => {
        const stats: Record<string, number> = {};
        accessLogsList.forEach(log => {
            if (!log.accessed_at) return;
            const dateStr = new Date(log.accessed_at).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            stats[dateStr] = (stats[dateStr] || 0) + 1;
        });
        return Object.entries(stats)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [accessLogsList]);

    const groupedAccessLogs = useMemo(() => {
        const groups = new Map<string, { name: string; count: number; last_access: string; logs: any[] }>();
        
        accessLogsList.forEach(log => {
            if (!log.full_name) return;
            const name = log.full_name.trim();
            const cleanName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!cleanName) return;

            let groupKey = name;
            let found = false;

            for (const [existingKey, data] of groups.entries()) {
                const cleanExisting = existingKey.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (cleanExisting === cleanName || cleanExisting.includes(cleanName) || cleanName.includes(cleanExisting)) {
                    groupKey = existingKey;
                    found = true;
                    break;
                }
            }

            const curr = groups.get(groupKey) || { name: groupKey, count: 0, last_access: log.accessed_at, logs: [] as any[] };
            curr.count += 1;
            curr.logs.push(log);
            
            if (new Date(log.accessed_at) > new Date(curr.last_access)) {
                curr.last_access = log.accessed_at;
            }

            groups.set(groupKey, curr);
        });

        groups.forEach(group => {
            group.logs.sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime());
        });

        return Array.from(groups.values()).sort((a, b) => new Date(b.last_access).getTime() - new Date(a.last_access).getTime());
    }, [accessLogsList]);


    const fetchRobotsConfig = useCallback(async () => {
        setLoadingRobots(true);
        try {
            const res = await fetch('/api/admin/robots');
            if (res.ok) {
                const json = await res.json();
                setRobotsList(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching robots config:', err);
        } finally {
            setLoadingRobots(false);
        }
    }, []);

    const handleUpdateRobotField = (id: string, field: 'target_url' | 'status', value: string) => {
        setRobotsList(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSaveRobotConfig = async (robot: any) => {
        try {
            const res = await fetch('/api/admin/robots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: robot.id,
                    target_url: robot.target_url,
                    status: robot.status
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Configuración de ${robot.name} guardada exitosamente.`);
                fetchRobotsConfig();
            } else {
                alert('Error al guardar: ' + data.error);
            }
        } catch (err) {
            console.error('Error saving robot:', err);
            alert('Error al intentar guardar la configuración.');
        }
    };

    useEffect(() => {
        if (view === 'editor') {
            fetchEditorData();
            fetchTelemetry();
            fetchAccessLogs();
            fetchRobotsConfig();
        }
    }, [view, fetchEditorData, fetchTelemetry, fetchAccessLogs, fetchRobotsConfig]);

    useEffect(() => {
        if (view === 'editor' && selectedEditorRobotId) {
            fetchEditorAdvises();
        }
    }, [view, selectedEditorRobotId, fetchEditorAdvises]);

    const handleSaveFault = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/troubleshooting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(faultForm)
            });
            const data = await res.json();
            if (res.ok) {
                setFaultModalOpen(false);
                fetchEditorData();
                alert(selectedFault ? 'Falla actualizada exitosamente' : 'Falla creada exitosamente');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error saving fault:', err);
            alert('Error al guardar la falla');
        }
    };

    const handleDeleteFault = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta falla de forma permanente?')) return;
        try {
            const res = await fetch(`/api/admin/troubleshooting?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                fetchEditorData();
                alert('Falla eliminada exitosamente');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error deleting fault:', err);
            alert('Error al eliminar la falla');
        }
    };

    const handleSaveAdvice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/advises', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...adviceForm,
                    robot_id: selectedEditorRobotId
                })
            });
            const data = await res.json();
            if (res.ok) {
                setAdviceModalOpen(false);
                fetchEditorAdvises();
                alert(selectedAdvice ? 'Consejo actualizado exitosamente' : 'Consejo creado exitosamente');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error saving advice:', err);
            alert('Error al guardar el consejo');
        }
    };

    const handleDeleteAdvice = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este consejo de forma permanente?')) return;
        try {
            const res = await fetch(`/api/admin/advises?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                fetchEditorAdvises();
                alert('Consejo eliminado exitosamente');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error deleting advice:', err);
            alert('Error al eliminar el consejo');
        }
    };

    // Filtros de búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
    const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'theory' | 'simulation'>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'Training 1' | 'Training 2' | 'Training 3' | 'DC' | 'Customer'>('all');

    const fetchSessions = useCallback(async () => {
        const { data, error } = await supabase
            .from('training_sessions')
            .select('id, name, trainer, pin, active, created_at')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSessions(data);
        }
        setLoadingSessions(false);
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    useEffect(() => {
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

    const handleLogout = async () => {
        await fetch('/api/auth/admin-logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/admin';
    };

    // 1. Filtrar los results según los criterios de búsqueda, fecha y tipo de examen
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

        if (categoryFilter !== 'all') {
            const level = getExamLevel(r);
            if (level !== categoryFilter) return false;
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

    // Calcular duración promedio de intentos filtrados
    const attemptsWithDuration = filteredResults.filter(r => r.duration_sec !== null);
    const avgDurationSec = attemptsWithDuration.length > 0
        ? Math.round(attemptsWithDuration.reduce((acc, r) => acc + (r.duration_sec ?? 0), 0) / attemptsWithDuration.length)
        : 0;

    // Métricas de ROI Avanzadas:
    // A. Horas de Trainer Ahorradas: Cada examen ahorra 15 minutos de calificación/registro manual
    const trainerHoursSaved = ((totalAttempts * 15) / 60).toFixed(1);

    // B. Promedio de Confianza (Paso 4 Rating):
    const ratings: number[] = [];
    filteredResults.forEach(r => {
        if (r.answers && Array.isArray(r.answers)) {
            const ratingObj = r.answers.find((ans: any) => ans.questionId === 'feedback_rating');
            if (ratingObj && ratingObj.selectedText) {
                const val = parseInt(ratingObj.selectedText);
                if (!isNaN(val)) ratings.push(val);
            }
        }
    });
    const avgConfidenceRating = ratings.length > 0
        ? (ratings.reduce((acc, v) => acc + v, 0) / ratings.length).toFixed(1)
        : '—';

    // C. Tiempo de Ramp-up (Tiempo de Habilitación):
    // Tiempo desde el primer intento hasta el primer intento aprobado de cada trainee
    const getRampUpTime = () => {
        const trainees = new Map<string, { first: number; passed: number | null }>();
        filteredResults.forEach(r => {
            const time = new Date(r.taken_at).getTime();
            const curr = trainees.get(r.trainee_id) || { first: time, passed: null };
            if (time < curr.first) {
                curr.first = time;
            }
            if (r.passed) {
                if (curr.passed === null || time < curr.passed) {
                    curr.passed = time;
                }
            }
            trainees.set(r.trainee_id, curr);
        });

        const diffs: number[] = [];
        trainees.forEach(t => {
            if (t.passed !== null) {
                diffs.push((t.passed - t.first) / (1000 * 60)); // minutos
            }
        });

        if (diffs.length === 0) return '—';
        const avgMin = diffs.reduce((acc, d) => acc + d, 0) / diffs.length;
        if (avgMin < 60) {
            return `${Math.round(avgMin)} mins`;
        }
        const avgHr = avgMin / 60;
        if (avgHr < 24) {
            return `${avgHr.toFixed(1)} hrs`;
        }
        const avgDays = avgHr / 24;
        return `${avgDays.toFixed(1)} días`;
    };

    const rampUpTime = getRampUpTime();

    // D. Curva de Aprendizaje por número de intento (1, 2, 3+)
    const getLearningCurveStats = () => {
        const stats = {
            1: { count: 0, passed: 0, scoreSum: 0, timeSum: 0, timeCount: 0 },
            2: { count: 0, passed: 0, scoreSum: 0, timeSum: 0, timeCount: 0 },
            '3+': { count: 0, passed: 0, scoreSum: 0, timeSum: 0, timeCount: 0 }
        };

        filteredResults.forEach(r => {
            const att = r.attempt_number || 1;
            const key = att === 1 ? 1 : att === 2 ? 2 : '3+';
            stats[key].count += 1;
            stats[key].scoreSum += r.percentage;
            if (r.passed) stats[key].passed += 1;
            if (r.duration_sec) {
                stats[key].timeSum += r.duration_sec;
                stats[key].timeCount += 1;
            }
        });

        return stats;
    };

    const learningCurve = getLearningCurveStats();

    // E. Top 5 Fallas Comunes (excluyendo feedback_rating)
    const getTopFailedQuestions = () => {
        const errorCounts = new Map<string, { text: string; count: number; correctText: string }>();
        filteredResults.forEach(r => {
            if (r.answers && Array.isArray(r.answers)) {
                r.answers.forEach((ans: any) => {
                    if (ans.questionId === 'feedback_rating') return;
                    if (ans.isCorrect === false) {
                        const id = ans.questionId || ans.questionText;
                        const record = errorCounts.get(id) || { text: ans.questionText, count: 0, correctText: ans.correctText || '' };
                        record.count += 1;
                        errorCounts.set(id, record);
                    }
                });
            }
        });
        return Array.from(errorCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const topFailed = getTopFailedQuestions();

    // F. Alumnos Requeriendo Atención (>= 3 intentos fallidos sin aprobar)
    const getAtencionTrainees = () => {
        const traineeMap = new Map<string, { name: string; attempts: ExamResult[] }>();
        filteredResults.forEach(r => {
            const name = r.trainees?.full_name ?? 'Sin nombre';
            if (!traineeMap.has(r.trainee_id)) {
                traineeMap.set(r.trainee_id, { name, attempts: [] });
            }
            traineeMap.get(r.trainee_id)!.attempts.push(r);
        });

        const attentionList: { name: string; attempts: number }[] = [];
        traineeMap.forEach((v) => {
            const hasPassed = v.attempts.some(a => a.passed);
            if (!hasPassed && v.attempts.length >= 3) {
                attentionList.push({ name: v.name, attempts: v.attempts.length });
            }
        });
        return attentionList;
    };

    const attentionList = getAtencionTrainees();

    // G. Agrupar Trainees para Listado
    const traineeMap = new Map<string, { name: string; attempts: ExamResult[] }>();
    filteredResults.forEach(r => {
        const name = r.trainees?.full_name ?? 'Sin nombre';
        if (!traineeMap.has(r.trainee_id)) {
            traineeMap.set(r.trainee_id, { name, attempts: [] });
        }
        traineeMap.get(r.trainee_id)!.attempts.push(r);
    });

    let traineesList = Array.from(traineeMap.entries());
    if (statusFilter !== 'all') {
        traineesList = traineesList.filter(([, v]) => {
            const approved = v.attempts.some(a => a.passed);
            return statusFilter === 'passed' ? approved : !approved;
        });
    }

    // H. Exportación a CSV
    const exportToCSV = () => {
        if (filteredResults.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        // Encabezados en español
        const headers = [
            'Nombre del Operador',
            'Grupo/Sesion',
            'Tipo de Examen',
            'Fecha',
            'Aciertos',
            'Precision %',
            'Estado',
            'Duracion',
            'Numero de Intento',
            'Nivel Confianza (Paso 4)'
        ];

        const rows = filteredResults.map(r => {
            const isSimulation = r.answers && Array.isArray(r.answers) && r.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
            const typeText = isSimulation ? 'Simulador' : 'Teorico';
            const dateText = new Date(r.taken_at).toLocaleDateString('es-MX') + ' ' + new Date(r.taken_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            const scoreText = `${r.score}/${r.max_score}`;
            const statusText = r.passed ? 'APROBADO' : 'PENDIENTE';
            const durationText = formatDuration(r.duration_sec);

            // Obtener el rating
            let ratingText = '—';
            if (r.answers && Array.isArray(r.answers)) {
                const ratingObj = r.answers.find((ans: any) => ans.questionId === 'feedback_rating');
                if (ratingObj && ratingObj.selectedText) {
                    ratingText = ratingObj.selectedText + ' / 5';
                }
            }

            return [
                `"${(r.trainees?.full_name ?? 'Sin nombre').replace(/"/g, '""')}"`,
                `"${(r.training_sessions?.name ?? 'General').replace(/"/g, '""')}"`,
                `"${typeText}"`,
                `"${dateText}"`,
                `"${scoreText}"`,
                `"${r.percentage}%"`,
                `"${statusText}"`,
                `"${durationText}"`,
                `"${r.attempt_number}"`,
                `"${ratingText}"`
            ];
        });

        // Prefijar con UTF-8 BOM (\uFEFF) para asegurar compatibilidad de acentos y caracteres especiales en Google Sheets / Excel
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_Admin_ROI_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#07080c] text-white flex flex-col font-sans select-none">
            {/* Header */}
            <header className="bg-[#0b0c13] border-b border-white/[0.04] px-8 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <img
                        src="/autoryx_logo.webp"
                        alt="Autoryx Logo"
                        className="h-10 w-auto object-contain object-left"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {view === 'analytics' ? (
                        <button
                            onClick={() => setView('editor')}
                            className="bg-[#FF5A00]/10 hover:bg-[#FF5A00]/20 text-[#FF5A00] border border-[#FF5A00]/25 hover:border-[#FF5A00]/40 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Wrench className="w-4 h-4" />
                            Editar Contenidos
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('analytics')}
                            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/[0.05] text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Ver Analíticas (ROI)
                        </button>
                    )}
                    <button
                        onClick={exportToCSV}
                        className="bg-[#00A8FC]/10 hover:bg-[#00A8FC]/20 text-[#00A8FC] border border-[#00A8FC]/25 hover:border-[#00A8FC]/40 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        Exportar a Google Sheets
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-neutral-900 hover:bg-neutral-800 border border-white/[0.05] hover:border-white/[0.1] text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-gray-400 hover:text-white"
                    >
                        <LogOut className="w-4 h-4 text-gray-500" />
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* Dashboard Workspace */}
            <main className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-8">
                {view === 'analytics' ? (
                    <>
                        {/* Selector de Sesiones y Filtros */}
                        <div className="bg-[#0d0e15]/80 border border-white/[0.04] rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider pl-1">Filtrar por Grupo:</span>
                                <div className="relative">
                                    <select
                                        value={selectedSessionId}
                                        onChange={(e) => setSelectedSessionId(e.target.value)}
                                        className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-white focus:outline-none appearance-none transition-colors min-w-[200px]"
                                    >
                                        <option value="all">Todos los Grupos de Estudio</option>
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.trainer})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 items-center">
                                {/* Filtro Tipo Examen */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Examen:</span>
                                    <select
                                        value={examTypeFilter}
                                        onChange={(e) => setExamTypeFilter(e.target.value as any)}
                                        className="bg-[#14151f] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none appearance-none cursor-pointer pr-7 relative"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="theory">Teórico</option>
                                        <option value="simulation">Simulador</option>
                                    </select>
                                </div>

                                {/* Filtro Categoría */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Categoría:</span>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value as any)}
                                        className="bg-[#14151f] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none appearance-none cursor-pointer pr-7 relative font-semibold"
                                    >
                                        <option value="all">Todas</option>
                                        <option value="Training 1">Training 1</option>
                                        <option value="Training 2">Training 2</option>
                                        <option value="Training 3">Training 3</option>
                                        <option value="DC">DC</option>
                                        <option value="Customer">Customer</option>
                                    </select>
                                </div>

                                {/* Filtro Fecha */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Fecha:</span>
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value as any)}
                                        className="bg-[#14151f] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none appearance-none cursor-pointer pr-7 relative"
                                    >
                                        <option value="all">Histórico</option>
                                        <option value="today">Hoy</option>
                                        <option value="week">Últimos 7 días</option>
                                        <option value="month">Este mes</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Métricas Principales (ROI & Performance) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#00A8FC]/5 blur-lg transition-transform duration-500 group-hover:scale-150" />
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Horas Ahorradas</span>
                                    <div className="p-2 rounded-lg bg-[#00A8FC]/10 border border-[#00A8FC]/20 text-[#00A8FC]">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white">{trainerHoursSaved}h</div>
                                    <p className="text-[10px] text-gray-500 mt-1">Horas de trainer administradas guardadas</p>
                                </div>
                            </div>

                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#00A8FC]/5 blur-lg transition-transform duration-500 group-hover:scale-150" />
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Nivel Confianza</span>
                                    <div className="p-2 rounded-lg bg-[#00A8FC]/10 border border-[#00A8FC]/20 text-[#00A8FC]">
                                        <Star className="w-4 h-4 fill-[#00A8FC]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white flex items-center gap-1.5">
                                        {avgConfidenceRating} <span className="text-xs text-gray-500 font-medium">/ 5</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Percepción promedio del operador (Paso 4)</p>
                                </div>
                            </div>

                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#00A8FC]/5 blur-lg transition-transform duration-500 group-hover:scale-150" />
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Ramp-up Time</span>
                                    <div className="p-2 rounded-lg bg-[#00A8FC]/10 border border-[#00A8FC]/20 text-[#00A8FC]">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white">{rampUpTime}</div>
                                    <p className="text-[10px] text-gray-500 mt-1">Tiempo de habilitación (1er intento a aprobado)</p>
                                </div>
                            </div>

                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#00A8FC]/5 blur-lg transition-transform duration-500 group-hover:scale-150" />
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tasa Aprobación</span>
                                    <div className="p-2 rounded-lg bg-[#00A8FC]/10 border border-[#00A8FC]/20 text-[#00A8FC]">
                                        <Award className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white">{passRate}%</div>
                                    <p className="text-[10px] text-gray-500 mt-1">De {totalAttempts} intentos totales registrados</p>
                                </div>
                            </div>

                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#00A8FC]/5 blur-lg transition-transform duration-500 group-hover:scale-150" />
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Duración Promedio</span>
                                    <div className="p-2 rounded-lg bg-[#00A8FC]/10 border border-[#00A8FC]/20 text-[#00A8FC]">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white">
                                        {avgDurationSec ? `${Math.floor(avgDurationSec / 60)}m ${avgDurationSec % 60}s` : '—'}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Tiempo promedio de resolución activa</p>
                                </div>
                            </div>
                        </div>

                        {/* Sección de Curva de Aprendizaje Analítica */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Tabla de la Curva de Aprendizaje */}
                            <div className="lg:col-span-2 bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1 tracking-wider uppercase">Análisis de la Curva de Aprendizaje</h3>
                                    <p className="text-xs text-gray-500 mb-6">Progresión del rendimiento del operador a lo largo de sus intentos sucesivos</p>
                                    
                                    <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                    <th className="p-4">Nivel / Número de Intento</th>
                                                    <th className="p-4 text-center">Intentos Completados</th>
                                                    <th className="p-4 text-center">Precisión Promedio</th>
                                                    <th className="p-4 text-center">Tiempo Promedio</th>
                                                    <th className="p-4 text-center">Tasa Acreditación</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                <tr className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="p-4 font-bold text-[#00A8FC]">Primer Intento (Línea Base)</td>
                                                    <td className="p-4 text-center font-medium">{learningCurve[1].count}</td>
                                                    <td className="p-4 text-center font-bold text-neutral-200">
                                                        {learningCurve[1].count > 0 ? `${Math.round(learningCurve[1].scoreSum / learningCurve[1].count)}%` : '—'}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-400">
                                                        {learningCurve[1].timeCount > 0 ? formatDuration(Math.round(learningCurve[1].timeSum / learningCurve[1].timeCount)) : '—'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                            {learningCurve[1].count > 0 ? `${Math.round((learningCurve[1].passed / learningCurve[1].count) * 100)}%` : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="p-4 font-bold text-[#00A8FC]">Segundo Intento (Asimilación)</td>
                                                    <td className="p-4 text-center font-medium">{learningCurve[2].count}</td>
                                                    <td className="p-4 text-center font-bold text-neutral-200">
                                                        {learningCurve[2].count > 0 ? `${Math.round(learningCurve[2].scoreSum / learningCurve[2].count)}%` : '—'}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-400">
                                                        {learningCurve[2].timeCount > 0 ? formatDuration(Math.round(learningCurve[2].timeSum / learningCurve[2].timeCount)) : '—'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                            {learningCurve[2].count > 0 ? `${Math.round((learningCurve[2].passed / learningCurve[2].count) * 100)}%` : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="p-4 font-bold text-[#00A8FC]">Tercer Intento+ (Perfeccionamiento)</td>
                                                    <td className="p-4 text-center font-medium">{learningCurve['3+'].count}</td>
                                                    <td className="p-4 text-center font-bold text-neutral-200">
                                                        {learningCurve['3+'].count > 0 ? `${Math.round(learningCurve['3+'].scoreSum / learningCurve['3+'].count)}%` : '—'}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-400">
                                                        {learningCurve['3+'].timeCount > 0 ? formatDuration(Math.round(learningCurve['3+'].timeSum / learningCurve['3+'].timeCount)) : '—'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                            {learningCurve['3+'].count > 0 ? `${Math.round((learningCurve['3+'].passed / learningCurve['3+'].count) * 100)}%` : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 rounded-xl bg-blue-950/20 border border-[#00A8FC]/10 text-xs text-gray-400 flex items-start gap-3">
                                    <ShieldAlert className="w-4 h-4 text-[#00A8FC] shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Análisis de Curva:</strong> Una curva exitosa muestra un incremento de precisión mayor a 80% y una reducción del tiempo de resolución mayor al 50% entre el intento 1 y el intento 3.
                                    </span>
                                </div>
                            </div>

                            {/* Alertas de Alumnos Requeriendo Atención y Top Fallas */}
                            <div className="flex flex-col gap-6">
                                {/* Panel Alertas de Atención */}
                                <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1 tracking-wider uppercase flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-[#00A8FC]" /> Alumnos en Rezago
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-4">Trainees con 3 o más intentos fallidos que requieren soporte personalizado</p>

                                        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                                            {attentionList.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-white/[0.04] rounded-xl bg-white/[0.01]">
                                                    Todos los operadores activos están progresando bien.
                                                </div>
                                            ) : (
                                                attentionList.map((trainee, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-red-950/10 border border-red-500/10 text-xs">
                                                        <span className="font-semibold text-neutral-200">{trainee.name}</span>
                                                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                                                            {trainee.attempts} intentos fallados
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Top Fallas Comunes */}
                                <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1 tracking-wider uppercase">Fallas Críticas Frecuentes</h3>
                                        <p className="text-xs text-gray-500 mb-4">Los 5 escenarios o preguntas con mayor índice de error</p>

                                        <div className="flex flex-col gap-3">
                                            {topFailed.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-white/[0.04] rounded-xl bg-white/[0.01]">
                                                    No hay datos suficientes de fallas.
                                                </div>
                                            ) : (
                                                topFailed.map((item, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1 text-xs">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <span className="font-medium text-neutral-300 leading-tight block line-clamp-1">{item.text}</span>
                                                            <span className="bg-[#00A8FC]/10 text-[#00A8FC] px-1.5 py-0.5 rounded font-bold shrink-0 text-[10px]">
                                                                {item.count} err
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Listado General de Trainees */}
                        <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-wider uppercase">Historial General de Operadores</h3>
                                    <p className="text-xs text-gray-500">Listado de operadores, intentos realizados y estatus de acreditación</p>
                                </div>

                                <div className="flex flex-wrap gap-3 items-center">
                                    {/* Buscar por Nombre */}
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors min-w-[200px]"
                                    />

                                    {/* Filtro Estatus */}
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="bg-[#14151f] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none appearance-none cursor-pointer pr-7 relative"
                                    >
                                        <option value="all">Estatus: Todos</option>
                                        <option value="passed">Aprobados</option>
                                        <option value="failed">Pendientes</option>
                                    </select>
                                </div>
                            </div>

                            {loadingResults ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                                    <span className="w-8 h-8 border-2 border-[#00A8FC]/30 border-t-[#00A8FC] rounded-full animate-spin" />
                                    <span className="text-xs">Cargando registros...</span>
                                </div>
                            ) : traineesList.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-white/[0.04] rounded-2xl bg-white/[0.01]">
                                    <Users className="w-8 h-8 text-gray-600 mb-2" />
                                    <span className="text-xs">No se encontraron operadores registrados con los filtros aplicados.</span>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                    <th className="p-4">Operador</th>
                                                    <th className="p-4">Grupo / Sesión</th>
                                                    <th className="p-4 text-center">Intentos</th>
                                                    <th className="p-4 text-center">Mejor Precisión</th>
                                                    <th className="p-4 text-center">Último Intento</th>
                                                    <th className="p-4 text-center">Estatus Final</th>
                                                    <th className="p-4 text-center">Nivel Confianza (Paso 4)</th>
                                                    <th className="p-4 text-center">Historial</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {traineesList.map(([traineeId, data]) => {
                                                    const name = data.name;
                                                    const totalAttempts = data.attempts.length;
                                                    const bestScore = Math.max(...data.attempts.map(a => a.percentage));
                                                    const lastAttempt = data.attempts[data.attempts.length - 1];
                                                    const isApproved = data.attempts.some(a => a.passed);
                                                    const groupName = lastAttempt.training_sessions?.name ?? 'General';

                                                    // Obtener rating del Paso 4
                                                    let lastRating = '—';
                                                    const ratingAttempt = data.attempts.find(a => {
                                                        if (a.answers && Array.isArray(a.answers)) {
                                                            return a.answers.some((ans: any) => ans.questionId === 'feedback_rating');
                                                        }
                                                        return false;
                                                    });
                                                    if (ratingAttempt) {
                                                        const ratingObj = ratingAttempt.answers.find((ans: any) => ans.questionId === 'feedback_rating');
                                                        if (ratingObj && ratingObj.selectedText) {
                                                            lastRating = ratingObj.selectedText + ' ★';
                                                        }
                                                    }

                                                    return (
                                                        <React.Fragment key={traineeId}>
                                                            <tr className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                                                <td className="p-4 font-bold text-neutral-200 flex items-center gap-2">
                                                                    {name}
                                                                    {!isApproved && totalAttempts >= 3 && (
                                                                        <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-1">
                                                                            <ShieldAlert className="w-2.5 h-2.5" /> REZAGO
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-gray-400 font-medium">{groupName}</td>
                                                                <td className="p-4 text-center font-bold text-neutral-300">{totalAttempts}</td>
                                                                <td className="p-4 text-center">
                                                                    <span className={`font-black ${bestScore >= 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {bestScore}%
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-center text-gray-400">{formatDate(lastAttempt.taken_at)}</td>
                                                                <td className="p-4 text-center">
                                                                    {isApproved ? (
                                                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                                            ACREDITADO
                                                                        </span>
                                                                    ) : (
                                                                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                                            PENDIENTE
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-center text-[#FF5A00] font-bold">{lastRating}</td>
                                                                <td className="p-4 text-center">
                                                                    <button
                                                                        onClick={() => setExpandedAttemptId(expandedAttemptId === traineeId ? null : traineeId)}
                                                                        className="text-[#00A8FC] hover:underline font-semibold"
                                                                    >
                                                                        {expandedAttemptId === traineeId ? 'Ocultar' : 'Ver Detalles'}
                                                                    </button>
                                                                </td>
                                                            </tr>

                                                            {/* Desglose de Intentos del Estudiante */}
                                                            {expandedAttemptId === traineeId && (
                                                                <tr>
                                                                    <td colSpan={8} className="bg-[#0e0f16]/90 p-4 border-b border-white/[0.05]">
                                                                        <div className="flex flex-col gap-4">
                                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Desglose de Intentos de {name}:</div>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                {data.attempts.map((attempt) => {
                                                                                    const isSim = attempt.answers && Array.isArray(attempt.answers) && attempt.answers.some((ans: any) => ans.questionId?.startsWith('sq'));
                                                                                    return (
                                                                                        <div key={attempt.id} className="bg-[#141520] border border-white/[0.05] rounded-xl p-4 flex flex-col gap-2">
                                                                                            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                                                                                                <span className="font-bold text-[#00A8FC]">Intento #{attempt.attempt_number}</span>
                                                                                                <span className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-white/[0.05]">
                                                                                                    {isSim ? 'Simulador' : 'Teórico'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                                                                <span>Precisión:</span>
                                                                                                <span className={`font-bold ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>{attempt.percentage}%</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between text-xs text-gray-400">
                                                                                                <span>Duración:</span>
                                                                                                <span className="font-medium text-neutral-300">{formatDuration(attempt.duration_sec)}</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between text-xs text-gray-400">
                                                                                                <span>Fecha:</span>
                                                                                                <span className="font-medium text-neutral-400">{formatDate(attempt.taken_at)}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* VISTA EDITOR DE CONTENIDOS */
                    <div className="flex flex-col gap-6 animate-fadeIn text-left">
                        {/* Cabecera / Pestañas */}
                        <div className="bg-[#0d0e15]/80 border border-white/[0.04] rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-6">
                                <h2 className="text-sm font-black text-white tracking-widest flex items-center gap-2 uppercase">
                                    <Wrench className="w-4 h-4 text-[#FF5A00]" />
                                    Gestor de Base de Conocimientos
                                </h2>
                                <div className="h-5 w-[1px] bg-white/[0.07]" />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditorTab('faults')}
                                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                                            editorTab === 'faults'
                                                ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                                                : 'bg-[#14151f] text-gray-400 border-white/[0.05] hover:text-white'
                                        }`}
                                    >
                                        Fallas (Troubleshooting)
                                    </button>
                                    <button
                                        onClick={() => setEditorTab('advises')}
                                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                                            editorTab === 'advises'
                                                ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                                                : 'bg-[#14151f] text-gray-400 border-white/[0.05] hover:text-white'
                                        }`}
                                    >
                                        Consejos de Operación (Advises)
                                    </button>
                                    <button
                                        onClick={() => setEditorTab('telemetry')}
                                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                                            editorTab === 'telemetry'
                                                ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                                                : 'bg-[#14151f] text-gray-400 border-white/[0.05] hover:text-white'
                                        }`}
                                    >
                                        Consultas de Voz (IA)
                                    </button>
                                    <button
                                        onClick={() => setEditorTab('access')}
                                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                                            editorTab === 'access'
                                                ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                                                : 'bg-[#14151f] text-gray-400 border-white/[0.05] hover:text-white'
                                        }`}
                                    >
                                        Accesos de Usuarios
                                    </button>
                                    <button
                                        onClick={() => setEditorTab('robots')}
                                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                                            editorTab === 'robots'
                                                ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                                                : 'bg-[#14151f] text-gray-400 border-white/[0.05] hover:text-white'
                                        }`}
                                    >
                                        Estaciones (Robots)
                                    </button>
                                </div>
                            </div>
                            
                            {editorTab === 'faults' ? (
                                <button
                                    onClick={() => {
                                        setSelectedFault(null);
                                        setFaultForm({
                                            id: '',
                                            category: 'Problemas con el robot',
                                            symptom: '',
                                            resolution_protocol: '',
                                            sop_reference: '',
                                            video_url: ''
                                        });
                                        setFaultModalOpen(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Agregar Nueva Falla
                                </button>
                            ) : editorTab === 'advises' ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 font-semibold">Seleccionar Robot:</span>
                                    <div className="relative">
                                        <select
                                            value={selectedEditorRobotId}
                                            onChange={(e) => setSelectedEditorRobotId(e.target.value)}
                                            className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-white focus:outline-none appearance-none cursor-pointer"
                                        >
                                            {editorRobots.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedAdvice(null);
                                            const nextNum = editorAdvises.length > 0
                                                ? Math.max(...editorAdvises.map(a => a.advice_number)) + 1
                                                : 1;
                                            setAdviceForm({
                                                id: `${selectedEditorRobotId}__${nextNum}`,
                                                robot_id: selectedEditorRobotId,
                                                advice_number: nextNum,
                                                content: '',
                                                is_exception: false
                                            });
                                            setAdviceModalOpen(true);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar Consejo
                                    </button>
                                </div>
                            ) : editorTab === 'access' ? (
                                <button 
                                    onClick={fetchAccessLogs}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAccessLogs ? 'animate-spin' : ''}`} /> Actualizar Accesos
                                </button>
                            ) : editorTab === 'robots' ? (
                                <button 
                                    onClick={fetchRobotsConfig}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRobots ? 'animate-spin' : ''}`} /> Actualizar Robots
                                </button>
                            ) : null}
                        </div>

                        {/* Listados de Contenido */}
                        {loadingEditor ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3 bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl">
                                <span className="w-8 h-8 border-2 border-[#00A8FC]/30 border-t-[#00A8FC] rounded-full animate-spin" />
                                <span className="text-xs">Cargando base de conocimiento...</span>
                            </div>
                        ) : editorTab === 'faults' ? (
                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col">
                                <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                    <th className="p-4">ID</th>
                                                    <th className="p-4">Categoría</th>
                                                    <th className="p-4">Síntoma</th>
                                                    <th className="p-4">SOP Ref</th>
                                                    <th className="p-4 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {editorFaults.map(f => (
                                                    <tr key={f.id} className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                                        <td className="p-4 font-mono font-semibold text-gray-300">{f.id}</td>
                                                        <td className="p-4 text-gray-400 font-medium">{f.category}</td>
                                                        <td className="p-4 text-white font-medium max-w-[200px] truncate" title={f.symptom}>{f.symptom}</td>
                                                        <td className="p-4 text-gray-400 font-medium">{f.sop_reference}</td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFault(f);
                                                                        setFaultForm({
                                                                            id: f.id,
                                                                            category: f.category,
                                                                            symptom: f.symptom,
                                                                            resolution_protocol: f.resolution_protocol,
                                                                            sop_reference: f.sop_reference,
                                                                            video_url: f.video_url || ''
                                                                        });
                                                                        setFaultModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-[#00A8FC] transition-colors rounded hover:bg-white/[0.03]"
                                                                    title="Editar"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFault(f.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-white/[0.03]"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : editorTab === 'advises' ? (
                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col">
                                <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                    <th className="p-4">Número de Consejo</th>
                                                    <th className="p-4">Contenido</th>
                                                    <th className="p-4 text-center">Es Excepción</th>
                                                    <th className="p-4 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {editorAdvises.map(a => (
                                                    <tr key={a.id} className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                                        <td className="p-4 font-bold text-[#00A8FC] text-center w-32">Consejo #{a.advice_number}</td>
                                                        <td className="p-4 text-white font-medium max-w-lg truncate" title={a.content}>{a.content}</td>
                                                        <td className="p-4 text-center">
                                                            {a.is_exception ? (
                                                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-semibold">Sí</span>
                                                            ) : (
                                                                <span className="text-gray-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAdvice(a);
                                                                        setAdviceForm({
                                                                            id: a.id,
                                                                            robot_id: a.robot_id,
                                                                            advice_number: a.advice_number,
                                                                            content: a.content,
                                                                            is_exception: !!a.is_exception
                                                                        });
                                                                        setAdviceModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-[#00A8FC] transition-colors rounded hover:bg-white/[0.03]"
                                                                    title="Editar"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAdvice(a.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-white/[0.03]"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : editorTab === 'telemetry' ? (
                            /* TELEMETRIA DE VOZ */
                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                                        Historial de consultas de voz analizadas por IA
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {selectedTelemetryIds.length > 0 && (
                                            <button 
                                                onClick={handleBulkDeleteTelemetry}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25 hover:border-red-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Eliminar Seleccionados ({selectedTelemetryIds.length})
                                            </button>
                                        )}
                                        <button 
                                            onClick={fetchTelemetry}
                                            className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${loadingTelemetry ? 'animate-spin' : ''}`} />
                                            Actualizar
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                    <th className="p-4 w-12 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={telemetryList.length > 0 && selectedTelemetryIds.length === telemetryList.length}
                                                            onChange={handleToggleAllTelemetry}
                                                            className="w-4 h-4 rounded bg-[#14151f] border-white/[0.1] text-[#00A8FC] focus:ring-0 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="p-4">Fecha</th>
                                                    <th className="p-4">Consulta del Operador</th>
                                                    <th className="p-4 text-center">Coincidencias</th>
                                                    <th className="p-4">Selección Realizada</th>
                                                    <th className="p-4 text-center">Origen</th>
                                                    <th className="p-4 text-center">Estatus</th>
                                                    <th className="p-4 text-center">Tiempo Lector</th>
                                                    <th className="p-4 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {loadingTelemetry ? (
                                                    <tr>
                                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                                            Cargando datos de telemetría...
                                                        </td>
                                                    </tr>
                                                ) : telemetryList.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                                            No se han registrado consultas de voz aún.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    telemetryList.map((item) => (
                                                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                                            <td className="p-4 text-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedTelemetryIds.includes(item.id)}
                                                                    onChange={() => handleToggleTelemetrySelect(item.id)}
                                                                    className="w-4 h-4 rounded bg-[#14151f] border-white/[0.1] text-[#00A8FC] focus:ring-0 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="p-4 text-gray-400 font-medium whitespace-nowrap">
                                                                {formatDate(item.timestamp)}
                                                            </td>
                                                            <td className="p-4 text-white font-bold max-w-xs truncate" title={item.query}>
                                                                "{item.query}"
                                                            </td>
                                                            <td className="p-4 text-center font-bold text-gray-300">
                                                                {item.matches_count}
                                                            </td>
                                                            <td className="p-4 text-gray-400 truncate max-w-[180px]" title={item.selected_option || 'Ninguna'}>
                                                                {item.selected_option || <span className="text-gray-600">—</span>}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {item.source === 'text' && (
                                                                    <span className="bg-neutral-500/15 text-neutral-400 border border-neutral-500/30 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                                                        📝 TEXTO
                                                                    </span>
                                                                )}
                                                                {item.source === 'voice_inline' && (
                                                                    <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                                                        🎙️ VOZ
                                                                    </span>
                                                                )}
                                                                {(item.source === 'speech_agent' || !item.source) && (
                                                                    <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                                                        🤖 IA
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {item.status === 'resolved' && (
                                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                        RESUELTO
                                                                    </span>
                                                                )}
                                                                {item.status === 'no_matches' && (
                                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                        SIN SOLUCIÓN
                                                                    </span>
                                                                )}
                                                                {item.status === 'abandoned' && (
                                                                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                        ABANDONADO
                                                                    </span>
                                                                )}
                                                                {item.status === 'retried' && (
                                                                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                        REINTENTADO
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-center font-mono text-gray-400">
                                                                {item.time_spent_seconds ? `${item.time_spent_seconds}s` : '—'}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                 <div className="flex items-center justify-center gap-2">
                                                                     {(item.status === 'no_matches' || item.status === 'abandoned') && (
                                                                         <button
                                                                             onClick={() => {
                                                                                 setSelectedFault(null);
                                                                                 setFaultForm({
                                                                                     id: `ERR-VOICE-${Math.floor(Math.random() * 900 + 100)}`,
                                                                                     category: 'Problemas con el robot',
                                                                                     symptom: item.query,
                                                                                     resolution_protocol: '',
                                                                                     sop_reference: '',
                                                                                     video_url: ''
                                                                                 });
                                                                                 setFaultModalOpen(true);
                                                                             }}
                                                                             className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap"
                                                                             title="Añadir esta falla a la base de conocimiento"
                                                                         >
                                                                             Añadir Falla
                                                                         </button>
                                                                     )}
                                                                     <button
                                                                         onClick={() => handleDeleteTelemetry(item.id)}
                                                                         className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                                                         title="Eliminar este registro de búsqueda"
                                                                     >
                                                                         <Trash2 className="w-4 h-4" />
                                                                     </button>
                                                                 </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : editorTab === 'access' ? (
                            /* ACCESOS DE USUARIOS */
                            <div className="flex flex-col gap-6 w-full text-left">
                                {/* Tarjetas de Métricas */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-xl p-5 flex flex-col shadow-lg">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Accesos Hoy</span>
                                        <span className="text-3xl font-black text-[#FF5A00]">{todayAccessCount}</span>
                                    </div>
                                    <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-xl p-5 flex flex-col shadow-lg">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Accesos Totales</span>
                                        <span className="text-3xl font-black text-[#00A8FC]">{accessLogsList.length}</span>
                                    </div>
                                    <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-xl p-5 flex flex-col shadow-lg">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Usuarios Distintos</span>
                                        <span className="text-3xl font-black text-emerald-400">{uniqueUsersCount}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* Lista de Registros Detallada (8 columnas) */}
                                    <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col lg:col-span-8">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                                            Historial de Accesos Recientes
                                        </h4>
                                        <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                            <th className="p-4">Usuario</th>
                                                            <th className="p-4 text-center">Total de Accesos</th>
                                                            <th className="p-4">Último Acceso</th>
                                                            <th className="p-4 text-center">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/[0.03]">
                                                        {loadingAccessLogs ? (
                                                            <tr>
                                                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                                                    Cargando historial de accesos...
                                                                </td>
                                                            </tr>
                                                        ) : groupedAccessLogs.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                                                    No se han registrado accesos aún.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            groupedAccessLogs.map((group) => (
                                                                <React.Fragment key={group.name}>
                                                                    <tr 
                                                                        className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02] cursor-pointer"
                                                                        onClick={() => setExpandedAccessLogUser(expandedAccessLogUser === group.name ? null : group.name)}
                                                                    >
                                                                        <td className="p-4 text-white font-bold flex items-center gap-2">
                                                                            {group.name}
                                                                        </td>
                                                                        <td className="p-4 text-center font-black text-[#00A8FC]">
                                                                            {group.count}
                                                                        </td>
                                                                        <td className="p-4 text-gray-400 whitespace-nowrap">{formatDate(group.last_access)}</td>
                                                                        <td className="p-4 text-center">
                                                                            <button className="text-[#00A8FC] hover:underline font-semibold text-xs">
                                                                                {expandedAccessLogUser === group.name ? 'Ocultar' : 'Ver Registros'}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                    {expandedAccessLogUser === group.name && (
                                                                        <tr>
                                                                            <td colSpan={4} className="bg-[#0e0f16]/90 p-4 border-b border-white/[0.05]">
                                                                                <div className="flex flex-col gap-2">
                                                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">Desglose de Accesos de {group.name}:</div>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                                        {group.logs.map(log => (
                                                                                            <div key={log.id} className="bg-[#141520] border border-white/[0.05] rounded-xl p-3 flex flex-col gap-1.5">
                                                                                                <div className="flex justify-between text-xs text-gray-400">
                                                                                                    <span className="font-semibold text-neutral-300">Fecha:</span>
                                                                                                    <span>{formatDate(log.accessed_at)}</span>
                                                                                                </div>
                                                                                                <div className="flex justify-between text-[11px] text-gray-400">
                                                                                                    <span className="font-semibold">Ubicación:</span>
                                                                                                    <span className="truncate ml-2">{log.location || 'Desconocido'}</span>
                                                                                                </div>
                                                                                                <div className="flex justify-between text-[11px] text-gray-400">
                                                                                                    <span className="font-semibold">IP:</span>
                                                                                                    <span className="font-mono">{log.ip_address}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accesos por Día (4 columnas) */}
                                    <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col lg:col-span-4">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                                            Accesos Diarios
                                        </h4>
                                        <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                        <th className="p-4">Día</th>
                                                        <th className="p-4 text-center">Cantidad</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/[0.03]">
                                                    {loadingAccessLogs ? (
                                                        <tr>
                                                            <td colSpan={2} className="p-6 text-center text-gray-500">
                                                                Cargando...
                                                            </td>
                                                        </tr>
                                                    ) : dailyAccessStats.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={2} className="p-6 text-center text-gray-500">
                                                                Sin registros.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        dailyAccessStats.map((stat) => (
                                                            <tr key={stat.date} className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                                                <td className="p-4 text-white font-bold">{stat.date}</td>
                                                                <td className="p-4 text-center text-[#FF5A00] font-black text-sm">{stat.count}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ESTACIONES (ROBOTS) */
                            <div className="bg-[#0c0d14]/75 border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col w-full text-left">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">
                                    Configuración de URLs de Estaciones Robotizadas
                                </h3>
                                {loadingRobots ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                                        <span className="w-8 h-8 border-2 border-[#00A8FC]/30 border-t-[#00A8FC] rounded-full animate-spin" />
                                        <span className="text-xs">Cargando estaciones...</span>
                                    </div>
                                ) : robotsList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                        <span>No se encontraron estaciones registradas en la base de datos.</span>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-[#141520] border-b border-white/[0.05] text-gray-400 font-semibold">
                                                        <th className="p-4">ID (Código Nodo)</th>
                                                        <th className="p-4">Nombre del Robot</th>
                                                        <th className="p-4">URL Objetivo (Ultra Tech)</th>
                                                        <th className="p-4 text-center">Estatus</th>
                                                        <th className="p-4 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/[0.03]">
                                                    {robotsList.map(robot => (
                                                        <tr key={robot.id} className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                                            <td className="p-4 font-mono font-semibold text-gray-300">{robot.id}</td>
                                                            <td className="p-4 text-white font-bold">{robot.name}</td>
                                                            <td className="p-4">
                                                                <input
                                                                    type="text"
                                                                    value={robot.target_url || ''}
                                                                    onChange={(e) => handleUpdateRobotField(robot.id, 'target_url', e.target.value)}
                                                                    placeholder="https://app.ultra.tech/app/stations/..."
                                                                    className="w-full bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <select
                                                                    value={robot.status || 'inactive'}
                                                                    onChange={(e) => handleUpdateRobotField(robot.id, 'status', e.target.value)}
                                                                    className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-2 py-1.5 text-xs font-semibold text-white focus:outline-none appearance-none cursor-pointer text-center"
                                                                >
                                                                    <option value="active">Activo</option>
                                                                    <option value="inactive">Inactivo</option>
                                                                    <option value="maintenance">Mantenimiento</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <button
                                                                    onClick={() => handleSaveRobotConfig(robot)}
                                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-[0.98]"
                                                                >
                                                                    Guardar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL DE FALLA */}
            {faultModalOpen && (
                <div className="fixed inset-0 bg-[#07080c]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b0c13] border border-white/[0.08] rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-scaleIn text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-[#FF5A00]" />
                                {selectedFault ? 'Editar Falla' : 'Nueva Falla'}
                            </h3>
                            <button onClick={() => setFaultModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveFault} className="flex flex-col gap-4 text-xs font-semibold">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Identificador único (ID)</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!selectedFault}
                                    placeholder="Ej: robot_stopped"
                                    value={faultForm.id}
                                    onChange={e => setFaultForm({ ...faultForm, id: e.target.value })}
                                    className="bg-[#14151f] border border-white/[0.07] disabled:bg-neutral-900 disabled:text-gray-500 focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Categoría</label>
                                <select
                                    value={faultForm.category}
                                    onChange={e => setFaultForm({ ...faultForm, category: e.target.value })}
                                    className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors cursor-pointer"
                                >
                                    <option value="Problemas con el robot">Problemas con el robot</option>
                                    <option value="Error de Calibración">Error de Calibración</option>
                                    <option value="Falla de Alimentación">Falla de Alimentación</option>
                                    <option value="Fallo de Software">Fallo de Software</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Síntoma</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="Describe detalladamente el síntoma visible"
                                    value={faultForm.symptom}
                                    onChange={e => setFaultForm({ ...faultForm, symptom: e.target.value })}
                                    className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors resize-none font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Protocolo de Resolución</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Pasos para solucionar la falla"
                                    value={faultForm.resolution_protocol}
                                    onChange={e => setFaultForm({ ...faultForm, resolution_protocol: e.target.value })}
                                    className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors resize-none font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Referencia SOP</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: SOP-MERC-01"
                                        value={faultForm.sop_reference}
                                        onChange={e => setFaultForm({ ...faultForm, sop_reference: e.target.value })}
                                        className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">URL de Video (opcional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={faultForm.video_url}
                                        onChange={e => setFaultForm({ ...faultForm, video_url: e.target.value })}
                                        className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="bg-[#FF5A00] hover:bg-[#FF5A00]/90 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 transition-all active:scale-[0.98]"
                            >
                                Guardar Falla
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CONSEJO (ADVISE) */}
            {adviceModalOpen && (
                <div className="fixed inset-0 bg-[#07080c]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b0c13] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleIn text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-[#FF5A00]" />
                                {selectedAdvice ? 'Editar Consejo' : 'Nuevo Consejo'}
                            </h3>
                            <button onClick={() => setAdviceModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdvice} className="flex flex-col gap-4 text-xs font-semibold">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Identificador único (ID)</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!selectedAdvice}
                                        placeholder="Ej: mercury__1"
                                        value={adviceForm.id}
                                        onChange={e => setAdviceForm({ ...adviceForm, id: e.target.value })}
                                        className="bg-[#14151f] border border-white/[0.07] disabled:bg-neutral-900 disabled:text-gray-500 focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors font-mono"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Número de consejo</label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={adviceForm.advice_number}
                                        onChange={e => setAdviceForm({ ...adviceForm, advice_number: parseInt(e.target.value) || 1 })}
                                        className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Contenido del consejo</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Describe la instrucción o consejo para el operador..."
                                    value={adviceForm.content}
                                    onChange={e => setAdviceForm({ ...adviceForm, content: e.target.value })}
                                    className="bg-[#14151f] border border-white/[0.07] focus:border-[#00A8FC]/50 rounded-lg px-3 py-2 text-white focus:outline-none transition-colors resize-none font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    id="is_exception"
                                    checked={adviceForm.is_exception}
                                    onChange={e => setAdviceForm({ ...adviceForm, is_exception: e.target.checked })}
                                    className="w-4 h-4 border-white/[0.07] bg-[#14151f] rounded focus:ring-0 text-[#FF5A00] cursor-pointer"
                                />
                                <label htmlFor="is_exception" className="text-[11px] text-gray-300 font-semibold cursor-pointer select-none">
                                    Marcar como excepción operacional
                                </label>
                            </div>
                            <button
                                type="submit"
                                className="bg-[#FF5A00] hover:bg-[#FF5A00]/90 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 transition-all active:scale-[0.98]"
                            >
                                Guardar Consejo
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
