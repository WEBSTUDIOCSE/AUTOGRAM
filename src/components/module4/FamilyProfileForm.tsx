'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, Upload, User } from 'lucide-react';
import type { FamilyProfile, FamilyMember, InstagramAccount } from '@/lib/firebase/config/types';
import { FamilyProfileService } from '@/lib/services/module4';
import { StorageService } from '@/lib/services/storage.service';

interface FamilyProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile?: FamilyProfile | null;
  instagramAccounts: InstagramAccount[];
  userId: string;
}

type MemberRole = 'person1' | 'person2' | 'child' | 'mother' | 'father' | 'grandmother' | 'grandfather';
type Gender = 'male' | 'female';

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'person1', label: 'Partner 1' },
  { value: 'person2', label: 'Partner 2' },
  { value: 'child', label: 'Child' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
];

interface MemberInput {
  id: string;
  name: string;
  role: MemberRole;
  gender: Gender | '';
  age: string;
  imageUrl: string;
  imageFile?: File;
}

export function FamilyProfileForm({
  isOpen,
  onClose,
  onSuccess,
  profile,
  instagramAccounts,
  userId,
}: FamilyProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [members, setMembers] = useState<MemberInput[]>([]);

  // Initialize form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileName(profile.profileName);
      setSelectedAccountId(profile.instagramAccountId);
      setMembers(
        profile.members.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          gender: m.gender || '',
          age: m.age?.toString() || '',
          imageUrl: m.imageUrl || '',
        }))
      );
    } else {
      resetForm();
    }
  }, [profile]);

  const resetForm = () => {
    setProfileName('');
    setSelectedAccountId('');
    setMembers([]);
  };

  const addMember = () => {
    setMembers([
      ...members,
      {
        id: `temp_${Date.now()}`,
        name: '',
        role: 'person1',
        gender: '',
        age: '',
        imageUrl: '',
      },
    ]);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, field: keyof MemberInput, value: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleImageUpload = async (memberId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        // Upload to Firebase Storage
        const imageUrl = await StorageService.uploadImage(base64Data, userId, 'module4' as any);
        
        // Update member with both imageUrl and imageBase64 (for AI generation)
        setMembers(
          members.map((m) => (m.id === memberId ? { ...m, imageUrl, imageBase64: base64Data, imageFile: file } : m))
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    if (!selectedAccountId) {
      alert('Please select an Instagram account');
      return;
    }

    if (members.length === 0) {
      alert('Please add at least one family member');
      return;
    }

    // Validate members
    const invalidMembers = members.filter((m) => !m.name.trim());
    if (invalidMembers.length > 0) {
      alert('Please fill in all member names');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAccount = instagramAccounts.find((acc) => acc.id === selectedAccountId);
      if (!selectedAccount) {
        throw new Error('Selected Instagram account not found');
      }

      const membersData = members.map((m) => {
        const memberData: any = {
          name: m.name.trim(),
          role: m.role,
        };
        if (m.gender) {
          memberData.gender = m.gender;
        }
        if (m.age && m.age.trim()) {
          memberData.age = parseInt(m.age, 10);
        }
        if (m.imageUrl) {
          memberData.imageUrl = m.imageUrl;
        }
        return memberData;
      });

      if (profile) {
        // Update existing profile
        await FamilyProfileService.updateProfile(profile.id, {
          profileName: profileName.trim(),
          instagramAccountId: selectedAccount.id,
          instagramAccountName: selectedAccount.username || selectedAccount.name,
          members: membersData.map((m, idx) => ({
            ...m,
            id: profile.members[idx]?.id || `member_${Date.now()}_${idx}`,
          })),
        });
        console.log('Family profile updated successfully');
      } else {
        // Create new profile
        await FamilyProfileService.createProfile(
          userId,
          profileName.trim(),
          selectedAccount.id,
          selectedAccount.username || selectedAccount.name,
          membersData
        );
        console.log('Family profile created successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving family profile:', error);
      alert('Failed to save family profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit Family Profile' : 'Create Family Profile'}</DialogTitle>
          <DialogDescription>
            Set up your family profile with members and Instagram account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Name */}
          <div className="space-y-2">
            <Label htmlFor="profileName">Profile Name *</Label>
            <Input
              id="profileName"
              placeholder="e.g., Johnson Family, My Parents"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Instagram Account */}
          <div className="space-y-2">
            <Label htmlFor="instagramAccount">Instagram Account *</Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="instagramAccount">
                <SelectValue placeholder="Select an Instagram account" />
              </SelectTrigger>
              <SelectContent>
                {instagramAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.username || account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Family Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Family Members *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMember}
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="flex gap-3 rounded-lg border p-4"
                >
                  {/* Avatar/Image Upload */}
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <Label
                      htmlFor={`image-${member.id}`}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                      </div>
                    </Label>
                    <Input
                      id={`image-${member.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(member.id, file);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Member Details */}
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Name *</Label>
                        <Input
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Role *</Label>
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateMember(member.id, 'role', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Gender</Label>
                        <Select
                          value={member.gender}
                          onValueChange={(value) => updateMember(member.id, 'gender', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Age</Label>
                        <Input
                          type="number"
                          placeholder="Age"
                          value={member.age}
                          onChange={(e) => updateMember(member.id, 'age', e.target.value)}
                          disabled={isSubmitting}
                          min="0"
                          max="150"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMember(member.id)}
                    disabled={isSubmitting}
                    className="self-start"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {members.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No family members added. Click "Add Member" to start.
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
