'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { mockRecentPrompts } from '@/lib/mock-data/module1';

interface RecentPromptsProps {
  onSelectPrompt?: (prompt: string) => void;
  onClearAll?: () => void;
}

export function RecentPrompts({ onSelectPrompt, onClearAll }: RecentPromptsProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const selectedPrompt = mockRecentPrompts.find((p) => p.id === value);

  const handleSelect = (currentValue: string) => {
    setValue(currentValue === value ? '' : currentValue);
    setOpen(false);
    
    const selected = mockRecentPrompts.find((p) => p.id === currentValue);
    if (selected && onSelectPrompt) {
      onSelectPrompt(selected.text);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Prompts</h3>
        {onClearAll && mockRecentPrompts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selectedPrompt
                ? selectedPrompt.text
                : 'Select a recent prompt or create new...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0" 
          align="start"
          style={{ width: buttonRef.current?.offsetWidth }}
        >
          <Command>
            <CommandInput placeholder="Search prompts..." />
            <CommandList>
              <CommandEmpty>No recent prompts found.</CommandEmpty>
              <CommandGroup>
                {mockRecentPrompts.map((prompt) => (
                  <CommandItem
                    key={prompt.id}
                    value={prompt.id}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === prompt.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm">{prompt.text}</p>
                      <p className="text-xs text-muted-foreground">{prompt.timestamp}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
