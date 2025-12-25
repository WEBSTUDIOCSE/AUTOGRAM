'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Play } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ImageToVideoPreviewProps {
  videoUrl: string | null;
  onDownload: () => void;
  onRegenerate: () => void;
  isGenerating?: boolean;
}

export default function ImageToVideoPreview({
  videoUrl,
  onDownload,
  onRegenerate,
  isGenerating = false,
}: ImageToVideoPreviewProps) {
  if (!videoUrl) {
    return (
      <div className="space-y-2">
        <Label>Video Preview</Label>
        <Card>
          <CardContent className="p-6">
            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="rounded-full bg-muted p-4">
                  <Play className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">No video generated yet</p>
                <p className="text-xs text-center max-w-xs">
                  Upload an image and configure settings, then click Generate to create your video
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Generated Video</Label>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '500px' }}
            >
              Your browser does not support the video tag.
            </video>

            <div className="flex gap-2">
              <Button
                onClick={onDownload}
                className="flex-1"
                variant="default"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
              <Button
                onClick={onRegenerate}
                variant="outline"
                className="flex-1"
                disabled={isGenerating}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
