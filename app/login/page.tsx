import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginPanel } from '@/components/auth/LoginPanel';
import { LoginPageShell } from '@/components/auth/LoginPageShell';

export const metadata = { title: 'Sign In — NFX Policies' };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/policies');

  return (
    <LoginPageShell>
      {/* Left branding panel — hidden on mobile */}
      <LoginPanel />

      {/* Right login form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 flex flex-col items-center md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: '#3E2B4D' }}>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">NFX Policies</h1>
            <p className="mt-1 text-sm text-slate-500">NickelFox Technologies</p>
          </div>

          {/* Heading */}
          <div className="mb-8 hidden md:block">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to your NickelFox account to continue.</p>
          </div>

          {/* Form — no glass card on white bg */}
          <LoginForm />

          <p className="mt-6 text-center text-xs text-slate-400">
            By signing in, you agree to comply with all applicable company policies.
          </p>
        </div>
      </div>
    </LoginPageShell>
  );
}
