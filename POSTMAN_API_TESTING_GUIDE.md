# 🔧 Postman API Testing Guide

## 📋 Quick Setup (3 Steps)

### Step 1: Import into Postman
1. Open **Postman Desktop App**
2. Click **"Import"** (top left corner)
3. Import these files from `postman/` folder:
   - ✅ `Instagram_API_Complete.postman_collection.json` - All API tests
   - ✅ `Instagram_API_UAT.postman_environment.json` - Environment variables

### Step 2: Select Environment
1. In Postman, click the **Environment dropdown** (top right)
2. Select **"Instagram API - UAT"**
3. All variables from `environments.ts` are now loaded! 🎉

### Step 3: Run Tests
1. Open **"Instagram API - Complete Testing Suite"** collection
2. Expand **"Account 1 (EMILY)"** or **"Account 2 (Angela)"**
3. Click any request → Click **"Send"**
4. Check response in bottom panel

---

## 📂 Collection Structure

### 🔵 Account 1 (EMILY) - 17841478413044591
- App ID: 1408513954025673
- 7 API requests ready to test

### 🔵 Account 2 (Angela) - 17841473226055306  
- App ID: 735416536241722
- 7 API requests ready to test

### 🔧 Diagnostics & Troubleshooting
- Rate limit checker
- App configuration verifier

---

## 🧪 Testing Workflow

### For Each Account, Run Tests in Order:
- ✅ Expected: Shows if token is valid in response JSON
- ✅ Shows: `is_valid`, `expires_at`, `scopes` (permissions)
- ❌ If error: Token is expired or invalid

**Request 2: Get Instagram Account Info**
## 🧪 Testing Workflow

### For Each Account, Run Tests in Order:

**1️⃣ Debug Access Token**
- ✅ Expected: `"is_valid": true`
- ✅ Shows: Token expiration date, granted permissions (scopes)
- ❌ If error: Token expired or invalid

**2️⃣ Get Instagram Account Info**
- ✅ Expected: Returns `username`, `followers_count`, `media_count`
- ❌ If error "Cannot call API": Missing permissions or app not approved

**3️⃣ Get Account Permissions**
- ✅ Expected: List of permissions with `"status": "granted"`
- 🔍 Must have:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`
  - `pages_show_list`

**4️⃣ Get Recent Media**
- ✅ Expected: Last 10 posts with captions, likes, comments
- ❌ If error: Check if account has any posts

**5️⃣ Create Media Container** (Safe - No Publish)
- ✅ Expected: Returns `{"id": "container_id_17841..."}`
- ⚠️ This does NOT publish to Instagram (safe to test)
- Copy the container ID if you want to publish

**6️⃣ Publish Media Container** (⚠️ WARNING: Posts to Instagram!)
- Paste container ID from step 5
- ✅ Expected: Returns post ID
- ⚠️ This WILL actually post to Instagram!

**7️⃣ Exchange for Long-Lived Token**
- ✅ Expected: New `access_token` with 60-day expiry
- 📋 Copy the new token and update `environments.ts`

---

## ✅ Success Response Examples

### Debug Token (Request 1):
```json
{
  "data": {
    "app_id": "1408513954025673",
    "type": "USER",
    "application": "Your App Name",
    "data_access_expires_at": 1735430400,
    "expires_at": 1735430400,
    "is_valid": true,
    "scopes": [
      "instagram_basic",
      "instagram_content_publish",
      "pages_read_engagement",
      "pages_show_list"
    ],
    "user_id": "122093996457147387"
  }
}
```

### Account Info (Request 2):
```json
{
  "id": "17841478413044591",
  "username": "your_instagram_username",
  "name": "Your Display Name",
  "profile_picture_url": "https://...",
  "followers_count": 150,
  "follows_count": 200,
  "media_count": 45,
  "biography": "Your bio here"
}
```

### Permissions (Request 3):
```json
{
  "data": [
    {
      "permission": "instagram_basic",
      "status": "granted"
    },
    {
      "permission": "instagram_content_publish",
      "status": "granted"
    },
    {
      "permission": "pages_read_engagement",
      "status": "granted"
    }
  ]
}
```

### Create Container (Request 5):
```json
{
  "id": "17841478413044999"
}
```

### Long-Lived Token (Request 7):
```json
{
  "access_token": "EAABc...NEW_60_DAY_TOKEN...",
  "token_type": "bearer",
  "expires_in": 5183999
}
```

---

## ❌ Common Errors & Solutions

### Error: "Cannot call API for app X on behalf of user Y"
```json
{
  "error": {
    "message": "Cannot call API for app 735416536241722 on behalf of user 122093996457147387",
    "type": "OAuthException",
    "code": 10
  }
}
```
**Cause**: Missing `instagram_content_publish` permission

**Fix**:
1. Go to https://developers.facebook.com/apps/YOUR_APP_ID
2. Navigate to **Use Cases** → **Authenticate and request data from users**
3. Click **"Add"** next to `instagram_content_publish`
4. Generate new token with all permissions
5. Run Request 7 to get long-lived token
6. Update `environments.ts`

### Error: "Invalid OAuth access token"
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```
**Cause**: Token expired (tokens last 60 days)

**Fix**:
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app
3. Click "Get Token" → "Get User Access Token"
4. Select all 4 permissions
5. Generate token
6. In Postman: Update environment variable (click eye icon → edit)
7. OR run Request 7 to exchange for long-lived token

### Error: "Permissions error" or Missing Scopes
**Cause**: Token generated without required permissions

