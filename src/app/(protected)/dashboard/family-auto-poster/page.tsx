'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FamilyProfileCard } from '@/components/module4/FamilyProfileCard';
import { FamilyProfileForm } from '@/components/module4/FamilyProfileForm';
import { FamilyAutoPostSettings } from '@/components/module4/FamilyAutoPostSettings';
import { FamilyPostHistory } from '@/components/module4/FamilyPostHistory';
import type { FamilyProfile } from '@/lib/services/module4';
import { FamilyProfileService } from '@/lib/services/module4';
import { InstagramService, type InstagramAccount } from '@/lib/services/instagram.service';

export default function FamilyAutoPosterPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyProfile | null>(null);
  const [selectedProfileForSchedule, setSelectedProfileForSchedule] = useState<FamilyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load Instagram accounts with real usernames
      const accounts = InstagramService.getAccounts();
      const accountsWithUsernames = await Promise.all(
        accounts.map(async (account) => {
          try {
            const response = await fetch(
              `https://graph.facebook.com/v18.0/${account.accountId}?fields=username,name&access_token=${account.accessToken}`
            );
            const data = await response.json();
            
            return {
              ...account,
              username: data.username || account.username,
              name: data.name || account.name
            };
          } catch (err) {
            return account;
          }
        })
      );
      
      const [profilesData] = await Promise.all([
        FamilyProfileService.getUserProfiles(user.uid),
      ]);
      
      setProfiles(profilesData);
      setInstagramAccounts(accountsWithUsernames);
    } catch (error) {
      setError('Failed to load family profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    if (instagramAccounts.length === 0) {
      setError('Please add at least one Instagram account first');
      return;
    }
    setEditingProfile(null);
    setShowCreateForm(true);
  };

  const handleEditProfile = (profile: FamilyProfile) => {
    setEditingProfile(profile);
    setShowCreateForm(true);
  };

  const handleFormSuccess = async () => {
    setShowCreateForm(false);
    setEditingProfile(null);
    await loadData();
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = async (profileId: string) => {
    setProfiles(profiles.filter((p) => p.id !== profileId));
  };

  const handleViewSchedules = (profile: FamilyProfile) => {
    setSelectedProfileForSchedule(profile);
  };

  // Show schedule management view
  if (selectedProfileForSchedule) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        <FamilyAutoPostSettings
          profile={selectedProfileForSchedule}
          onBack={() => setSelectedProfileForSchedule(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Family Auto-Poster</h1>
        <p className="text-muted-foreground">
          Create family profiles and schedule automatic posts with your loved ones
        </p>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles">Family Profiles</TabsTrigger>
          <TabsTrigger value="history">Post History</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-6">
          {/* Create Profile Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Family Profiles</h2>
              <p className="text-sm text-muted-foreground">
                Manage your family profiles and auto-posting schedules
              </p>
            </div>
            <Button onClick={handleCreateProfile}>
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && profiles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No family profiles yet</h3>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Create your first family profile to start auto-posting with your loved ones
                </p>
                <Button onClick={handleCreateProfile}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profiles Grid */}
          {!loading && profiles.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <FamilyProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteProfile}
                  onViewSchedules={handleViewSchedules}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {user && <FamilyPostHistory userId={user.uid} />}
        </TabsContent>
      </Tabs>

      {/* Profile Form Modal */}
      <FamilyProfileForm
        isOpen={showCreateForm}
        onClose={handleFormCancel}
        onSuccess={handleFormSuccess}
        profile={editingProfile}
        instagramAccounts={instagramAccounts}
        userId={user?.uid || ''}
      />
    </div>
  );
}
