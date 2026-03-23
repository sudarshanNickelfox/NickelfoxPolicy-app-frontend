import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/requireSession';
import { AdminPoliciesClient } from './AdminPoliciesClient';

export const metadata = { title: 'Manage Policies — NFX Policies' };

export default async function AdminPoliciesPage() {
  const session = await requireSession();

  if (session.role !== 'admin') {
    redirect('/policies');
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Manage Policies</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload new policies, review existing ones, and remove outdated documents.
        </p>
      </div>
      <AdminPoliciesClient accessToken={session.accessToken} />
    </div>
  );
}
