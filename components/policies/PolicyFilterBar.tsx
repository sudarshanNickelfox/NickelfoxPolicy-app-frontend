'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import type { PolicyFilters, PolicyStatus } from '@/types';

const STATUS_OPTIONS: { value: PolicyStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'acknowledged', label: 'Acknowledged' },
];

interface FilterValues {
  status: PolicyStatus | '';
  category: string;
  department: string;
  date_from: string;
  date_to: string;
}

interface PolicyFilterBarProps {
  filters: PolicyFilters;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

export function PolicyFilterBar({ filters, values, onChange }: PolicyFilterBarProps) {
  const handleChange = useCallback(
    (key: keyof FilterValues, value: string) => {
      onChange({ ...values, [key]: value });
    },
    [values, onChange]
  );

  const handleReset = useCallback(() => {
    onChange({ status: '', category: '', department: '', date_from: '', date_to: '' });
  }, [onChange]);

  const hasActiveFilters = Object.values(values).some((v) => v !== '');

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
      role="search"
      aria-label="Filter policies"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-slate-500">
          Status
        </label>
        <select
          id="filter-status"
          value={values.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className={selectClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-xs font-medium text-slate-500">
          Category
        </label>
        <select
          id="filter-category"
          value={values.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={selectClass}
        >
          <option value="">All categories</option>
          {filters.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-department" className="text-xs font-medium text-slate-500">
          Department
        </label>
        <select
          id="filter-department"
          value={values.department}
          onChange={(e) => handleChange('department', e.target.value)}
          className={selectClass}
        >
          <option value="">All departments</option>
          {filters.departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-date-from" className="text-xs font-medium text-slate-500">
          From
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={values.date_from}
          onChange={(e) => handleChange('date_from', e.target.value)}
          className={selectClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-date-to" className="text-xs font-medium text-slate-500">
          To
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={values.date_to}
          onChange={(e) => handleChange('date_to', e.target.value)}
          className={selectClass}
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} aria-label="Clear all filters">
          Clear filters
        </Button>
      )}
    </div>
  );
}
