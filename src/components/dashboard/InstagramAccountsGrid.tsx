'use client';

import { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';
import { InstagramAccountCard } from './InstagramAccountCard';
import { InstagramService, type InstagramAccount } from '@/lib/services/instagram.service';
import { AutoPostLogService } from '@/lib/services/module3/auto-post-log.service';
import { CharacterService } from '@/lib/services/character.service';
import { FamilyProfileService } from '@/lib/services/module4/family-profile.service';

interface AccountWithData {
  account: InstagramAccount;
  lastPostTime?: string;
  nextScheduledTime?: string;
}

export function InstagramAccountsGrid({ userId }: { userId: string }) {
  const [accountsData, setAccountsData] = useState<AccountWithData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  const loadAccounts = async () => {
    try {
      const accounts = InstagramService.getAccounts();
      
      // Get recent posts
      const logs = await AutoPostLogService.getUserLogs(userId, 50);

      // Load characters and family profiles to calculate next scheduled times
      const characters = await CharacterService.getUserCharacters(userId);
      const familyProfiles = await FamilyProfileService.getUserProfiles(userId);

      const accountsWithData: AccountWithData[] = accounts.map((account) => {
        // Find last successful post for this account
        const lastPost = logs.find(
          (log) => log.instagramAccountId === account.accountId && log.status === 'success'
        );

        // Calculate next scheduled time from characters and family profiles
        let nextScheduledTime: string | undefined;
        const now = new Date();
        const allPostingTimes: Date[] = [];

        // Collect posting times from characters assigned to this account
        characters.forEach((char) => {
          if (char.assignedAccountId === account.accountId && char.postingTimes && char.postingTimes.length > 0) {
            char.postingTimes.forEach((time) => {
              const [hours, minutes] = time.split(':').map(Number);
              const scheduledDate = new Date();
              scheduledDate.setHours(hours, minutes, 0, 0);
              
              // Add today's time if it's in the future
              if (scheduledDate > now) {
                allPostingTimes.push(new Date(scheduledDate));
              }
              
              // Also add tomorrow's time
              const tomorrowDate = new Date(scheduledDate);
              tomorrowDate.setDate(tomorrowDate.getDate() + 1);
              allPostingTimes.push(tomorrowDate);
            });
          }
        });

        // Collect posting times from family profiles assigned to this account
        familyProfiles.forEach((profile) => {
          if (profile.isActive && profile.instagramAccountId === account.accountId && profile.postingTimes && profile.postingTimes.length > 0) {
            profile.postingTimes.forEach((time) => {
              const [hours, minutes] = time.split(':').map(Number);
              const scheduledDate = new Date();
              scheduledDate.setHours(hours, minutes, 0, 0);
              
              // Add today's time if it's in the future
              if (scheduledDate > now) {
                allPostingTimes.push(new Date(scheduledDate));
              }
              
              // Also add tomorrow's time
              const tomorrowDate = new Date(scheduledDate);
              tomorrowDate.setDate(tomorrowDate.getDate() + 1);
              allPostingTimes.push(tomorrowDate);
            });
          }
        });

        // Find the earliest scheduled time
        if (allPostingTimes.length > 0) {
          allPostingTimes.sort((a, b) => a.getTime() - b.getTime());
          nextScheduledTime = allPostingTimes[0].toISOString();
        }

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Instagram Accounts</h2>
            <p className="text-sm text-muted-foreground">Loading your connected accounts...</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-[400px] rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Instagram Accounts</h2>
          <p className="text-sm text-muted-foreground">
            {accountsData.length} account{accountsData.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      </div>

      {accountsData.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center bg-muted/30">
          <Instagram className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-base font-medium text-muted-foreground">No Instagram accounts connected yet</p>
          <p className="text-sm text-muted-foreground mt-2">Connect your Instagram account in settings to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {accountsData.map(({ account, lastPostTime, nextScheduledTime }) => (
            <InstagramAccountCard
              key={account.accountId}
              account={account}
              lastPostTime={lastPostTime}
              nextScheduledTime={nextScheduledTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}
