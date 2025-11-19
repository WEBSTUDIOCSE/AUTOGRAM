'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Character } from "@/lib/firebase/config/types";
import CharacterCard from "./CharacterCard";
import UploadCharacterButton from "./UploadCharacterButton";

interface CharacterCarouselProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
  onEditCharacter: (character: Character) => void;
  onUploadClick: () => void;
}

export default function CharacterCarousel({
  characters,
  selectedCharacter,
  onSelectCharacter,
  onEditCharacter,
  onUploadClick,
}: CharacterCarouselProps) {
  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-semibold">Select Character Model</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          <UploadCharacterButton onClick={onUploadClick} />
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isSelected={selectedCharacter?.id === character.id}
              onSelect={onSelectCharacter}
              onEdit={onEditCharacter}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
