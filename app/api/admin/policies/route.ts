import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';
import {
  verifyToken,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/apiAuth';

const BUCKET = 'policy-documents';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 52_428_800; // 50 MB

// ─── Storage helpers (inlined — no Express dependency) ────────────────────────

function sanitiseFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

function buildObjectPath(policyId: string, originalFilename: string): string {
  return `policies/${policyId}/${sanitiseFilename(originalFilename)}`;
}

async function uploadFile(objectPath: string, buffer: Buffer, mimeType: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    console.error('[adminPolicies] upload failed', { objectPath, error });
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

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

// ─── POST /api/admin/policies ─────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
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

  // Ensure multipart/form-data
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return Response.json(
      {
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Request must be multipart/form-data' },
      },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      {
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Failed to parse form data' },
      },
      { status: 400 },
    );
  }

  const file = formData.get('file');

  // Validate file presence
  if (!file || !(file instanceof File)) {
    return Response.json(
      {
        success: false,
        error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Only PDF and DOCX files are accepted.' },
      },
      { status: 415 },
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return Response.json(
      {
        success: false,
        error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Only PDF and DOCX files are accepted.' },
      },
      { status: 415 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      {
        success: false,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'File size must not exceed 50 MB.' },
      },
      { status: 413 },
    );
  }

  // Extract and validate text fields
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const category = (formData.get('category') as string | null)?.trim() ?? '';
  const department = (formData.get('department') as string | null)?.trim() ?? '';
  const version = (formData.get('version') as string | null)?.trim() ?? '';
  const effective_date = (formData.get('effective_date') as string | null)?.trim() ?? '';
  const requires_acknowledgement = formData.get('requires_acknowledgement') as string | null;

  const missing: string[] = [];
  if (!title) missing.push('title');
  if (!category) missing.push('category');
  if (!department) missing.push('department');
  if (!version) missing.push('version');
  if (!effective_date) missing.push('effective_date');

  if (missing.length > 0) {
    return Response.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields', fields: missing },
      },
      { status: 400 },
    );
  }

  // Check for duplicate (title, version)
  const { data: existing, error: dupError } = await supabase
    .from('policies')
    .select('id')
    .eq('title', title)
    .eq('version', version)
    .maybeSingle();

  if (dupError) {
    return serverErrorResponse();
  }

  if (existing) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A policy with this title and version already exists.',
        },
      },
      { status: 409 },
    );
  }

  const policyId = randomUUID();
  const objectPath = buildObjectPath(policyId, file.name);

  // Convert File to Buffer for Supabase storage upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload file to Supabase Storage
  try {
    await uploadFile(objectPath, buffer, file.type);
  } catch (err) {
    console.error('[adminPolicies] storage upload failed', err);
    return Response.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to upload file to storage.' },
      },
      { status: 500 },
    );
  }

  // Insert policy row
  const { data: policy, error: insertError } = await supabase
    .from('policies')
    .insert({
      id: policyId,
      title,
      category,
      department,
      version,
      effective_date,
      file_url: objectPath,
      requires_acknowledgement: requires_acknowledgement === 'true',
      is_archived: false,
    })
    .select()
    .single();

  if (insertError || !policy) {
    // Roll back the uploaded file
    await deleteFile(objectPath).catch((rollbackErr) => {
      console.error('[adminPolicies] storage rollback failed after DB insert error', rollbackErr);
    });
    return Response.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to save policy record.' },
      },
      { status: 500 },
    );
  }

  return Response.json({ success: true, policy }, { status: 201 });
}
