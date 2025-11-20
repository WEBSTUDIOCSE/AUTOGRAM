# Auto-Post Error Handling & Display

## Overview

The auto-posting system now includes comprehensive error handling that displays errors directly in your website, making it easy to identify and fix issues.

## Where Errors Are Displayed

### 1. **History Tab** (Primary Error View)
Location: `Dashboard → Auto-Poster → History`

**What You'll See:**
- Red error badge showing "Failed" status
- Detailed error message with specific problem
- Contextual tips based on error type
- Scheduled time when the error occurred

**Example Error Display:**
```
⚠️ Error Details:
Not Enough Characters: You have 2 character(s), but need at least 3. 
Upload more characters in the Generate tab.

💡 Tip: Make sure you have uploaded at least 3 characters in the Generate tab.
```

### 2. **Recent Errors Banner** (Top of Page)
Location: Top of `Dashboard → Auto-Poster` page

**What You'll See:**
- Red alert banner showing up to 3 most recent errors
- Quick summary of what went wrong
- Refresh button to check for new errors
- Link to History tab for full details

**Example Banner:**
```
⚠️ Recent Auto-Post Errors:
• Not Enough Characters: You have 2 character(s), but need at least 3
• No active prompt templates found
• Instagram account not found or disconnected

Check the History tab for full details and fix any issues in Settings.
[Refresh Button]
```

### 3. **Settings Tab** (Configuration Validation)
Location: `Dashboard → Auto-Poster → Settings`

**What You'll See:**
- Test Configuration button shows validation results
- Pre-save validation when enabling auto-posting
- Red alerts if requirements aren't met

## Error Categories

### 1. **Character Missing** 🚨 High Priority
**Error Message:**
```
Not Enough Characters: You have X character(s), but need at least 3. 
Upload more characters in the Generate tab.
```

**What It Means:** You don't have enough character images uploaded.

**How to Fix:**
1. Go to **Generate** tab
2. Click **Upload Character** button
3. Upload character images until you have at least 3
4. Characters will appear in the carousel

**Icon:** 🚨 (High severity)

---

### 2. **Prompt Missing** 🚨 High Priority
**Error Message:**
```
No Active Prompt Templates: Generate an image in the Generate tab 
to create your first prompt template.
```

**What It Means:** You don't have any saved prompts for auto-posting to use.

**How to Fix:**
1. Go to **Generate** tab
2. Select a character
3. Enter a scene description
4. Click **Generate** - This automatically saves your prompt!
5. Repeat to create more variety (recommended 3-5 prompts)

**Icon:** 🚨 (High severity)

---

### 3. **Instagram Connection Error** 🔴 Critical
**Error Message:**
```
Instagram Account Not Found: Instagram account not found or disconnected. 
Please check your Instagram account connection.
```

**What It Means:** Your Instagram account is disconnected or the access token expired.

**How to Fix:**
1. Go to **Settings** tab
2. Check which Instagram account is selected
3. If needed, reconnect your Instagram account
4. Ensure the account is active and has proper permissions

**Icon:** 🔴 (Critical severity)

---

### 4. **API Service Error** ⚠️ Medium Priority
**Error Message:**
```
API Rate Limit: The AI service is temporarily unavailable or rate-limited. 
The system will retry at the next scheduled time.
```

**What It Means:** The AI API (Gemini) has hit rate limits or is temporarily down.

**How to Fix:**
- **No action needed!** The system will automatically retry at the next scheduled time
- This is usually temporary and resolves itself
- If it persists for 24+ hours, check your Gemini API quota

**Icon:** ⚠️ (Medium severity)

---

### 5. **Network Error** ⚠️ Low Priority
**Error Message:**
```
Network Connection Issue: There was a temporary network issue.
```

**What It Means:** Temporary internet connection problem during posting.

**How to Fix:**
- **No action needed!** The system will automatically retry
- Check your internet connection if errors persist
- Verify your server/hosting is stable

**Icon:** ⚠️ (Low severity)

---

## Error Display Features

### Smart Categorization
The system automatically categorizes errors and provides:
- **Error Type**: What category of problem occurred
- **Severity**: How urgent the issue is (Low, Medium, High, Critical)
- **User-Friendly Title**: Clear description of the problem
- **Actionable Tips**: Specific steps to fix the issue
- **Visual Indicators**: Color-coded badges and icons

### Contextual Help
Each error includes:
- ✅ What went wrong
- ✅ Why it happened
- ✅ How to fix it
- ✅ When system will retry (if automatic)

### Visual Indicators
- 🔴 **Critical** - Requires immediate action (Instagram errors)
- 🚨 **High** - Blocks auto-posting (character/prompt missing)
- ⚠️ **Medium** - Temporary issues (API limits)
- ⚠️ **Low** - Self-resolving (network issues)

