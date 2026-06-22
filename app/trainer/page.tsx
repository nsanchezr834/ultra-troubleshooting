/**
 * app/trainer/page.tsx
 * Server Component — guard de autenticación para el Dashboard de Trainer.
 * Usa la cookie 'trainer_session_id' (independiente de la sesión de operador).
 */

import { cookies } from 'next/headers';
import { verifySessionToken } from '../lib/security';
import TrainerClient from './trainer-client';
import TrainerStartingPage from './trainer-starting';

export const metadata = {
    title: 'Trainer Dashboard — Ultra Platform',
    description: 'Dashboard de curva de aprendizaje para Trainers certificados de Ultra.',
};

export default async function TrainerPage() {
    const cookieStore = await cookies();
    const trainerToken = cookieStore.get('trainer_session_id')?.value;
    const isTrainer = verifySessionToken(trainerToken, 'trainer');

    if (!isTrainer) {
        return <TrainerStartingPage />;
    }

    return <TrainerClient />;
}
