import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your account',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's your dashboard overview.
        </p>
      </div>

      {/* Content Area - Add your content here */}
      <div className="rounded-lg border bg-card p-8">
        <div className="text-center text-muted-foreground">
          <p>Your dashboard content goes here</p>
        </div>
      </div>
    </div>
  );
}
