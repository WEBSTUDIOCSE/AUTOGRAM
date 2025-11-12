'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { APIBook } from '@/lib/firebase/services';
import { Loader2 } from 'lucide-react';
import type { InstagramAccount } from '@/lib/services/instagram.service';

interface InstagramAccountSelectorProps {
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export function InstagramAccountSelector({
  selectedAccountId,
  onSelectAccount,
}: InstagramAccountSelectorProps) {
  const [account, setAccount] = React.useState<InstagramAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        const accountInfo = await APIBook.instagram.getAccountInfo();
        setAccount(accountInfo);
        // Auto-select this account
        onSelectAccount(accountInfo.id);
      } catch (err) {
        console.error('Failed to fetch Instagram account:', err);
        setError(err instanceof Error ? err.message : 'Failed to load account');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Post to Instagram Account</h3>
        <div className="flex items-center gap-2 p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading account...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Post to Instagram Account</h3>
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-sm text-red-600">❌ {error}</p>
          <p className="text-xs text-red-500 mt-1">Check your Instagram connection settings</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Post to Instagram Account</h3>
        <div className="p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">No Instagram account connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Post to Instagram Account</h3>
      
      <RadioGroup value={selectedAccountId} onValueChange={onSelectAccount}>
        <div className="space-y-1.5">
          <div
            className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent/50 transition-colors"
          >
            <RadioGroupItem value={account.id} id={account.id} />
            {account.profile_picture_url ? (
              <img 
                src={account.profile_picture_url} 
                alt={account.username}
                className="h-7 w-7 rounded-full"
              />
            ) : (
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {account.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <Label
              htmlFor={account.id}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">@{account.username}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {account.id}
                  </p>
                </div>
              </div>
            </Label>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
