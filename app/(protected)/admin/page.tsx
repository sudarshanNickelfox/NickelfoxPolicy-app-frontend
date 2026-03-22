import { requireSession } from '@/lib/auth/requireSession';
import { AdminClient } from './AdminClient';

export const metadata = { title: 'Admin Dashboard — NFX Policies' };

export default async function AdminPage() {
  const session = await requireSession('admin');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitor policy compliance, acknowledgements, and team activity.
        </p>
      </div>
      <AdminClient accessToken={session.accessToken} />
    </div>
  );
}
