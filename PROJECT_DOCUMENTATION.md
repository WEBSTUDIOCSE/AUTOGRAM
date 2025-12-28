# Autogram - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Module System](#module-system)
5. [Auto-Posting System](#auto-posting-system)
6. [Firebase Structure](#firebase-structure)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [AI Integration](#ai-integration)
10. [Deployment](#deployment)
11. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

**Autogram** is an AI-powered Instagram content generation and auto-posting platform that enables users to:
- Generate AI images and videos for Instagram
- Create and manage character personas
- Automate Instagram posting with scheduling
- Generate family group content
- Create video content (text-to-video and image-to-video)
- Generate motivational quotes with visual content

### Key Features
- ✅ Multi-AI provider support (Gemini, ByteDance, Flux, Kling, Veo)
- ✅ Automated Instagram posting with scheduling
- ✅ Character-based content generation
- ✅ Family profile group content
- ✅ Video generation (text-to-video & image-to-video)
- ✅ Motivational quote generation with images/videos
- ✅ Prompt variation with AI to avoid repetition
- ✅ Retry mechanism for failed posts
- ✅ Comprehensive logging and history

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.7 (App Router)
- **Build Tool**: Turbopack
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Firebase Auth

### Backend
- **Platform**: Vercel (Next.js API Routes)
- **Functions**: Firebase Cloud Functions (Node.js 22)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Scheduler**: Firebase Cloud Scheduler

### AI Services
- **Text Generation**: Google Gemini AI
- **Image Generation**: Kie.ai (ByteDance, Flux models)
- **Video Generation**: Kie.ai (ByteDance, Kling, Veo models)

### External APIs
- **Instagram**: Graph API (for posting)
- **Payment**: Razorpay (for subscriptions)

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (Next.js)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Generator │  │Auto-Post │  │  History │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js API Routes (Vercel)                    │
│  /api/auto-post  /api/video-auto-post  /api/video-generation│
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Firebase Cloud Functions (Scheduler)               │
│         scheduledUnifiedAutoPost (0 * * * *)                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Firestore                        │
│  users/  characters/  video_prompts/  auto_post_logs/       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     External Services                        │
│   Gemini AI    Kie.ai (Videos/Images)    Instagram API      │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Interaction** → UI Components
2. **Action Trigger** → Next.js API Route or Firebase Service
3. **Data Processing** → Service Layer (Module-specific logic)
4. **AI Generation** → External AI APIs
5. **Instagram Posting** → Instagram Graph API
6. **Logging** → Firestore Collections
7. **UI Update** → Real-time data fetch

---

## 📦 Module System

Autogram uses a modular architecture where each content type is handled by a separate module.

### Module 1: AI Image Generator
**Location**: `src/app/(protected)/dashboard/generator`

**Purpose**: Generate single AI images using text prompts

**Features**:
- Text-to-image generation
- Multiple AI model support (ByteDance, Flux)
- Real-time generation progress
- Image download and Instagram posting

**Key Files**:
- `page.tsx` - Main generator UI
- `/api/image-generation` - Image generation API

---

### Module 2: Character Generator
**Location**: `src/app/(protected)/dashboard/character-generator`

**Purpose**: Create and manage character personas with consistent image generation

**Features**:
- Character profile creation (name, style, attributes)
- Character image generation with style consistency
- Character library management
- Edit and delete characters

**Key Files**:
- `page.tsx` - Character creation UI
- `src/components/module2/` - Character components
- `src/lib/firebase/services/character.service.ts` - Character CRUD operations

**Firestore Collections**:
- `characters/` - Character profiles
  ```typescript
  {
    id: string,
    userId: string,
    name: string,
    imageUrl: string,
    module: 'module2',
    style: string,
    attributes: string[],
    createdAt: Timestamp
  }
  ```

---

### Module 3: Character Auto Poster (Image Auto-Posting)
**Location**: `src/app/(protected)/dashboard/auto-poster`

**Purpose**: Automated Instagram posting for character images

**Architecture**:
```
User Enables Auto-Post
      ↓
Sets Posting Times (e.g., 10:00, 14:00, 18:00)
      ↓
Firebase Scheduler Triggers (Hourly)
      ↓
Checks Active Characters with Matching Time
      ↓
Calls /api/auto-post
      ↓
Generates Context-Aware Prompt with Gemini AI
      ↓
Generates Image with Selected AI Model
      ↓
Posts to Instagram
      ↓
Logs Result to Firestore
```

**Key Components**:

1. **Configuration** (`auto_post_configs`)
   ```typescript
   {
     userId: string,
     isEnabled: boolean,
     activeCharacterIds: string[],
     updatedAt: Timestamp
   }
   ```

2. **Character Settings** (`characters`)
   - Each character has: `postingTimes: ['10:00', '14:00', '18:00']`
   - Each character has: `instagramAccountId` (which account to post to)

3. **Daily Context Service** (`src/lib/services/module3/daily-context.service.ts`)
   - Uses Gemini AI to generate contextual prompts
   - Considers: season, weather, time of day, trends
   - Avoids repetition by analyzing recent prompts

4. **Post History** (`auto_post_logs`)
   ```typescript
   {
     userId: string,
     characterId: string,
     characterName: string,
     basePrompt: string,
     generatedPrompt: string,
     generatedImageUrl: string,
     instagramPostId: string,
     status: 'success' | 'failed' | 'skipped',
     timestamp: Timestamp,
     error?: string
   }
   ```

**API Endpoint**: `POST /api/auto-post`

**Workflow**:
1. Receive `userId`, `characterId`, `scheduledTime`
2. Fetch character data
3. Get random prompt from prompt library
4. Generate contextual variation with Gemini AI
5. Generate image using user's AI settings
6. Post to Instagram with caption
7. Log result to `auto_post_logs`

---

### Module 4: Family Auto Poster
**Location**: `src/app/(protected)/dashboard/family-auto-poster`

**Purpose**: Generate and auto-post images with multiple characters (family groups)

**Features**:
- Family profile creation (multiple characters)
- Template-based prompt system
- Group image generation
- Automated family posting

**Architecture**:
```
Family Profile (Mom, Dad, Kids)
      ↓
Family Prompt Templates
      ↓
Scheduler Triggers
      ↓
Generates Family Scene
      ↓
Posts to Instagram
```

**Key Collections**:

1. **Family Profiles** (`family_profiles`)
   ```typescript
   {
     userId: string,
     profileName: string,
     memberCharacterIds: string[],
     postingTimes: string[],
     instagramAccountId: string,
     isActive: boolean
   }
   ```

2. **Family Prompts** (`family_prompts`)
   ```typescript
   {
     userId: string,
     familyId: string,
     template: string,
     category: string,
     usageCount: number
   }
   ```

3. **Post History** (`family_post_history`)
   ```typescript
   {
     userId: string,
     familyId: string,
     prompt: string,
     imageUrl: string,
     instagramPostId: string,
     status: 'success' | 'failed',
     timestamp: Timestamp
   }
   ```

**API Endpoint**: `POST /api/family-auto-post`

---

### Module 7: Image-to-Video Generator
**Location**: `src/app/(protected)/dashboard/image-to-video-generator`

**Purpose**: Convert static images to animated videos

**Features**:
- Upload or select character image
- Add motion description prompt
- Duration selection (5, 8, 10 seconds)
- Resolution control (720p, 1080p)
- Camera settings (fixed/dynamic)

**Key Files**:
- `page.tsx` - Image-to-video UI
- `src/components/module7/` - Image-to-video components
- `/api/video-generation` - Video generation API

**Supported Models**:
- ByteDance V1 Pro Image-to-Video
- ByteDance V1 Lite Image-to-Video
- Kling 2.6 Image-to-Video

---

### Module 8: Video Auto Poster
**Location**: `src/app/(protected)/dashboard/video-auto-poster`

**Purpose**: Automated video generation and Instagram Reels posting

**Features**:
- Text-to-video generation
- Image-to-video generation (with characters)
- Prompt variation to avoid repetition
- Scheduled posting
- Retry mechanism for failed posts

**Architecture**:
```
Video Prompt Library
      ↓
Scheduler Triggers (Hourly)
      ↓
Generate Prompt Variation (Gemini AI)
      ↓
Generate Video (2-5 minutes)
      ↓
SAVE to Firestore Immediately (status: 'video_generated')
      ↓
Try Instagram Posting
      ↓
Update Status: 'success' or 'instagram_failed'
```

**Why Save Before Posting?**
- Video generation takes 2-5 minutes
- Vercel timeout is 300 seconds (5 minutes)
- If timeout occurs, video URL is preserved
- User can retry posting from History UI

**Key Collections**:

1. **Video Prompts** (`video_prompts`)
   ```typescript
   {
     id: string,
     userId: string,
     videoType: 'text-to-video' | 'image-to-video',
     basePrompt: string,
     characterId?: string,
     characterName?: string,
     postingTimes: string[],
     assignedAccountId: string,
     isActive: boolean,
     category?: string,
     usageCount: number,
     lastUsedAt: Timestamp
   }
   ```

2. **Video Auto Post Config** (`video_auto_post_configs`)
   ```typescript
   {
     userId: string,
     isEnabled: boolean,
     activeTextToVideoIds: string[],
     activeImageToVideoIds: string[],
     updatedAt: Timestamp
   }
   ```

3. **Video Auto Post Logs** (`video_auto_post_logs`)
   ```typescript
   {
     userId: string,
     videoPromptId: string,
     videoType: 'text-to-video' | 'image-to-video',
     basePrompt: string,
     generatedPrompt: string,
     generatedVideoUrl: string,
     thumbnailUrl?: string,
     caption: string,
     hashtags: string,
     instagramAccountId: string,
     instagramPostId?: string,
     status: 'success' | 'failed' | 'video_generated' | 'instagram_failed' | 'skipped',
     characterId?: string,
     characterName?: string,
     model?: string,
     timestamp: Timestamp,
     error?: string
   }
   ```

**Prompt Variation Service** (`src/lib/services/module8/video-prompt-generator.service.ts`):
- Analyzes last 10 prompts
- Uses Gemini AI to generate completely different topics
- Includes NSFW safety rules to avoid ByteDance content filter
- Ensures variety in activities, settings, and themes

**API Endpoint**: `POST /api/video-auto-post`

**Workflow**:
1. Receive `userId`, `promptId`
2. Fetch video prompt
3. Generate unique variation with Gemini AI
4. Load user's AI model preferences
5. Generate video (with character image if image-to-video)
6. **Save video to Firestore immediately** (status: 'video_generated')
7. Try posting to Instagram as REEL
8. Update status: 'success' or 'instagram_failed'
9. Log complete result

**Retry Mechanism**:
- History UI shows retry button for 'video_generated' and 'instagram_failed' statuses
- User can manually retry Instagram posting
- Video URL is preserved in Firestore

---

### Module 9: Motivational Quotes Auto Poster
**Location**: `src/app/(protected)/dashboard/motivational-quotes`

**Purpose**: Automated motivational quote generation with visual content and Instagram posting

**Features**:
- AI-powered unique quote generation
- Image and video support for quotes
- Category-based quote themes (success, mindset, motivation, inspiration, life, wisdom)
- Visual style customization
- Prompt library management
- Scheduled automated posting
- Comprehensive history tracking

**Architecture**:
```
Prompt Library (Categories & Themes)
      ↓
Scheduler Triggers (Hourly)
      ↓
Generate Unique Quote (Gemini AI)
      ↓
Create Visual Prompt
      ↓
Generate Media (Image/Video via Kie.ai)
      ↓
Post to Instagram
      ↓
Log Result & Save Quote
```

**Key Collections**:

1. **Motivational Quotes** (`motivational_quotes`)
   ```typescript
   {
     id: string,
     userId: string,
     quoteText: string,
     author?: string,
     category: string,
     contentType: 'image' | 'video',
     mediaUrl: string,
     instagramPostId?: string,
     instagramAccountId: string,
     promptId: string,
     createdAt: Timestamp
   }
   ```

2. **Motivational Quote Prompts** (`motivational_quote_prompts`)
   ```typescript
   {
     id: string,
     userId: string,
     category: string,
     themeDescription: string,
     contentType: 'image' | 'video',
     style: string,
     postingTimes: string[],
     assignedAccountId: string,
     isActive: boolean,
     usageCount: number,
     lastUsedAt: Timestamp,
     createdAt: Timestamp
   }
   ```

3. **Motivational Auto Post Configs** (`users/{userId}/motivational_auto_post_configs/default`)
   ```typescript
   {
     isEnabled: boolean,
     activePromptIds: string[],
     updatedAt: Timestamp
   }
   ```

4. **Motivational Auto Post Logs** (`motivational_auto_post_logs`)
   ```typescript
   {
     id: string,
     userId: string,
     promptId: string,
     quoteText?: string,
     author?: string,
     category: string,
     themeDescription: string,
     contentType: 'image' | 'video',
     mediaUrl?: string,
     instagramPostId?: string,
     instagramAccountId: string,
     instagramAccountUsername?: string,
     status: 'success' | 'failed' | 'media_generated' | 'instagram_failed' | 'skipped',
     error?: string,
     executionTime?: number,
     createdAt: Timestamp
   }
   ```

**Quote Generation Service** (`src/lib/services/module9/motivational-prompt-refiner.service.ts`):
- Analyzes recent quotes to ensure uniqueness
- Uses Gemini AI to generate original motivational quotes
- Creates visual prompts optimized for image/video generation
- Supports 6 categories: success, mindset, motivation, inspiration, life, wisdom
- Includes safety rules for appropriate content
- JSON output parsing for structured data

**API Endpoint**: `POST /api/motivational-auto-post`

**Workflow**:
1. Receive request from scheduler
2. Fetch active prompts with scheduled times
3. For each active prompt:
   - Generate unique quote using AI
   - Create visual prompt for media
   - Generate image or video
   - Post to assigned Instagram account
   - Save quote to database
   - Log complete result
4. Return processing summary

**Categories**:
- **success**: Achievement, winning, reaching goals
- **mindset**: Mental strength, positive thinking, growth
- **motivation**: Drive, action, perseverance
- **inspiration**: Uplifting messages, hope, dreams
- **life**: Life lessons, wisdom, experiences
- **wisdom**: Deep insights, philosophical quotes

**Visual Styles**:
- modern, minimalist, vibrant, elegant, bold, serene

---

## 🤖 Auto-Posting System

### Unified Scheduler Architecture

**Location**: `functions/src/index.ts`

The unified scheduler is a single Firebase Cloud Function that orchestrates all auto-posting modules.

### How It Works

```typescript
// Triggers every hour at minute 0 (HH:00)
scheduledUnifiedAutoPost = onSchedule({
  schedule: "0 * * * *",  // Cron expression
  timeZone: "Asia/Kolkata"
}, async (event) => {
  // 1. Get current time in IST
  const currentTime = "14:00"; // Example
  
  // 2. Process each module
  for (const module of MODULES) {
    await processModule(module, currentTime);
  }
});
```

### Module Registry Pattern

```typescript
const MODULES = [
  {
    moduleId: 'module3',
    moduleName: 'Character Auto Poster',
    collection: 'characters',
    apiEndpoint: '/api/auto-post',
    getScheduledItems: async (currentTime) => {
      // Find characters with postingTimes including currentTime
      // Return array of items to post
    }
  },
  {
    moduleId: 'module4',
    moduleName: 'Family Auto Poster',
    collection: 'family_profiles',
    apiEndpoint: '/api/family-auto-post',
    getScheduledItems: async (currentTime) => {
      // Find family profiles with postingTimes including currentTime
    }
  },
  {
    moduleId: 'module8',
    moduleName: 'Video Auto Poster',
    collection: 'video_prompts',
    apiEndpoint: '/api/video-auto-post',
    getScheduledItems: async (currentTime) => {
      // Find video prompts with postingTimes including currentTime
    }
  },
  {
    moduleId: 'module9',
    moduleName: 'Motivational Quotes Auto Poster',
    collection: 'motivational_quote_prompts',
    apiEndpoint: '/api/motivational-auto-post',
    getScheduledItems: async (currentTime) => {
      // Find motivational prompts with postingTimes including currentTime
    }
  }
];
```

### Processing Flow

```typescript
async function processModule(module, currentTime) {
  // 1. Get scheduled items for this time
  const items = await module.getScheduledItems(currentTime);
  
  // 2. For each item, check if auto-posting is enabled
  for (const item of items) {
    const config = await getModuleConfig(item.userId, module.moduleId);
    
    if (!config.isEnabled) {
      console.log('Auto-posting disabled');
      continue;
    }
    
    // 3. Call API endpoint
    const response = await fetch(`${API_BASE_URL}${module.apiEndpoint}`, {
      method: 'POST',
      body: JSON.stringify(item.payload)
    });
    
    // 4. Log result
    if (response.ok) {
      console.log('✅ SUCCESS:', item.displayName);
    } else {
      console.error('❌ FAILED:', item.displayName);
      await logError(item);
    }
  }
}
```

### Configuration Check

For **Module 8 (Video Auto Poster)**, there's an additional config check:

```typescript
// Check if video auto-posting is enabled
const config = await db
  .collection('users')
  .doc(userId)
  .collection('video_auto_post_configs')
  .doc('default')
  .get();

if (!config.exists || !config.data().isEnabled) {
  console.log('Video auto-posting disabled');
  return; // Skip this user
}
```

### Time Matching Logic

```typescript
// Character has postingTimes: ['10:00', '14:00', '18:00']
// Current time is '14:00'

const isScheduled = character.postingTimes.includes('14:00'); // true
// This character will be posted at 14:00
```

### Adding New Modules

To add a new module, simply add an entry to the `MODULES` array:

```typescript
{
  moduleId: 'module9',
  moduleName: 'New Feature Auto Poster',
  collection: 'new_feature_items',
  apiEndpoint: '/api/new-feature-auto-post',
  getScheduledItems: async (currentTime) => {
    // Custom logic to find scheduled items
    return scheduledItems;
  }
}
```

**No other code changes needed!** The unified scheduler handles everything.

---

## 🔥 Firebase Structure

### Firestore Collections

```
firestore/
├── users/
│   └── {userId}/
│       ├── preferences/
│       │   └── settings/
│       │       ├── textModel: "gemini-2.0-flash-exp"
│       │       ├── imageModel: "flux-2/pro"
│       │       ├── textToVideoModel: "veo3_fast"
│       │       └── imageToVideoModel: "bytedance/v1-pro-image-to-video"
│       ├── auto_post_configs/
│       │   └── default/
│       │       ├── isEnabled: boolean
│       │       └── activeCharacterIds: string[]
│       ├── family_auto_post_configs/
│       │   └── default/
│       │       ├── isEnabled: boolean
│       │       └── activeFamilyIds: string[]
│       ├── video_auto_post_configs/
│       │   └── default/
│       │       ├── isEnabled: boolean
│       │       ├── activeTextToVideoIds: string[]
│       │       └── activeImageToVideoIds: string[]
│       └── instagram_accounts/
│           └── {accountId}/
│               ├── username: string
│               ├── pageId: string
│               └── accessToken: string
│
├── characters/
│   └── {characterId}/
│       ├── userId: string
│       ├── name: string
│       ├── imageUrl: string
│       ├── module: string
│       ├── postingTimes: string[]
│       ├── instagramAccountId: string
│       └── createdAt: Timestamp
│
├── prompt_library/
│   └── {promptId}/
│       ├── userId: string
│       ├── characterId: string
│       ├── category: string
│       ├── basePrompt: string
│       └── usageCount: number
│
├── auto_post_logs/
│   └── {logId}/
│       ├── userId: string
│       ├── characterId: string
│       ├── generatedPrompt: string
│       ├── generatedImageUrl: string
│       ├── instagramPostId: string
│       ├── status: string
│       └── timestamp: Timestamp
│
├── family_profiles/
│   └── {profileId}/
│       ├── userId: string
│       ├── profileName: string
│       ├── memberCharacterIds: string[]
│       ├── postingTimes: string[]
│       └── isActive: boolean
│
├── family_prompts/
│   └── {promptId}/
│       ├── userId: string
│       ├── familyId: string
│       ├── template: string
│       └── category: string
│
├── family_post_history/
│   └── {logId}/
│       ├── userId: string
│       ├── familyId: string
│       ├── prompt: string
│       ├── imageUrl: string
│       └── status: string
│
├── video_prompts/
│   └── {promptId}/
│       ├── userId: string
│       ├── videoType: 'text-to-video' | 'image-to-video'
│       ├── basePrompt: string
│       ├── characterId?: string
│       ├── postingTimes: string[]
│       ├── assignedAccountId: string
│       └── isActive: boolean
│
└── video_auto_post_logs/
    └── {logId}/
        ├── userId: string
        ├── videoPromptId: string
        ├── videoType: string
        ├── generatedPrompt: string
        ├── generatedVideoUrl: string
        ├── instagramPostId?: string
        ├── status: 'success' | 'failed' | 'video_generated' | 'instagram_failed'
        └── timestamp: Timestamp
```

### Firebase Storage Structure

```
storage/
└── users/
    └── {userId}/
        ├── module2/
        │   └── characters/
        │       └── char_{timestamp}_{random}_original.{ext}
        ├── module3/
        │   └── characters/
        │       └── char_{timestamp}_{random}_original.{ext}
        ├── module4/
        │   └── families/
        │       └── family_{timestamp}_{random}_original.{ext}
        ├── module7/
        │   └── characters/
        │       └── char_{timestamp}_{random}_original.{ext}
        └── generated/
            ├── images/
            │   └── gen_{timestamp}_{random}.{ext}
            └── videos/
                └── vid_{timestamp}_{random}.mp4
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/session` - Get current session

### Image Generation
- `POST /api/upload-image` - Upload image to Firebase Storage
- `POST /api/convert-image` - Convert image format
- `POST /api/image-generation` - Generate AI image

### Video Generation
- `POST /api/video-generation` - Generate AI video (text-to-video or image-to-video)

### Auto-Posting
- `POST /api/auto-post` - Character auto-post (Module 3)
- `POST /api/family-auto-post` - Family auto-post (Module 4)
- `POST /api/video-auto-post` - Video auto-post (Module 8)

### Payment
- `POST /api/payment/initiate` - Start payment flow
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/success` - Payment success callback
- `GET /api/payment/failure` - Payment failure callback

### Request/Response Format

#### Generate Video (Example)
```typescript
POST /api/video-generation

Request:
{
  prompt: string,
  videoType: 'text-to-video' | 'image-to-video',
  imageUrl?: string,  // Required for image-to-video
  duration: string,   // '5', '8', '10'
  aspectRatio: string, // '9:16', '16:9', '1:1'
  resolution: string, // '720p', '1080p'
  model?: string      // Optional, uses user preference if not provided
}

Response:
{
  success: true,
  videoUrl: string,
  thumbnailUrl?: string,
  taskId: string,
  model: string,
  cost: number
}
```

#### Auto-Post (Example)
```typescript
POST /api/auto-post

Request:
{
  userId: string,
  characterId: string,
  scheduledTime: string,
  authToken: string
}

Response:
{
  success: true,
  postId: string,
  imageUrl: string,
  prompt: string,
  instagramPostId: string
}
```

---

## 🔐 Authentication & Authorization

### Firebase Authentication
- Email/Password authentication
- Session-based with HTTP-only cookies
- Protected routes with middleware

### Middleware
**Location**: `src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  
  // Protect /dashboard/* routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Redirect authenticated users from auth pages
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### Context Provider
**Location**: `src/contexts/AuthContext.tsx`

```typescript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Security Rules

**Firestore Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /characters/{characterId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

**Storage Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

## 🤖 AI Integration

### Gemini AI (Google)
**Used For**: Text generation, prompt variation, context generation

**Configuration**:
```typescript
// src/lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getTextModelName = () => {
  // Returns user's preferred model or default
  return 'gemini-2.0-flash-exp';
};
```

**Use Cases**:
- Daily context generation (Module 3)
- Video prompt variation (Module 8)
- Safety filtering

### Kie.ai
**Used For**: Image generation, video generation

**Supported Models**:

**Images**:
- ByteDance SeeDream
- Flux 2 Pro
- Flux 2 Dev

**Videos**:
- ByteDance V1 Pro (text-to-video, image-to-video)
- ByteDance V1 Lite (text-to-video, image-to-video)
- Kling 2.6 (text-to-video, image-to-video)
- Veo 3 Fast
- Veo 3 Quality
- Grok Imagine

**Provider Implementation**:
```typescript
// src/lib/services/video-generation/providers/kieai-video.provider.ts
export class KieAIVideoProvider implements VideoGenerationProvider {
  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    // 1. Build payload based on model
    const payload = this.buildInputPayload(selectedModel, options);
    
    // 2. Create task
    const taskResponse = await fetch(`${baseUrl}/jobs/createTask`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: payload })
    });
    
    // 3. Poll for completion
    const result = await this.pollTaskStatus(taskId);
    
    return result;
  }
}
```

### Instagram Graph API
**Used For**: Posting content to Instagram

**Implementation**:
```typescript
// src/lib/services/instagram.service.ts
export const InstagramService = {
  async postImage(accountId: string, imageUrl: string, caption: string) {
    // 1. Create media container
    const containerId = await createMediaContainer(accountId, imageUrl, caption);
    
    // 2. Publish media
    const postId = await publishMedia(accountId, containerId);
    
    return postId;
  },
  
  async postReel(accountId: string, videoUrl: string, caption: string) {
    // 1. Create video container
    const containerId = await createVideoContainer(accountId, videoUrl, caption);
    
    // 2. Publish reel
    const postId = await publishMedia(accountId, containerId);
    
    return postId;
  }
};
```

---

## 🚀 Deployment

### Vercel (Frontend & API Routes)

**Automatic Deployment**:
- Push to `main` branch triggers automatic deployment
- Environment variables set in Vercel dashboard

**Environment Variables**:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# AI Services
GEMINI_API_KEY=
KIEAI_API_KEY=

# Instagram
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Auto-Post
AUTO_POST_SECRET_TOKEN=
```

