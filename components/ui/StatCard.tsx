'use client';

import { AnimatedCard, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

type StatCardColor = 'indigo' | 'green' | 'yellow' | 'red';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: StatCardColor;
  delay?: number;
}

const colorConfig: Record<
  StatCardColor,
  { bg: string; text: string; iconBg: string }
> = {
  indigo: {
    bg: '',
    text: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
  },
  green: {
    bg: '',
    text: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  yellow: {
    bg: '',
    text: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
  },
  red: {
    bg: '',
    text: 'text-red-600',
    iconBg: 'bg-red-100',
  },
};

const TrendUpIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

const TrendDownIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
  </svg>
);

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'indigo',
  delay = 0,
}: StatCardProps) {
  const config = colorConfig[color];
  const isTrendPositive = trend && trend.value >= 0;

  return (
    <AnimatedCard delay={delay}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>

            {trend && (
              <div
                className={cn(
                  'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  isTrendPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
                )}
                aria-label={`${isTrendPositive ? 'Up' : 'Down'} ${Math.abs(trend.value)} ${trend.label}`}
              >
                {isTrendPositive ? <TrendUpIcon /> : <TrendDownIcon />}
                <span>
                  {isTrendPositive ? '+' : ''}
                  {trend.value} {trend.label}
                </span>
              </div>
            )}
          </div>

          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              config.iconBg,
              config.text,
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
