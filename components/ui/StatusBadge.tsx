import { Badge } from './Badge';
import type { PolicyStatus } from '@/types';

interface StatusBadgeProps {
  status: PolicyStatus;
}

const statusConfig: Record<PolicyStatus, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  acknowledged: { label: 'Acknowledged', variant: 'success' },
  read: { label: 'Read', variant: 'warning' },
  unread: { label: 'Unread', variant: 'default' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
