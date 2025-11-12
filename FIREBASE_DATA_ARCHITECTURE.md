# Firebase Data Architecture - Autogram

## 📊 Firestore Collections Structure

### 1. **users** Collection
Stores user profile and settings

```typescript
users/{userId}
{
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences: {
    defaultAspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
    defaultStyle: string;
    autoSaveToHistory: boolean;
  };
  stats: {
    totalImagesGenerated: number;
    totalPostsMade: number;
    creditsUsed: number;
  };
}
```

---

### 2. **generated_images** Collection
Stores all AI-generated images (whether posted or not)

```typescript
generated_images/{imageId}
{
  id: string;
  userId: string;
  prompt: string;
  enhancedPrompt: string; // The AI-enhanced version
  imageUrl: string; // Firebase Storage URL
  thumbnailUrl?: string; // Smaller version for lists
  model: string; // "gemini-2.5-flash-image"
  settings: {
    aspectRatio: string;
    style?: string;
    seed?: number;
  };
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: "png" | "jpg" | "webp";
  };
  status: "generated" | "saved" | "posted" | "deleted";
  isFavorite: boolean;
  tags: string[];
  collection?: string; // Collection/folder name
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- userId + createdAt (desc)
- userId + status
- userId + isFavorite
- userId + tags (array-contains)

---

### 3. **instagram_posts** Collection
Stores Instagram posting history and details

```typescript
instagram_posts/{postId}
{
  id: string;
  userId: string;
  imageId: string; // Reference to generated_images
  instagramPostId: string; // Instagram's post ID
  instagramAccountId: string;
  instagramUsername: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  status: "pending" | "posted" | "failed" | "deleted";
  error?: string; // If status is failed
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    lastUpdated?: Timestamp;
  };
  scheduledFor?: Timestamp; // For future scheduling
  postedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- userId + createdAt (desc)
- userId + status
- userId + instagramAccountId
- instagramPostId (unique)

---

### 4. **instagram_accounts** Collection
Stores connected Instagram accounts

