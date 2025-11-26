'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { APIBook } from '@/lib/firebase/services';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { InstagramAccount } from '@/lib/firebase/config/types';

interface InstagramAccountSelectorProps {
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export function InstagramAccountSelector({
  selectedAccountId,
  onSelectAccount,
}: InstagramAccountSelectorProps) {
  const [accounts, setAccounts] = React.useState<InstagramAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const availableAccounts = APIBook.instagram.getAccounts();
        setAccounts(availableAccounts);
        
        // Auto-select first account if none selected
        if (availableAccounts.length > 0 && !selectedAccountId) {
          onSelectAccount(availableAccounts[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch Instagram accounts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Post to Instagram Account</h3>
        <div className="flex items-center gap-2 p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading accounts...</span>
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

  if (accounts.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Post to Instagram Account</h3>
        <div className="p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">No Instagram accounts connected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add accounts in environments.ts configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        Post to Instagram Account {accounts.length > 1 && `(${accounts.length} available)`}
      </h3>
      
      <RadioGroup value={selectedAccountId} onValueChange={onSelectAccount}>
        <div className="space-y-1.5">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem value={account.id} id={account.id} />
              {account.profilePictureUrl ? (
                <img 
                  src={account.profilePictureUrl} 
                  alt={account.username}
                  className="h-7 w-7 rounded-full object-cover"
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
                    <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                      {account.username || account.name}
                      {account.isActive && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {account.username ? `@${account.username}` : `ID: ${account.accountId}`}
                    </p>
                  </div>
                  {selectedAccountId === account.id && (
                    <span className="text-xs font-medium text-primary">Selected</span>
                  )}
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
      
      {accounts.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Select which Instagram account to post to
        </p>
      )}
    </div>
  );
}
