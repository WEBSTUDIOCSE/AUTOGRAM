'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Character } from "@/lib/firebase/config/types";
import { cn } from "@/lib/utils";

interface CharacterCardProps {
  character: Character;
  isSelected?: boolean;
  onSelect: (character: Character) => void;
  onEdit: (character: Character) => void;
}

export default function CharacterCard({
  character,
  isSelected = false,
  onSelect,
  onEdit,
}: CharacterCardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Card
        className={cn(
          "relative h-[120px] w-[120px] cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/50",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onSelect(character)}
      >
        <img
          src={character.thumbnailUrl}
          alt={character.name}
          className="h-full w-full object-contain"
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute right-1 top-1 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(character);
          }}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </Card>
      <span className="text-xs font-medium text-center truncate w-[120px]">
        {character.name}
      </span>
    </div>
  );
}
