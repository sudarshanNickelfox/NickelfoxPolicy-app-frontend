import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, unauthorizedResponse, serverErrorResponse } from '@/lib/apiAuth';

// ─── GET /api/acknowledgements ────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  // Auth
  let user;
  try {
    user = verifyToken(req as unknown as Request);
  } catch {
    return serverErrorResponse();
  }

  if (!user) {
    return unauthorizedResponse();
  }

  const userId = user.id;

  try {
    const { data, error } = await supabase
      .from('policy_acknowledgements')
      .select('policy_id, acknowledged_at, policies!inner(title, version, is_archived)')
      .eq('user_id', userId)
      .order('acknowledged_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch acknowledgements: ${error.message}`);
    }

    const mapped = (data ?? []).map((row: any) => ({
      id: row.policy_id,
      policyId: row.policy_id,
      policyTitle: row.policies.title,
      policyVersion: row.policies.version,
      acknowledgedAt: row.acknowledged_at,
      isArchived: row.policies.is_archived,
    }));

    return Response.json({ success: true, data: mapped });
  } catch {
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
