import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Authentication Error — NFX Policies' };

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server configuration error',
    description: 'There is an issue with the server configuration. Please contact your administrator.',
  },
  AccessDenied: {
    title: 'Access denied',
    description: 'You do not have permission to access this resource. If you believe this is a mistake, please contact your administrator.',
  },
  Verification: {
    title: 'Verification failed',
    description: 'The sign-in link is no longer valid. It may have expired or already been used.',
  },
  Default: {
    title: 'Authentication error',
    description: 'An unexpected error occurred during authentication. Please try signing in again.',
  },
};

interface AuthErrorPageProps {
  searchParams: { error?: string };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const errorKey = searchParams.error ?? 'Default';
  const errorInfo = ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.Default;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 border border-red-200">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-slate-900">{errorInfo.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{errorInfo.description}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button variant="primary" aria-label="Return to sign in page">
              Return to sign in
            </Button>
          </Link>
          <Link href="mailto:it-support@company.com">
            <Button variant="secondary" aria-label="Contact IT support">
              Contact support
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
