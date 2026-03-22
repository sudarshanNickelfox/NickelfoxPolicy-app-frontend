import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import {
  verifyToken,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/apiAuth';

// ─── Validation schema (mirrors backend adminPaginationSchema) ─────────────────

const adminPaginationSchema = z.object({
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
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

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
  const parsed = adminPaginationSchema.safeParse(rawQuery);

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

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('users')
      // Explicitly exclude password_hash
      .select('id, email, name, role, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);

    const total = count ?? 0;

    return Response.json({
      success: true,
      data: data ?? [],
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
