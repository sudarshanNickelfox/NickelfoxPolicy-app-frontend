'use client';

import { motion } from 'framer-motion';

interface LoginPageShellProps {
  children: React.ReactNode;
}

export function LoginPageShell({ children }: LoginPageShellProps) {
  return (
    <main className="flex min-h-screen overflow-hidden bg-white">
      <motion.div
        className="flex w-full"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </main>
  );
}
