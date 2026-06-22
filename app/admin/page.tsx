import { cookies } from 'next/headers';
import { verifySessionToken } from '../lib/security';
import AdminClient from './admin-client';
import AdminStartingPage from './admin-starting';

export const metadata = {
    title: 'Admin Dashboard — Ultra Platform',
    description: 'Dashboard de analíticas y ROI para la administración de Ultra.',
};

export default async function AdminPage() {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_session_id')?.value;
    const isAdmin = verifySessionToken(adminToken, 'admin');

    if (!isAdmin) {
        return <AdminStartingPage />;
    }

    return <AdminClient />;
}
