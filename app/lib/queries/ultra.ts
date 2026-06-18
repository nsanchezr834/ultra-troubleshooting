/**
 * lib/queries/ultra.ts
 * Queries principales para Ultra Platform.
 * Reemplaza los imports estáticos de robots-db.ts y workflows-db.ts.
 */

import { supabase } from '../supabase';
import type { ClientConfig, RobotConfig, FaultConfig, AdviceConfig } from '../../../config/robots-db';
import type { WorkflowConfig } from '../../../config/workflows-db';

// ── CLIENTS + ROBOTS + FAULTS ─────────────────────────────────────────────────

/**
 * Trae todos los clientes con sus robots y faults anidados.
 * Equivalente a: import { CLIENTS_DATABASE } from '../config/robots-db'
 */
export async function getClientsDatabase(): Promise<Record<string, ClientConfig>> {
    // 1. Traer clientes
    const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, logo_url');

    if (clientsError) throw new Error(`[clients] ${clientsError.message}`);

    // 2. Traer todos los robots
    const { data: robots, error: robotsError } = await supabase
        .from('robots')
        .select('id, client_id, name, status, workflow_key');

    if (robotsError) throw new Error(`[robots] ${robotsError.message}`);

    // 3. Traer todos los faults
    const { data: faults, error: faultsError } = await supabase
        .from('faults')
        .select('id, robot_id, fault_key, issue, description, severity, escalation, final_notes, troubleshooting_steps');

    if (faultsError) throw new Error(`[faults] ${faultsError.message}`);

    // 3.5 Traer todos los advises
    const { data: advises, error: advisesError } = await supabase
        .from('advises')
        .select('id, robot_id, advice_number, content, is_exception')
        .order('advice_number', { ascending: true });

    if (advisesError) {
        console.warn('⚠️ No se pudo obtener la tabla de advises, utilizando array vacío:', advisesError.message);
    }

    // 4. Armar el Record<string, ClientConfig> igual que el .ts original
    const database: Record<string, ClientConfig> = {};

    for (const client of clients ?? []) {
        const clientRobots: RobotConfig[] = (robots ?? [])
            .filter(r => r.client_id === client.id)
            .map(r => {
                const robotFaults: FaultConfig[] = (faults ?? [])
                    .filter(f => f.robot_id === r.id)
                    .map(f => ({
                        id: f.fault_key,
                        issue: f.issue,
                        description: f.description ?? '',
                        severity: f.severity as FaultConfig['severity'],
                        escalation: f.escalation ?? '',
                        finalNotes: f.final_notes ?? undefined,
                        troubleshooting: Array.isArray(f.troubleshooting_steps)
                            ? f.troubleshooting_steps
                            : [],
                    }));

                const robotAdvises: AdviceConfig[] = (advises ?? [])
                    .filter(a => a.robot_id === r.id)
                    .map(a => ({
                        id: a.id,
                        adviceNumber: a.advice_number,
                        content: a.content,
                        isException: a.is_exception,
                    }));

                return {
                    id: r.id,
                    name: r.name,
                    status: r.status as RobotConfig['status'],
                    faults: robotFaults,
                    advises: robotAdvises.length > 0 ? robotAdvises : undefined,
                };
            });

        database[client.id] = {
            id: client.id,
            name: client.name,
            robots: clientRobots,
        };
    }

    return database;
}

// ── WORKFLOWS ─────────────────────────────────────────────────────────────────

/**
 * Trae todos los workflows.
 * Equivalente a: import { WORKFLOWS_DATABASE } from '../config/workflows-db'
 */
export async function getWorkflowsDatabase(): Promise<Record<string, WorkflowConfig>> {
    const { data: workflows, error } = await supabase
        .from('workflows')
        .select('id, name, version, description, root_node');

    if (error) throw new Error(`[workflows] ${error.message}`);

    const database: Record<string, WorkflowConfig> = {};

    for (const w of workflows ?? []) {
        database[w.id] = {
            id: w.id,
            name: w.name,
            version: w.version,
            description: w.description ?? '',
            rootNode: w.root_node,
        };
    }

    return database;
}

// ── LOGO URL ──────────────────────────────────────────────────────────────────

/**
 * Obtiene la URL pública del logo de un cliente desde Supabase Storage.
 * Reemplaza la función getClientLogoPath() del page.tsx original.
 */
export function getClientLogoUrl(
    clientsDatabase: Record<string, ClientConfig & { logo_url?: string }>,
    clientId: string
): string {
    const client = clientsDatabase[clientId] as (ClientConfig & { logo_url?: string }) | undefined;
    return client?.logo_url ?? '';
}