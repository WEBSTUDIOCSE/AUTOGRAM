# Production Environment Setup Checklist

> This document lists everything needed to configure the **PROD** environment (`autogram-14ddc`) to match UAT (`env-uat-cd3c5`).

---

## 1. Firebase Project Setup (`autogram-14ddc`)

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
The `firestore.indexes.json` file has all the composite indexes. Deploy them to the prod project:
```bash
firebase use production
firebase deploy --only firestore:indexes
```

**Collections that need indexes in PROD (currently configured for UAT):**
- `character_posts` (userId + timestamp)
- `auto_post_logs` (userId + executedAt)
- `prompt_templates` (userId + createdAt, userId + isActive)
- `family_auto_post_logs` (userId + executedAt, userId + familyProfileId + status + executedAt)
- `family_prompt_templates` (userId + familyProfileId + createdAt, userId + familyProfileId + category + isActive)
- `characters` (userId + module + uploadedAt)
- `video_auto_post_logs` (userId + executedAt)
- `video_prompts` (userId + createdAt)
- `motivational_quotes` (userId + createdAt, userId + category + createdAt)
- `motivational_quote_prompts` (userId + createdAt, userId + isActive + createdAt)
- `motivational_auto_post_logs` (userId + createdAt, promptId + createdAt, userId + timestamp)

### 1.3 Firestore Security Rules — Deploy to Production
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
