'use client';

import { useState, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

const ACCEPTED_EXTENSIONS = '.pdf,.docx';

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  409: 'Policy with this title and version already exists.',
  413: 'File exceeds 50 MB limit.',
  415: 'Only PDF and DOCX files accepted.',
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface PolicyUploadFormProps {
  onSuccess: (policy: unknown) => void;
  onCancel: () => void;
}

interface FormFields {
  title: string;
  category: string;
  department: string;
  version: string;
  effectiveDate: string;
  requiresAcknowledgement: boolean;
}

const INITIAL_FIELDS: FormFields = {
  title: '',
  category: '',
  department: '',
  version: '',
  effectiveDate: '',
  requiresAcknowledgement: false,
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
      {label}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          {' *'}
        </span>
      )}
    </label>
  );
}

export function PolicyUploadForm({ onSuccess, onCancel }: PolicyUploadFormProps) {
  const { data: session } = useSession();
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(selected.type)) {
      setFileError('Only PDF and DOCX files are accepted.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(selected);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitError(null);

      if (!file) {
        setFileError('Please select a file to upload.');
        return;
      }

      const token = (session as { accessToken?: string } | null)?.accessToken;
      if (!token) {
        setSubmitError('You must be signed in to upload a policy.');
        return;
      }

      const body = new FormData();
      body.append('file', file);
      body.append('title', fields.title.trim());
      body.append('category', fields.category.trim());
      body.append('department', fields.department.trim());
      body.append('version', fields.version.trim());
      body.append('effective_date', fields.effectiveDate);
      body.append('requiresAcknowledgement', String(fields.requiresAcknowledgement));

      setIsSubmitting(true);
      try {
        const res = await fetch(`${BASE_URL}/api/admin/policies`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });

        if (!res.ok) {
          const message =
            HTTP_ERROR_MESSAGES[res.status] ??
            (await res.text().catch(() => `Upload failed (${res.status}).`));
          setSubmitError(message);
          return;
        }

        const { policy } = (await res.json()) as { policy: unknown };
        onSuccess(policy);
      } catch {
        setSubmitError('Network error. Please check your connection and try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [file, fields, session, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Upload new policy">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="upload-title" label="Title" required />
          <input
            id="upload-title"
            name="title"
            type="text"
            required
            disabled={isSubmitting}
            value={fields.title}
            onChange={handleFieldChange}
            placeholder="e.g. Information Security Policy"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="upload-version" label="Version" required />
          <input
            id="upload-version"
            name="version"
            type="text"
            required
            disabled={isSubmitting}
            value={fields.version}
            onChange={handleFieldChange}
            placeholder="e.g. 1.0"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="upload-category" label="Category" required />
          <input
            id="upload-category"
            name="category"
            type="text"
            required
            disabled={isSubmitting}
            value={fields.category}
            onChange={handleFieldChange}
            placeholder="e.g. Security"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="upload-department" label="Department" required />
          <input
            id="upload-department"
            name="department"
            type="text"
            required
            disabled={isSubmitting}
            value={fields.department}
            onChange={handleFieldChange}
            placeholder="e.g. Engineering"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="upload-effectiveDate" label="Effective Date" required />
          <input
            id="upload-effectiveDate"
            name="effectiveDate"
            type="date"
            required
            disabled={isSubmitting}
            value={fields.effectiveDate}
            onChange={handleFieldChange}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="upload-file" label="Document" required />
          <input
            ref={fileInputRef}
            id="upload-file"
            name="file"
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            required
            disabled={isSubmitting}
            onChange={handleFileChange}
            aria-describedby={fileError ? 'upload-file-error' : 'upload-file-hint'}
            className={
              'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 ' +
              'file:mr-3 file:cursor-pointer file:rounded-md file:border-0 ' +
              'file:bg-indigo-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-indigo-700 ' +
              'hover:file:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ' +
              'disabled:cursor-not-allowed disabled:opacity-50'
            }
          />
          {fileError ? (
            <p id="upload-file-error" role="alert" className="text-xs text-red-600">
              {fileError}
            </p>
          ) : (
            <p id="upload-file-hint" className="text-xs text-slate-400">
              PDF or DOCX only, max 50 MB
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            id="upload-requiresAcknowledgement"
            name="requiresAcknowledgement"
            type="checkbox"
            disabled={isSubmitting}
            checked={fields.requiresAcknowledgement}
            onChange={handleFieldChange}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">Requires employee acknowledgement</span>
        </label>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isSubmitting ? 'Uploading...' : 'Upload Policy'}
        </Button>
      </div>
    </form>
  );
}
