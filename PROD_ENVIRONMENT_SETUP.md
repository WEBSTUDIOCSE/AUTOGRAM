# Production Environment Setup Checklist

> This document lists everything needed to configure the **PROD** environment (`autogram-14ddc`) to match UAT (`env-uat-cd3c5`).

---

## 1. Firebase Project Setup (`autogram-14ddc`)

### Quick Links — Firebase Console (PROD)

| Service | Direct Link |
|---|---|
| 🏠 Project Overview | [Open](https://console.firebase.google.com/project/autogram-14ddc/overview) |
| 📊 Firestore Database | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore) |
| 📑 Firestore Indexes | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes) |
| 🔒 Firestore Rules | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/rules) |
| 🔐 Authentication | [Open](https://console.firebase.google.com/project/autogram-14ddc/authentication) |
| 🔑 Auth Sign-in Methods | [Open](https://console.firebase.google.com/project/autogram-14ddc/authentication/providers) |
| ✉️ Auth Email Templates | [Open](https://console.firebase.google.com/project/autogram-14ddc/authentication/emails) |
| 🌐 Auth Authorized Domains | [Open](https://console.firebase.google.com/project/autogram-14ddc/authentication/settings) |
| 📦 Storage | [Open](https://console.firebase.google.com/project/autogram-14ddc/storage) |
| 📦 Storage Rules | [Open](https://console.firebase.google.com/project/autogram-14ddc/storage/rules) |
| ⚡ Cloud Functions | [Open](https://console.firebase.google.com/project/autogram-14ddc/functions) |
| 📧 Cloud Messaging (VAPID) | [Open](https://console.firebase.google.com/project/autogram-14ddc/settings/cloudmessaging) |
| ⚙️ Project Settings | [Open](https://console.firebase.google.com/project/autogram-14ddc/settings/general) |
| 🔑 Service Accounts | [Open](https://console.firebase.google.com/project/autogram-14ddc/settings/serviceaccounts) |

### Quick Links — Firebase Console (UAT — for reference)

| Service | Direct Link |
|---|---|
| 🏠 Project Overview | [Open](https://console.firebase.google.com/project/env-uat-cd3c5/overview) |
| 📊 Firestore Database | [Open](https://console.firebase.google.com/project/env-uat-cd3c5/firestore) |
| 📑 Firestore Indexes | [Open](https://console.firebase.google.com/project/env-uat-cd3c5/firestore/indexes) |
| 🔒 Firestore Rules | [Open](https://console.firebase.google.com/project/env-uat-cd3c5/firestore/rules) |
| 🔐 Authentication | [Open](https://console.firebase.google.com/project/env-uat-cd3c5/authentication) |
| ⚡ Cloud Functions | [Open](https://console.firebase.google.com/project/env-uat-cd3c5/functions) |

---

### 1.1 `.firebaserc` — Add Production Alias
Currently only UAT is configured. Add production:
```json
{
  "projects": {
    "default": "env-uat-cd3c5",
    "production": "autogram-14ddc"
  }
}
```
Then deploy to prod with: `firebase use production && firebase deploy`

### 1.2 Firestore Indexes — Deploy to Production

The `firestore.indexes.json` file has all 20 composite indexes. 

#### Option 1: Automatic (Recommended) — Firebase CLI
```bash
firebase use production
firebase deploy --only firestore:indexes
```

#### Option 2: Get Direct Links — Run Helper Script
```bash
node scripts/create-firestore-indexes.js autogram-14ddc
```
This will output all direct console links organized by collection group.

#### Option 3: Manual Creation via Console
Use the links below to open the Firestore Indexes page filtered by collection group, then click **"Add Index"** for each entry:

| # | Collection | Fields | Indexes Page |
|---|---|---|---|
| 1 | `character_posts` | `userId` ↑ + `timestamp` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=character_posts) |
| 2 | `character_posts` | `characterId` ↑ + `timestamp` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=character_posts) |
| 3 | `auto_post_logs` | `userId` ↑ + `executedAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=auto_post_logs) |
| 4 | `prompt_templates` | `userId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=prompt_templates) |
| 5 | `prompt_templates` | `userId` ↑ + `isActive` ↑ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=prompt_templates) |
| 6 | `family_auto_post_logs` | `userId` ↑ + `executedAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=family_auto_post_logs) |
| 7 | `family_auto_post_logs` | `userId` ↑ + `familyProfileId` ↑ + `executedAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=family_auto_post_logs) |
| 8 | `family_auto_post_logs` | `userId` ↑ + `familyProfileId` ↑ + `status` ↑ + `executedAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=family_auto_post_logs) |
| 9 | `family_prompt_templates` | `userId` ↑ + `familyProfileId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=family_prompt_templates) |
| 10 | `family_prompt_templates` | `userId` ↑ + `familyProfileId` ↑ + `category` ↑ + `isActive` ↑ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=family_prompt_templates) |
| 11 | `characters` | `userId` ↑ + `module` ↑ + `uploadedAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=characters) |
| 12 | `video_auto_post_logs` | `userId` ↑ + `executedAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=video_auto_post_logs) |
| 13 | `video_prompts` | `userId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=video_prompts) |
| 14 | `motivational_quotes` | `userId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_quotes) |
| 15 | `motivational_quotes` | `userId` ↑ + `category` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_quotes) |
| 16 | `motivational_quote_prompts` | `userId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_quote_prompts) |
| 17 | `motivational_quote_prompts` | `userId` ↑ + `isActive` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_quote_prompts) |
| 18 | `motivational_auto_post_logs` | `userId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_auto_post_logs) |
| 19 | `motivational_auto_post_logs` | `promptId` ↑ + `createdAt` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_auto_post_logs) |
| 20 | `motivational_auto_post_logs` | `userId` ↑ + `timestamp` ↓ | [Open](https://console.firebase.google.com/project/autogram-14ddc/firestore/indexes?collectionGroupId=motivational_auto_post_logs) |

### 1.3 Firestore Security Rules — Deploy to Production

Go to [PROD Firestore Rules](https://console.firebase.google.com/project/autogram-14ddc/firestore/rules) and deploy:
```bash
firebase use production
firebase deploy --only firestore:rules
```

**⚠️ MISSING RULES — Add before deploying to prod:**
The following collections are used in code but have NO security rules:
- `family_profiles`
- `family_auto_post_logs`
- `family_prompt_templates`
- `video_prompts`
- `video_auto_post_configs`
- `video_auto_post_logs`
- `motivational_quotes`
- `motivational_quote_prompts`
- `motivational_auto_post_logs`
- `motivational_auto_post_configs` (subcollection under `users/{uid}`)
- `instagram_posts`

### 1.4 Storage Rules — Deploy to Production

Go to [PROD Storage Rules](https://console.firebase.google.com/project/autogram-14ddc/storage/rules) and deploy:
```bash
firebase use production
firebase deploy --only storage
```

---

## 2. VAPID Key (Push Notifications)

**Status: ❌ NOT CONFIGURED for PROD** (empty string in `environments.ts`)

### Steps:
1. Go to [Firebase Console → autogram-14ddc → Project Settings → Cloud Messaging](https://console.firebase.google.com/project/autogram-14ddc/settings/cloudmessaging)
2. Under **Web Push certificates**, click **Generate key pair**
3. Copy the generated VAPID key
4. Update `PROD_CONFIG.vapidKey` in `src/lib/firebase/config/environments.ts`

---

## 3. Firebase Authentication

### 3.1 Enable Auth Providers in PROD
Go to [Firebase Console → autogram-14ddc → Authentication → Sign-in method](https://console.firebase.google.com/project/autogram-14ddc/authentication/providers):
- ✅ Enable **Email/Password** sign-in

### 3.2 Configure Authorized Domains
Go to Authentication → Settings → Authorized domains:
- Add your production domain (e.g., `autogram.app`, `autogram-orpin.vercel.app`)
- Add `autogram-14ddc.firebaseapp.com`

### 3.3 Email Templates
Go to Authentication → Templates:
- Configure **Password reset** email template
- Configure **Email verification** template
- Set the **Action URL** to your production domain

---

## 4. Environment Variables (Vercel / Hosting)

### 4.1 Required Environment Variables for PROD

| Variable | Where to Set | Description | Status |
|---|---|---|---|
| `NEXT_PUBLIC_GEMINI_API_KEY_PROD` | Vercel Dashboard | Gemini AI API key for production | ⚠️ Need key |
| `NEXT_PUBLIC_KIEAI_API_KEY_PROD` | Vercel Dashboard | Kie.ai API key for video generation | ⚠️ Need key |
| `NEXT_PUBLIC_PAYU_MERCHANT_KEY` | Vercel Dashboard | PayU merchant key (production) | ⚠️ Need key |
| `PAYU_MERCHANT_SALT` | Vercel Dashboard (server) | PayU salt for hash generation | ⚠️ Need key |
| `AUTO_POST_SECRET_TOKEN` | Vercel Dashboard (server) | Secret token for scheduled auto-post API calls | ⚠️ Set custom value |
| `NEXT_PUBLIC_APP_URL` | Vercel Dashboard | Production app URL (e.g., `https://autogram-orpin.vercel.app`) | ⚠️ Set URL |
| `INSTAGRAM_USERNAME_1_PROD` | Vercel Dashboard (server) | Production Instagram username | ⚠️ Need value |
| `INSTAGRAM_ACCESS_TOKEN_1_PROD` | Vercel Dashboard (server) | Production Instagram page access token | ⚠️ Need token |
| `INSTAGRAM_ACCOUNT_ID_1_PROD` | Vercel Dashboard (server) | Production Instagram business account ID | ⚠️ Need ID |
| `INSTAGRAM_APP_ID_1_PROD` | Vercel Dashboard (server) | Production Facebook App ID | ⚠️ Need ID |
| `INSTAGRAM_APP_SECRET_1_PROD` | Vercel Dashboard (server) | Production Facebook App Secret | ⚠️ Need secret |
| `NODE_ENV` | Auto-set by Vercel | Set to `production` | ✅ Auto |

### 4.2 How to Set in Vercel
1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add each variable above
3. Set scope to **Production** only
4. Redeploy after adding variables

---

## 5. Firebase Cloud Functions

### 5.1 Deploy Functions to PROD
```bash
firebase use production
firebase deploy --only functions
```

### 5.2 Update Cloud Functions Config
In `functions/src/index.ts`:
- **`AUTH_TOKEN`**: Currently hardcoded as `autogram-auto-post-secret-2024` — change for production or use Firebase Functions config
- **`API_BASE_URL`**: Currently `https://autogram-orpin.vercel.app` — update to production URL if different

### 5.3 Set Functions Environment Variables
```bash
firebase use production
firebase functions:secrets:set AUTO_POST_SECRET_TOKEN
```

---

## 6. Instagram / Facebook Setup for PROD

### 6.1 Facebook App
1. Go to [Facebook Developer Console](https://developers.facebook.com)
2. Either use existing app or create a new one for production
3. Set app mode to **Live** (not Development)
4. Add Instagram Graph API permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
5. Submit for App Review if not done

### 6.2 Instagram Business Account
1. Ensure Instagram account is a **Business** or **Creator** account
2. Connect it to a Facebook Page
3. Generate a **Page Access Token** with never-expiring permissions
4. Get the **Instagram Business Account ID** from Graph API

---

## 7. PayU Payment Gateway (Production)

### 7.1 Switch from Test to Live
- Current code in `payu-config.ts` uses `test.payu.in` vs `secure.payu.in` based on env
- Get **production merchant key** and **salt** from PayU dashboard
- Set `NEXT_PUBLIC_PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` in Vercel

---

## 8. DNS / Domain Configuration

- Configure custom domain in Vercel (if using one)
- Add domain to Firebase Auth authorized domains
- Update `NEXT_PUBLIC_APP_URL` to match
- Update CORS settings if applicable

---

## 9. Switch to Production

### 9.1 Toggle the Environment Flag
In `src/lib/firebase/config/environments.ts`, change:
```typescript
export const IS_PRODUCTION = true; // Change from false to true
```

### 9.2 Alternative (Recommended): Use Environment Variable
Consider replacing the hardcoded boolean with:
```typescript
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
```

---

## 10. Pre-Launch Verification Checklist

- [ ] Firebase Auth email/password enabled in prod project
- [ ] All Firestore indexes deployed to prod
- [ ] Firestore security rules deployed (with missing collections added)
- [ ] Storage rules deployed to prod
- [ ] VAPID key generated and configured
- [ ] All Vercel environment variables set
- [ ] Cloud Functions deployed to prod project
- [ ] Instagram access tokens valid and not expired
- [ ] PayU production keys configured
- [ ] Custom domain configured (if applicable)
- [ ] `IS_PRODUCTION` flag set to `true`
- [ ] `API_BASE_URL` in Cloud Functions updated
- [ ] `AUTO_POST_SECRET_TOKEN` changed from default value
- [ ] Test auth flow (signup, login, password reset)
- [ ] Test payment flow end-to-end
- [ ] Test Instagram posting
- [ ] Test auto-post scheduling
- [ ] Console logs removed from production code

---

## 11. Code Optimization Recommendations

### 🔴 Critical Priority

#### 11.1 Move Hardcoded Secrets to Environment Variables
**File:** `src/lib/firebase/config/environments.ts`
- UAT Instagram access tokens, app secrets, and API keys are **hardcoded in source code** — visible in Git history
- **Fix:** Move all secrets to `.env.local` (local dev) and Vercel env vars (deployed). Reference via `process.env.NEXT_PUBLIC_*` or server-only `process.env.*`
- Create a `.env.example` file documenting required variables

#### 11.2 Add Firestore Query Limits & Pagination
**Files:** All service files in `src/lib/services/`
- Most Firestore queries have **no `.limit()`** — fetching unbounded data causes excessive reads and slow load times
- **Fix:** Add `.limit(20)` (or appropriate page size) to all list queries. Implement cursor-based pagination with `startAfter()` for "load more" functionality
- **Impact:** Reduces Firestore read costs and dramatically improves page load

#### 11.3 Standardize API Route Error Handling
**Files:** All files in `src/app/api/`
- Error handling is inconsistent — some routes swallow errors, some return unstructured responses
- **Fix:** Create a shared `apiErrorHandler()` utility that wraps route handlers, logs errors consistently, and returns structured `{ error, message, statusCode }` responses

### 🟠 High Priority

#### 11.4 Component Memoization
**Files:** Components in `src/components/module1/`, `module3/`, `module4/`, `module9/`
- No `React.memo`, `useMemo`, or `useCallback` usage — causes unnecessary re-renders on large forms and lists
- **Fix:** Wrap pure list-item components in `React.memo`. Use `useCallback` for event handlers passed as props. Use `useMemo` for expensive computed values (filtered lists, sorted data)

#### 11.5 Optimize Image Upload Flow
**File:** `src/lib/services/storage.service.ts`, `src/lib/services/image-upload.helper.ts`
- Images are converted to base64 before upload — doubles memory usage and blocks the UI thread
- **Fix:** Use direct `File` object uploads with `uploadBytesResumable()` for progress tracking. Compress images client-side before upload using canvas resize (max 1920px)

#### 11.6 Bundle Size — Dynamic Imports
**File:** `package.json` — `firebase` (~200KB), `@google/genai`, `lucide-react`
- All Firebase services imported at app startup even when not needed
- **Fix:**
  - Use `import { getAuth } from 'firebase/auth'` (tree-shakeable) — already done ✅
  - Dynamic `import()` for heavy pages: video generator, image-to-video, motivational quotes
  - Replace full `lucide-react` imports with individual icon imports: `import { Home } from 'lucide-react/dist/esm/icons/home'`

### 🟡 Medium Priority

#### 11.7 Convert Dashboard Pages to Server Components
**Files:** `src/app/(protected)/dashboard/page.tsx` and subpages
- All dashboard pages use `'use client'` at the top — entire page bundles ship to browser
- **Fix:** Split into server component (layout, data fetch) + client component (interactive parts). Use `<Suspense>` with skeleton loaders

#### 11.8 Add Loading States & Suspense Boundaries
**Files:** All page components
- Missing `loading.tsx` files in route segments — users see blank screens during navigation
- **Fix:** Add `loading.tsx` with skeleton loaders for each dashboard route. Wrap async components in `<Suspense fallback={<Skeleton />}>`

#### 11.9 Unify Duplicated Service Logic
**Files:**
- `src/lib/services/module1/prompt-refiner.service.ts`
- `src/lib/services/module2/prompt-refiner.service.ts`
- `src/lib/services/module3/prompt-refiner.service.ts`
- `src/lib/services/module4/prompt-refiner.service.ts`
- `src/lib/services/module6/prompt-refiner.service.ts`
- `src/lib/services/module7/prompt-refiner.service.ts`
- Near-identical prompt refiner logic duplicated across 6+ modules
- **Fix:** Create a unified `src/lib/services/shared/prompt-refiner.service.ts` with module-specific configuration passed as parameters (strategy pattern)

#### 11.10 Add Rate Limiting to API Routes
**Files:** All files in `src/app/api/`
- No rate limiting on any API route — vulnerable to abuse (especially auto-post and image generation endpoints)
- **Fix:** Add a simple in-memory rate limiter or use Vercel's edge config for rate limiting. At minimum, validate `AUTO_POST_SECRET_TOKEN` strictly on all scheduled endpoints

### 🟢 Low Priority

#### 11.11 Firebase Singleton & SSR Safety
**File:** `src/lib/firebase/firebase.ts`
- Add explicit check: `typeof window !== 'undefined'` before initializing client-side Firebase services
- Use `getApps().length === 0` guard before `initializeApp()`

#### 11.12 Auth Token Refresh
**Files:** `src/contexts/AuthContext.tsx`, `src/lib/auth/server.ts`
- No explicit token refresh or expiration handling
- **Fix:** Add `onIdTokenChanged` listener for automatic token refresh. Set shorter cookie expiration and refresh proactively

#### 11.13 Environment Switcher Improvement
**File:** `src/lib/firebase/config/environments.ts`
- Uses hardcoded `IS_PRODUCTION = false` boolean — requires code change to switch
- **Fix:** Replace with `process.env.NODE_ENV === 'production'` or a dedicated `NEXT_PUBLIC_ENV` variable
