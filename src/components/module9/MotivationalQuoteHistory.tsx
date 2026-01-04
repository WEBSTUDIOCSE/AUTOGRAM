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
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg sm:text-xl">Post History</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          View all generated motivational quotes and their posting status
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {logs.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-xs sm:text-sm text-muted-foreground">
              No posts yet. Enable auto-posting and add prompts to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-3 sm:p-4 sm:pt-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="flex-1 space-y-2 w-full min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {getStatusBadge(log.status)}
                          <Badge variant="outline" className="text-xs">
                            {log.contentType === 'image' ? (
                              <Image className="h-3 w-3 mr-1" />
                            ) : (
                              <Video className="h-3 w-3 mr-1" />
                            )}
                            {log.contentType}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{log.category}</Badge>
                        </div>
                        
                        {log.quoteText && (
                          <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                            <p className="text-xs sm:text-sm font-medium italic line-clamp-3">"{log.quoteText}"</p>
                            {log.author && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">— {log.author}</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                          {log.instagramAccountName && (
                            <span className="truncate">@{log.instagramAccountName}</span>
                          )}
                          <span className="truncate">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}</span>
                        </div>

                        {log.error && (
                          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                            <p className="text-xs text-destructive">Error: {log.error}</p>
                          </div>
                        )}
                      </div>

                      {log.mediaUrl && (
                        <div className="w-full sm:w-auto sm:ml-4">
                          {log.contentType === 'image' ? (
                            <img
                              src={log.mediaUrl}
                              alt="Generated content"
                              className="w-full sm:w-20 md:w-24 h-auto sm:h-20 md:h-24 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 bg-muted rounded-md flex items-center justify-center">
                              <Video className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
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
                          className="h-8 sm:h-9 text-xs w-full sm:w-auto"
                          asChild
                        >
                          <a
                            href={`https://www.instagram.com/p/${log.instagramPostId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" />
                            <span className="text-xs">View on Instagram</span>
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
