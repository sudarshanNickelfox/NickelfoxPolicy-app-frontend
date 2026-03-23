'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { Session } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const ShieldIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const QuizIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
    />
  </svg>
);

const CogIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const navItems: NavItem[] = [
  { label: 'Policies', href: '/policies', icon: <DocumentIcon /> },
  { label: 'My Acknowledgements', href: '/my-acknowledgements', icon: <CheckCircleIcon /> },
  { label: 'Policy Quiz', href: '/quiz', icon: <QuizIcon /> },
  { label: 'Admin', href: '/admin', icon: <CogIcon />, adminOnly: true },
  { label: 'Manage Policies', href: '/admin/policies', icon: <DocumentIcon />, adminOnly: true },
];

interface SidebarProps {
  session: Session;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ session, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = session.role === 'admin';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const avatarInitial = session.user.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'flex h-full flex-col border-r border-indigo-700/50 overflow-hidden z-30',
        'bg-gradient-to-b from-violet-700 via-indigo-600 to-blue-600',
        // Desktop: always visible
        'hidden md:flex',
        // Mobile: fixed drawer overlay when open
        mobileOpen && 'fixed inset-y-0 left-0 flex',
      )}
      aria-label="Main navigation"
    >
      {/* Logo / Header */}
      <div className="flex h-16 items-center border-b border-white/20 px-4 overflow-hidden">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className={cn('text-white', isCollapsed ? 'mx-auto' : '')}>
            <ShieldIcon />
          </span>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap text-lg font-bold text-white"
              >
                NFX Policies
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="ml-auto flex md:hidden items-center justify-center rounded-lg p-1.5 text-blue-100/70 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4" role="navigation">
        <ul className="space-y-1" role="list">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isCollapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <span
                    className={cn('shrink-0', isActive ? 'text-white' : 'text-blue-100/70')}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <motion.span
                    animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle button */}
      <div className="border-t border-white/20 px-2 py-2">
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-blue-100/50',
            'hover:bg-white/10 hover:text-white transition-colors',
            isCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {!isCollapsed && <span>Collapse</span>}
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {/* User info */}
      <div className="border-t border-white/20 bg-black/20 px-2 py-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2',
            isCollapsed ? 'justify-center' : '',
          )}
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
              aria-hidden="true"
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-sm font-semibold"
              aria-hidden="true"
            >
              {avatarInitial}
            </div>
          )}

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-white whitespace-nowrap">
                  {session.user.name ?? 'User'}
                </p>
                <p className="truncate text-xs text-blue-100/60 whitespace-nowrap">
                  {session.user.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
