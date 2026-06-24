/**
 * SEED SCRIPT — Ultra Platform / Remotics
 * ----------------------------------------
 * Migra robots-db.ts y workflows-db.ts a Supabase.
 *
 * USO:
 *   1. npm install @supabase/supabase-js tsx dotenv
 *   2. Crea un archivo .env.local con:
 *        SUPABASE_URL=https://xxxx.supabase.co
 *        SUPABASE_SERVICE_KEY=eyJ...  ← usa la SERVICE ROLE key (no la anon)
 *   3. npx tsx scripts/seed-supabase.ts
 *
 * IMPORTANTE: Usa la SERVICE ROLE key para bypass de RLS durante el seed.
 * Nunca la expongas en el frontend.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ── Cargar variables de entorno ──────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Importar las bases de datos locales ─────────────────────────────────────
// Ajusta las rutas según la ubicación de este script en tu proyecto
// Por esto:
import { CLIENTS_DATABASE } from '../config/robots-db';
import { WORKFLOWS_DATABASE } from '../config/workflows-db';

// ── Mapa robot_id → workflow_key (igual que ROBOT_TO_WORKFLOW_MAP del dashboard)
const ROBOT_TO_WORKFLOW_MAP: Record<string, string> = {
    'packie-2.0': 'packie-2.0',
    'future-2.0': 'future-2.0',
    'captain-pack-sparrow': 'captain-pack-sparrow',
    'packasaurus': 'packasaurus',
    'fleetwood-pack': 'highline-fleetwood',
    'fleetwood': 'highline-fleetwood',
    'phil': 'highline-phil',
    'highline-phil': 'highline-phil',
    'venus': 'outerspace-venus',
    'mercury': 'outerspace-mercury',
    'mabel': 'mountainy-mabel',
    'monty': 'mountainy-monty',
    'box-fold': 'internal-box-fold',
    'pick-sort': 'internal-pick-sort',
    'tote': 'internal-tote',
    'bagger-label': 'internal-bagger-label',
    'tower-stack-unstack': 'internal-tower-stack',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(emoji: string, msg: string) {
    console.log(`${emoji}  ${msg}`);
}

async function upsert(table: string, data: object | object[]) {
    const rows = Array.isArray(data) ? data : [data];
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`[${table}] ${error.message}`);
}

// ── Seed clients ─────────────────────────────────────────────────────────────

async function seedClients() {
    log('🏢', 'Insertando clientes...');

    const clients = Object.values(CLIENTS_DATABASE).map(c => ({
        id: c.id,
        name: c.name,
        logo_url: null, // se sube manualmente al bucket después
    }));

    await upsert('clients', clients);
    log('✅', `${clients.length} clientes insertados`);
}

// ── Seed robots ──────────────────────────────────────────────────────────────

async function seedRobots() {
    log('🤖', 'Insertando robots...');

    const robots: object[] = [];

    for (const client of Object.values(CLIENTS_DATABASE)) {
        for (const robot of client.robots) {
            robots.push({
                id: robot.id,
                client_id: client.id,
                name: robot.name,
                status: robot.status,
                workflow_key: ROBOT_TO_WORKFLOW_MAP[robot.id] ?? null,
            });
        }
    }

    await upsert('robots', robots);
    log('✅', `${robots.length} robots insertados`);
}

// ── Seed faults ──────────────────────────────────────────────────────────────

async function seedFaults() {
    log('⚠️ ', 'Insertando faults...');

    // Para faults el PK compuesto es (id, robot_id), pero Supabase upsert
    // necesita un único campo o constraint. Usaremos un id generado compuesto.
    const faults: object[] = [];

    for (const client of Object.values(CLIENTS_DATABASE)) {
        for (const robot of client.robots) {
            for (const fault of robot.faults) {
                faults.push({
                    id: `${robot.id}__${fault.id}`,   // id único compuesto
                    robot_id: robot.id,
                    fault_key: fault.id,               // el id original corto
                    issue: fault.issue,
                    description: fault.description,
                    severity: fault.severity,
                    escalation: fault.escalation,
                    final_notes: fault.finalNotes ?? null,
                    troubleshooting_steps: fault.troubleshooting, // jsonb array
                });
            }
        }
    }

    if (faults.length === 0) {
        log('ℹ️ ', 'No hay faults que insertar');
        return;
    }

    await upsert('faults', faults);
    log('✅', `${faults.length} faults insertados`);
}

// ── Seed workflows ────────────────────────────────────────────────────────────

async function seedWorkflows() {
    log('🔄', 'Insertando workflows...');

    const workflows = Object.values(WORKFLOWS_DATABASE).map(w => ({
        id: w.id,
        name: w.name,
        version: w.version,
        description: w.description,
        root_node: w.rootNode, // Supabase lo serializa como jsonb automáticamente
    }));

    await upsert('workflows', workflows);
    log('✅', `${workflows.length} workflows insertados`);
}

// ── Seed advises ─────────────────────────────────────────────────────────────

async function seedAdvises() {
    log('💡', 'Insertando advises...');

    const advises: object[] = [];

    for (const client of Object.values(CLIENTS_DATABASE)) {
        for (const robot of client.robots) {
            if (robot.advises) {
                for (const adv of robot.advises) {
                    advises.push({
                        id: adv.id,
                        robot_id: robot.id,
                        advice_number: adv.adviceNumber,
                        content: adv.content,
                        is_exception: adv.isException
                    });
                }
            }
        }
    }

    if (advises.length === 0) {
        log('ℹ️ ', 'No hay advises que insertar');
        return;
    }

    await upsert('advises', advises);
    log('✅', `${advises.length} advises insertados`);
}

// ── Runner principal ──────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚀  Ultra Platform — Seed Supabase\n');
    console.log(`📡  URL: ${SUPABASE_URL}\n`);

    try {
        await seedClients();
        await seedRobots();
        await seedFaults();
        await seedWorkflows();
        await seedAdvises();

        console.log('\n🎉  Seed completado exitosamente.\n');
        console.log('📋  Próximos pasos:');
        console.log('    1. Sube los logos al bucket "logos" en Supabase Storage');
        console.log('    2. Actualiza el campo logo_url en la tabla clients');
        console.log('    3. Ejecuta el SQL de setup de RLS (ver seeds/setup-rls.sql)');

    } catch (err) {
        console.error('\n❌  Error durante el seed:', err);
        process.exit(1);
    }
}

main();
