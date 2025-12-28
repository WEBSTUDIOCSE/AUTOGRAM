'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock, Image, Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { APIBook } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import type { MotivationalAutoPostLog } from '@/lib/services/module9/motivational-auto-post-log.service';

export function MotivationalQuoteHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [logs, setLogs] = React.useState<MotivationalAutoPostLog[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const LIMIT = 20;

  React.useEffect(() => {
    if (user?.uid) {
      loadLogs();
    }
  }, [page, user]);

  const loadLogs = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const logsData = await APIBook.motivationalAutoPostLog.getUserLogs(user.uid, LIMIT);
      
      if (page === 1) {
        setLogs(logsData);
      } else {
        setLogs((prev) => [...prev, ...logsData]);
      }
      
      setHasMore(logsData.length === LIMIT);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'media_generated':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Media Generated
          </Badge>
        );
      case 'instagram_failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Instagram Failed
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && page === 1) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post History</CardTitle>
        <CardDescription>
          View all generated motivational quotes and their posting status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No posts yet. Enable auto-posting and add prompts to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          <Badge variant="outline">
                            {log.contentType === 'image' ? (
                              <Image className="h-3 w-3 mr-1" />
                            ) : (
                              <Video className="h-3 w-3 mr-1" />
                            )}
                            {log.contentType}
                          </Badge>
                          <Badge variant="secondary">{log.category}</Badge>
                        </div>
                        
                        {log.quoteText && (
                          <div className="rounded-md border bg-muted/50 p-3">
                            <p className="text-sm font-medium italic">"{log.quoteText}"</p>
                            {log.author && (
                              <p className="text-xs text-muted-foreground mt-1">— {log.author}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.instagramAccountName && (
                            <span>@{log.instagramAccountName}</span>
                          )}
                          <span>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}</span>
                        </div>

                        {log.error && (
                          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                            <p className="text-xs text-destructive">Error: {log.error}</p>
                          </div>
                        )}
                      </div>

                      {log.mediaUrl && (
                        <div className="ml-4">
                          {log.contentType === 'image' ? (
                            <img
                              src={log.mediaUrl}
                              alt="Generated content"
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                              <Video className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {log.instagramPostId && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://www.instagram.com/p/${log.instagramPostId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            View on Instagram
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
