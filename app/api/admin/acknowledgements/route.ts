import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import {
  verifyToken,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/apiAuth';

// ─── Validation schema (mirrors backend acknowledgementFilterSchema) ───────────

const acknowledgementFilterSchema = z.object({
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
  policy_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date_from: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  date_to: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
});

// ─── GET /api/admin/acknowledgements ─────────────────────────────────────────

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

  // Validate query params
  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = acknowledgementFilterSchema.safeParse(rawQuery);

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

  const { page, limit, policy_id, user_id, date_from, date_to } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('policy_acknowledgements')
      .select(
        `
        user_id,
        policy_id,
        acknowledged_at,
        users!inner ( name, email ),
        policies!inner ( title, version )
      `,
        { count: 'exact' },
      )
      .order('acknowledged_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (policy_id) query = query.eq('policy_id', policy_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (date_from) query = query.gte('acknowledged_at', date_from);
    if (date_to) query = query.lte('acknowledged_at', date_to);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch acknowledgements: ${error.message}`);

    // Normalize nested Supabase joins into flat objects
    const normalized = (data ?? []).map((row: any) => ({
      user_id: row.user_id,
      policy_id: row.policy_id,
      acknowledged_at: row.acknowledged_at,
      user_name: row.users?.name ?? '',
      user_email: row.users?.email ?? '',
      policy_title: row.policies?.title ?? '',
      policy_version: row.policies?.version ?? '',
    }));

    const total = count ?? 0;

    return Response.json({
      success: true,
      data: normalized,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
