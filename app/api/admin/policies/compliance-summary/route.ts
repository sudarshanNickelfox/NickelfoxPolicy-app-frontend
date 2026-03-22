import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  verifyToken,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/apiAuth';

// ─── GET /api/admin/policies/compliance-summary ───────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  // Auth — admin only
  let user;
  try {
    user = verifyToken(req as unknown as Request);
  } catch {
    return serverErrorResponse();
  }

  if (!user) {
    return unauthorizedResponse();
  }

  if (user.role !== 'admin') {
    return forbiddenResponse();
  }

  try {
    // Count total employees (non-admin users)
    const { count: totalUsers, error: userCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee');

    if (userCountError) throw new Error(`Failed to count users: ${userCountError.message}`);

    const employeeCount = totalUsers ?? 0;

    // Fetch all policies that require acknowledgement and are not archived
    const { data: policies, error: policyError } = await supabase
      .from('policies')
      .select('id, title, version')
      .eq('requires_acknowledgement', true)
      .eq('is_archived', false);

    if (policyError) throw new Error(`Failed to fetch policies: ${policyError.message}`);

    if (!policies || policies.length === 0) {
      return Response.json({ success: true, data: [] });
    }

    // For each policy, count acknowledgements
    const summaries = await Promise.all(
      policies.map(async (policy: { id: string; title: string; version: string }) => {
        const { count: ackCount, error: ackError } = await supabase
          .from('policy_acknowledgements')
          .select('*', { count: 'exact', head: true })
          .eq('policy_id', policy.id);

        if (ackError)
          throw new Error(`Failed to count acks for policy ${policy.id}: ${ackError.message}`);

        const acknowledged = ackCount ?? 0;
        const pending = Math.max(0, employeeCount - acknowledged);
        const rate = employeeCount > 0 ? Math.round((acknowledged / employeeCount) * 100) : 0;

        return {
          policy_id: policy.id,
          policy_title: policy.title,
          policy_version: policy.version,
          total_users: employeeCount,
          acknowledged_count: acknowledged,
          pending_count: pending,
          compliance_rate: rate,
        };
      }),
    );

    return Response.json({ success: true, data: summaries });
  } catch {
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
