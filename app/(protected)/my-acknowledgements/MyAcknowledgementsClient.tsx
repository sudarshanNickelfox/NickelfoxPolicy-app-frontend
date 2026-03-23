'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  fetchUserAcknowledgements,
  exportAcknowledgementsCSV,
} from '@/lib/services/acknowledgementService';
import type { Acknowledgement } from '@/types';

function TableSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading acknowledgements" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function MyAcknowledgementsClient() {
  const { data: session } = useSession();
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const token = (session as { accessToken?: string } | null)?.accessToken;
    if (!token) return;

    setIsLoading(true);
    fetchUserAcknowledgements(token)
      .then(setAcknowledgements)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load acknowledgements.'),
      )
      .finally(() => setIsLoading(false));
  }, [session]);

  const handleExport = useCallback(async () => {
    const token = (session as { accessToken?: string } | null)?.accessToken;
    if (!token) return;
    setIsExporting(true);
    try {
      await exportAcknowledgementsCSV(token);
    } catch {
      // Export errors are non-blocking in UX
    } finally {
      setIsExporting(false);
    }
  }, [session]);

  const displayedAcknowledgements = showArchived
    ? acknowledgements
    : acknowledgements.filter((a) => !a.isArchived);

  const archivedCount = acknowledgements.filter((a) => a.isArchived).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Acknowledgement History</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {archivedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived((v) => !v)}
                aria-label={showArchived ? 'Hide archived policies' : 'Show archived policies'}
              >
                {showArchived ? 'Hide' : 'Show'} archived ({archivedCount})
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              isLoading={isExporting}
              aria-label="Export acknowledgements as CSV"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div role="alert" className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : displayedAcknowledgements.length === 0 ? (
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
            <h3 className="mt-3 text-sm font-semibold text-slate-700">
              No acknowledgements yet
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              When you acknowledge policies, they will appear here.
            </p>
            <Link href="/policies" className="mt-4">
              <Button variant="primary" size="sm">
                Browse policies
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Acknowledgement history">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Policy
                  </th>
                  <th
                    scope="col"
                    className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Version
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Acknowledged at
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedAcknowledgements.map((ack) => (
                  <tr key={ack.id} className="hover:bg-slate-50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <Link
                        href={`/policies/${ack.policyId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                      >
                        {ack.policyTitle}
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-3 sm:py-4 text-slate-500">v{ack.policyVersion}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {ack.isArchived ? (
                        <Badge variant="danger">Archived</Badge>
                      ) : (
                        <Badge variant="success">Acknowledged</Badge>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-3 sm:py-4 text-slate-500">
                      <time dateTime={ack.acknowledgedAt}>
                        {new Date(ack.acknowledgedAt).toLocaleString('en-US', {
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
