'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { fetchPolicies } from '@/lib/services/policyService';
import { fetchUserAcknowledgements } from '@/lib/services/acknowledgementService';
import type { Policy, Acknowledgement, User } from '@/types';

interface UserDashboardClientProps {
  accessToken: string;
  user: User;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getComplianceColor(pct: number): string {
  if (pct >= 80) return 'text-green-500';
  if (pct >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getBarColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getRingStroke(pct: number): string {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function useCountUp(target: number, duration = 1.2, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || target === 0) return;
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(parseFloat(v.toFixed(decimals))),
    });
    return controls.stop;
  }, [inView, target, duration, decimals]);

  return { ref, value };
}

// ── Hero ring (white on gradient bg) ──────────────────────────────────────────

function HeroRing({ pct }: { pct: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const ringRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true });
  const { ref: numRef, value: displayPct } = useCountUp(pct, 1.4);

  useEffect(() => {
    if (!inView || !ringRef.current) return;
    const targetOffset = circumference - (pct / 100) * circumference;
    const controls = animate(circumference, targetOffset, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ringRef.current) ringRef.current.style.strokeDashoffset = String(v);
      },
    });
    return controls.stop;
  }, [inView, pct, circumference]);

  return (
    <div ref={containerRef} className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
        <circle
          ref={ringRef}
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span ref={numRef} className="text-2xl font-bold text-white tabular-nums leading-none">
          {displayPct}%
        </span>
        <span className="text-xs text-indigo-100 mt-0.5">Compliant</span>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  iconBgClass: string;
  iconColorClass: string;
  icon: React.ReactNode;
  trendLabel: string;
  delay: number;
}

function StatCard({ label, value, suffix = '', iconBgClass, iconColorClass, icon, trendLabel, delay }: StatCardProps) {
  const { ref, value: displayValue } = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 cursor-default"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <span className={`w-5 h-5 ${iconColorClass}`}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end gap-1">
        <span ref={ref} className="text-3xl font-bold text-slate-800 tabular-nums leading-none">
          {displayValue}
        </span>
        {suffix && <span className="text-xl font-bold text-slate-600 leading-none mb-0.5">{suffix}</span>}
      </div>
      <p className="text-xs text-slate-400">{trendLabel}</p>
    </motion.div>
  );
}

// ── Personal compliance ring ───────────────────────────────────────────────────

function ComplianceRing({ pct, acknowledged, total }: { pct: number; acknowledged: number; total: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const ringRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true });
  const stroke = getRingStroke(pct);
  const { ref: numRef, value: displayPct } = useCountUp(pct, 1.4);

  useEffect(() => {
    if (!inView || !ringRef.current) return;
    const targetOffset = circumference - (pct / 100) * circumference;
    const controls = animate(circumference, targetOffset, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ringRef.current) ringRef.current.style.strokeDashoffset = String(v);
      },
    });
    return controls.stop;
  }, [inView, pct, circumference]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle
            ref={ringRef}
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={numRef} className={`text-3xl font-bold tabular-nums ${getComplianceColor(pct)}`}>
            {displayPct}%
          </span>
          <span className="text-xs text-slate-400 mt-0.5">Compliance</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 text-center">
        <span className="font-semibold text-slate-800">{acknowledged}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span> policies acknowledged
      </p>
    </div>
  );
}

// ── Category bar ──────────────────────────────────────────────────────────────

function CategoryBar({ name, pct, total, acked, delay }: { name: string; pct: number; total: number; acked: number; delay: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const inView = useInView(barRef, { once: true });
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, pct, {
      duration: 1.0,
      delay,
      ease: 'easeOut',
      onUpdate: (v) => setWidth(parseFloat(v.toFixed(1))),
    });
    return controls.stop;
  }, [inView, pct, delay]);

  return (
    <div ref={barRef} className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 capitalize">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{acked}/{total}</span>
          <span className={`text-sm font-semibold tabular-nums ${getComplianceColor(pct)}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${getBarColor(pct)}`}
          style={{ width: `${width}%`, transition: 'width 0.05s linear' }}
        />
      </div>
    </div>
  );
}

// ── Activity item ──────────────────────────────────────────────────────────────

