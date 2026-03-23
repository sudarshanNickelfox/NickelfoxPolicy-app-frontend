'use client';

import { motion, type Variants } from 'framer-motion';

const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Enterprise Security',
    description: 'Azure AD SSO with role-based access control.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: 'Policy Management',
    description: 'Centralise and version all company policies.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Acknowledgement Tracking',
    description: 'Real-time compliance across your organisation.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375zm-4.875 7.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 018.25 19.875v-9z" />
      </svg>
    ),
    title: 'Employee Dashboard',
    description: 'Personal policy history and compliance status.',
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function LoginPanel() {
  return (
    <div
      className="hidden md:flex md:w-[42%] relative overflow-hidden flex-col justify-between p-12 lg:p-14"
      style={{ backgroundColor: '#3E2B4D' }}
    >
      {/* Decorative blurred circles */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full"
        style={{ backgroundColor: '#563D66', filter: 'blur(90px)', opacity: 0.6 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-10 h-[380px] w-[380px] rounded-full"
        style={{ backgroundColor: '#563D66', filter: 'blur(75px)', opacity: 0.5 }}
        aria-hidden="true"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col h-full"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-12">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.20)' }}
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">NFX Policies</span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
            Manage HR Policies<br />with Confidence
          </h1>
          <p style={{ color: 'rgba(200,192,208,0.80)' }} className="text-sm leading-relaxed">
            A unified platform for policy distribution, acknowledgement tracking, and compliance reporting.
          </p>
        </motion.div>

        {/* Feature cards */}
        <ul className="flex flex-col gap-3 flex-1" role="list">
          {FEATURES.map((feature) => (
            <motion.li
              key={feature.title}
              variants={itemVariants}
              className="flex items-start gap-3 rounded-2xl p-3.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #5E4E6B' }}
            >
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: '#4E3A5D', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(200,192,208,0.70)' }}>{feature.description}</p>
              </div>
            </motion.li>
          ))}
        </ul>

        {/* Footer */}
        <motion.p variants={itemVariants} className="mt-8 text-xs" style={{ color: 'rgba(200,192,208,0.50)' }}>
          © 2026 NickelFox Technologies
        </motion.p>
      </motion.div>
    </div>
  );
}