**Build Configuration**:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### Firebase (Cloud Functions)

**Manual Deployment**:
```bash
cd functions
npm run build
firebase deploy --only functions
```

**Functions Configuration**:
```typescript
// functions/src/index.ts
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  timeoutSeconds: 540,
  memory: "512MiB"
});
```

**Deployed Functions**:
- `scheduledUnifiedAutoPost` - Main scheduler (runs hourly)
- `scheduledAutoPost` - Legacy character auto-poster (deprecated)
- `scheduledFamilyAutoPost` - Legacy family auto-poster (deprecated)

### Firebase CLI Commands

```bash
# Login
firebase login

# Initialize project
firebase init

# Deploy all
firebase deploy

# Deploy specific function
firebase deploy --only functions:scheduledUnifiedAutoPost

# View logs
firebase functions:log

# Test locally
npm run serve
```

---

## 💻 Development Workflow

### Local Setup

```bash
# 1. Clone repository
git clone https://github.com/WEBSTUDIOCSE/AUTOGRAM.git
cd autogram

# 2. Install dependencies
npm install
cd functions && npm install && cd ..

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# 5. Run Firebase emulators (optional)
firebase emulators:start
```

### Project Structure

```
autogram/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── (protected)/         # Protected pages (dashboard)
│   │   │   └── dashboard/
│   │   │       ├── generator/            # Module 1
│   │   │       ├── character-generator/  # Module 2
│   │   │       ├── auto-poster/          # Module 3
│   │   │       ├── family-auto-poster/   # Module 4
│   │   │       ├── image-to-video-generator/ # Module 7
│   │   │       └── video-auto-poster/    # Module 8
│   │   ├── api/                 # API routes
│   │   └── globals.css
│   ├── components/              # React components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── module2/
│   │   ├── module3/
│   │   ├── module4/
│   │   ├── module7/
│   │   ├── module8/
│   │   └── ui/                  # shadcn/ui components
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom hooks
│   └── lib/
│       ├── ai/                  # AI service integrations
│       ├── auth/                # Auth helpers
│       ├── firebase/            # Firebase services
│       │   ├── config/
│       │   └── services/
│       ├── payment/             # Payment integration
│       ├── services/            # Business logic
│       │   ├── module3/
│       │   ├── module4/
│       │   ├── module8/
│       │   └── video-generation/
│       └── validations/         # Form validations
├── functions/                   # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts            # Unified scheduler
│   │   └── legacy/             # Legacy schedulers
│   └── package.json
├── public/                      # Static assets
├── firebase.json               # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── next.config.ts             # Next.js configuration
└── package.json
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

### Testing

```bash
# Build and check for errors
npm run build

