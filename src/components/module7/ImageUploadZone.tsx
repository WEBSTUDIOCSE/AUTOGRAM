'use client';

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ImageUploadZoneProps {
  selectedImage: File | null;
  preview: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

export default function ImageUploadZone({
  selectedImage,
  preview,
  onImageSelect,
  onImageRemove,
  disabled = false,
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !selectedImage) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Source Image</Label>
      <Card>
        <CardContent className="p-6">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Selected"
                className="w-full h-auto rounded-lg max-h-[400px] object-contain"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={onImageRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary"
              onClick={handleClick}
            >
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="rounded-full bg-muted p-4">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP up to 10MB
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={disabled}>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled}
          />
        </CardContent>
      </Card>
      {selectedImage && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
    </div>
  );
}
