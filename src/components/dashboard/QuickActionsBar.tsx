'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImagePlus, Upload, Settings } from 'lucide-react';
import Link from 'next/link';

export function QuickActionsBar() {
  const actions = [
    {
      label: 'Generate Image',
      icon: ImagePlus,
      href: '/dashboard/generator',
      variant: 'default' as const,
    },
    {
      label: 'Upload Character',
      icon: Upload,
      href: '/dashboard/character-generator',
      variant: 'default' as const,
    },
    {
      label: 'Auto-Post Settings',
      icon: Settings,
      href: '/dashboard/auto-poster',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button variant={action.variant} className="w-full h-auto flex-col py-4 gap-2">
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
