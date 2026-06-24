/**
 * app/lib/training.ts
 * Funciones para gestionar sesiones de training y trainees en Supabase.
 * Usado en la Fase 2 del sistema de curva de aprendizaje.
 */

import { supabase } from './supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TrainingSession {
    id: string;
    pin: string;
    name: string;
    trainer: string;
    client_id: string | null;
    robot_id: string | null;
    active: boolean;
    created_at: string;
}

export interface Trainee {
    id: string;
    session_id: string;
    full_name: string;
    created_at: string;
}

export interface TraineeIdentity {
    traineeId: string;
    traineeName: string;
    sessionId: string;
    sessionName: string;
    trainerName: string;
    existingAttemptsCount: number;
    approvedLevels: string[];
}

// Helper para normalizar nombres en formato Título (ej: nahum sanchez -> Nahum Sanchez)
export function cleanAndFormatName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Obtener los niveles previamente aprobados por el participante (insensible a mayúsculas/minúsculas)
export async function getApprovedLevelsByName(fullName: string): Promise<string[]> {
    const normalizedName = cleanAndFormatName(fullName);
    const { data: siblingTrainees, error: siblingError } = await supabase
        .from('trainees')
        .select('id')
        .ilike('full_name', normalizedName);

    if (siblingError || !siblingTrainees) {
        return [];
    }

    const siblingIds = siblingTrainees.map(t => t.id);
    if (siblingIds.length === 0) return [];

    const { data: passedExams, error: passedError } = await supabase
        .from('exam_results')
        .select('answers')
        .in('trainee_id', siblingIds)
        .eq('passed', true);

    if (passedError || !passedExams) return [];

    const approvedLevels: string[] = [];
    passedExams.forEach(exam => {
        if (exam.answers && Array.isArray(exam.answers)) {
            const levelObj = exam.answers.find((ans: any) => ans.questionId === 'exam_level');
            if (levelObj && levelObj.selectedText) {
                approvedLevels.push(levelObj.selectedText);
            }
        }
    });

    return approvedLevels;
}

// ─── Validar PIN y registrar trainee ─────────────────────────────────────────

/**
 * Valida un PIN de sesión y registra (o recupera) al trainee.
 * Retorna la identidad completa para usar en el examen.
 * 
 * Si el PIN no existe o está inactivo → lanza error con mensaje legible.
 * Si el nombre ya existe en la sesión → recupera el trainee existente (upsert).
 */
export async function validateAndRegisterTrainee(
    pin: string,
    fullName: string
): Promise<TraineeIdentity> {
    const normalizedPin = pin.trim().toUpperCase();
    const normalizedName = cleanAndFormatName(fullName);

    // 1. Buscar la sesión activa con ese PIN
    const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .select('id, name, trainer, active')
        .eq('pin', normalizedPin)
        .eq('active', true)
        .single();

    if (sessionError || !session) {
        throw new Error('PIN inválido o sesión no activa. Verifica con tu Trainer.');
    }

    // 2. Intentar buscar trainee existente para evitar conflictos de upsert (insensible a mayúsculas/minúsculas)
    const { data: existingTrainees, error: selectError } = await supabase
        .from('trainees')
        .select('id, full_name')
        .eq('session_id', session.id)
        .ilike('full_name', normalizedName);

    if (selectError) {
        console.error('[training] Error al buscar trainee existente:', selectError);
    }

    // Intentar buscar coincidencia exacta, o tomar el primero si no hay coincidencia exacta
    let trainee: { id: string; full_name: string } | null | undefined = existingTrainees?.find(t => t.full_name === normalizedName) || existingTrainees?.[0];
    let traineeError = null;

    if (!trainee) {
        const { data: newTrainee, error: insertError } = await supabase
            .from('trainees')
            .insert({ session_id: session.id, full_name: normalizedName })
            .select('id, full_name')
            .single();
        trainee = newTrainee;
        traineeError = insertError;
    }

    if (traineeError || !trainee) {
        if (traineeError) {
            console.error('[training] Error insertando trainee:', traineeError);
        }
        throw new Error('Error al registrar el participante. Intenta de nuevo.');
    }

    // 3. Contar intentos existentes para inicializar el contador de intentos del lado del cliente
    const { count, error: countError } = await supabase
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .eq('trainee_id', trainee.id)
        .eq('session_id', session.id);

    if (countError) {
        console.error('[training] Error al contar intentos existentes:', countError);
    }

    // 4. Obtener todos los niveles aprobados históricamente por este participante
    const approvedLevels = await getApprovedLevelsByName(normalizedName);

    return {
        traineeId: trainee.id,
        traineeName: trainee.full_name,
        sessionId: session.id,
        sessionName: session.name,
        trainerName: session.trainer,
        existingAttemptsCount: count || 0,
        approvedLevels,
    };
}

// ─── Guardar resultado de examen ──────────────────────────────────────────────

export interface ExamResultPayload {
    traineeId: string;
    sessionId: string;
    robotId?: string | null;
    score: number;
    maxScore: number;
    passed: boolean;
    answers: object;
    durationSec?: number;
    attemptNumber?: number;
}

/**
 * Persiste el resultado del examen en Supabase.
 * Llamado desde exam-modal al finalizar (Fase 3).
 */
export async function saveExamResult(payload: ExamResultPayload): Promise<void> {
    const percentage = parseFloat(
        ((payload.score / payload.maxScore) * 100).toFixed(2)
    );

    const { error } = await supabase.from('exam_results').insert({
        trainee_id: payload.traineeId,
        session_id: payload.sessionId,
        robot_id: payload.robotId ?? null,
        score: payload.score,
        max_score: payload.maxScore,
        percentage,
        passed: payload.passed,
        answers: payload.answers,
        duration_sec: payload.durationSec ?? null,
        attempt_number: payload.attemptNumber ?? 1,
    });

    if (error) {
        console.error('[training] Error guardando resultado:', error);
        throw new Error('No se pudo guardar el resultado. Verifica la conexión.');
    }
}
