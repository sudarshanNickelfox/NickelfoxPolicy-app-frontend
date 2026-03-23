'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/policies';

  return (
    <div className="flex flex-col gap-6">
      <motion.button
        type="button"
        onClick={() => signIn('azure-ad', { callbackUrl })}
        className="flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#2F5BE7] focus:ring-offset-2"
        style={{ background: 'linear-gradient(135deg, #2F5BE7 0%, #4070f0 100%)', boxShadow: '0 4px 16px rgba(47,91,231,0.35)' }}
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
