/**
 * SEED SCRIPT — Questions database (Fixed to use existing Supabase structure)
 * --------------------------------
 * Migra las preguntas del examen (EXAM_QUESTIONS) de exam-modal.tsx a Supabase.
 *
 * USO:
 *   npx tsx scripts/seed-questions.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Función auxiliar para convertir el string id en un UUID válido basado en hash si no lo es, 
// o simplemente generar un uuid v4 dummy/consistente para la siembra de preguntas hardcoded.
function getDeterministicUUID(idStr: string): string {
    // Si ya tiene formato uuid, retornarlo
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idStr)) {
        return idStr;
    }
    // Generar un UUID determinista simple basado en el texto del id string.
    // Usaremos un mapeo básico o un UUID base relleno para que sea único pero repetible si corremos de nuevo el seed.
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        const char = idStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convertir a entero de 32 bits
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // Retornamos un UUID válido concatenando el hex
    return `00000000-0000-4000-a000-${hex.padEnd(12, '0')}`;
}

async function seedQuestions() {
    console.log('🚀  Ultra Platform — Seed Questions Database (Adaptado a Producción)\n');
    console.log(`📡  URL: ${SUPABASE_URL}`);
    
    // Importación dinámica para asegurar que dotenv cargó el env antes de iniciar supabase en exam-modal.tsx
    const { EXAM_QUESTIONS } = await import('../app/components/exam-modal');
    console.log(`📝  Preguntas a migrar: ${EXAM_QUESTIONS.length}\n`);

    const questionsToInsert = EXAM_QUESTIONS.map(q => ({
        id: getDeterministicUUID(q.id),
        question: q.question,
        options: q.options,
        correct_index: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium', // 'media' o 'easy'
        // Mapear campos de la base de datos real
        is_active: true
    }));

    const { error } = await supabase
        .from('exam_questions')
        .upsert(questionsToInsert, { onConflict: 'id' });

    if (error) {
        throw new Error(`[exam_questions] Error during upsert: ${error.message}`);
    }

    console.log('✅  Exito: exam_questions insertadas correctamente utilizando columnas de producción.');
}

seedQuestions().catch(err => {
    console.error('❌  Error durante el seed:', err);
    process.exit(1);
});
