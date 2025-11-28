'use client';

import { useEffect, useState } from 'react';
import { InstagramAccountCard } from './InstagramAccountCard';
import { InstagramService, type InstagramAccount } from '@/lib/services/instagram.service';
import { AutoPostLogService } from '@/lib/services/module3/auto-post-log.service';
import { AutoPostConfigService } from '@/lib/services/module3/auto-post-config.service';
import { useRouter } from 'next/navigation';

interface AccountWithData {
  account: InstagramAccount;
  lastPostTime?: string;
  nextScheduledTime?: string;
}

export function InstagramAccountsGrid({ userId }: { userId: string }) {
  const [accountsData, setAccountsData] = useState<AccountWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  const loadAccounts = async () => {
    try {
      const accounts = InstagramService.getAccounts();
      
      // Get auto-post config for scheduling info
      const config = await AutoPostConfigService.getConfig(userId);
      
      // Get recent posts
      const logs = await AutoPostLogService.getUserLogs(userId, 50);

      const accountsWithData: AccountWithData[] = accounts.map((account) => {
        // Find last successful post for this account
        const lastPost = logs.find(
          (log) => log.instagramAccountId === account.accountId && log.status === 'success'
        );

        // Calculate next scheduled time
        // TODO: Update this to work with character-specific posting times
        let nextScheduledTime: string | undefined;
        /*
        if (config && config.isEnabled && config.postingTimes.length > 0) {
          const now = new Date();
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);

          // Check if this account is in rotation
          if (config.instagramAccounts.includes(account.accountId)) {
            // Find next posting time
            const sortedTimes = [...config.postingTimes].sort();
            
            for (const time of sortedTimes) {
              const [hours, minutes] = time.split(':').map(Number);
              const scheduledDate = new Date(today);
              scheduledDate.setHours(hours, minutes, 0, 0);

              if (scheduledDate > now) {
                nextScheduledTime = scheduledDate.toISOString();
                break;
              }
            }

            // If no time found today, use first time tomorrow
            if (!nextScheduledTime && sortedTimes.length > 0) {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const [hours, minutes] = sortedTimes[0].split(':').map(Number);
              tomorrow.setHours(hours, minutes, 0, 0);
              nextScheduledTime = tomorrow.toISOString();
            }
          }
        }
        */

        return {
          account,
          lastPostTime: lastPost?.executedAt,
          nextScheduledTime,
        };
      });

      setAccountsData(accountsWithData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = (accountId: string) => {
    router.push(`/dashboard/auto-poster?reconnect=${accountId}`);
  };

  const handleViewAnalytics = (accountId: string) => {
    router.push(`/dashboard/analytics?account=${accountId}`);
  };

  const handleAddAccount = () => {
    router.push('/dashboard/auto-poster?tab=settings');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Instagram Accounts</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold truncate">Instagram Accounts</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {accountsData.length} account{accountsData.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      </div>

      {accountsData.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">No Instagram accounts connected yet</p>
          <p className="text-xs text-muted-foreground mt-2">Connect your Instagram account in settings to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1">
          {accountsData.map(({ account, lastPostTime, nextScheduledTime }) => (
            <InstagramAccountCard
              key={account.accountId}
              account={account}
              lastPostTime={lastPostTime}
              nextScheduledTime={nextScheduledTime}
              onReconnect={() => handleReconnect(account.accountId)}
              onViewAnalytics={() => handleViewAnalytics(account.accountId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
