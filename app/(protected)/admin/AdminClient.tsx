'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import {
  fetchComplianceSummary,
  fetchAdminAcknowledgements,
  type PolicyComplianceSummary,
  type AdminAcknowledgement,
} from '@/lib/services/adminService';

interface AdminClientProps {
  accessToken: string;
}

// ── Compliance progress bar ────────────────────────────────────────────────

function ComplianceBar({ rate }: { rate: number }) {
  const colorClass =
    rate >= 80
      ? 'bg-green-500'
      : rate >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(rate)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(rate)}% compliance`}
        />
      </div>
      <span
        className={`text-xs font-semibold tabular-nums w-12 text-right ${
          rate >= 80
            ? 'text-green-600'
            : rate >= 50
            ? 'text-yellow-600'
            : 'text-red-600'
        }`}
      >
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Compliance Summary Table ───────────────────────────────────────────────

interface ComplianceSummaryTableProps {
  data: PolicyComplianceSummary[];
  isLoading: boolean;
  error: string | null;
}

function ComplianceSummaryTable({ data, isLoading, error }: ComplianceSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Compliance Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading compliance data" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="h-10 w-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No compliance data</h3>
            <p className="mt-1 text-xs text-slate-400">
              Compliance data will appear once policies have been acknowledged.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Policy compliance summary">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    { label: 'Policy', cls: 'px-4 sm:px-6 py-3' },
                    { label: 'Version', cls: 'hidden sm:table-cell px-6 py-3' },
                    { label: 'Acknowledged', cls: 'hidden md:table-cell px-6 py-3' },
                    { label: 'Pending', cls: 'hidden md:table-cell px-6 py-3' },
                    { label: 'Compliance Rate', cls: 'px-4 sm:px-6 py-3' },
                  ].map((col) => (
                    <th
                      key={col.label}
                      scope="col"
                      className={`${col.cls} text-left text-xs font-medium uppercase tracking-wide text-slate-400`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row) => (
                  <tr key={row.policy_id} className="hover:bg-slate-50">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900 max-w-xs">
                      <span className="line-clamp-1">{row.policy_title}</span>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-3 text-slate-500">v{row.policy_version}</td>
                    <td className="hidden md:table-cell px-6 py-3">
                      <span className="font-semibold text-green-600">
                        {row.acknowledged_count}
                      </span>
                      <span className="text-slate-400"> / {row.total_users}</span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-3">
                      <span
                        className={
                          row.pending_count > 0 ? 'font-semibold text-red-500' : 'text-slate-400'
                        }
                      >
                        {row.pending_count}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 min-w-[140px] sm:min-w-[200px]">
                      <ComplianceBar rate={row.compliance_rate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Acknowledgements Table ──────────────────────────────────────────

interface RecentAcknowledgementsTableProps {
  data: AdminAcknowledgement[];
  isLoading: boolean;
  error: string | null;
}

function RecentAcknowledgementsTable({
  data,
  isLoading,
  error,
}: RecentAcknowledgementsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Acknowledgements</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading acknowledgements" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="h-10 w-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No acknowledgements yet</h3>
            <p className="mt-1 text-xs text-slate-400">
              Acknowledgements will appear here as users sign off on policies.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Recent acknowledgements">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    { label: 'User', cls: 'px-4 sm:px-6 py-3' },
                    { label: 'Email', cls: 'hidden md:table-cell px-6 py-3' },
                    { label: 'Policy', cls: 'hidden sm:table-cell px-6 py-3' },
                    { label: 'Version', cls: 'hidden lg:table-cell px-6 py-3' },
                    { label: 'Acknowledged At', cls: 'hidden lg:table-cell px-6 py-3' },
                  ].map((col) => (
                    <th
                      key={col.label}
                      scope="col"
                      className={`${col.cls} text-left text-xs font-medium uppercase tracking-wide text-slate-400`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, idx) => (
                  <tr key={`${row.user_id}-${row.policy_id}-${idx}`} className="hover:bg-slate-50">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">{row.user_name}</td>
                    <td className="hidden md:table-cell px-6 py-3 text-slate-500">{row.user_email}</td>
                    <td className="hidden sm:table-cell px-6 py-3 text-slate-700 max-w-xs">
                      <span className="line-clamp-1">{row.policy_title}</span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-3 text-slate-500">v{row.policy_version}</td>
                    <td className="hidden lg:table-cell px-6 py-3 text-slate-500">
                      <time dateTime={row.acknowledged_at}>
                        {new Date(row.acknowledged_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stat card icons ────────────────────────────────────────────────────────

const PolicyIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375zm-4.875 7.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 018.25 19.875v-9z" />
  </svg>
);

// ── Main AdminClient ───────────────────────────────────────────────────────

export function AdminClient({ accessToken }: AdminClientProps) {
  const [complianceData, setComplianceData] = useState<PolicyComplianceSummary[]>([]);
  const [ackData, setAckData] = useState<AdminAcknowledgement[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(true);
  const [ackLoading, setAckLoading] = useState(true);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [ackError, setAckError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setComplianceLoading(true);
    setAckLoading(true);

    fetchComplianceSummary(accessToken)
      .then(setComplianceData)
      .catch((err) =>
        setComplianceError(err instanceof Error ? err.message : 'Failed to load compliance data.'),
      )
      .finally(() => setComplianceLoading(false));

    fetchAdminAcknowledgements(accessToken)
      .then(({ data }) => setAckData(data))
      .catch((err) =>
        setAckError(err instanceof Error ? err.message : 'Failed to load acknowledgements.'),
      )
      .finally(() => setAckLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived aggregate stats from compliance data
  const totalPolicies = complianceData.length;
  const totalAcknowledged = complianceData.reduce((sum, p) => sum + p.acknowledged_count, 0);
  const totalPending = complianceData.reduce((sum, p) => sum + p.pending_count, 0);
  const overallCompliance =
    complianceData.length > 0
      ? complianceData.reduce((sum, p) => sum + p.compliance_rate, 0) / complianceData.length
      : 0;

  const complianceColor =
    overallCompliance >= 80 ? 'green' : overallCompliance >= 50 ? 'yellow' : 'red';

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {complianceLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white border border-slate-100 shadow-sm p-6"
              aria-hidden="true"
            >
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total Policies"
              value={totalPolicies}
              icon={<PolicyIcon />}
              color="indigo"
              delay={0}
            />
            <StatCard
              label="Acknowledged"
              value={totalAcknowledged}
              icon={<CheckIcon />}
              color="green"
              delay={0.05}
            />
            <StatCard
              label="Pending"
              value={totalPending}
              icon={<ClockIcon />}
              color="yellow"
              delay={0.1}
            />
            <StatCard
              label="Avg Compliance Rate"
              value={`${overallCompliance.toFixed(1)}%`}
              icon={<ChartIcon />}
              color={complianceColor}
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Compliance Summary Table */}
      <ComplianceSummaryTable
        data={complianceData}
        isLoading={complianceLoading}
        error={complianceError}
      />

      {/* Recent Acknowledgements Table */}
      <RecentAcknowledgementsTable
        data={ackData}
        isLoading={ackLoading}
        error={ackError}
      />
    </div>
  );
}
