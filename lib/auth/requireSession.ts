import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import type { Session } from '@/types';

const DEV_MOCK_SESSION: Session = {
  user: {
    name: 'Jane Smith',
    email: 'jane.smith@nfx.com',
    image: null,
  },
  accessToken: 'mock-access-token',
  role: 'admin',
};

export async function requireSession(requiredRole?: 'admin' | 'employee'): Promise<Session> {
  // In development with no real provider configured, return mock session
  if (process.env.NODE_ENV === 'development' && !process.env.AZURE_AD_CLIENT_ID) {
    return DEV_MOCK_SESSION;
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const typedSession = session as unknown as Session;

  if (requiredRole === 'admin' && typedSession.role !== 'admin') {
    redirect('/policies');
  }

  return typedSession;
}
