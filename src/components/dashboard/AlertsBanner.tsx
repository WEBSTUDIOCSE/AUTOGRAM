'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoPostLogService } from '@/lib/services/auto-post-log.service';

interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AlertsBanner({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = async () => {
    try {
      const alertsList: DashboardAlert[] = [];

      // Note: Token expiry checking would require fetching from Instagram API
      // For now, we'll focus on failed posts alerts
      
      // Check for recent failed posts (last 24 hours)
      const logs = await AutoPostLogService.getUserLogs(userId, 20);
      const recentFailures = logs.filter((log) => {
        if (log.status !== 'failed') return false;
        const logTime = new Date(log.executedAt).getTime();
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return logTime > dayAgo;
      });

      if (recentFailures.length > 0) {
        const latestFailure = recentFailures[0];
        alertsList.push({
          id: `post-failed-${latestFailure.id}`,
          type: 'critical',
          title: 'Auto-Post Failed',
          message: `Failed ${getTimeAgo(latestFailure.executedAt)} - ${latestFailure.error || 'Unknown error'}`,
          action: {
            label: 'View Details',
            onClick: () => {
              window.location.href = '/dashboard/auto-poster?tab=history';
            },
          },
        });
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error('Error loading alerts:', error);
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

    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          variant={alert.type === 'critical' ? 'destructive' : 'default'}
          className={alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}
        >
          {alert.type === 'critical' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{alert.message}</span>
            {alert.action && (
              <Button
                size="sm"
                variant={alert.type === 'critical' ? 'destructive' : 'outline'}
                onClick={alert.action.onClick}
                className="ml-4"
              >
                {alert.action.label}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
