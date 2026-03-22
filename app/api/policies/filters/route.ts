import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, unauthorizedResponse, serverErrorResponse } from '@/lib/apiAuth';

// ─── GET /api/policies/filters ────────────────────────────────────────────────

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

  try {
    const [{ data: cats }, { data: depts }] = await Promise.all([
      supabase
        .from('policies')
        .select('category')
        .eq('is_archived', false)
        .order('category'),
      supabase
        .from('policies')
        .select('department')
        .eq('is_archived', false)
        .order('department'),
    ]);

    const categories = [
      ...new Set((cats ?? []).map((r: { category: string }) => r.category).filter(Boolean)),
    ];
    const departments = [
      ...new Set((depts ?? []).map((r: { department: string }) => r.department).filter(Boolean)),
    ];

    return Response.json({ success: true, data: { categories, departments } });
  } catch {
    // Best-effort endpoint — return empty arrays rather than an error status
    return Response.json({ success: true, data: { categories: [], departments: [] } });
  }
}
