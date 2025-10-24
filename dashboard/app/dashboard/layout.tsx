// dashboard/app/dashboard/layout.tsx

import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppNavbar } from '@/components/app-navbar';
import { AppSidebar } from '@/components/app-sidebar';

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 62)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1">
        <AppNavbar />

        {/* Hauptinhalt */}
        <main className="flex-1 p-6 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
