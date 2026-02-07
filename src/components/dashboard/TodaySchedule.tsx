'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { AutoPostConfigService } from '@/lib/services/module3/auto-post-config.service';
import { CharacterService } from '@/lib/services/character.service';
import { FamilyProfileService } from '@/lib/services/module4/family-profile.service';
import { InstagramService } from '@/lib/services/instagram.service';

interface ScheduledPost {
  time: string;
  accountId: string;
  accountName: string;
  characterName?: string;
  timeUntil: string;
  isToday: boolean;
}

export function TodaySchedule({ userId }: { userId: string }) {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
    
    // Refresh every minute to update "time until" display
    const interval = setInterval(loadSchedule, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadSchedule = async () => {
    try {
      const config = await AutoPostConfigService.getConfig(userId);
      if (!config || !config.isEnabled) {
        setScheduledPosts([]);
        setLoading(false);
        return;
      }

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const posts: ScheduledPost[] = [];

      // Load Module 3 (Characters) schedule
      try {
        const characters = await CharacterService.getUserCharacters(userId);
        const activeCharacters = characters.filter(char => 
          config.activeCharacterIds.includes(char.id) &&
          char.postingTimes && 
          char.postingTimes.length > 0
        );

        activeCharacters.forEach(character => {
          character.postingTimes.forEach(time => {
            const [hours, minutes] = time.split(':').map(Number);
            
            // Check today
            const todayDate = new Date(today);
            todayDate.setHours(hours, minutes, 0, 0);
            if (todayDate > now) {
              const account = InstagramService.getAccountById(character.assignedAccountId);
              posts.push({
                time: todayDate.toISOString(),
                accountId: character.assignedAccountId,
                accountName: account?.username || account?.name || 'Unknown',
                characterName: character.name,
                timeUntil: getTimeUntil(todayDate),
                isToday: true,
              });
            }

            // Check tomorrow
            const tomorrowDate = new Date(tomorrow);
            tomorrowDate.setHours(hours, minutes, 0, 0);
            const account = InstagramService.getAccountById(character.assignedAccountId);
            posts.push({
              time: tomorrowDate.toISOString(),
              accountId: character.assignedAccountId,
              accountName: account?.username || account?.name || 'Unknown',
              characterName: character.name,
              timeUntil: getTimeUntil(tomorrowDate),
              isToday: false,
            });
          });
        });
      } catch (error) {
      }

      // Load Module 4 (Family) schedule
      try {
        const familyProfiles = await FamilyProfileService.getUserProfiles(userId);
        const activeProfiles = familyProfiles.filter(profile => 
          profile.isActive &&
          profile.postingTimes && 
          profile.postingTimes.length > 0
        );

        activeProfiles.forEach(profile => {
          profile.postingTimes.forEach(time => {
            const [hours, minutes] = time.split(':').map(Number);
            
            // Check today
            const todayDate = new Date(today);
            todayDate.setHours(hours, minutes, 0, 0);
            if (todayDate > now) {
              const account = InstagramService.getAccountById(profile.instagramAccountId);
              posts.push({
                time: todayDate.toISOString(),
                accountId: profile.instagramAccountId,
                accountName: account?.username || account?.name || 'Unknown',
                characterName: `${profile.profileName} (Family)`,
                timeUntil: getTimeUntil(todayDate),
                isToday: true,
              });
            }

            // Check tomorrow
            const tomorrowDate = new Date(tomorrow);
            tomorrowDate.setHours(hours, minutes, 0, 0);
            const account = InstagramService.getAccountById(profile.instagramAccountId);
            posts.push({
              time: tomorrowDate.toISOString(),
              accountId: profile.instagramAccountId,
              accountName: account?.username || account?.name || 'Unknown',
              characterName: `${profile.profileName} (Family)`,
              timeUntil: getTimeUntil(tomorrowDate),
              isToday: false,
            });
          });
        });
      } catch (error) {
      }

      // Sort by time
      posts.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      // Limit to next 6 posts
      setScheduledPosts(posts.slice(0, 6));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntil = (scheduledDate: Date): string => {
    const now = Date.now();
    const time = scheduledDate.getTime();
    const diff = time - now;

    if (diff < 0) return 'Now';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `in ${minutes}m`;
    if (hours < 24) return `in ${hours}h`;
    return `in ${days}d`;
  };

  const formatTime = (isoTime: string): string => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scheduledPosts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="text-sm sm:text-base">No posts scheduled</p>
            <p className="text-xs sm:text-sm mt-1">Configure auto-posting in settings to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by day
  const todayPosts = scheduledPosts.filter((p) => p.isToday);
  const tomorrowPosts = scheduledPosts.filter((p) => !p.isToday);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 gap-2">
        <CardTitle className="text-base sm:text-lg">Upcoming Posts</CardTitle>
        <Badge variant="outline" className="text-xs">{scheduledPosts.length} scheduled</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {/* Today's Posts */}
          {todayPosts.length > 0 && (
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">Today</h4>
              <div className="space-y-2">
                {todayPosts.map((post, index) => (
                  <div
                    key={index}
                    className="flex items-start sm:items-center p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base">{formatTime(post.time)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {post.timeUntil}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        @{post.accountName}
                        {post.characterName && ` • ${post.characterName}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Posts */}
          {tomorrowPosts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tomorrow</h4>
              <div className="space-y-2">
                {tomorrowPosts.map((post, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatTime(post.time)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        @{post.accountName}
                        {post.characterName && ` • ${post.characterName}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