# Build Firebase functions
cd functions
npm run build
```

### Common Tasks

**Add New Module**:
1. Create UI page in `src/app/(protected)/dashboard/`
2. Create components in `src/components/module{N}/`
3. Create services in `src/lib/services/module{N}/`
4. Add API route in `src/app/api/`
5. Add to unified scheduler in `functions/src/index.ts`

**Update AI Models**:
1. Edit `src/lib/services/video-generation/providers/kieai-video.provider.ts`
2. Add model configuration in `buildInputPayload()`
3. Update user preferences interface

**Modify Scheduler**:
1. Edit `functions/src/index.ts`
2. Update `schedule` cron expression
3. Build: `cd functions && npm run build`
4. Deploy: `firebase deploy --only functions`

---

## 📊 Monitoring & Debugging

### Firebase Console

**Cloud Functions Logs**:
1. Go to Firebase Console → Functions
2. Select `scheduledUnifiedAutoPost`
3. View logs for execution history

**Firestore Data**:
1. Go to Firebase Console → Firestore
2. Navigate collections to view data
3. Check `auto_post_logs` for posting history

### Vercel Logs

1. Go to Vercel Dashboard
2. Select project
3. View function logs under "Functions"

### Common Issues

**Auto-Post Not Triggering**:
- Check if `isEnabled` is true in config
- Verify posting times match format 'HH:MM'
- Check character is in `activeCharacterIds`
- View Firebase Function logs for errors

**Video Generation Timeout**:
- Videos saved with status 'video_generated'
- Use retry button in History UI
- Check Kie.ai credits

**Instagram Posting Failed**:
- Verify Instagram access token is valid
- Check account permissions
- View error in `auto_post_logs`

---

## 📝 Best Practices

### Code Organization
- ✅ Module-specific logic in `src/lib/services/module{N}/`
- ✅ Shared utilities in `src/lib/`
- ✅ UI components in `src/components/`
- ✅ API routes follow RESTful conventions

### Error Handling
- ✅ Always log errors to Firestore
- ✅ Provide user-friendly error messages
- ✅ Implement retry mechanisms for transient failures
- ✅ Use try-catch blocks in async functions

### Performance
- ✅ Use Firebase indexes for queries
- ✅ Implement pagination for large datasets
- ✅ Cache AI model preferences
- ✅ Optimize image sizes before upload

### Security
- ✅ Never expose API keys in client code
- ✅ Validate all user inputs
- ✅ Use Firestore security rules
- ✅ Implement rate limiting for API routes

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Bulk retry for failed posts
- [ ] Analytics dashboard with success rates
- [ ] Multi-language support
- [ ] Team collaboration features
- [ ] Advanced scheduling (specific dates)
- [ ] Post preview before auto-posting
- [ ] A/B testing for prompts
- [ ] Integration with more social platforms

### Technical Improvements
- [ ] Implement queue system for long-running tasks
- [ ] Add Redis caching layer
- [ ] Improve error recovery mechanisms
- [ ] Implement webhooks for status updates
- [ ] Add comprehensive unit tests
- [ ] Set up CI/CD pipeline

---

## 📞 Support & Contact

- **GitHub**: [WEBSTUDIOCSE/AUTOGRAM](https://github.com/WEBSTUDIOCSE/AUTOGRAM)
- **Documentation**: This file
- **Issues**: GitHub Issues tab

---

## 📄 License

Proprietary - All rights reserved

---

**Last Updated**: December 27, 2025
**Version**: 1.0.0
