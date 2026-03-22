import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { verifyToken, unauthorizedResponse, serverErrorResponse } from '@/lib/apiAuth';

const policyIdSchema = z.object({
  id: z.string().uuid('Invalid policy ID — must be a valid UUID'),
});

// ─── POST /api/policies/[id]/acknowledge ──────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<Response> {
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

  // Validate route param
  const parsed = policyIdSchema.safeParse(params);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid policy ID — must be a valid UUID',
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  const userId = user.id;
  const policyId = parsed.data.id;

  // Extract IP address from Next.js request headers
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    undefined;

  try {
    const now = new Date().toISOString();

    // Check whether the acknowledgement already exists
    const { data: existing, error: lookupError } = await supabase
      .from('policy_acknowledgements')
      .select('acknowledged_at')
      .eq('user_id', userId)
      .eq('policy_id', policyId)
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      throw new Error(`Failed to look up acknowledgement: ${lookupError.message}`);
    }

    const action: 'acknowledged' | 'reacknowledged' = existing ? 'reacknowledged' : 'acknowledged';

    // Upsert into policy_acknowledgements
    const { error: upsertError } = await supabase
      .from('policy_acknowledgements')
      .upsert(
        { user_id: userId, policy_id: policyId, acknowledged_at: now },
        { onConflict: 'user_id,policy_id' },
      );

    if (upsertError) {
      throw new Error(`Failed to upsert acknowledgement: ${upsertError.message}`);
    }

    // Append to audit log — always, even for re-acknowledgements
    const { error: auditError } = await supabase.from('acknowledgement_audit_log').insert({
      user_id: userId,
      policy_id: policyId,
      action,
      timestamp: now,
      ip_address: ipAddress ?? null,
    });

    if (auditError) {
      throw new Error(`Failed to write audit log: ${auditError.message}`);
    }

    return Response.json({
      success: true,
      data: {
        acknowledgement_id: `${userId}:${policyId}`,
        acknowledged_at: now,
        action,
      },
    });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    const statusCode = error.statusCode ?? 500;
    return Response.json(
      {
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
          message: statusCode < 500 ? error.message : 'Internal server error',
        },
      },
      { status: statusCode },
    );
  }
}
