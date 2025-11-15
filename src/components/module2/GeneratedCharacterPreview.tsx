'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GeneratedCharacterPreviewProps {
  imageBase64: string | null;
  isLoading: boolean;
  onDownload: () => void;
  onRegenerate: () => void;
  disabled?: boolean;
}

export default function GeneratedCharacterPreview({
  imageBase64,
  isLoading,
  onDownload,
  onRegenerate,
  disabled = false,
}: GeneratedCharacterPreviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!imageBase64) {
    return (
      <Card>
        <CardContent className="flex aspect-square items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            Generated image will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-md">
            <img
              src={imageBase64}
              alt="Generated character"
              className="h-auto w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onDownload}
              disabled={disabled}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onRegenerate}
              disabled={disabled}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
