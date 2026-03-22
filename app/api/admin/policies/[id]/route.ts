import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  verifyToken,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/apiAuth';

const BUCKET = 'policy-documents';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function deleteFile(objectPath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([objectPath]);

  if (error) {
    if (error.message.toLowerCase().includes('not found')) {
      console.warn('[adminPolicies] file not found during delete — skipping', { objectPath });
      return;
    }
    console.error('[adminPolicies] delete failed', { objectPath, error });
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

// ─── DELETE /api/admin/policies/[id] ──────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<Response> {
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

  const { id } = params;

  // Basic UUID format check
  if (!UUID_REGEX.test(id)) {
    return Response.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid policy ID — must be a valid UUID' },
      },
      { status: 400 },
    );
  }

  // Fetch the policy
  const { data: policy, error: fetchError } = await supabase
    .from('policies')
    .select('id, title, file_url, is_archived')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return serverErrorResponse();
  }

  if (!policy) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Policy not found.' } },
      { status: 404 },
    );
  }

  if (policy.is_archived) {
    return Response.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Archived policies cannot be deleted.' },
      },
      { status: 403 },
    );
  }

  // Block delete if acknowledgements exist (protects audit trail)
  const { count: ackCount, error: ackError } = await supabase
    .from('policy_acknowledgements')
    .select('*', { count: 'exact', head: true })
    .eq('policy_id', id);

  if (ackError) {
    return serverErrorResponse();
  }

  if ((ackCount ?? 0) > 0) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete a policy with existing acknowledgements. Archive it instead.',
        },
      },
      { status: 409 },
    );
  }

  // Delete the file from storage (non-fatal if already missing)
  if (policy.file_url) {
    try {
      await deleteFile(policy.file_url);
    } catch (err) {
      console.error('[adminPolicies] storage delete failed — aborting DB delete', err);
      return Response.json(
        {
          success: false,
          error: { code: 'SERVER_ERROR', message: 'Failed to delete file from storage.' },
        },
        { status: 500 },
      );
    }
  }

  // Delete the policy row
  const { error: deleteError } = await supabase.from('policies').delete().eq('id', id);

  if (deleteError) {
    return Response.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete policy record.' },
      },
      { status: 500 },
    );
  }

  return Response.json({ success: true, message: 'Policy deleted successfully.', id });
}
