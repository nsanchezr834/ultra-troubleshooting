/**
 * SEED SCRIPT — Questions database
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

async function seedQuestions() {
    console.log('🚀  Ultra Platform — Seed Questions Database\n');
    console.log(`📡  URL: ${SUPABASE_URL}`);
    
    // Importación dinámica para asegurar que dotenv cargó el env antes de iniciar supabase en exam-modal.tsx
    const { EXAM_QUESTIONS } = await import('../app/components/exam-modal');
    console.log(`📝  Preguntas a migrar: ${EXAM_QUESTIONS.length}\n`);

    const questionsToInsert = EXAM_QUESTIONS.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_index: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty || 'easy',
        category: q.category || 'Training 1',
        active: true
    }));

    const { error } = await supabase
        .from('exam_questions')
        .upsert(questionsToInsert, { onConflict: 'id' });

    if (error) {
        throw new Error(`[exam_questions] Error during upsert: ${error.message}`);
    }

    console.log('✅  Exito: exam_questions insertadas correctamente.');
}

seedQuestions().catch(err => {
    console.error('❌  Error durante el seed:', err);
    process.exit(1);
});
