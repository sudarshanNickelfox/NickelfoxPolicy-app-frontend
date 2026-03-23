'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageTransition } from '@/components/layout/PageTransition';
import type { Session } from '@/types';

interface AppShellProps {
  session: Session;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        session={session}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          title="NFX Policies"
          session={session}
          onMenuToggle={() => setMobileOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto" id="main-content" tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
