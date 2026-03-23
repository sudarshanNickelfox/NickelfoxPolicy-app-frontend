import { requireSession } from '@/lib/auth/requireSession';
import { MyAcknowledgementsClient } from './MyAcknowledgementsClient';

export const metadata = { title: 'My Acknowledgements — NFX Policies' };

export default async function MyAcknowledgementsPage() {
  await requireSession();
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Acknowledgements</h2>
        <p className="mt-1 text-sm text-slate-500">
          A record of all policies you have acknowledged.
        </p>
      </div>
      <MyAcknowledgementsClient />
    </div>
  );
}
