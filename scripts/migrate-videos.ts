import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// HARDCODED MAP FROM videos.tsx
const VIDEO_LIBRARY: any = {
    'fleetwood-pack': {
        videos: [
            {
                title: 'Proceso Completo — Fleetwood',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Fleetwood.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_fleetwood.mp4',
            },
            {
                title: 'Mala Inserción de Producto en la Bolsa',
                description: 'Caso de estudio demostrando una mala inserción del producto en la bolsa.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Fleetwood%20_%20Bad%20package.mp4',
            },
        ],
    },
    'fleetwood': {
        videos: [
            {
                title: 'Proceso de Empaque - Fleetwood',
                description: 'Recorrido operativo completo del ciclo de trabajo.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_fleetwood.mp4',
            }
        ],
    },
    'pick-sort': {
        videos: [
            {
                title: 'Atasco en Conveyor de Salida',
                description: 'Demostración de resolución cuando los productos se acumulan y bloquean el sensor de salida.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/atasco_conveyor_salida.mp4',
            }
        ]
    },
    'msqc': {
        videos: [
            {
                title: 'Despejar atascos de producto',
                description: 'La bolsa no es liberada.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/20241014_114321.mp4',
            },
            {
                title: 'Problema en la zona de sellado',
                description: 'La bolsa no es extraida de la zona de sellado.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/20241014_104845_2.mp4',
            }
        ]
    }
};

// Hardcoded mapping to bypass ts-node module resolution issues
const ROBOT_MAP: Record<string, { clientKey: string, robotName: string }> = {
    'fleetwood-pack': { clientKey: 'manifest.eco', robotName: 'Fleetwood Pack' },
    'fleetwood': { clientKey: 'manifest.eco', robotName: 'Fleetwood' },
    'pick-sort': { clientKey: 'highline-commerce', robotName: 'Pick & Sort' },
    'msqc': { clientKey: 'shipcube', robotName: 'MSQC' }
};

async function migrateVideos() {
    console.log("Iniciando migración de videos...");
    let inserted = 0;

    for (const [robotId, config] of Object.entries(VIDEO_LIBRARY)) {
        const robotInfo = ROBOT_MAP[robotId];
        if (!robotInfo) {
            console.warn(`No se encontró robotName para robotId: ${robotId}`);
            continue;
        }

        const vids: any[] = (config as any).videos;
        for (let i = 0; i < vids.length; i++) {
            const v = vids[i];
            
            const row = {
                id: `${robotId}-video-${i+1}`,
                category: 'Video Tutorial',
                symptom: v.title,
                root_cause: v.description,
                severity: 'LOW',
                resolution_protocol: 'Consulta el video para ver el proceso paso a paso.',
                sop_reference: `Video - ${robotInfo.robotName}`,
                video_url: v.src
            };

            const { error } = await supabase.from('troubleshooting_knowledge').upsert(row);
            if (error) {
                console.error("Error insertando video:", error);
            } else {
                inserted++;
            }
        }
    }
    
    console.log(`✅ Migración de videos completa. Insertados: ${inserted}`);
}

migrateVideos();
