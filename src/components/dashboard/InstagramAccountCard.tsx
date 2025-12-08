'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, CheckCircle2, ExternalLink, Users, ImageIcon, Clock, Calendar } from 'lucide-react';
import type { InstagramAccount } from '@/lib/services/instagram.service';

interface InstagramAccountCardProps {
  account: InstagramAccount;
  lastPostTime?: string;
  nextScheduledTime?: string;
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
    <Card className="w-full hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardHeader className="pb-3">
        {/* Top Row - Avatar and Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-border shadow-sm">
              <AvatarImage src={stats?.profilePicUrl || account.profilePictureUrl} alt={stats?.username || account.username || account.accountId} />
              <AvatarFallback className="bg-muted">
                <Instagram className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {account.isActive && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 border-2 border-background shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
          <Badge 
            variant={account.isActive ? 'default' : 'destructive'}
            className="shrink-0 font-semibold px-3 py-1"
          >
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        {/* Account Info */}
        <div className="space-y-1">
          <CardTitle className="text-lg sm:text-xl font-bold break-words">
            @{stats?.username || (loadingStats ? 'Loading...' : account.username || account.accountId)}
          </CardTitle>
          <p className="text-sm text-muted-foreground break-words line-clamp-2">
            {stats?.name || (loadingStats ? 'Loading...' : account.name || 'Instagram Account')}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-lg p-3 sm:p-4 border hover:bg-muted/60 transition-colors">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground text-xs font-medium truncate">Followers</p>
            </div>
            <p className="font-bold text-xl sm:text-2xl break-words">
              {loadingStats ? '...' : stats ? formatNumber(stats.followersCount) : 'N/A'}
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 sm:p-4 border hover:bg-muted/60 transition-colors">
            <div className="flex items-center gap-1.5 mb-2">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground text-xs font-medium truncate">Posts</p>
            </div>
            <p className="font-bold text-xl sm:text-2xl break-words">
              {loadingStats ? '...' : stats ? stats.mediaCount : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Post */}
        <div className="bg-muted/40 rounded-lg p-3 sm:p-4 border hover:bg-muted/60 transition-colors">
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium mb-1">Last Auto-Post</p>
              <p className="font-bold text-sm sm:text-base break-words">{getTimeAgo(lastPostTime)}</p>
            </div>
          </div>
        </div>

        {/* Next Scheduled */}
        <div className="bg-muted/40 rounded-lg p-3 sm:p-4 border hover:bg-muted/60 transition-colors">
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium mb-1">Next Scheduled</p>
              <p className="font-bold text-sm sm:text-base break-words">{formatNextTime(nextScheduledTime)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1">
          <Button
            variant="outline"
            size="default"
            className="w-full font-semibold hover:bg-accent"
            onClick={() => window.open(`https://instagram.com/${stats?.username || account.username || account.accountId}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">View on Instagram</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
