'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, CheckCircle2, ExternalLink } from 'lucide-react';
import type { InstagramAccount } from '@/lib/services/instagram.service';

interface InstagramAccountCardProps {
  account: InstagramAccount;
  lastPostTime?: string;
  nextScheduledTime?: string;
  onReconnect: () => void;
  onViewAnalytics: () => void;
}

interface InstagramStats {
  followersCount: number;
  mediaCount: number;
  username: string;
  name: string;
  profilePicUrl: string;
}

export function InstagramAccountCard({
  account,
  lastPostTime,
  nextScheduledTime,
  onReconnect,
  onViewAnalytics,
}: InstagramAccountCardProps) {
  const [stats, setStats] = useState<InstagramStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchInstagramStats();
  }, [account.accountId]);

  const fetchInstagramStats = async () => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${account.accountId}?fields=followers_count,media_count,username,name,profile_picture_url&access_token=${account.accessToken}`
      );
      const data = await response.json();
      
      if (data.followers_count !== undefined && data.media_count !== undefined) {
        setStats({
          followersCount: data.followers_count,
          mediaCount: data.media_count,
          username: data.username || account.username,
          name: data.name || account.name,
          profilePicUrl: data.profile_picture_url || account.profilePictureUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching Instagram stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getTimeAgo = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatNextTime = (time?: string): string => {
    if (!time) return 'Not scheduled';
    const date = new Date(time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={stats?.profilePicUrl || account.profilePictureUrl} alt={stats?.username || account.username || account.accountId} />
              <AvatarFallback>
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 flex-wrap">
                <span className="truncate">@{stats?.username || (loadingStats ? 'Loading...' : account.username || account.accountId)}</span>
                {account.isActive && (
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                {stats?.name || (loadingStats ? 'Loading...' : account.name || 'Instagram Account')}
              </p>
            </div>
          </div>
          <Badge variant={account.isActive ? 'secondary' : 'destructive'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs mb-0.5">Followers</p>
            <p className="font-semibold truncate">
              {loadingStats ? 'Loading...' : stats ? formatNumber(stats.followersCount) : 'N/A'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs mb-0.5">Posts</p>
            <p className="font-semibold truncate">
              {loadingStats ? 'Loading...' : stats ? stats.mediaCount : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Post */}
        <div className="text-sm min-w-0">
          <p className="text-muted-foreground text-xs mb-0.5">Last Auto-Post</p>
          <p className="font-medium truncate">{getTimeAgo(lastPostTime)}</p>
        </div>

        {/* Next Scheduled */}
        <div className="text-sm min-w-0">
          <p className="text-muted-foreground text-xs mb-0.5">Next Scheduled</p>
          <p className="font-medium truncate">{formatNextTime(nextScheduledTime)}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={() => window.open(`https://instagram.com/${stats?.username || account.username || account.accountId}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            <span className="truncate">Instagram</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
