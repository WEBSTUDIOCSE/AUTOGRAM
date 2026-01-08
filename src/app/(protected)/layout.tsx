import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { PageHeader } from '@/components/dashboard/page-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your account',
};

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard&message=Please sign in to continue');
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <PageHeader />
        <div className="px-4 md:px-6 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
