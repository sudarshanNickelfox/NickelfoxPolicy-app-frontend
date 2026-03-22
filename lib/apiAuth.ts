import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  iat?: number;
  exp?: number;
}

/**
 * Verifies the Bearer JWT from the Authorization header of a Next.js Request.
 *
 * Replicates the Express `requireAuth` middleware logic from the backend.
 * Returns the decoded payload on success, or null if the header is missing,
 * malformed, or the token fails verification.
 *
 * Usage in an API route:
 *   const user = verifyToken(req);
 *   if (!user) return unauthorizedResponse();
 */
export function verifyToken(req: Request): JwtPayload | null {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // strip "Bearer "
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // Configuration error — fail closed; the route handler will return 500
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ─── Shared response helpers ──────────────────────────────────────────────────

export function unauthorizedResponse(): Response {
  return Response.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
    { status: 401 },
  );
}

export function forbiddenResponse(): Response {
  return Response.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } },
    { status: 403 },
  );
}

export function serverErrorResponse(message = 'Internal server error'): Response {
  return Response.json(
    { success: false, error: { code: 'SERVER_ERROR', message } },
    { status: 500 },
  );
}
