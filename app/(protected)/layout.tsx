import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageTransition } from '@/components/layout/PageTransition';
import { requireSession } from '@/lib/auth/requireSession';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar session={session} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="NFX Policies" session={session} />
        <main
          className="flex-1 overflow-y-auto"
          id="main-content"
          tabIndex={-1}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
