'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertsBanner } from '@/components/dashboard/AlertsBanner';
import { OverviewStats } from '@/components/dashboard/OverviewStats';
import { InstagramAccountsGrid } from '@/components/dashboard/InstagramAccountsGrid';
import { TodaySchedule } from '@/components/dashboard/TodaySchedule';

export default function DashboardPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName.split(' ')[0] || 'there');
    } else {
      setUserName('there');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6 lg:p-8 max-w-[100vw] overflow-x-hidden">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Welcome back, {userName}!</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Here&apos;s your Instagram auto-posting dashboard.
        </p>
      </div>

      {/* Alerts Banner */}
      <AlertsBanner userId={user.uid} />

      {/* Overview Stats */}
      <OverviewStats userId={user.uid} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <InstagramAccountsGrid userId={user.uid} />
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <TodaySchedule userId={user.uid} />
        </div>
      </div>
    </div>
  );
}
