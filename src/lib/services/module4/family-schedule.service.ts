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
import type { FamilyAutoPostSchedule, FamilyPromptCategory } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'family_auto_post_schedules';

/**
 * Service for managing family auto-post schedules for Module 4
 */
export class FamilyScheduleService {
  /**
   * Get all schedules for a family profile
   */
  static async getSchedules(
    userId: string,
    familyProfileId: string
  ): Promise<FamilyAutoPostSchedule[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('familyProfileId', '==', familyProfileId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          promptTemplateId: data.promptTemplateId,
          category: data.category,
          frequency: data.frequency,
          time: data.time,
          dayOfWeek: data.dayOfWeek,
          isEnabled: data.isEnabled,
          timezone: data.timezone,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (error) {
      throw new Error('Failed to get family schedules');
    }
  }

  /**
   * Get a single schedule by ID
   */
  static async getSchedule(scheduleId: string): Promise<FamilyAutoPostSchedule | null> {
    try {
      const scheduleRef = doc(db, COLLECTION_NAME, scheduleId);
      const scheduleSnap = await getDoc(scheduleRef);

      if (!scheduleSnap.exists()) {
        return null;
      }

      const data = scheduleSnap.data();
      return {
        id: scheduleSnap.id,
        userId: data.userId,
        familyProfileId: data.familyProfileId,
        promptTemplateId: data.promptTemplateId,
        category: data.category,
        frequency: data.frequency,
        time: data.time,
        dayOfWeek: data.dayOfWeek,
        isEnabled: data.isEnabled,
        timezone: data.timezone,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch (error) {
      throw new Error('Failed to get schedule');
    }
  }

  /**
   * Get all enabled schedules for a user (for cron job processing)
   */
  static async getEnabledSchedules(userId: string): Promise<FamilyAutoPostSchedule[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('isEnabled', '==', true)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          promptTemplateId: data.promptTemplateId,
          category: data.category,
          frequency: data.frequency,
          time: data.time,
          dayOfWeek: data.dayOfWeek,
          isEnabled: data.isEnabled,
          timezone: data.timezone,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (error) {
      throw new Error('Failed to get enabled schedules');
    }
  }

  /**
   * Create a new schedule
   */
  static async createSchedule(
    userId: string,
    familyProfileId: string,
    promptTemplateId: string,
    category: FamilyPromptCategory,
    frequency: 'daily' | 'weekly',
    time: string,
    timezone: string = 'Asia/Kolkata',
    dayOfWeek?: number
  ): Promise<FamilyAutoPostSchedule> {
    try {
      const scheduleRef = doc(collection(db, COLLECTION_NAME));

      const scheduleData = {
        userId,
        familyProfileId,
        promptTemplateId,
        category,
        frequency,
        time,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        isEnabled: true,
        timezone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(scheduleRef, scheduleData);

      return {
        id: scheduleRef.id,
        userId,
        familyProfileId,
        promptTemplateId,
        category,
        frequency,
        time,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        isEnabled: true,
        timezone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error('Failed to create schedule');
    }
  }

  /**
   * Update a schedule
   */
  static async updateSchedule(
    scheduleId: string,
    updates: {
      promptTemplateId?: string;
      category?: FamilyPromptCategory;
      frequency?: 'daily' | 'weekly';
      time?: string;
      dayOfWeek?: number;
      isEnabled?: boolean;
      timezone?: string;
    }
  ): Promise<void> {
    try {
      const scheduleRef = doc(db, COLLECTION_NAME, scheduleId);
      
      await updateDoc(scheduleRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error('Failed to update schedule');
    }
  }

  /**
   * Delete a schedule
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const scheduleRef = doc(db, COLLECTION_NAME, scheduleId);
      await deleteDoc(scheduleRef);
    } catch (error) {
      throw new Error('Failed to delete schedule');
    }
  }

  /**
   * Toggle schedule enabled/disabled
   */
  static async toggleSchedule(scheduleId: string, isEnabled: boolean): Promise<void> {
    try {
      await this.updateSchedule(scheduleId, { isEnabled });
    } catch (error) {
      throw new Error('Failed to toggle schedule');
    }
  }

  /**
   * Check if a schedule should run at the current time
   */
  static shouldRunSchedule(
    schedule: FamilyAutoPostSchedule,
    currentTime: Date
  ): boolean {
    if (!schedule.isEnabled) return false;

    const [hours, minutes] = schedule.time.split(':').map(Number);
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    // Check time match
    if (hours !== currentHours || minutes !== currentMinutes) {
      return false;
    }

    // For weekly schedules, check day of week
    if (schedule.frequency === 'weekly') {
      const currentDayOfWeek = currentTime.getDay();
      return schedule.dayOfWeek === currentDayOfWeek;
    }

    // Daily schedules run every day at the specified time
    return true;
  }
}
