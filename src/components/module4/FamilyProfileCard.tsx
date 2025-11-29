'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Instagram, Edit, Trash2, Calendar, User } from 'lucide-react';
import type { FamilyProfile } from '@/lib/services/module4';
import { FamilyProfileService } from '@/lib/services/module4';

interface FamilyProfileCardProps {
  profile: FamilyProfile;
  onEdit: (profile: FamilyProfile) => void;
  onDelete: (profileId: string) => void;
  onViewSchedules: (profile: FamilyProfile) => void;
}

export function FamilyProfileCard({
  profile,
  onEdit,
  onDelete,
  onViewSchedules,
}: FamilyProfileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${profile.profileName}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await FamilyProfileService.deleteProfile(profile.id);
      onDelete(profile.id);
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete family profile');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      person1: 'Partner 1',
      person2: 'Partner 2',
      child: 'Child',
      mother: 'Mother',
      father: 'Father',
      grandmother: 'Grandmother',
      grandfather: 'Grandfather',
    };
    return roleMap[role] || role;
  };

  const familyContext = FamilyProfileService.buildFamilyContext(profile.members);

  return (
    <Card className={!profile.isActive ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{profile.profileName}</CardTitle>
              <CardDescription className="mt-1">
                {profile.members.length} member{profile.members.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
          <Badge variant={profile.isActive ? 'default' : 'secondary'}>
            {profile.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Family Context Preview */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium text-muted-foreground">Family Context:</p>
          <p className="mt-1 text-sm">
            {familyContext || 'No family members added yet'}
          </p>
        </div>

        {/* Family Members */}
        <div>
          <p className="mb-3 text-sm font-medium">Members:</p>
          <div className="flex flex-wrap gap-3">
            {profile.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.imageUrl} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel(member.role)}
                    {member.age && ` • ${member.age}y`}
                    {member.gender && ` • ${member.gender}`}
                  </span>
                </div>
              </div>
            ))}
            {profile.members.length === 0 && (
              <p className="text-sm text-muted-foreground">No members added</p>
            )}
          </div>
        </div>

        {/* Instagram Account */}
        <div className="flex items-center gap-2 text-sm">
          <Instagram className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Instagram:</span>
          <span className="font-medium">{profile.instagramAccountName}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewSchedules(profile)}
            className="flex-1"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedules
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(profile)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
