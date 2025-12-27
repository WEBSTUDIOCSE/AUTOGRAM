'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Clock, Video, Film, Calendar, Upload, AlertCircle } from 'lucide-react';
import type { VideoAutoPostLog } from '@/lib/firebase/config/types';
import { APIBook } from '@/lib/firebase/services';
import { InstagramService } from '@/lib/services/instagram.service';

interface VideoAutoPostHistoryProps {
  userId: string;
}

export default function VideoAutoPostHistory({ userId }: VideoAutoPostHistoryProps) {
  const [logs, setLogs] = useState<VideoAutoPostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const loadedLogs = await APIBook.videoAutoPostLog.getLogsByUserId(userId, 50);
      setLogs(loadedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPost = async (log: VideoAutoPostLog) => {
    try {
      setRetryingId(log.id);
      setError(null);

      // Post to Instagram
      const instagramPostId = await InstagramService.postImage(
        log.generatedVideoUrl,
        log.caption || log.generatedPrompt,
        log.instagramAccountId,
        true // isVideo flag for Instagram REELS
      );

      if (instagramPostId) {
        // Update log status to success
        await APIBook.videoAutoPostLog.updateLog(log.id, {
          status: 'success',
          instagramPostId,
          error: undefined,
        });

        // Reload logs to show updated status
        await loadLogs();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry posting');
      
      // Update log with new error
      await APIBook.videoAutoPostLog.updateLog(log.id, {
        status: 'instagram_failed',
        error: err instanceof Error ? err.message : 'Retry failed',
      });
      
      await loadLogs();
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Auto-Post History</CardTitle>
        <CardDescription>
          View your automated video posting history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {logs.length === 0 ? (
          <Alert>
            <Video className="h-4 w-4" />
            <AlertDescription>
              No video auto-posts yet. Enable auto-posting to start generating videos automatically.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Video Thumbnail */}
                    <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {log.generatedVideoUrl ? (
                        <video
                          src={log.generatedVideoUrl}
                          className="h-full w-full object-cover"
                          muted
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {log.videoType === 'text-to-video' ? (
                            <Video className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <Film className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Log Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={log.videoType === 'text-to-video' ? 'default' : 'secondary'} className="text-xs">
                              {log.videoType === 'text-to-video' ? 'Text-to-Video' : 'Image-to-Video'}
                            </Badge>
                            {log.characterName && (
                              <Badge variant="outline" className="text-xs">
                                {log.characterName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            log.status === 'success' ? 'default' :
                            log.status === 'failed' ? 'destructive' :
                            log.status === 'video_generated' ? 'default' :
                            log.status === 'instagram_failed' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {log.status === 'success' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {log.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                          {log.status === 'video_generated' && <Video className="mr-1 h-3 w-3" />}
                          {log.status === 'instagram_failed' && <XCircle className="mr-1 h-3 w-3" />}
                          {log.status === 'video_generated' ? 'Video Ready' : 
                           log.status === 'instagram_failed' ? 'Instagram Failed' : 
                           log.status}
                        </Badge>
                      </div>

                      {/* Prompt */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {log.generatedPrompt}
                      </p>

                      {/* Instagram Account */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Posted to: <strong>{log.instagramAccountName}</strong></span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Scheduled: {log.scheduledTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Executed: {new Date(log.executedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Model Info */}
                      {log.model && (
                        <div className="text-xs text-muted-foreground">
                          Model: {log.model}
                        </div>
                      )}

                      {/* Error Message */}
                      {(log.status === 'failed' || log.status === 'instagram_failed') && log.error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">
                            {log.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Video Generated Alert */}
                      {log.status === 'video_generated' && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Video generated successfully but not posted to Instagram yet. Click retry to post now.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Retry Button for video_generated or instagram_failed */}
                      {(log.status === 'video_generated' || log.status === 'instagram_failed') && (
                        <Button
                          onClick={() => handleRetryPost(log)}
                          disabled={retryingId === log.id}
                          size="sm"
                          className="mt-2"
                        >
                          {retryingId === log.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-3 w-3" />
                              Retry Post to Instagram
                            </>
                          )}
                        </Button>
                      )}

                      {/* Instagram Post Link */}
                      {log.instagramPostId && (
                        <a
                          href={`https://www.instagram.com/p/${log.instagramPostId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View on Instagram →
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
