'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw, ImageIcon } from "lucide-react";

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
        <CardContent className="p-6 space-y-4">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!imageBase64) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-6">
              <ImageIcon className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No Image Generated</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Select a character and enter a scene description to generate an image
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
          <img
            src={imageBase64}
            alt="Generated character scene"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onDownload}
            disabled={disabled}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={disabled}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
