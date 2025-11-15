'use client';

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface UploadCharacterButtonProps {
  onClick: () => void;
}

export default function UploadCharacterButton({ onClick }: UploadCharacterButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Card
        className="flex h-[120px] w-[120px] cursor-pointer items-center justify-center border-2 border-dashed transition-all hover:border-primary hover:bg-accent"
        onClick={onClick}
      >
        <Plus className="h-8 w-8 text-muted-foreground" />
      </Card>
      <span className="text-xs font-medium text-center text-muted-foreground">
        Upload New
      </span>
    </div>
  );
}
