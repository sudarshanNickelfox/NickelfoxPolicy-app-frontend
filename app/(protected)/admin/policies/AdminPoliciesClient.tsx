'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PolicyUploadForm } from '@/components/admin/PolicyUploadForm';
import type { Policy } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const DELETE_ERROR_MESSAGE_409 =
  'This policy has acknowledgements — archive it instead.';

interface AdminPoliciesClientProps {
  accessToken: string;
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ---- Animated Modal -------------------------------------------------------

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 id="modal-title" className="text-base font-semibold text-slate-900">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Confirmation dialog ---------------------------------------------------

interface ConfirmDeleteProps {
  policy: Policy;
  isDeleting: boolean;
  deleteError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({
  policy,
  isDeleting,
  deleteError,
  onConfirm,
  onCancel,
}: ConfirmDeleteProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Are you sure you want to delete{' '}
        <strong className="text-slate-900">{policy.title}</strong> (v{policy.version})? This action
        cannot be undone.
      </p>

      {deleteError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {deleteError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          isLoading={isDeleting}
          disabled={deleteError === DELETE_ERROR_MESSAGE_409}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
}

// ---- Main client component ------------------------------------------------

export function AdminPoliciesClient({ accessToken }: AdminPoliciesClientProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/policies`, {
        headers: authHeaders(accessToken),
      });
      if (!res.ok) throw new Error(`Failed to load policies (${res.status})`);
      const data = (await res.json()) as { data: Policy[] } | Policy[];
      setPolicies(Array.isArray(data) ? data : data.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load policies.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleUploadSuccess = useCallback(
    (_policy: unknown) => {
      setIsUploadOpen(false);
      loadPolicies();
    },
    [loadPolicies],
  );

  const handleDeleteClick = useCallback((policy: Policy) => {
    setDeleteError(null);
    setPolicyToDelete(policy);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!policyToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/policies/${policyToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders(accessToken),
      });

      if (res.status === 409) {
        setDeleteError(DELETE_ERROR_MESSAGE_409);
        return;
      }
      if (res.status === 404) {
        setDeleteError('Policy not found. It may have already been deleted.');
        return;
      }
      if (!res.ok) {
        setDeleteError(`Delete failed (${res.status}). Please try again.`);
        return;
      }

      setPolicyToDelete(null);
      loadPolicies();
    } catch {
      setDeleteError('Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [policyToDelete, accessToken, loadPolicies]);

  const handleDeleteCancel = useCallback(() => {
    setPolicyToDelete(null);
    setDeleteError(null);
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>All Policies</CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              aria-label="Upload new policy"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Upload New Policy
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6" aria-label="Loading policies" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div role="alert" className="p-6 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={loadPolicies}>
                Try again
              </Button>
            </div>
          ) : policies.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-400">
                No policies found. Upload one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Policies list">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {[
                      { label: 'Title', cls: 'px-4 sm:px-6 py-3' },
                      { label: 'Category', cls: 'hidden sm:table-cell px-6 py-3' },
                      { label: 'Department', cls: 'hidden md:table-cell px-6 py-3' },
                      { label: 'Version', cls: 'hidden lg:table-cell px-6 py-3' },
                      { label: 'Effective Date', cls: 'hidden lg:table-cell px-6 py-3' },
                      { label: '', cls: 'px-4 sm:px-6 py-3' },
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
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-slate-50">
                      <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="line-clamp-1">{policy.title}</span>
                          {policy.isArchived && <Badge variant="warning">Archived</Badge>}
                          {policy.requiresAcknowledgement && (
                            <Badge variant="info">Ack required</Badge>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-3 text-slate-500">{policy.category}</td>
                      <td className="hidden md:table-cell px-6 py-3 text-slate-500">{policy.department}</td>
                      <td className="hidden lg:table-cell px-6 py-3 text-slate-500">v{policy.version}</td>
                      <td className="hidden lg:table-cell px-6 py-3 text-slate-500">
                        <time dateTime={policy.effectiveDate}>
                          {new Date(policy.effectiveDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(policy)}
                          aria-label={`Delete ${policy.title}`}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload New Policy"
      >
        <PolicyUploadForm
          onSuccess={handleUploadSuccess}
          onCancel={() => setIsUploadOpen(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={policyToDelete !== null}
        onClose={handleDeleteCancel}
        title="Delete Policy"
      >
        {policyToDelete && (
          <ConfirmDeleteDialog
            policy={policyToDelete}
            isDeleting={isDeleting}
            deleteError={deleteError}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </Modal>
    </>
  );
}