## Error Recovery

### Automatic Retry
The system automatically retries failed posts based on error type:

| Error Type | Retry Delay | Auto-Resolve |
|------------|-------------|--------------|
| Network Error | 1 hour | ✅ Yes |
| API Error | 1 hour | ✅ Yes |
| Instagram Error | 2 hours | ⚠️ Maybe |
| Character Missing | 24 hours | ❌ No - User action required |
| Prompt Missing | 24 hours | ❌ No - User action required |

### User Action Required
For **High** and **Critical** errors:
1. System pauses automatic retries
2. Error displays in UI immediately
3. User must fix the issue manually
4. Once fixed, system resumes at next scheduled time

## Monitoring Your Auto-Posts

### Check Status Regularly
**Recommended:** Check the History tab once per day

**What to Look For:**
- ✅ Green "Posted" badges = Success
- ❌ Red "Failed" badges = Need attention
- 📊 Total posts count = System health

### Recent Errors Banner
The top banner automatically shows:
- Last 3 failed attempts
- Most recent at the top
- Click "Refresh" to update

### Statistics
In the History tab header:
- **Total Posts**: Lifetime count of auto-posts
- Shows both successful and failed attempts

## Best Practices

### 1. Set Up Properly Before Enabling
✅ Upload at least 3-5 characters  
✅ Generate 3-5 images to save prompts  
✅ Select Instagram account  
✅ Add posting times  
✅ Click "Test Configuration"  

### 2. Monitor Regularly
✅ Check History tab daily  
✅ Watch for error patterns  
✅ Address High/Critical errors immediately  

### 3. Maintain Resources
✅ Keep 5+ characters uploaded  
✅ Keep 5+ active prompts  
✅ Verify Instagram connection monthly  

### 4. Respond to Errors
✅ Read error messages carefully  
✅ Follow the suggested actions  
✅ Test after fixing issues  

## Common Scenarios

### Scenario 1: First-Time Setup Error
**Error:** "Not enough characters"  
**Solution:** Upload 3+ characters before enabling auto-posting

### Scenario 2: Auto-Posting Stops Working
**Check:**
1. History tab for recent errors
2. Recent Errors banner at top of page
3. Settings → Test Configuration

### Scenario 3: Occasional Failures
**If errors are rare (< 10%):** Usually API/network issues, no action needed  
**If errors are frequent (> 20%):** Check for systematic issues (expired tokens, etc.)

### Scenario 4: All Posts Failing
**Action:**
1. Go to History tab
2. Look at the error message
3. Follow the suggested fix
4. Re-enable auto-posting after fixing

## Error Log Data

Each error is logged with:
- **User ID**: Your account identifier
- **Timestamp**: When error occurred
- **Scheduled Time**: Intended posting time
- **Error Message**: Detailed description
- **Status**: "failed"
- **Partial Data**: Character name, account name (if available)

## Testing

### Test Configuration
Before enabling auto-posting:
1. Go to **Settings** tab
2. Configure all settings
3. Click **"Test Configuration"**
4. Review results:
   - ✅ Success = Ready to enable
   - ❌ Failure = Fix issues first

### Manual Trigger
Test immediately without waiting:
```powershell
Invoke-WebRequest -Uri "https://triggerautopost-guoxeox4eq-uc.a.run.app?userId=YOUR_USER_ID" -Method POST
```

Check History tab to see results and any errors.

## Technical Details

### Error Service
File: `src/lib/services/error-notification.service.ts`

**Features:**
- Automatic error categorization
- Severity determination
- User-friendly message generation
- Retry delay calculation
- Icon selection based on severity

### Error Display Components
- `AutoPostHistory.tsx` - Full error details with tips
- `auto-poster/page.tsx` - Recent errors banner
- `AutoPostSettings.tsx` - Configuration validation

### Error Flow
```
1. Error occurs during auto-post execution
2. Error caught and categorized by ErrorNotificationService
3. User-friendly message generated with actionable tips
4. Error saved to auto_post_logs collection
5. Error displayed in History tab with contextual help
6. Recent error shown in banner at top of page
7. System determines retry strategy based on error type
```

## Support

If errors persist after following suggestions:
1. Screenshot the error message from History tab
2. Check your Gemini API quota/limits
3. Verify Instagram API access
4. Check Firebase service status
5. Review Firebase Functions logs: `firebase functions:log`

## Summary

✅ **Errors are displayed in the website** - No need to check external logs  
✅ **Clear, actionable error messages** - Know exactly what to fix  
✅ **Automatic categorization** - Understand error severity  
✅ **Smart retry logic** - System handles temporary issues automatically  
✅ **User action prompts** - Get notified when you need to take action  
✅ **Multiple views** - History tab + banner for comprehensive monitoring  
