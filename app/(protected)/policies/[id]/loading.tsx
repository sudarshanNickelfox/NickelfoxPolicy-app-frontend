import { Skeleton } from '@/components/ui/Skeleton';

export default function PolicyViewerLoading() {
  return (
    <div className="flex h-full flex-col" aria-label="Loading policy" aria-busy="true">
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="flex-1">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </div>
  );
}