```typescript
instagram_accounts/{accountId}
{
  id: string; // Instagram Business Account ID
  userId: string;
  username: string;
  profilePictureUrl?: string;
  accessToken: string; // Encrypted
  tokenExpiresAt: Timestamp;
  isActive: boolean;
  isPrimary: boolean; // Default account
  accountType: "business" | "creator";
  followers?: number;
  following?: number;
  postsCount?: number;
  lastSyncedAt?: Timestamp;
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- userId + isActive
- userId + isPrimary

---

### 5. **prompts_history** Collection
Stores user's prompt history for quick reuse

```typescript
prompts_history/{promptId}
{
  id: string;
  userId: string;
  prompt: string;
  category?: string; // "social", "quotes", "creative", etc.
  useCount: number;
  lastUsedAt: Timestamp;
  createdAt: Timestamp;
}
```

**Indexes:**
- userId + lastUsedAt (desc)
- userId + useCount (desc)

---

### 6. **collections** Collection
User-created folders/collections for organizing images

```typescript
collections/{collectionId}
{
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  imageCount: number;
  isDefault: boolean; // "All Images" collection
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- userId + createdAt (desc)

---

### 7. **activity_log** Collection
Tracks user actions for analytics

```typescript
activity_log/{activityId}
{
  id: string;
  userId: string;
  action: "image_generated" | "image_posted" | "image_downloaded" | "image_deleted" | "prompt_used";
  entityType: "image" | "post" | "prompt";
  entityId: string;
  metadata?: any;
  createdAt: Timestamp;
}
```

**Indexes:**
- userId + createdAt (desc)
- userId + action

---

## 🗂️ Firebase Storage Structure

```
/users/{userId}/
  /generated-images/
    /{timestamp}-{imageId}.png
    /{timestamp}-{imageId}-thumb.png
  /uploads/
    /{filename}
```

---

## 🔄 Data Flow & Operations

### **Module 1: Image Generation**

#### 1. Generate Image
```typescript
async function generateAndSaveImage(userId, prompt, settings) {
  // Step 1: Generate image with Gemini
  const aiResponse = await APIBook.ai.generateImage(prompt);
  
  // Step 2: Upload to Firebase Storage
  const imageUrl = await uploadToStorage(aiResponse.imageBase64, userId);
  
  // Step 3: Save to generated_images collection
  const imageDoc = await db.collection('generated_images').add({
    userId,
    prompt,
    enhancedPrompt: aiResponse.enhancedPrompt,
    imageUrl,
    model: "gemini-2.5-flash-image",
    settings,
    metadata: {
      width: 1024,
      height: 1024,
      fileSize: calculateSize(aiResponse.imageBase64),
      format: "png"
    },
    status: "generated",
    isFavorite: false,
    tags: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  // Step 4: Update user stats
  await db.collection('users').doc(userId).update({
    'stats.totalImagesGenerated': FieldValue.increment(1)
  });
  
  // Step 5: Save prompt to history
  await savePromptToHistory(userId, prompt);
  
  return imageDoc.id;
}
```

#### 2. Keep Image (Save to Collection)
```typescript
async function keepImage(imageId, collectionName?) {
  await db.collection('generated_images').doc(imageId).update({
    status: "saved",
    collection: collectionName || "default",
    updatedAt: Timestamp.now()
  });
}
```

#### 3. Post to Instagram
```typescript
async function postToInstagram(imageId, caption, hashtags, accountId) {
  // Step 1: Get image data
  const imageDoc = await db.collection('generated_images').doc(imageId).get();
  const imageData = imageDoc.data();
  
  // Step 2: Post to Instagram
  const instagramPostId = await APIBook.instagram.postImage(
    imageData.imageUrl, 
    `${caption}\n\n${hashtags.join(' ')}`
  );
  
  // Step 3: Save to instagram_posts collection
  await db.collection('instagram_posts').add({
    userId: imageData.userId,
    imageId,
    instagramPostId,
    instagramAccountId: accountId,
    caption,
    hashtags,
    imageUrl: imageData.imageUrl,
    status: "posted",
    postedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  // Step 4: Update image status
  await db.collection('generated_images').doc(imageId).update({
    status: "posted",
    updatedAt: Timestamp.now()
  });
  
  // Step 5: Update user stats
  await db.collection('users').doc(imageData.userId).update({
    'stats.totalPostsMade': FieldValue.increment(1)
  });
}
```

---

## 📋 Implementation Checklist

### **Phase 1: Core Data Services** (Priority 1)
- [ ] Create `UserService` - User profile CRUD
- [ ] Create `ImageService` - Generated images CRUD
- [ ] Create `InstagramPostService` - Instagram posts CRUD
- [ ] Create `StorageService` - Firebase Storage operations
- [ ] Create `PromptHistoryService` - Prompt history management

### **Phase 2: Advanced Features** (Priority 2)
- [ ] Create `CollectionService` - Collections/folders
- [ ] Create `InstagramAccountService` - Account management
- [ ] Create `ActivityLogService` - Activity tracking

### **Phase 3: Analytics & Optimization** (Priority 3)
- [ ] Create `AnalyticsService` - Stats and insights
- [ ] Implement caching strategy
- [ ] Add data cleanup jobs
- [ ] Implement pagination for large datasets

---

## 🔒 Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /generated_images/{imageId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    match /instagram_posts/{postId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    match /instagram_accounts/{accountId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    match /prompts_history/{promptId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    match /collections/{collectionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📊 Firestore Indexes (to create in Firebase Console)

```
Collection: generated_images
- userId (Ascending) + createdAt (Descending)
- userId (Ascending) + status (Ascending)
- userId (Ascending) + isFavorite (Ascending) + createdAt (Descending)

Collection: instagram_posts
- userId (Ascending) + createdAt (Descending)
- userId (Ascending) + status (Ascending)

Collection: prompts_history
- userId (Ascending) + lastUsedAt (Descending)
- userId (Ascending) + useCount (Descending)
```

---

## 🎯 Next Steps

1. **Create Service Files** in `src/lib/services/`
   - `user.service.ts`
   - `image.service.ts`
   - `instagram-post.service.ts`
   - `storage.service.ts`
   - `prompt-history.service.ts`

2. **Update Generator Page** to use these services

3. **Create Firestore Indexes** in Firebase Console

4. **Set Security Rules** in Firebase Console

5. **Test Data Flow** end-to-end
