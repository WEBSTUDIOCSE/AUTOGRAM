# Unified Auto-Post Architecture

## Overview

This document describes the **Unified Auto-Post Architecture** - a dynamic, module-based system that eliminates code duplication and makes adding new auto-posting modules trivial.

## 🎯 Problems Solved

### Before (Separate Functions)
- ❌ Duplicate code for Module 3 (Character) and Module 4 (Family)
- ❌ Adding new modules required copying entire function structures
- ❌ Bug fixes had to be applied to multiple places
- ❌ Base64 image data was lost (imageUrl saved but not imageBase64)
- ❌ Inconsistent error handling across modules

### After (Unified Architecture)
- ✅ Single scheduler function handles all modules dynamically
- ✅ Adding new modules = adding one entry to MODULES array
- ✅ Bug fixes apply to all modules automatically
- ✅ Images always save both URL and base64 data
- ✅ Consistent error handling and logging across all modules

---

## 🏗️ Architecture Components

### 1. Unified Scheduler (Firebase Functions)

**Location**: `functions/src/index.ts`

**Main Function**: `scheduledUnifiedAutoPost`
- Runs every hour at minute 0 (IST timezone)
- Iterates through all registered modules
- For each module, fetches scheduled items
- Executes auto-post for each scheduled item
- Provides comprehensive logging and error tracking

**Module Registry**: `MODULES` array
```typescript
const MODULES: AutoPostModule[] = [
  {
    moduleId: "module3",
    moduleName: "Character Auto Poster",
    collection: "characters",
    apiEndpoint: "/api/auto-post",
    getScheduledItems: async (currentTime: string) => { ... }
  },
  {
    moduleId: "module4",
    moduleName: "Family Auto Poster",
    collection: "family_profiles",
    apiEndpoint: "/api/family-auto-post",
    getScheduledItems: async (currentTime: string) => { ... }
  }
];
```

### 2. Unified Image Storage Service

**Location**: `src/lib/services/unified/image-storage.service.ts`

**Key Features**:
- Single upload function returns **both** `imageUrl` and `imageBase64`
- Prevents base64 data loss issue
- Handles compression, validation, and metadata extraction
- Works consistently across all modules

**Main Methods**:
```typescript
// Upload single image
await UnifiedImageStorageService.uploadFromFile(file, userId, folder);

// Upload multiple images
await UnifiedImageStorageService.uploadMultipleImages(images, userId, folder);

// Convert file to base64
await UnifiedImageStorageService.fileToBase64(file);
```

### 3. Module Registry Service (Frontend)

**Location**: `src/lib/services/unified/auto-post-module-registry.service.ts`

**Purpose**: Client-side module management
- Find all scheduled items across modules
- Execute auto-post for specific modules
- Consistent API across all auto-posting features

---

## 📝 How to Add a New Module

Adding a new auto-posting module is now incredibly simple:

### Step 1: Add Module to Firebase Functions

**File**: `functions/src/index.ts`

Add entry to `MODULES` array:

```typescript
{
  moduleId: "module5", // Unique module identifier
  moduleName: "New Module Name", // Display name
  collection: "your_firestore_collection", // Firestore collection
  apiEndpoint: "/api/your-endpoint", // API endpoint
  
  getScheduledItems: async (currentTime: string) => {
    const results = [];
    
    // Query your collection for items scheduled at currentTime
    const snapshot = await db.collection("your_collection").get();
    
    snapshot.forEach((doc) => {
      const item = doc.data();
      
      // Check if item is scheduled for this time
      if (item.postingTimes?.includes(currentTime)) {
        results.push({
          userId: item.userId,
          itemId: doc.id,
          displayName: item.name || "Unknown",
          payload: {
            userId: item.userId,
            scheduledTime: currentTime,
            yourItemId: doc.id, // Module-specific data
          },
        });
      }
    });
    
    return results;
  },
}
```

### Step 2: Create API Endpoint

**File**: `src/app/api/your-endpoint/route.ts`

```typescript
export async function POST(req: Request) {
  const { userId, scheduledTime, yourItemId, authToken } = await req.json();
  
  // Validate auth token
  if (authToken !== process.env.AUTO_POST_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Execute your module's logic
  await YourModuleService.executeAutoPost(userId, scheduledTime, yourItemId);
  
  return NextResponse.json({ success: true });
}
```

### Step 3: Use Unified Image Storage (Optional)

If your module uses images:

```typescript
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';

// Upload image with base64
const result = await UnifiedImageStorageService.uploadFromFile(
  file,
  userId,
  'your_folder'
);

// Save both URL and base64 to Firestore
await updateDoc(docRef, {
  imageUrl: result.imageUrl,
  imageBase64: result.imageBase64, // This is critical!
});
```

