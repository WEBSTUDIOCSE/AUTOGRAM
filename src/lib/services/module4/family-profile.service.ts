import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { FamilyProfile, FamilyMember } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'family_profiles';

/**
 * Service for managing family profiles for Module 4
 */
export class FamilyProfileService {
  /**
   * Generate unique ID for family member
   */
  private static generateMemberId(): string {
    return `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all family profiles for a user
   */
  static async getUserProfiles(userId: string): Promise<FamilyProfile[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          profileName: data.profileName,
          members: data.members || [],
          instagramAccountId: data.instagramAccountId,
          instagramAccountName: data.instagramAccountName,
          postingTimes: data.postingTimes || [],
          isActive: data.isActive,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error getting family profiles:', error);
      throw new Error('Failed to get family profiles');
    }
  }

  /**
   * Get a single family profile by ID
   */
  static async getProfile(profileId: string): Promise<FamilyProfile | null> {
    try {
      const profileRef = doc(db, COLLECTION_NAME, profileId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        return null;
      }

      const data = profileSnap.data();
      return {
        id: profileSnap.id,
        userId: data.userId,
        profileName: data.profileName,
        members: data.members || [],
        instagramAccountId: data.instagramAccountId,
        instagramAccountName: data.instagramAccountName,
        postingTimes: data.postingTimes || [],
        isActive: data.isActive,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch (error) {
      console.error('Error getting family profile:', error);
      throw new Error('Failed to get family profile');
    }
  }

  /**
   * Create a new family profile
   */
  static async createProfile(
    userId: string,
    profileName: string,
    instagramAccountId: string,
    instagramAccountName: string,
    members: Omit<FamilyMember, 'id'>[]
  ): Promise<FamilyProfile> {
    try {
      const profileRef = doc(collection(db, COLLECTION_NAME));
      
      // Add IDs to members and clean undefined fields
      const membersWithIds: FamilyMember[] = members.map(member => {
        const cleanMember: any = {
          id: this.generateMemberId(),
          name: member.name,
          role: member.role,
        };
        if (member.gender) {
          cleanMember.gender = member.gender;
        }
        if (member.age !== undefined && member.age !== null) {
          cleanMember.age = member.age;
        }
        if (member.imageUrl) {
          cleanMember.imageUrl = member.imageUrl;
        }
        if (member.customRole) {
          cleanMember.customRole = member.customRole;
        }
        return cleanMember as FamilyMember;
      });

      const profileData = {
        userId,
        profileName,
        members: membersWithIds,
        instagramAccountId,
        instagramAccountName,
        postingTimes: [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(profileRef, profileData);

      return {
        id: profileRef.id,
        userId,
        profileName,
        members: membersWithIds,
        instagramAccountId,
        instagramAccountName,
        postingTimes: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating family profile:', error);
      throw new Error('Failed to create family profile');
    }
  }

  /**
   * Update a family profile
   */
  static async updateProfile(
    profileId: string,
    updates: {
      profileName?: string;
      members?: FamilyMember[];
      instagramAccountId?: string;
      instagramAccountName?: string;
      postingTimes?: string[];
      isActive?: boolean;
    }
  ): Promise<void> {
    try {
      const profileRef = doc(db, COLLECTION_NAME, profileId);
      
      // Clean undefined fields from updates
      const cleanUpdates: any = { updatedAt: serverTimestamp() };
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      
      await updateDoc(profileRef, cleanUpdates);
    } catch (error) {
      console.error('Error updating family profile:', error);
      throw new Error('Failed to update family profile');
    }
  }

  /**
   * Delete a family profile
   */
  static async deleteProfile(profileId: string): Promise<void> {
    try {
      const profileRef = doc(db, COLLECTION_NAME, profileId);
      await deleteDoc(profileRef);
    } catch (error) {
      console.error('Error deleting family profile:', error);
      throw new Error('Failed to delete family profile');
    }
  }

  /**
   * Add a member to a family profile
   */
  static async addMember(
    profileId: string,
    member: Omit<FamilyMember, 'id'>
  ): Promise<FamilyMember> {
    try {
      const profile = await this.getProfile(profileId);
      if (!profile) {
        throw new Error('Family profile not found');
      }

      const newMember: FamilyMember = {
        ...member,
        id: this.generateMemberId(),
      };

      const updatedMembers = [...profile.members, newMember];
      await this.updateProfile(profileId, { members: updatedMembers });

      return newMember;
    } catch (error) {
      console.error('Error adding family member:', error);
      throw new Error('Failed to add family member');
    }
  }

  /**
   * Remove a member from a family profile
   */
  static async removeMember(profileId: string, memberId: string): Promise<void> {
    try {
      const profile = await this.getProfile(profileId);
      if (!profile) {
        throw new Error('Family profile not found');
      }

      const updatedMembers = profile.members.filter(m => m.id !== memberId);
      await this.updateProfile(profileId, { members: updatedMembers });
    } catch (error) {
      console.error('Error removing family member:', error);
      throw new Error('Failed to remove family member');
    }
  }

  /**
   * Update a member in a family profile
   */
  static async updateMember(
    profileId: string,
    memberId: string,
    updates: Partial<Omit<FamilyMember, 'id'>>
  ): Promise<void> {
    try {
      const profile = await this.getProfile(profileId);
      if (!profile) {
        throw new Error('Family profile not found');
      }

      const updatedMembers = profile.members.map(m =>
        m.id === memberId ? { ...m, ...updates } : m
      );
      await this.updateProfile(profileId, { members: updatedMembers });
    } catch (error) {
      console.error('Error updating family member:', error);
      throw new Error('Failed to update family member');
    }
  }

  /**
   * Build family context string for prompt generation
   * e.g., "Sarah and John with their daughter Emma and grandmother Margaret"
   */
  static buildFamilyContext(members: FamilyMember[]): string {
    if (members.length === 0) return '';

    const couple = members.filter(m => m.role === 'person1' || m.role === 'person2');
    const children = members.filter(m => m.role === 'child');
    const parents = members.filter(m => m.role === 'mother' || m.role === 'father');
    const grandparents = members.filter(m => m.role === 'grandmother' || m.role === 'grandfather');

    const parts: string[] = [];

    // Couple
    if (couple.length === 2) {
      parts.push(`${couple[0].name} and ${couple[1].name}`);
    } else if (couple.length === 1) {
      parts.push(couple[0].name);
    }

    // Children
    if (children.length > 0) {
      const childrenNames = children.map(c => c.name).join(', ');
      const childWord = children.length === 1 ? 'child' : 'children';
      if (parts.length > 0) {
        parts.push(`with their ${childWord} ${childrenNames}`);
      } else {
        parts.push(childrenNames);
      }
    }

    // Parents
    if (parents.length > 0) {
      const parentsNames = parents.map(p => p.name).join(' and ');
      if (parts.length > 0) {
        parts.push(`and ${parentsNames}`);
      } else {
        parts.push(parentsNames);
      }
    }

    // Grandparents
    if (grandparents.length > 0) {
      const grandparentsNames = grandparents.map(g => g.name).join(' and ');
      if (parts.length > 0) {
        parts.push(`and ${grandparentsNames}`);
      } else {
        parts.push(grandparentsNames);
      }
    }

    return parts.join(' ');
  }

  /**
   * Get members by category for different prompt types
   */
  static getMembersByCategory(
    members: FamilyMember[],
    category: 'couple' | 'family' | 'kids'
  ): FamilyMember[] {
    switch (category) {
      case 'couple':
        return members.filter(m => m.role === 'person1' || m.role === 'person2');
      case 'kids':
        return members.filter(m => m.role === 'child');
      case 'family':
        return members; // All members
      default:
        return members;
    }
  }
}
