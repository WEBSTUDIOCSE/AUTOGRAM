'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockInstagramAccounts } from '@/lib/mock-data/module1';

interface InstagramAccountSelectorProps {
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export function InstagramAccountSelector({
  selectedAccountId,
  onSelectAccount,
}: InstagramAccountSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Post to Instagram Account</h3>
      
      <RadioGroup value={selectedAccountId} onValueChange={onSelectAccount}>
        <div className="space-y-1.5">
          {mockInstagramAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem value={account.id} id={account.id} />
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {account.username.slice(1, 3).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor={account.id}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium leading-none">{account.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.followers}
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
