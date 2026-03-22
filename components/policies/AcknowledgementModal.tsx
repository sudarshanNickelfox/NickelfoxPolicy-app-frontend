'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { acknowledgePolicyById } from '@/lib/services/policyService';

interface AcknowledgementModalProps {
  policyId: string;
  policyTitle: string;
  policyVersion: string;
  currentVersion: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (acknowledgedAt: string) => void;
}

export function AcknowledgementModal({
  policyId,
  policyTitle,
  policyVersion,
  currentVersion,
  isOpen,
  onClose,
  onSuccess,
}: AcknowledgementModalProps) {
  const { data: session } = useSession();
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const hasVersionMismatch = policyVersion !== currentVersion;

  useEffect(() => {
    if (isOpen) {
      setChecked(false);
      setError(null);
      setSubmitted(false);
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!checked || isSubmitting || submitted) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await acknowledgePolicyById(policyId, (session as any)?.accessToken);
      setSubmitted(true);
      onSuccess(res.acknowledged_at);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to acknowledge. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [checked, isSubmitting, submitted, policyId, onSuccess, session]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ack-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ack-modal-title"
          aria-describedby="ack-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="ack-modal-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            ref={dialogRef}
            className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  id="ack-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Acknowledge Policy
                </h2>
                <p id="ack-modal-desc" className="mt-0.5 text-sm text-slate-500">
                  {policyTitle}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close acknowledgement dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {hasVersionMismatch && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800"
              >
                <strong>Version mismatch:</strong> You are viewing version{' '}
                <strong>{policyVersion}</strong>, but the current version is{' '}
                <strong>{currentVersion}</strong>. Please ensure you have read the latest version
                before acknowledging.
              </div>
            )}

            <div className="mb-6 rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              <p>
                By acknowledging this policy, you confirm that you have read, understood, and agree
                to comply with the contents of <strong>{policyTitle}</strong> (version{' '}
                {currentVersion}).
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                aria-label="I have read and understood this policy"
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">
                I confirm that I have read and understood this policy and agree to comply with its
                requirements.
              </span>
            </label>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!checked || submitted}
                isLoading={isSubmitting}
                aria-label="Submit policy acknowledgement"
              >
                {submitted ? 'Acknowledged' : 'Acknowledge'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
