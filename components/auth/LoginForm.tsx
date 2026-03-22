'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut', delay },
  }),
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/policies';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    });
    if (result?.error) {
      setError('Invalid email or password.');
      setIsLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-center text-base font-semibold text-white">
        Sign in to your account
      </h2>

      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg bg-red-500/20 border border-red-300/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </motion.div>
      )}

      {/* Email field */}
      <motion.div
        className="flex flex-col gap-1.5"
        custom={0.1}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
      >
        <label htmlFor="email" className="text-sm font-medium text-white/90">
          Email
        </label>
        <motion.input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@nfx.com"
          className="w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20 transition-colors"
          whileFocus={{ scale: 1.01 }}
        />
      </motion.div>

      {/* Password field */}
      <motion.div
        className="flex flex-col gap-1.5"
        custom={0.2}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
      >
        <label htmlFor="password" className="text-sm font-medium text-white/90">
          Password
        </label>
        <motion.input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20 transition-colors"
          whileFocus={{ scale: 1.01 }}
        />
      </motion.div>

      {/* Sign in button */}
      <motion.div
        custom={0.3}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
      >
        <GradientSignInButton isLoading={isLoading} />
      </motion.div>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-2 text-white/40">or</span>
        </div>
      </div>

      {/* Microsoft SSO button */}
      <motion.button
        type="button"
        onClick={() => signIn('azure-ad', { callbackUrl })}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/20 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 23 23"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path fill="#f3f3f3" d="M0 0h23v23H0z" />
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
        Sign in with Microsoft
      </motion.button>
    </form>
  );
}

/* ── Gradient Sign In button with shimmer overlay ──────────────────────── */

interface GradientSignInButtonProps {
  isLoading: boolean;
}

function GradientSignInButton({ isLoading }: GradientSignInButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:from-violet-600 hover:to-indigo-700"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Shimmer overlay */}
      <motion.span
        className="pointer-events-none absolute inset-0 -skew-x-12 bg-white/20"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '200%' } : { x: '-100%' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      <span className="relative">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Signing in…
          </span>
        ) : (
          'Sign in'
        )}
      </span>
    </motion.button>
  );
}
