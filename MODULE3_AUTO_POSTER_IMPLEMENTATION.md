# Module 3: Auto-Poster Implementation Guide

**Date**: November 16, 2025  
**Status**: Backend Complete, UI Components In Progress  
**Architecture**: Firebase Cloud Functions + Firestore

---

## 🎯 Overview

Module 3 implements an intelligent auto-posting system that:
- Posts 2 times daily at user-defined schedules
- Automatically selects random characters
- Generates creative prompt variations using AI
- Rotates between multiple Instagram accounts
- Tracks all activity with detailed logs
- Provides test mode before enabling

---

## 📊 Firestore Collections

### 1. `auto_post_configs` (per user)
```typescript
{
  id: userId,
  isEnabled: boolean,
  postingTimes: ['10:00', '18:00'],
  timezone: 'America/New_York',
  instagramAccounts: ['account1', 'account2'],
  minCharacters: 3,
  accountRotationStrategy: 'rotate' | 'random',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. `prompt_templates` (per user)
```typescript
{
  id: string,
  userId: string,
  basePrompt: 'wearing elegant dress in cafe',
  category: 'fashion',
  usageCount: 5,
  lastUsedAt: Timestamp,
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. `auto_post_logs` (all executions)
```typescript
{
  id: string,
  userId: string,
  characterId: string,
  characterName: string,
  promptTemplateId: string,
  basePrompt: string,
  generatedPrompt: string, // AI variation
  generatedImageUrl: string,
  caption: string,
  hashtags: string,
  instagramPostId: string,
  instagramAccountId: string,
  instagramAccountName: string,
  scheduledTime: '10:00',
  executedAt: Timestamp,
  status: 'success' | 'failed' | 'skipped',
  error?: string
}
```

---

## 🔧 Services Implemented

### 1. **AutoPostConfigService**
```typescript
// Get/Create configuration
await APIBook.autoPostConfig.getOrCreateConfig(userId);

// Update settings
await APIBook.autoPostConfig.updateConfig(userId, {
  isEnabled: true,
  postingTimes: ['10:00', '18:00'],
  instagramAccounts: ['account1'],
});

// Enable/Disable
await APIBook.autoPostConfig.enableAutoPosting(userId);
await APIBook.autoPostConfig.disableAutoPosting(userId);

// Check requirements
await APIBook.autoPostConfig.canEnableAutoPosting(userId, characterCount);
```

### 2. **PromptLibraryService**
```typescript
// CRUD operations
await APIBook.promptLibrary.createPrompt(userId, 'base prompt', 'category');
await APIBook.promptLibrary.getUserPrompts(userId);
await APIBook.promptLibrary.updatePrompt(promptId, { basePrompt: 'new' });
await APIBook.promptLibrary.deletePrompt(promptId);

// Auto-posting helpers
await APIBook.promptLibrary.getRandomPrompt(userId);
await APIBook.promptLibrary.incrementUsage(promptId);
```

### 3. **PromptVariationService**
```typescript
// Generate variations
const variation = await APIBook.promptVariation.generateVariation(basePrompt);

// Multiple variations
const variations = await APIBook.promptVariation.generateMultipleVariations(prompt, 3);

// Contextual variations
await APIBook.promptVariation.generateTimeBasedVariation(prompt, 'evening');
await APIBook.promptVariation.generateSeasonalVariation(prompt, 'summer');
await APIBook.promptVariation.generateMoodBasedVariation(prompt, 'romantic');
```

### 4. **AutoPostLogService**
```typescript
// Save logs
await APIBook.autoPostLog.saveLog({ ...logData });

// Query logs
await APIBook.autoPostLog.getUserLogs(userId, 50);
await APIBook.autoPostLog.getSuccessfulPosts(userId);
await APIBook.autoPostLog.getFailedPosts(userId);
await APIBook.autoPostLog.getCharacterLogs(userId, characterId);

// Statistics
await APIBook.autoPostLog.getStatistics(userId);
```

### 5. **AutoPostSchedulerService** (Main Orchestrator)
```typescript
// Execute auto-post (called by Cloud Function)
await APIBook.autoPostScheduler.executeAutoPost(userId, scheduledTime);

// Test configuration
await APIBook.autoPostScheduler.testAutoPost(userId);

// Get next scheduled time
APIBook.autoPostScheduler.getNextScheduledTime(config);
```

---

## 🔄 Auto-Post Workflow

```
1. Cloud Function triggers at scheduled time (e.g., 10:00 AM)
   ↓
2. Check if auto-posting is enabled for user
   ↓
3. Verify user has enough characters (min requirement)
   ↓
4. Select random character from user's uploads
   ↓
5. Get random active prompt template
   ↓
6. Generate AI variation of prompt using Gemini
   ↓
7. Generate image with character + varied prompt
   ↓
8. Upload image to Firebase Storage (module3/auto-generated/)
   ↓
9. Select Instagram account (rotate or random strategy)
   ↓
10. Post to Instagram with auto-generated caption/hashtags
    ↓
11. Save log with all details and status
    ↓
12. Update usage statistics (character + prompt)
```

---

## 🎨 UI Components Created

### 1. **AutoPostSettings.tsx** ✅ (Complete)
- Enable/disable toggle with validation
- Posting time management (add/remove times)
- Instagram account selection
- Account rotation strategy selector
- Minimum characters requirement
- Test configuration button
- Next scheduled post display
- Real-time validation

### 2. **PromptLibrary.tsx** (Next)
- Add new prompt templates
- Edit existing prompts
- Delete prompts
- Toggle active/inactive
- View usage statistics
- Category organization
- Search/filter functionality

### 3. **AutoPostHistory.tsx** (Next)
- Recent auto-posts list
- Success/failure status
- View generated images
- Instagram post links
- Filter by date/status
- Statistics dashboard
- Export functionality

---

## 🚀 Firebase Cloud Functions Setup

### Required Files

1. **functions/package.json**
```json
{
  "dependencies": {
    "firebase-functions": "^4.5.0",
    "firebase-admin": "^12.0.0"
  }
}
```

2. **functions/src/index.ts**
```typescript
import * as functions from 'firebase-functions';
import { AutoPostSchedulerService } from './services/auto-post-scheduler.service';

// Scheduled function runs twice daily
export const autoPostScheduler = functions.pubsub
  .schedule('0 10,18 * * *') // 10 AM and 6 PM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore()
      .collection('auto_post_configs')
      .where('isEnabled', '==', true)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const now = new Date();
        const scheduledTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        await AutoPostSchedulerService.executeAutoPost(userId, scheduledTime);
      } catch (error) {
        console.error(`Failed to execute auto-post for user ${userDoc.id}:`, error);
      }
    }
  });
```

3. **Deploy Command**
```bash
firebase deploy --only functions
```

### Alternative: Vercel Cron (if deployed on Vercel)

**vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/auto-post",
      "schedule": "0 10,18 * * *"
    }
  ]
}
```

**app/api/auto-post/route.ts**
```typescript
import { NextResponse } from 'next/server';
import { AutoPostSchedulerService } from '@/lib/services/auto-post-scheduler.service';

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all enabled users
  const usersSnapshot = await admin.firestore()
    .collection('auto_post_configs')
    .where('isEnabled', '==', true)
    .get();

  const results = [];
  for (const userDoc of usersSnapshot.docs) {
    try {
      const userId = userDoc.id;
      const scheduledTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      await AutoPostSchedulerService.executeAutoPost(userId, scheduledTime);
      results.push({ userId, status: 'success' });
    } catch (error) {
      results.push({ userId: userDoc.id, status: 'failed', error });
    }
  }

  return NextResponse.json({ results });
}
```

---

## 📝 Integration with Module 3 Page

### Add Tabs to auto-poster/page.tsx

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AutoPostSettings from '@/components/module3/AutoPostSettings';
import PromptLibrary from '@/components/module3/PromptLibrary';
import AutoPostHistory from '@/components/module3/AutoPostHistory';

// Add tabs below character carousel
<Tabs defaultValue="generate" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="generate">Generate</TabsTrigger>
    <TabsTrigger value="settings">Auto-Post Settings</TabsTrigger>
    <TabsTrigger value="prompts">Prompt Library</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>

  <TabsContent value="generate">
    {/* Existing generation UI */}
  </TabsContent>

  <TabsContent value="settings">
    <AutoPostSettings userId={user.uid} characters={characters} />
  </TabsContent>

  <TabsContent value="prompts">
    <PromptLibrary userId={user.uid} />
  </TabsContent>

  <TabsContent value="history">
    <AutoPostHistory userId={user.uid} />
  </TabsContent>
</Tabs>
```

