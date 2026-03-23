'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AcknowledgementModal } from './AcknowledgementModal';
import { acknowledgePolicyById } from '@/lib/services/policyService';
import type { PolicyDetail, PolicyStatus } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface PolicyViewerShellProps {
  policy: PolicyDetail;
}

export function PolicyViewerShell({ policy }: PolicyViewerShellProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<PolicyStatus>(policy.status);
  const [signedUrl, setSignedUrl] = useState<string | null>(policy.signed_url ?? null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);

  const isAcknowledged = status === 'acknowledged';
  const isDocx = policy.fileType === 'docx';

  // Refresh signed URL (in case the initial one expired)
  const refreshSignedUrl = useCallback(async () => {
    const token = (session as any)?.accessToken;
    setIsFetchingUrl(true);
    setUrlError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/policies/${policy.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json() as { data: { signed_url: string | null } };
      const url = json.data?.signed_url ?? null;
      if (!url) {
        setUrlError('No document attached to this policy.');
        return;
      }
      setSignedUrl(url);
    } catch {
      setUrlError('Could not load the document. Please try again.');
    } finally {
      setIsFetchingUrl(false);
    }
  }, [policy.id, session]);

  // Quick-acknowledge (no modal) for policies that don't require formal acknowledgement
  const handleQuickAcknowledge = useCallback(async () => {
    const token = (session as any)?.accessToken;
    if (!token || isAcknowledging) return;
    setIsAcknowledging(true);
    setAckError(null);
    try {
      await acknowledgePolicyById(policy.id, token);
      setStatus('acknowledged');
    } catch (err) {
      setAckError(err instanceof Error ? err.message : 'Failed to acknowledge. Please try again.');
    } finally {
      setIsAcknowledging(false);
    }
  }, [policy.id, session, isAcknowledging]);

  const handleAcknowledgeSuccess = useCallback((_acknowledgedAt: string) => {
    setStatus('acknowledged');
    setIsAckModalOpen(false);
  }, []);

  return (
    <div className="flex h-full flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-base font-semibold text-slate-900 truncate">{policy.title}</h2>
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

        {/* Download button */}
        {signedUrl && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label={`Download ${policy.title}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </a>
        )}
      </div>

      {/* ── Document viewer ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-slate-100 relative">
        {isFetchingUrl ? (
          <div className="flex h-full items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : urlError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600">{urlError}</p>
            <Button variant="secondary" size="sm" onClick={refreshSignedUrl}>
              Try again
            </Button>
          </div>
        ) : signedUrl && !isDocx ? (
          /* ── PDF embedded viewer ── */
          <iframe
            src={signedUrl}
            title={policy.title}
            className="h-full w-full border-0"
            aria-label={`Document viewer for ${policy.title}`}
          />
        ) : signedUrl && isDocx ? (
          /* ── DOCX: can't embed, show download card ── */
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
              <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{policy.title}</h3>
              <p className="mt-1 text-xs text-slate-500">Word document (.docx) — preview not available in browser.</p>
            </div>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Document
            </a>
          </div>
        ) : (
          /* ── No document attached ── */
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200">
              <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No document attached to this policy.</p>
            <Button variant="secondary" size="sm" onClick={refreshSignedUrl} isLoading={isFetchingUrl}>
              Reload
            </Button>
          </div>
        )}
      </div>

      {/* ── Acknowledge bar ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isAcknowledged && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-200 bg-white px-4 sm:px-6 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {policy.requiresAcknowledgement
                    ? 'This policy requires your acknowledgement.'
                    : 'Mark this policy as read.'}
                </p>
                {ackError && (
                  <p className="mt-0.5 text-xs text-red-600" role="alert">{ackError}</p>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={
                  policy.requiresAcknowledgement
                    ? () => setIsAckModalOpen(true)
                    : handleQuickAcknowledge
                }
                isLoading={isAcknowledging}
                aria-label="Acknowledge this policy"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Acknowledge Policy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Already acknowledged banner */}
      {isAcknowledged && (
        <div className="border-t border-green-200 bg-green-50 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            You have acknowledged this policy.
          </div>
        </div>
      )}

      <AcknowledgementModal
        policyId={policy.id}
        policyTitle={policy.title}
        policyVersion={policy.version}
        currentVersion={policy.version}
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        onSuccess={handleAcknowledgeSuccess}
      />
    </div>
  );
}
