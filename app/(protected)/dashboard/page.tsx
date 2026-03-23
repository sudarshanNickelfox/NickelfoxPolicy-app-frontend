import { requireSession } from '@/lib/auth/requireSession';
import { UserDashboardClient } from './UserDashboardClient';

export const metadata = { title: 'Dashboard — NFX Policies' };

export default async function DashboardPage() {
  const session = await requireSession();
  return <UserDashboardClient accessToken={session.accessToken} user={session.user} />;
}
