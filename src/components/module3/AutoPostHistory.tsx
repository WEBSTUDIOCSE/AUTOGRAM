'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  Clock,
  Instagram,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import type { AutoPostLog } from '@/lib/firebase/config/types';
import { APIBook } from '@/lib/firebase/services';

interface AutoPostHistoryProps {
  userId: string;
}

export default function AutoPostHistory({ userId }: AutoPostHistoryProps) {
  const [logs, setLogs] = useState<AutoPostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
  });

  useEffect(() => {
    loadHistory();
    loadStatistics();
  }, [userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const userLogs = await APIBook.autoPostLog.getUserLogs(userId, 50);
      setLogs(userLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await APIBook.autoPostLog.getStatistics(userId);
      setStatistics({ total: stats.total });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
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

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold">Post History</CardTitle>
            <CardDescription className="mt-2">
              View all your auto-posted content
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="text-right">
              <div className="text-3xl font-bold">{statistics.total}</div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* History List */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No auto-posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Generated Image */}
                  {log.generatedImageUrl && (
                    <div className="relative w-80 h-80 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-md">
                      <img
                        src={log.generatedImageUrl}
                        alt="Generated post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Post Details */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{formatDate(log.executedAt)}</h3>
                          {log.status === 'success' && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Posted
                            </Badge>
                          )}
                          {log.status === 'failed' && (
                            <Badge variant="destructive">
                              <span className="mr-1">✕</span>
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.characterName || 'No character'} • {log.instagramAccountName || 'No account'}
                        </p>
                        {log.scheduledTime && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Scheduled for: {log.scheduledTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Prompt:</p>
                      <p className="text-sm leading-relaxed">{log.generatedPrompt}</p>
                    </div>

                    {/* Caption */}
                    {log.caption && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Caption:</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{log.caption}</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {log.error && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-semibold text-red-900">⚠️ Error Details:</p>
                            <p className="text-sm text-red-800">{log.error}</p>
                            {log.error.includes('character') && (
                              <p className="text-xs text-red-700 mt-2">
                                💡 Tip: Make sure you have uploaded at least {log.error.match(/\d+/)?.[0] || '3'} characters in the Generate tab.
                              </p>
                            )}
                            {log.error.includes('prompt') && (
                              <p className="text-xs text-red-700 mt-2">
                                💡 Tip: Make sure you have at least one active prompt template. Generate an image first to save a prompt.
                              </p>
                            )}
                            {log.error.includes('Instagram') && (
                              <p className="text-xs text-red-700 mt-2">
                                💡 Tip: Check your Instagram account connection and make sure the account is selected in Settings.
                              </p>
                            )}
                            {log.error.includes('disabled') && (
                              <p className="text-xs text-red-700 mt-2">
                                💡 Tip: Auto-posting was disabled. Enable it in the Settings tab to resume.
                              </p>
                            )}
                            {log.error.includes('API') && (
                              <p className="text-xs text-red-700 mt-2">
                                💡 Tip: This may be a temporary API issue. The system will retry at the next scheduled time.
                              </p>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    {log.instagramPostId && log.status === 'success' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://www.instagram.com/p/${log.instagramPostId}/`,
                            '_blank'
                          );
                        }}
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        View on Instagram
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {logs.length >= 50 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadHistory}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
