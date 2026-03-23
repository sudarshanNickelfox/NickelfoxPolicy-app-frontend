import { AppShell } from '@/components/layout/AppShell';
import { requireSession } from '@/lib/auth/requireSession';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();

  return <AppShell session={session}>{children}</AppShell>;
}
