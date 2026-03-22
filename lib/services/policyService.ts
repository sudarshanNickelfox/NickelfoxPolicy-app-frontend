import type {
  Policy,
  PolicyDetail,
  PolicyFilters,
  PolicyQueryParams,
  PaginatedPolicies,
  AcknowledgementResponse,
  PolicyFileType,
  PolicyStatus,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Backend response shapes (snake_case) ────────────────────────────────────

interface BackendPolicy {
  id: string;
  title: string;
  category: string;
  department: string;
  version: string;
  effective_date: string;
  file_url: string | null;
  content_summary: string | null;
  requires_acknowledgement: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
}

interface BackendPolicyDetail extends BackendPolicy {
  signed_url: string | null;
}

interface BackendPoliciesEnvelope {
  success: boolean;
  data: BackendPolicy[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BackendPolicyDetailEnvelope {
  success: boolean;
  data: BackendPolicyDetail;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function deriveFileType(fileUrl: string | null): PolicyFileType {
  if (!fileUrl) return 'pdf';
  if (fileUrl.endsWith('.docx')) return 'docx';
  return 'pdf';
}

function deriveStatus(acknowledged: boolean): PolicyStatus {
  return acknowledged ? 'acknowledged' : 'unread';
}

function mapBackendPolicy(raw: BackendPolicy): Policy {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.content_summary ?? '',
    category: raw.category,
    department: raw.department,
    version: raw.version,
    fileType: deriveFileType(raw.file_url),
    status: deriveStatus(raw.acknowledged),
    effectiveDate: raw.effective_date,
    updatedAt: raw.updated_at,
    requiresAcknowledgement: raw.requires_acknowledgement,
    isArchived: raw.is_archived,
  };
}

function mapBackendPolicyDetail(raw: BackendPolicyDetail): PolicyDetail {
  return {
    ...mapBackendPolicy(raw),
    fileUrl: raw.file_url ?? '',
    signed_url: raw.signed_url,
  };
}

// ─── Public service functions ─────────────────────────────────────────────────

export async function fetchPolicies(params: PolicyQueryParams, token?: string): Promise<PaginatedPolicies> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.department) query.set('department', params.department);
  if (params.date_from) query.set('date_from', params.date_from);
  if (params.date_to) query.set('date_to', params.date_to);
  if (params.page) query.set('page', String(params.page));
  query.set('limit', String(params.page_size ?? 20));

  const envelope = await apiFetch<BackendPoliciesEnvelope>(`/api/policies?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const { data, meta } = envelope;
  const nextCursor =
    meta.page < meta.totalPages ? String(meta.page + 1) : null;

  return {
    data: data.map(mapBackendPolicy),
    nextCursor,
    total: meta.total,
  };
}

export async function fetchPolicyFilters(token?: string): Promise<PolicyFilters> {
  const envelope = await apiFetch<{ success: boolean; data: PolicyFilters }>('/api/policies/filters', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return envelope.data;
}

export async function fetchPolicyById(id: string, token?: string): Promise<PolicyDetail> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const envelope = await apiFetch<BackendPolicyDetailEnvelope>(`/api/policies/${id}`, {
    headers,
  });

  return mapBackendPolicyDetail(envelope.data);
}

export async function acknowledgePolicyById(
  id: string,
  token?: string
): Promise<AcknowledgementResponse> {
  const envelope = await apiFetch<{ success: boolean; data: AcknowledgementResponse }>(
    `/api/policies/${id}/acknowledge`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return envelope.data;
}