**That's it!** Your new module is now integrated into the unified scheduler.

---

## 🔄 Migration from Legacy

### Legacy Functions (Deprecated)

The old separate functions are kept for backward compatibility:
- `scheduledAutoPost` (Module 3) → Legacy
- `scheduledFamilyAutoPost` (Module 4) → Legacy
- `triggerAutoPost` → Legacy

**Location**: `functions/src/legacy/`

These will be removed in a future update once the unified scheduler is fully tested.

### Migration Checklist

✅ **Completed**:
- [x] Created unified scheduler
- [x] Created unified image storage service
- [x] Moved legacy functions to separate files
- [x] Updated Firebase functions index.ts
- [x] Created helper services for image upload

⏳ **Optional** (Can be done gradually):
- [ ] Update character form to use unified image helper
- [ ] Update family profile form to use unified image helper
- [ ] Remove legacy functions after 1-2 weeks of testing
- [ ] Add Module 5 (if planned)

---

## 🧪 Testing

### Test Unified Scheduler

**Manual Trigger Endpoint**:
```
POST /triggerUnifiedAutoPost?moduleId=module3&userId=USER_ID
POST /triggerUnifiedAutoPost?moduleId=module4&userId=USER_ID
```

### Test Image Upload

```typescript
import { uploadCharacterImage } from '@/lib/services/image-upload.helper';

// Upload with validation
const result = await uploadCharacterImage(file, userId, 'characters');

// Verify both fields are present
console.log(result.imageUrl); // Firebase Storage URL
console.log(result.imageBase64); // Base64 data for AI
```

---

## 📊 Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Code Duplication** | High (2 separate functions) | None (1 unified function) |
| **Adding New Module** | ~200 lines of code | ~20 lines of code |
| **Bug Fixes** | Apply to 2+ places | Apply once |
| **Image Storage** | Lost base64 data | Always save both formats |
| **Error Tracking** | Separate collections | Unified error log |
| **Maintenance** | Difficult | Easy |
| **Consistency** | Manual | Automatic |

---

## 🚀 Deployment

### Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions:scheduledUnifiedAutoPost
```

### Deploy Vercel (if API changes made)

```bash
git add .
git commit -m "Add unified auto-post architecture"
git push origin main
# Vercel auto-deploys
```

---

## 📖 Code Examples

### Example 1: Check Current Modules

```typescript
import { AutoPostModuleRegistry } from '@/lib/services/unified';

// Get all registered modules
const modules = AutoPostModuleRegistry.getModules();
console.log(modules); // [module3, module4]

// Get specific module
const module = AutoPostModuleRegistry.getModule('module3');
```

### Example 2: Execute Auto-Post Programmatically

```typescript
const module = AutoPostModuleRegistry.getModule('module4');
const result = await AutoPostModuleRegistry.executeAutoPost(
  module,
  {
    userId: 'user123',
    profileId: 'profile456',
    scheduledTime: '14:00',
  },
  'auth-token',
  'https://autogram-orpin.vercel.app'
);

if (result.success) {
  console.log('✅ Post created successfully');
} else {
  console.error('❌ Failed:', result.error);
}
```

### Example 3: Upload Images with Base64 Preservation

```typescript
import { uploadCharacterImage } from '@/lib/services/unified';

// Upload character image
const result = await uploadCharacterImage(file, userId, 'characters');

// Save to Firestore (both fields!)
await addDoc(collection(db, 'characters'), {
  name: 'Character Name',
  imageUrl: result.imageUrl, // For display
  imageBase64: result.imageBase64, // For AI generation
  userId,
  createdAt: Timestamp.now(),
});
```

---

## 🔒 Security Notes

- Auth token validation happens in each API endpoint
- Firebase Admin SDK runs with elevated permissions (server-side only)
- Client-side services use Firebase Auth context
- Image uploads restricted to authenticated users
- Rate limiting recommended for production

---

## 📝 Future Enhancements

1. **Dynamic Module Registration**: Allow modules to self-register at runtime
2. **Module Configuration UI**: Admin panel to enable/disable modules
3. **Advanced Scheduling**: Support cron expressions per module
4. **Webhook Support**: Trigger auto-posts from external services
5. **Analytics Dashboard**: Unified view of all module statistics

---

## 🤝 Contributing

When adding features to the unified architecture:

1. Keep module-specific logic in module files
2. Keep shared logic in unified services
3. Update this documentation
4. Add comprehensive logging
5. Test with multiple modules

---

## 📞 Support

For issues or questions:
- Check Firebase Functions logs: `firebase functions:log`
- Check Vercel deployment logs
- Review Firestore `unified_auto_post_errors` collection
- Check browser console for client-side errors

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
