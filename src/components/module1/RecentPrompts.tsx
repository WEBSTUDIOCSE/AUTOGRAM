'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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
import { InstagramPostService } from '@/lib/services/post-history.service';
import { useAuth } from '@/contexts/AuthContext';

interface RecentPromptsProps {
  onSelectPrompt?: (prompt: string) => void;
  onClearAll?: () => void;
}

interface PromptItem {
  id: string;
  text: string;
  timestamp: string;
}

export function RecentPrompts({ onSelectPrompt, onClearAll }: RecentPromptsProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [prompts, setPrompts] = React.useState<PromptItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Fetch recent prompts from Firestore
  React.useEffect(() => {
    const fetchPrompts = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const recentPrompts = await InstagramPostService.getRecentPrompts(user.uid, 10);
        
        // Transform to PromptItem format
        const items: PromptItem[] = recentPrompts.map((p, index) => ({
          id: `prompt-${index}`,
          text: p.prompt,
          timestamp: p.timestamp
        }));
        
        setPrompts(items);
      } catch (error) {
        console.error('Error fetching recent prompts:', error);
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [user?.uid]);

  const selectedPrompt = prompts.find((p) => p.id === value);

  const handleSelect = (currentValue: string) => {
    setValue(currentValue === value ? '' : currentValue);
    setOpen(false);
    
    const selected = prompts.find((p) => p.id === currentValue);
    if (selected && onSelectPrompt) {
      onSelectPrompt(selected.text);
    }
  };

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Prompts</h3>
        {onClearAll && prompts.length > 0 && (
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
            className="w-full justify-between font-normal overflow-hidden"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                <span className="truncate">Loading prompts...</span>
              </>
            ) : (
              <>
                <span className="truncate flex-1 text-left min-w-0">
                  {selectedPrompt
                    ? selectedPrompt.text
                    : 'Select a recent prompt or create new...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0" 
          align="start"
          style={{ width: buttonRef.current?.offsetWidth }}
        >
          <Command>
            <CommandInput placeholder="Search prompts..." />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>No recent prompts found.</CommandEmpty>
              <CommandGroup>
                {prompts.map((prompt) => (
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
