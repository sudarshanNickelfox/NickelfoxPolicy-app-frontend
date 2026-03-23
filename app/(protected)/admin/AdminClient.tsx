'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import {
  fetchComplianceSummary,
  fetchAdminAcknowledgements,
  type PolicyComplianceSummary,
  type AdminAcknowledgement,
} from '@/lib/services/adminService';

interface AdminClientProps {
  accessToken: string;
}

// ── Animated count-up hook ─────────────────────────────────────────────────────

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

// ── Animated compliance ring ───────────────────────────────────────────────────

function ComplianceRing({ rate, size = 160 }: { rate: number; size?: number }) {
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = size * 0.075;
  const center = size / 2;

  const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
  const trackColor = rate >= 80 ? '#dcfce7' : rate >= 50 ? '#fef3c7' : '#fee2e2';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Progress */}
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (rate / 100) * circumference }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{Math.round(rate)}%</span>
        <span className="text-xs text-slate-500 font-medium mt-0.5">Compliance</span>
      </div>
    </div>
  );
}

// ── Animated stat card ─────────────────────────────────────────────────────────

interface StatCardConfig {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  delay: number;
}

function AnimatedStatCard({ label, value, decimals = 0, suffix = '', icon, gradient, shadow, delay }: StatCardConfig) {
  const { ref, value: displayed } = useCountUp(value, 1.2, decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className="relative overflow-hidden rounded-2xl text-white p-5"
      style={{ background: gradient, boxShadow: shadow }}
    >
      {/* Decorative blob */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.3)', filter: 'blur(20px)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.4)', filter: 'blur(16px)' }} aria-hidden="true" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums leading-none">
            <span ref={ref}>{displayed.toLocaleString()}</span>{suffix}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.20)' }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ── Horizontal bar chart ───────────────────────────────────────────────────────

