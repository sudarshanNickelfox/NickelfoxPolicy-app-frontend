import { requireSession } from '@/lib/auth/requireSession';
import { QuizClient } from './QuizClient';

export const metadata = { title: 'Policy Quiz — NFX Policies' };

export default async function QuizPage() {
  await requireSession();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Policy Quiz</h2>
        <p className="mt-1 text-sm text-slate-500">
          Test your knowledge of the policies you have acknowledged.
        </p>
      </div>
      <QuizClient />
    </div>
  );
}
