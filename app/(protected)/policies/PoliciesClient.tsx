'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PolicyCard } from '@/components/policies/PolicyCard';
import { PolicyFilterBar } from '@/components/policies/PolicyFilterBar';
import { PolicyGridSkeleton } from '@/components/policies/PolicyCardSkeleton';
import { Button } from '@/components/ui/Button';
import { fetchPolicies } from '@/lib/services/policyService';
import type { Policy, PolicyFilters, PolicyStatus, PaginatedPolicies } from '@/types';

const PAGE_SIZE = 20;

interface FilterValues {
  status: PolicyStatus | '';
  category: string;
  department: string;
  date_from: string;
  date_to: string;
}

interface PoliciesClientProps {
  filters: PolicyFilters;
}

function buildFilterValues(searchParams: URLSearchParams): FilterValues {
  return {
    status: (searchParams.get('status') as PolicyStatus | '') ?? '',
    category: searchParams.get('category') ?? '',
    department: searchParams.get('department') ?? '',
    date_from: searchParams.get('date_from') ?? '',
    date_to: searchParams.get('date_to') ?? '',
  };
}

export function PoliciesClient({ filters }: PoliciesClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterValues, setFilterValues] = useState<FilterValues>(() =>
    buildFilterValues(searchParams)
  );
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadPolicies = useCallback(
    async (filterVals: FilterValues, pageNum?: number) => {
      const isInitial = !pageNum || pageNum === 1;
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      try {
        const result = await fetchPolicies({
          ...filterVals,
          page: pageNum ?? 1,
          page_size: PAGE_SIZE,
        }, (session as any)?.accessToken);
        if (isInitial) {
          setPolicies(result.data);
        } else {
          setPolicies((prev) => [...prev, ...result.data]);
        }
        setNextCursor(result.nextCursor);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policies.');
      } finally {
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [session]
  );

  useEffect(() => {
    if (status !== 'authenticated') return;
    setPage(1);
    loadPolicies(filterValues, 1);
  }, [filterValues, loadPolicies, status]);

  const handleFilterChange = useCallback(
    (values: FilterValues) => {
      setFilterValues(values);
      const params = new URLSearchParams();
      Object.entries(values).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  const handleLoadMore = useCallback(() => {
    if (nextCursor) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPolicies(filterValues, nextPage);
    }
  }, [nextCursor, page, filterValues, loadPolicies]);

  return (
    <div className="flex flex-col gap-6">
      <PolicyFilterBar
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
      />

      {isLoading ? (
        <PolicyGridSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 p-6 text-center"
        >
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => loadPolicies(filterValues, 1)}
          >
            Try again
          </Button>
        </div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20 shadow-sm border border-slate-100">
          <svg
            className="h-12 w-12 text-slate-300"
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
          <h3 className="mt-4 text-base font-semibold text-slate-700">No policies found</h3>
          <p className="mt-1 text-sm text-slate-400">
            Try adjusting your filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <strong className="text-slate-700">{policies.length}</strong> of{' '}
              <strong className="text-slate-700">{total}</strong> policies
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {policies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center py-4">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                aria-label="Load more policies"
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
