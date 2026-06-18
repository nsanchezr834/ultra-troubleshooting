/**
 * app/page.tsx
 * Server Component — fetcha datos de Supabase y los pasa a HomeClient.
 */

import { getClientsDatabase, getWorkflowsDatabase } from './lib/queries/ultra';
import HomeClient from './components/home-client';

export default async function HomeTroubleshooting() {
  const [clientsDatabase, workflowsDatabase] = await Promise.all([
    getClientsDatabase(),
    getWorkflowsDatabase(),
  ]);

  return (
    <HomeClient
      clientsDatabase={clientsDatabase}
      workflowsDatabase={workflowsDatabase}
    />
  );
}