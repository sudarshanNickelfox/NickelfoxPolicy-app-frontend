const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function authHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export interface PolicyComplianceSummary {
  policy_id: string;
  policy_title: string;
  policy_version: string;
  total_users: number;
  acknowledged_count: number;
  pending_count: number;
  compliance_rate: number;
}

export interface AdminAcknowledgement {
  user_id: string;
  policy_id: string;
  acknowledged_at: string;
  user_name: string;
  user_email: string;
  policy_title: string;
  policy_version: string;
}

export async function fetchComplianceSummary(token: string): Promise<PolicyComplianceSummary[]> {
  const res = await fetch(`${BASE_URL}/api/admin/policies/compliance-summary`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to load compliance data (${res.status})`);
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchAdminAcknowledgements(
  token: string,
  page = 1,
): Promise<{ data: AdminAcknowledgement[]; total: number }> {
  const res = await fetch(
    `${BASE_URL}/api/admin/acknowledgements?page=${page}&limit=20`,
    { headers: authHeaders(token) },
  );
  if (!res.ok) throw new Error(`Failed to load acknowledgements (${res.status})`);
  const json = await res.json();
  return { data: json.data ?? [], total: json.meta?.total ?? 0 };
}