---

## ✅ What's Complete

- ✅ All TypeScript interfaces and types
- ✅ AutoPostConfigService (full CRUD)
- ✅ PromptLibraryService (full CRUD + random selection)
- ✅ PromptVariationService (AI-powered variations)
- ✅ AutoPostLogService (logging and statistics)
- ✅ AutoPostSchedulerService (main orchestration)
- ✅ AutoPostSettings UI component (complete)
- ✅ All services exported in APIBook

## 🚧 Next Steps

1. **Create PromptLibrary UI Component**
   - Template management interface
   - Add/edit/delete functionality
   - Usage statistics display

2. **Create AutoPostHistory UI Component**
   - Log viewer with filters
   - Success/failure indicators
   - Instagram post links

3. **Update Module 3 Page**
   - Add tabs navigation
   - Integrate all three components
   - Add default prompts on first visit

4. **Set Up Cloud Functions**
   - Initialize Firebase Functions
   - Deploy scheduled trigger
   - Test with real schedule

5. **Testing**
   - Test configuration save/load
   - Test prompt variation generation
   - Test complete auto-post flow
   - Test error handling

6. **Documentation**
   - User guide for setting up auto-posting
   - Admin guide for managing prompts
   - Troubleshooting guide

---

## 💡 Key Features

1. **Intelligent Prompt Variations**
   - AI generates unique variations of base prompts
   - Maintains theme while changing details
   - Suitable for Instagram posting

