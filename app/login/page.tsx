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
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="mb-8 flex flex-col items-center md:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <svg
                className="h-8 w-8 text-white"
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
            <h1 className="text-2xl font-bold text-white">NFX Policies</h1>
            <p className="mt-1 text-sm text-white/60">Enterprise Policy Management</p>
          </div>

          {/* Glass form card */}
          <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            By signing in, you agree to comply with all applicable company policies.
          </p>
        </div>
      </div>
    </LoginPageShell>
  );
}
