'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/policies';

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-base font-semibold text-white">
        Sign in with your company account
      </h2>

      <motion.button
        type="button"
        onClick={() => signIn('azure-ad', { callbackUrl })}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/30 bg-white/20 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 23 23"
          className="h-5 w-5 shrink-0"
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
    </div>
  );
}
