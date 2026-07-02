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
    'future-2.0': {
        videos: [
            {
                title: 'Proceso Completo — Future 2.0',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Future 2.0.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_future.mp4',
            },
            {
                title: 'Falla — Bolsa Fuera de Posición',
                description: 'La bolsa queda fuera de posición dentro de la bagger.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/falla_future.mp4',
            },
        ],
    },
    'siemens': {
        videos: [
            {
                title: 'Proceso Correcto — SIEMENS',
                description: 'Recorrido operativo completo del proceso correcto de empaque para la estación SIEMENS.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/logos/proceso_SIEMENS.mp4',
            },
        ],
    },
    'buddy': {
        videos: [
            {
                title: 'Proceso Completo — Buddy',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Buddy.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_future.mp4',
            },
        ],
    },
    'max': {
        videos: [
            {
                title: 'Proceso Completo — Max',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Max.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_future.mp4',
            },
        ],
    },
    'mojo': {
        videos: [
            {
                title: 'Proceso Completo — Mojo',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Mojo.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_future.mp4',
            },
        ],
    },
    'monty': {
        videos: [
            {
                title: 'Proceso Completo — Monty',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Monty.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_montyf.mp4',
            },
            {
                title: 'Proceso Fallido — Monty',
                description: 'La bolsa sale sin etiqueta',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/falla_monty.mp4',
            },
        ],
    },
    'venus': {
        videos: [
            {
                title: 'Proceso Completo — Venus',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Venus.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_venus.mp4',
            },
        ],
    },
    'mercury': {
        videos: [
            {
                title: 'Proceso Correcto — Mercury',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Mercury.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_mercury.mp4',
            },
            {
                title: 'Proceso Fallido — Mercury',
                description: 'Caso de estudio que muestra una falla operativa en el robot Mercury.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Falla%20En%20Mercury.mp4',
            },
        ],
    },
    'mabel': {
        videos: [
            {
                title: 'Proceso Completo — Mabel',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Mabel.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/mabel_proceso_completo.mp4',
            },
            {
                title: 'Proceso Fallido — Mabel',
                description: 'En el video se puede observar que al momento que va a sacar una bolsa la maquina expendedora queda atorada.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/falla_mabel.mp4',
            },
        ],
    },
    'packie-2.0': {
        videos: [
            {
                title: 'Proceso Completo — Packie',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Packie.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_packie.mp4',
            },
            {
                title: 'Proceso Fallido — Packie',
                description: 'Demostración de un error durante el proceso operativo del robot Packie.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_tower_completo.mp4',
            },
        ],
    },
    'captain-pack-sparrow': {
        videos: [
            {
                title: 'Proceso Completo — Captain Pack Sparrow',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Captain Pack Sparrow.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/packsparrow_completo.mp4',
            },
            {
                title: 'Falla — La bagger no sacó la bolsa',
                description: 'Falla cuando la bagger no arroja o no saca la bolsa correspondiente al pedido.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/packsparrow_error.mp4',
            },
        ],
    },
    'packasaurus': {
        videos: [
            {
                title: 'Proceso Completo — Packasaurus',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Packasaurus.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Packasauros_completo.mp4',
            },
        ],
    },
    'phil': {
        videos: [
            {
                title: 'Proceso Completo',
                description: 'Ciclo operativo estándar de Phil.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Proceso_Completo%20_Phil.mp4',
            },
            {
                title: 'Error: Producto Pasado',
                description: 'Caso de manejo de error cuando el sistema detecta un producto fuera del rango de fecha.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/error_producto_pasado_phil.mp4',
            },
        ],
    },
    'bagger-label': {
        videos: [
            {
                title: 'Proceso Correcto — Bagger Label',
                description: 'Proceso correcto de cómo hacer el laboratorio del robot Bagger Label.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/bagger_label.mp4',
            },
            {
                title: 'Proceso Fallido — Bagger Label',
                description: 'La bagger no dispensa la bolsa.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/error_bagger.mp4',
            },
        ],
    },
    'box-fold': {
        videos: [
            {
                title: 'Proceso Completo',
                description: 'Proceso correcto del flujo completo para armar y depositar cajas.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_box.mp4',
            },
        ],
    },
    'pick-sort': {
        videos: [
            {
                title: 'Proceso Completo',
                description: 'Proceso correcto del flujo completo de clasificación Pick Sort.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_pick.mp4',
            },
        ],
    },
    'tower-stack-unstack': {
        videos: [
            {
                title: 'Proceso Completo — Tower Stack/Unstack',
                description: 'Recorrido operativo completo del ciclo de trabajo del robot Tower Stack/Unstack.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_tower_completo.mp4',
            },
        ],
    },
    'msqc': {
        videos: [
            {
                title: 'Proceso Correcto — MSQC',
                description: 'Recorrido operativo completo del proceso correcto de empaque.',
                src: 'https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/proceso_completo_msqc.mp4',
            },
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

const ROBOT_MAP: Record<string, { clientKey: string, robotName: string }> = {
    'fleetwood-pack': { clientKey: 'manifest.eco', robotName: 'Fleetwood Pack' },
    'fleetwood': { clientKey: 'manifest.eco', robotName: 'Fleetwood' },
    'future-2.0': { clientKey: 'manifest.eco', robotName: 'Future 2.0' },
    'siemens': { clientKey: 'siemens', robotName: 'Siemens Workflow' },
    'buddy': { clientKey: 'internal', robotName: 'Buddy' },
    'max': { clientKey: 'internal', robotName: 'Max' },
    'mojo': { clientKey: 'internal', robotName: 'Mojo' },
    'monty': { clientKey: 'mountainy', robotName: 'Monty' },
    'venus': { clientKey: 'outerspace', robotName: 'Venus' },
    'mercury': { clientKey: 'outerspace', robotName: 'Mercury' },
    'mabel': { clientKey: 'mountainy', robotName: 'Mabel' },
    'packie-2.0': { clientKey: 'packie', robotName: 'Packie 2.0' },
    'captain-pack-sparrow': { clientKey: 'packie', robotName: 'Captain Pack Sparrow' },
    'packasaurus': { clientKey: 'packie', robotName: 'Packasaurus' },
    'phil': { clientKey: 'highline-commerce', robotName: 'Phil' },
    'bagger-label': { clientKey: 'internal', robotName: 'Bagger Label' },
    'box-fold': { clientKey: 'internal', robotName: 'Box Fold' },
    'pick-sort': { clientKey: 'highline-commerce', robotName: 'Pick & Sort' },
    'tower-stack-unstack': { clientKey: 'internal', robotName: 'Tower Stack/Unstack' },
    'msqc': { clientKey: 'shipcube', robotName: 'MSQC' }
};

async function migrateVideos() {
    console.log("Iniciando migración MASIVA de videos...");
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
