'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import type { Policy } from '@/types';

interface PolicyCardProps {
  policy: Policy;
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const formattedDate = new Date(policy.effectiveDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.18 }}
    >
      <Link
        href={`/policies/${policy.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-2xl"
        aria-label={`View policy: ${policy.title}`}
      >
        <Card className="h-full transition-colors hover:bg-slate-50">
          <CardContent className="flex h-full flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={policy.status} />
                {policy.isArchived && <Badge variant="danger">Archived</Badge>}
                {policy.requiresAcknowledgement && policy.status !== 'acknowledged' && (
                  <Badge variant="info">Action Required</Badge>
                )}
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {policy.fileType.toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                {policy.title}
              </h3>
              {policy.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{policy.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span>
                <span className="font-medium text-slate-700">{policy.category}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{policy.department}</span>
              <span aria-hidden="true">·</span>
              <span>v{policy.version}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={policy.effectiveDate}>{formattedDate}</time>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
