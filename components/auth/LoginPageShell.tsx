'use client';

import { motion, type Transition, type TargetAndTransition } from 'framer-motion';

interface LoginPageShellProps {
  children: React.ReactNode;
}

interface OrbConfig {
  key: string;
  className: string;
  animate: TargetAndTransition;
  transition: Transition;
}

const ORB_CONFIG: OrbConfig[] = [
  {
    key: 'violet',
    className:
      'absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/40 blur-3xl',
    animate: { y: [0, -20, 0] },
    transition: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'blue',
    className:
      'absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-500/30 blur-3xl',
    animate: { y: [0, -14, 0] },
    transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'pink',
    className:
      'absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/25 blur-3xl',
    animate: { y: [0, -10, 0] },
    transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'indigo',
    className:
      'absolute top-10 right-1/4 h-56 w-56 rounded-full bg-indigo-400/20 blur-2xl',
    animate: { y: [0, -18, 0] },
    transition: { duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 },
  },
];

export function LoginPageShell({ children }: LoginPageShellProps) {
  return (
    <main className="relative flex min-h-screen overflow-hidden animated-gradient">
      {/* Floating background orbs */}
      {ORB_CONFIG.map((orb) => (
        <motion.div
          key={orb.key}
          className={orb.className}
          animate={orb.animate}
          transition={orb.transition}
          aria-hidden="true"
        />
      ))}

      {/* Page entry transition wrapper */}
      <motion.div
        className="relative z-10 flex w-full"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </main>
  );
}
