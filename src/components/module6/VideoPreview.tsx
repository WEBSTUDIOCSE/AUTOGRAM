'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Loader2, Video } from "lucide-react";

interface VideoPreviewProps {
  videoUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
  onRegenerate: () => void;
  disabled?: boolean;
}

export default function VideoPreview({
  videoUrl,
  isLoading,
  onDownload,
  onRegenerate,
  disabled = false,
}: VideoPreviewProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Generated Video
          </h3>

          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Generating video... This may take 1-3 minutes
                </p>
              </div>
            ) : videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                autoPlay
                loop
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="text-center text-muted-foreground">
                <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p>Your generated video will appear here</p>
              </div>
            )}
          </div>

          {videoUrl && !isLoading && (
            <div className="flex gap-2">
              <Button
                onClick={onDownload}
                variant="outline"
                className="flex-1"
                disabled={disabled}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={onRegenerate}
                variant="outline"
                className="flex-1"
                disabled={disabled}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
