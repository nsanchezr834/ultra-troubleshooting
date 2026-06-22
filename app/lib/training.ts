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
    const normalizedName = fullName.trim();

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

    // 2. Upsert del trainee (crea si no existe, recupera si ya existe)
    const { data: trainee, error: traineeError } = await supabase
        .from('trainees')
        .upsert(
            { session_id: session.id, full_name: normalizedName },
            { onConflict: 'session_id,full_name', ignoreDuplicates: false }
        )
        .select('id, full_name')
        .single();

    if (traineeError || !trainee) {
        throw new Error('Error al registrar el participante. Intenta de nuevo.');
    }

    return {
        traineeId: trainee.id,
        traineeName: trainee.full_name,
        sessionId: session.id,
        sessionName: session.name,
        trainerName: session.trainer,
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
