import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { verifyToken, unauthorizedResponse, serverErrorResponse } from '@/lib/apiAuth';

const BUCKET = 'policy-documents';

const policyIdSchema = z.object({
  id: z.string().uuid('Invalid policy ID — must be a valid UUID'),
});

// ─── GET /api/policies/[id] ───────────────────────────────────────────────────

export async function GET(
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

  const { id } = parsed.data;
  const userId = user.id;

  try {
    // Fetch policy
    const { data: policy, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Policy not found' } },
          { status: 404 },
        );
      }
      throw new Error(`Failed to fetch policy: ${error.message}`);
    }

    // Fetch acknowledgement state for this user
    const { data: ack, error: ackError } = await supabase
      .from('policy_acknowledgements')
      .select('acknowledged_at')
      .eq('user_id', userId)
      .eq('policy_id', id)
      .single();

    if (ackError && ackError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch acknowledgement: ${ackError.message}`);
    }

    const policyWithAck = {
      ...policy,
      acknowledged: !!ack,
      acknowledged_at: ack?.acknowledged_at ?? null,
    };

    // Generate a short-lived signed URL for the file (fresh on every request)
    let signed_url: string | null = null;
    if (policy.file_url) {
      try {
        const { data: urlData, error: urlError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(policy.file_url, 3600);

        if (!urlError && urlData?.signedUrl) {
          signed_url = urlData.signedUrl;
        } else {
          // Non-fatal — return null so the client shows "No document attached"
          console.warn('[policies] failed to generate signed URL for policy', id);
        }
      } catch {
        console.warn('[policies] failed to generate signed URL for policy', id);
      }
    }

    return Response.json({ success: true, data: { ...policyWithAck, signed_url } });
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
