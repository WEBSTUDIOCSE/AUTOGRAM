'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Users, Instagram } from 'lucide-react';
import { AutoPostLogService } from '@/lib/services/auto-post-log.service';
import { CharacterService } from '@/lib/services/character.service';
import { InstagramService } from '@/lib/services/instagram.service';

interface Stats {
  postsThisMonth: number;
  connectedAccounts: number;
  activeCharacters: number;
}

export function OverviewStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats>({
    postsThisMonth: 0,
    connectedAccounts: 0,
    activeCharacters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Get posts this month
      const logs = await AutoPostLogService.getUserLogs(userId, 100);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const postsThisMonth = logs.filter((log) => {
        const logDate = new Date(log.executedAt);
        return logDate >= firstDayOfMonth && log.status === 'success';
      }).length;

      // Get connected accounts
      const accounts = InstagramService.getAccounts();
      const connectedAccounts = accounts.length;

      // Get active characters
      const characters = await CharacterService.getUserCharacters(userId);
      const activeCharacters = characters.length;

      setStats({
        postsThisMonth,
        connectedAccounts,
        activeCharacters,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Posts This Month',
      value: stats.postsThisMonth,
      icon: Image,
      description: 'Successful auto-posts',
    },
    {
      title: 'Instagram Accounts',
      value: stats.connectedAccounts,
      icon: Instagram,
      description: 'Connected accounts',
    },
    {
      title: 'Active Characters',
      value: stats.activeCharacters,
      icon: Users,
      description: 'Uploaded characters',
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="w-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold">
                    {loading ? '...' : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.description}
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-2 sm:p-3 flex-shrink-0">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