function ActivityItem({ ack, index }: { ack: Acknowledgement; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: 'easeOut' }}
      className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0"
    >
      <div className="mt-0.5 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{ack.policyTitle}</p>
        <p className="text-xs text-slate-400 mt-0.5">v{ack.policyVersion} · {timeAgo(ack.acknowledgedAt)}</p>
      </div>
    </motion.div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export function UserDashboardClient({ accessToken, user }: UserDashboardClientProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [policiesResult, acksResult] = await Promise.all([
        fetchPolicies({ page: 1, page_size: 100 }, accessToken),
        fetchUserAcknowledgements(accessToken),
      ]);
      setPolicies(policiesResult.data);
      setAcknowledgements(acksResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activePolicies = policies.filter((p) => !p.isArchived);
  const totalPolicies = activePolicies.length;
  const acknowledgedCount = activePolicies.filter((p) => p.status === 'acknowledged').length;
  const pendingCount = activePolicies.filter(
    (p) => p.requiresAcknowledgement && p.status !== 'acknowledged'
  ).length;
  const complianceRate = totalPolicies > 0 ? Math.round((acknowledgedCount / totalPolicies) * 100) : 0;

  const pendingPolicies = activePolicies
    .filter((p) => p.requiresAcknowledgement && p.status !== 'acknowledged')
    .slice(0, 5);

  const recentAcks = [...acknowledgements]
    .sort((a, b) => new Date(b.acknowledgedAt).getTime() - new Date(a.acknowledgedAt).getTime())
    .slice(0, 6);

  const categoryMap: Record<string, { total: number; acked: number }> = {};
  activePolicies.forEach((p) => {
    if (!categoryMap[p.category]) categoryMap[p.category] = { total: 0, acked: 0 };
    categoryMap[p.category].total++;
    if (p.status === 'acknowledged') categoryMap[p.category].acked++;
  });
  const categories = Object.entries(categoryMap)
    .map(([name, v]) => ({ name, ...v, pct: Math.round((v.acked / v.total) * 100) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const displayName = user.name?.split(' ')[0] ?? user.email ?? 'there';

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <DashboardSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Failed to load dashboard</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Welcome hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="text-2xl sm:text-3xl font-bold text-white"
          >
            Good {getGreeting()}, {displayName}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            className="mt-1.5 text-indigo-100 text-sm sm:text-base"
          >
            Here&apos;s your policy compliance overview
          </motion.p>

          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
              className="mt-4"
            >
              <Link
                href="/policies"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl backdrop-blur-sm transition-colors border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {pendingCount} {pendingCount === 1 ? 'policy needs' : 'policies need'} your attention
              </Link>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
          className="relative z-10"
        >
          <HeroRing pct={complianceRate} />
        </motion.div>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Policies"
          value={totalPolicies}
          iconBgClass="bg-violet-100"
          iconColorClass="text-violet-600"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          trendLabel="Active, non-archived policies"
          delay={0.1}
        />
        <StatCard
          label="Acknowledged"
          value={acknowledgedCount}
          iconBgClass="bg-green-100"
          iconColorClass="text-green-600"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trendLabel="Policies you have acknowledged"
          delay={0.18}
        />
        <StatCard
          label="Pending Required"
          value={pendingCount}
          iconBgClass="bg-amber-100"
          iconColorClass="text-amber-600"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          }
          trendLabel="Require your acknowledgement"
          delay={0.26}
        />
        <StatCard
          label="Compliance Rate"
          value={complianceRate}
          suffix="%"
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-600"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          }
          trendLabel="Based on acknowledged vs total"
          delay={0.34}
        />
      </div>

      {/* ── Compliance ring + pending policies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center"
        >
          <div className="self-start mb-1">
            <h2 className="text-base font-semibold text-slate-800">Your Compliance</h2>
            <p className="text-xs text-slate-400 mt-0.5">Personal policy acknowledgement rate</p>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <ComplianceRing pct={complianceRate} acknowledged={acknowledgedCount} total={totalPolicies} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-base font-semibold text-slate-800">Requires Your Attention</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Policies awaiting your acknowledgement</p>

          <AnimatePresence mode="wait">
            {pendingPolicies.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No pending acknowledgements required.</p>
              </motion.div>
            ) : (
              <motion.ul key="list" className="space-y-2">
                {pendingPolicies.map((policy, i) => (
                  <motion.li
                    key={policy.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.06 * i, ease: 'easeOut' }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{policy.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-100 text-violet-700 capitalize">
                          {policy.category}
                        </span>
                        <span className="text-xs text-slate-400">v{policy.version}</span>
                      </div>
                    </div>
                    <Link
                      href={`/policies/${policy.id}`}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Read &amp; Acknowledge
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Category breakdown + recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-base font-semibold text-slate-800">Compliance by Category</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-6">Acknowledgement rate across policy categories</p>

          {categories.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No category data available.</div>
          ) : (
            <div className="space-y-5">
              {categories.map((cat, i) => (
                <CategoryBar
                  key={cat.name}
                  name={cat.name}
                  pct={cat.pct}
                  total={cat.total}
                  acked={cat.acked}
                  delay={0.06 * i}
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.62, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-base font-semibold text-slate-800">Recent Acknowledgements</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Your latest policy acknowledgement activity</p>

          {recentAcks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">No acknowledgements yet</p>
              <p className="text-xs text-slate-400 mt-1">Your acknowledgement history will appear here.</p>
            </div>
          ) : (
            <div>
              {recentAcks.map((ack, i) => (
                <ActivityItem key={ack.id} ack={ack} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
