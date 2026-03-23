import { Suspense } from 'react';
import { PoliciesClient } from './PoliciesClient';
import { fetchPolicyFilters } from '@/lib/services/policyService';
import { PolicyGridSkeleton } from '@/components/policies/PolicyCardSkeleton';
import { requireSession } from '@/lib/auth/requireSession';

export const metadata = { title: 'Policies — NFX Policies' };

export default async function PoliciesPage() {
  const session = await requireSession();
  const filters = await fetchPolicyFilters(session.accessToken).catch(() => ({ categories: [], departments: [] }));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Policy Library</h2>
        <p className="mt-1 text-sm text-slate-500">
          Browse, read, and acknowledge company policies.
        </p>
      </div>

      <Suspense fallback={<PolicyGridSkeleton />}>
        <PoliciesClient filters={filters} />
      </Suspense>
    </div>
  );
}
