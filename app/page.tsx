/**
 * app/page.tsx
 * Server Component — verifica sesión y renderiza StartingPage o HomeClient.
 */

import { cookies } from 'next/headers';
import { verifySessionToken } from './lib/security';
import { getClientsDatabase, getWorkflowsDatabase } from './lib/queries/ultra';
import HomeClient from './components/home-client';
import StartingPage from './components/starting';

export const dynamic = 'force-dynamic';

export default async function HomeTroubleshooting() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_id')?.value;
  const isAuthenticated = verifySessionToken(sessionToken);

  if (!isAuthenticated) {
    return <StartingPage />;
  }

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