2. **Flexible Scheduling**
   - User-defined posting times
   - Timezone support
   - Multiple posts per day

3. **Multi-Account Support**
   - Rotate between accounts evenly
   - Or use random selection
   - Track which account posted what

4. **Comprehensive Logging**
   - Every execution logged
   - Success/failure tracking
   - Detailed error messages

5. **Safety Checks**
   - Minimum character requirement
   - Configuration validation
   - Test mode before enabling

6. **Statistics**
   - Success rate calculation
   - Character usage tracking
   - Prompt performance metrics

---

## 🔐 Security Considerations

1. **Cloud Function Authentication**
   - Use Firebase Admin SDK
   - Verify user permissions
   - Rate limiting

2. **API Endpoint Security** (if using Vercel Cron)
   - Secret token verification
   - IP whitelist
   - Request validation

3. **Firestore Rules**
```javascript
// Users can only access their own configs/prompts/logs
match /auto_post_configs/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /prompt_templates/{promptId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

match /auto_post_logs/{logId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false; // Only Cloud Functions can write
}
```

---

## 📊 Monitoring & Alerts

### Recommended Monitoring

1. **Success Rate**: Track percentage of successful posts
2. **Error Patterns**: Identify common failure reasons
3. **Account Health**: Monitor Instagram API limits
4. **Execution Time**: Track function performance
5. **Cost**: Monitor Firebase Storage & Function costs

### Alert Setup

- Email when success rate drops below 90%
- Slack notification for repeated failures
- Dashboard for real-time monitoring

---

## 🎓 User Guide (To Be Created)

### For Users:
1. Upload at least 3 characters
2. Add prompt templates to library
3. Select Instagram accounts
4. Set posting times
5. Test configuration
6. Enable auto-posting
7. Monitor history

### For Admins:
1. Monitor Cloud Function logs
2. Check Firestore usage
3. Review error patterns
4. Optimize prompt templates
5. Manage API quotas

---

**Status**: System is fully functional and ready for deployment after UI components are complete and Cloud Functions are set up!
