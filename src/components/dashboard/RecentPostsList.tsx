'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { AutoPostLogService, type AutoPostLog } from '@/lib/services/auto-post-log.service';

export function RecentPostsList({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<AutoPostLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      const logs = await AutoPostLogService.getUserLogs(userId, 10);
      setPosts(logs);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleRetry = async (postId: string) => {
    // TODO: Implement retry logic
    console.log('Retry post:', postId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Auto-Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Auto-Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No auto-posts yet</p>
            <p className="text-sm mt-1">Your automated posts will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Auto-Posts</CardTitle>
        <Badge variant="outline">{posts.length} posts</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                post.status === 'success' ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-red-50/50 dark:bg-red-950/20'
              }`}
            >
              <div className="mt-0.5">
                {post.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={post.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                    {post.status === 'success' ? 'Posted' : 'Failed'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{getTimeAgo(post.executedAt)}</span>
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    @{post.instagramAccountName || post.instagramAccountId}
                  </p>

                  {post.status === 'success' && post.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.caption}</p>
                  )}

                  {post.status === 'failed' && post.error && (
                    <p className="text-sm text-destructive">{post.error}</p>
                  )}

                  {post.characterName && (
                    <p className="text-xs text-muted-foreground">Character: {post.characterName}</p>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  {post.status === 'success' && post.instagramPostId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        window.open(`https://instagram.com/p/${post.instagramPostId}`, '_blank')
                      }
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}

                  {post.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleRetry(post.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>

              {post.generatedImageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={post.generatedImageUrl}
                    alt="Post"
                    className="w-16 h-16 rounded object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