**Fix**:
1. Delete current token
2. Generate new one with ALL permissions:
   - ✅ instagram_basic
   - ✅ instagram_content_publish  
   - ✅ pages_read_engagement
   - ✅ pages_show_list

### Error: "(#10) Application does not have permission"
**Cause**: App needs Facebook App Review approval

**Solutions**:
- **For Testing**: Switch app to Development Mode + use Test Users
- **For Production**: Submit app for review (takes 1-3 days)

**Development Mode Setup**:
1. App Dashboard → Settings → Basic → App Mode: Development
2. App Roles → Test Users → Add test users
3. Test users can post without app review

---

## 🔄 How to Update Tokens in Your App

### After Getting New Long-Lived Token:

1. **Copy the new token** from Request 7 response
2. **Open** `src/lib/firebase/config/environments.ts`
3. **Find your account** in `UAT_INSTAGRAM.accounts`
4. **Replace** `accessToken` value:

```typescript
{
  id: "account_17841478413044591",
  name: "Instagram Account 1",
  username: "",
  accessToken: "PASTE_NEW_TOKEN_HERE", // ← Update this
  accountId: "17841478413044591",
  appId: "1408513954025673",
  appSecret: "1beb014e5c9b74c73f1bb38ba1a1e325",
  isActive: true
}
```

5. **Restart** your development server:
```bash
npm run dev
```

6. **Update Postman environment**:
   - Click **eye icon** (top right in Postman)
   - Click **Edit** next to "Instagram API - UAT"
   - Update `ACCOUNT_1_TOKEN` or `ACCOUNT_2_TOKEN`
   - Click **Save**

---

## 🎯 Quick Diagnostic Checklist

Run this checklist for any account with errors:

- [ ] **Request 1**: Token is valid (`is_valid: true`)
- [ ] **Request 1**: Token not expired (check `expires_at` timestamp)
- [ ] **Request 3**: Has `instagram_basic` permission
- [ ] **Request 3**: Has `instagram_content_publish` permission
- [ ] **Request 3**: Has `pages_read_engagement` permission
- [ ] **Request 2**: Can fetch account info (no errors)
- [ ] **Request 5**: Can create media container (returns container ID)
- [ ] **App Dashboard**: App is in correct mode (Development/Live)
- [ ] **App Dashboard**: Instagram use case is configured
- [ ] **environments.ts**: Token matches the one being tested

---

## 📊 Environment Variables Reference

All variables come from `src/lib/firebase/config/environments.ts`:

| Variable | Source | Example |
|----------|--------|---------|
| `BASE_URL` | Fixed | `https://graph.facebook.com/v18.0` |
| `ACCOUNT_1_ID` | `UAT_INSTAGRAM.accounts[0].accountId` | `17841478413044591` |
| `ACCOUNT_1_TOKEN` | `UAT_INSTAGRAM.accounts[0].accessToken` | `EAAUBCTXkEMk...` |
| `ACCOUNT_1_APP_ID` | `UAT_INSTAGRAM.accounts[0].appId` | `1408513954025673` |
| `ACCOUNT_1_APP_SECRET` | `UAT_INSTAGRAM.accounts[0].appSecret` | `1beb014e5c9b74c73f1bb38ba1a1e325` |
| `ACCOUNT_2_ID` | `UAT_INSTAGRAM.accounts[1].accountId` | `17841473226055306` |
| `ACCOUNT_2_TOKEN` | `UAT_INSTAGRAM.accounts[1].accessToken` | `EAAKc24Fnljo...` |
| `ACCOUNT_2_APP_ID` | `UAT_INSTAGRAM.accounts[1].appId` | `735416536241722` |
| `ACCOUNT_2_APP_SECRET` | `UAT_INSTAGRAM.accounts[1].appSecret` | `fc930595adbf59bdb747f9c93c44dc23` |

**To add Account 3**: Add to collection and environment JSON files with `ACCOUNT_3_*` variables.

---

## 🔗 Useful Links

- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Access Token Debugger**: https://developers.facebook.com/tools/debug/accesstoken/
- **App Dashboard**: https://developers.facebook.com/apps/
- **Instagram API Docs**: https://developers.facebook.com/docs/instagram-api
- **Permissions Reference**: https://developers.facebook.com/docs/permissions/reference

---

## 💡 Pro Tips

1. **Set Token Reminders**: Long-lived tokens expire in 60 days. Set calendar reminder for day 50.

2. **Use Variables**: The environment file uses variables so you never hardcode tokens in requests.

3. **Test Before Deploy**: Always run Request 1-3 before deploying to production.

4. **Save Responses**: Right-click response → "Save Response" to keep example responses.

5. **Duplicate Requests**: Right-click any request → "Duplicate" to create test variations.

6. **Monitor Rate Limits**: Use "Check Instagram API Rate Limits" in Diagnostics folder.

---

## 🆘 Still Having Issues?

If errors persist after following this guide:

1. **Share the error** from Postman response
2. **Share which request** failed (Request 1, 2, 3, etc.)
3. **Share the account** (Account 1 or Account 2)
4. Check if **app is in Development or Live mode**
5. Verify **Instagram account is Business account** (not Personal)

---

**Last Updated**: November 28, 2025  
**API Version**: v18.0  
**Environment**: UAT (User Acceptance Testing)

**Last Updated**: November 28, 2025  
**API Version**: v18.0  
**Environment**: UAT (User Acceptance Testing)

