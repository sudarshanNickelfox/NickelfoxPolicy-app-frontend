import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { verifyToken, unauthorizedResponse, serverErrorResponse } from '@/lib/apiAuth';

// ─── Validation schema (mirrors backend paginationSchema) ─────────────────────

const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Policy {
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
}

// ─── GET /api/policies ────────────────────────────────────────────────────────

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

  // Validate query params
  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = paginationSchema.safeParse(rawQuery);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  const { page, limit, search, category, department } = parsed.data;
  const userId = user.id;
  const offset = (page - 1) * limit;

  try {
    // Build paginated policies query
    let query = supabase
      .from('policies')
      .select('*', { count: 'exact' })
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,content_summary.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (department) {
      query = query.eq('department', department);
    }

    const { data: policies, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch policies: ${error.message}`);
    }

    if (!policies || policies.length === 0) {
      return Response.json({
        success: true,
        data: [],
        meta: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      });
    }

    // Fetch acknowledgements for this user for the returned policy IDs
    const policyIds = policies.map((p: Policy) => p.id);

    const { data: acks, error: ackError } = await supabase
      .from('policy_acknowledgements')
      .select('policy_id, acknowledged_at')
      .eq('user_id', userId)
      .in('policy_id', policyIds);

    if (ackError) {
      throw new Error(`Failed to fetch acknowledgements: ${ackError.message}`);
    }

    const ackMap = new Map<string, string>();
    for (const ack of acks ?? []) {
      ackMap.set(ack.policy_id, ack.acknowledged_at);
    }

    const data = policies.map((policy: Policy) => ({
      ...policy,
      acknowledged: ackMap.has(policy.id),
      acknowledged_at: ackMap.get(policy.id) ?? null,
    }));

    const total = count ?? 0;

    return Response.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