function PolicyBarChart({ data }: { data: PolicyComplianceSummary[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const sorted = [...data].sort((a, b) => b.compliance_rate - a.compliance_rate).slice(0, 7);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {sorted.map((row, i) => {
        const rate = row.compliance_rate;
        const barColor = rate >= 80 ? 'linear-gradient(90deg,#22c55e,#16a34a)'
          : rate >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)'
          : 'linear-gradient(90deg,#ef4444,#dc2626)';
        return (
          <div key={row.policy_id} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-700 truncate max-w-[60%]" title={row.policy_title}>
                {row.policy_title}
              </span>
              <span className="text-xs font-bold text-slate-600 tabular-nums">{rate.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: barColor }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${Math.min(rate, 100)}%` } : { width: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 + i * 0.08 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mini sparkline (SVG) ───────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 80, h = 32, pad = 4;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="opacity-70">
      <motion.polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
      />
    </svg>
  );
}

// ── Activity item ──────────────────────────────────────────────────────────────

function ActivityItem({ item, index }: { item: AdminAcknowledgement; index: number }) {
  const initial = item.user_name?.charAt(0).toUpperCase() ?? '?';
  const timeAgo = (() => {
    const diff = Date.now() - new Date(item.acknowledged_at).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 + index * 0.06 }}
      className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#2F5BE7,#4070f0)' }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{item.user_name}</p>
        <p className="text-xs text-slate-500 truncate">acknowledged <span className="text-slate-700 font-medium">{item.policy_title}</span></p>
      </div>
      <span className="shrink-0 text-xs text-slate-400">{timeAgo}</span>
    </motion.div>
  );
}

// ── Department compliance donut ring grid ──────────────────────────────────────

function MiniRing({ rate, label }: { rate: number; label: string }) {
  const r = 22, sw = 5, circ = 2 * Math.PI * r;
  const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref as any, { once: true });

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <svg width={54} height={54} className="-rotate-90">
          <circle cx={27} cy={27} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
          <motion.circle
            ref={ref}
            cx={27} cy={27} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={inView ? { strokeDashoffset: circ - (rate / 100) * circ } : {}}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <span className="absolute text-xs font-bold text-slate-800">{Math.round(rate)}%</span>
      </div>
      <span className="text-xs text-slate-500 text-center line-clamp-2 w-16 leading-tight">{label}</span>
    </div>
  );
}

// ── Main AdminClient ───────────────────────────────────────────────────────────

export function AdminClient({ accessToken }: AdminClientProps) {
  const [complianceData, setComplianceData] = useState<PolicyComplianceSummary[]>([]);
  const [ackData, setAckData] = useState<AdminAcknowledgement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [compliance, acks] = await Promise.all([
        fetchComplianceSummary(accessToken),
        fetchAdminAcknowledgements(accessToken),
      ]);
      setComplianceData(compliance);
      setAckData(acks.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  // Derived stats
  const totalPolicies = complianceData.length;
  const totalAcked = complianceData.reduce((s, p) => s + p.acknowledged_count, 0);
  const totalPending = complianceData.reduce((s, p) => s + p.pending_count, 0);
  const overallRate = totalPolicies > 0
    ? complianceData.reduce((s, p) => s + p.compliance_rate, 0) / totalPolicies
    : 0;

  // Sparkline: acknowledgements per day (last 7 days)
  const sparkValues = (() => {
    const counts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[d.toDateString()] = 0;
    }
    ackData.forEach((a) => {
      const k = new Date(a.acknowledged_at).toDateString();
      if (k in counts) counts[k]++;
    });
    return Object.values(counts);
  })();

  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <p className="text-sm text-red-600">{error}</p>
      <button onClick={load} className="text-sm text-[#2F5BE7] underline">Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard
          label="Total Policies" value={totalPolicies} delay={0}
          gradient="linear-gradient(135deg,#3E2B4D 0%,#5E4E6B 100%)"
          shadow="0 8px 24px rgba(62,43,77,0.30)"
          icon={<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        />
        <AnimatedStatCard
          label="Acknowledged" value={totalAcked} delay={0.08}
          gradient="linear-gradient(135deg,#2F5BE7 0%,#4070f0 100%)"
          shadow="0 8px 24px rgba(47,91,231,0.30)"
          icon={<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <AnimatedStatCard
          label="Pending" value={totalPending} delay={0.16}
          gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"
          shadow="0 8px 24px rgba(245,158,11,0.28)"
          icon={<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <AnimatedStatCard
          label="Avg Compliance" value={overallRate} decimals={1} suffix="%" delay={0.24}
          gradient="linear-gradient(135deg,#22c55e 0%,#16a34a 100%)"
          shadow="0 8px 24px rgba(34,197,94,0.28)"
          icon={<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375zm-4.875 7.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 018.25 19.875v-9z" /></svg>}
        />
      </div>

      {/* ── Middle row: compliance ring + bar chart ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Compliance overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center gap-4"
        >
          <div className="w-full flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Overall Compliance</h3>
            <span className="text-xs text-slate-400">{totalPolicies} policies</span>
          </div>

          <ComplianceRing rate={overallRate} size={152} />

          <div className="w-full flex justify-around text-center">
            <div>
              <p className="text-lg font-bold text-green-600 tabular-nums">{totalAcked}</p>
              <p className="text-xs text-slate-500">Done</p>
            </div>
            <div className="w-px bg-slate-100" />
            <div>
              <p className="text-lg font-bold text-amber-500 tabular-nums">{totalPending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div className="w-px bg-slate-100" />
            <div>
              <p className="text-lg font-bold text-slate-700 tabular-nums">{totalAcked + totalPending}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>

          {/* Sparkline */}
          <div className="w-full rounded-xl p-3 flex items-center justify-between gap-3"
            style={{ background: 'linear-gradient(135deg,#f8f7ff,#f0f4ff)' }}>
            <div>
              <p className="text-xs font-semibold text-slate-700">Last 7 days</p>
              <p className="text-xs text-slate-500">{sparkValues.reduce((a, b) => a + b, 0)} acknowledgements</p>
            </div>
            <Sparkline values={sparkValues} color="#2F5BE7" />
          </div>
        </motion.div>

        {/* Policy compliance bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800">Policy Compliance Breakdown</h3>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />≥80%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />50–79%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" />&lt;50%</span>
            </div>
          </div>
          {complianceData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">No compliance data yet.</div>
          ) : (
            <PolicyBarChart data={complianceData} />
          )}
        </motion.div>
      </div>

      {/* ── Bottom row: mini rings + activity feed ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Per-policy mini rings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Per-Policy Status</h3>
          {complianceData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">No data.</div>
          ) : (
            <div className="grid grid-cols-3 gap-4 justify-items-center">
              {complianceData.slice(0, 6).map((p) => (
                <MiniRing key={p.policy_id} rate={p.compliance_rate} label={p.policy_title} />
              ))}
            </div>
          )}

          {/* Top performer */}
          {complianceData.length > 0 && (() => {
            const top = [...complianceData].sort((a, b) => b.compliance_rate - a.compliance_rate)[0];
            return (
              <div className="mt-5 rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-800 truncate">Top: {top.policy_title}</p>
                  <p className="text-xs text-green-600">{top.compliance_rate.toFixed(1)}% compliance</p>
                </div>
              </div>
            );
          })()}
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Acknowledgements</h3>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#2F5BE7,#4070f0)' }}>
              {ackData.length} total
            </span>
          </div>

          {ackData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">No acknowledgements yet.</div>
          ) : (
            <div className="overflow-y-auto max-h-72 pr-1">
              {ackData.slice(0, 12).map((item, i) => (
                <ActivityItem key={`${item.user_id}-${item.policy_id}-${i}`} item={item} index={i} />
              ))}
            </div>
          )}

          {/* Summary footer */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Today', count: ackData.filter(a => new Date(a.acknowledged_at).toDateString() === new Date().toDateString()).length, color: '#2F5BE7' },
              { label: 'This week', count: ackData.filter(a => Date.now() - new Date(a.acknowledged_at).getTime() < 7 * 86400000).length, color: '#3E2B4D' },
              { label: 'Total', count: ackData.length, color: '#22c55e' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center bg-slate-50">
                <p className="text-lg font-extrabold tabular-nums" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ translateX: ['−100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonBox className="h-64" />
        <SkeletonBox className="lg:col-span-2 h-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonBox className="h-56" />
        <SkeletonBox className="lg:col-span-2 h-56" />
      </div>
    </div>
  );
}
