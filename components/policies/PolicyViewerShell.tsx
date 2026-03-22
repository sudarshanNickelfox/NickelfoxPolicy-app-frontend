'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AcknowledgementModal } from './AcknowledgementModal';
import type { PolicyDetail, PolicyStatus } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface PolicyViewerShellProps {
  policy: PolicyDetail;
}

export function PolicyViewerShell({ policy }: PolicyViewerShellProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<PolicyStatus>(policy.status);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const handleAcknowledgeSuccess = useCallback((_acknowledgedAt: string) => {
    setStatus('acknowledged');
    setIsModalOpen(false);
  }, []);

  const handleViewDownload = useCallback(async () => {
    const token = (session as { accessToken?: string } | null)?.accessToken;
    setIsLoadingUrl(true);
    try {
      const res = await fetch(`${BASE_URL}/api/policies/${policy.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as { data: { signed_url: string | null } };
      const signedUrl = json.data?.signed_url ?? null;
      if (!signedUrl) {
        alert('No document attached to this policy.');
        return;
      }
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not retrieve the document. Please try again.');
    } finally {
      setIsLoadingUrl(false);
    }
  }, [policy.id, session]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-slate-900">{policy.title}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <StatusBadge status={status} />
            <span aria-hidden="true">·</span>
            <span>{policy.category}</span>
            <span aria-hidden="true">·</span>
            <span>{policy.department}</span>
            <span aria-hidden="true">·</span>
            <span>v{policy.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewDownload}
            isLoading={isLoadingUrl}
            aria-label={`View or download ${policy.title}`}
          >
            {!isLoadingUrl && (
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
            )}
            View / Download
          </Button>

          {policy.requiresAcknowledgement && status !== 'acknowledged' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              aria-label="Acknowledge this policy"
            >
              Acknowledge Policy
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-300"
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
          <h3 className="mt-4 text-sm font-semibold text-slate-900">{policy.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Click the button to open the document in a new tab.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={handleViewDownload}
            isLoading={isLoadingUrl}
            aria-label={`View or download ${policy.title}`}
          >
            View / Download
          </Button>
        </div>
      </div>

      <AcknowledgementModal
        policyId={policy.id}
        policyTitle={policy.title}
        policyVersion={policy.version}
        currentVersion={policy.version}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAcknowledgeSuccess}
      />
    </div>
  );
}
