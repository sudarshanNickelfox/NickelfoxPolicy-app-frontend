import { notFound } from 'next/navigation';
import { fetchPolicyById } from '@/lib/services/policyService';
import { PolicyViewerShell } from '@/components/policies/PolicyViewerShell';
import { requireSession } from '@/lib/auth/requireSession';
import Link from 'next/link';

interface PolicyPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PolicyPageProps) {
  const policy = await fetchPolicyById(params.id).catch(() => null);
  return { title: policy ? `${policy.title} — NFX Policies` : 'Policy — NFX Policies' };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const session = await requireSession();

  let policy;
  try {
    policy = await fetchPolicyById(params.id, session.accessToken);
  } catch {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            <li>
              <Link
                href="/policies"
                className="text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                Policies
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li className="truncate text-slate-700" aria-current="page">
              {policy.title}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex-1 overflow-hidden">
        <PolicyViewerShell policy={policy} />
      </div>
    </div>
  );
}
