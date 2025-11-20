# Auto-Post Scheduling System

## How It Works

The auto-posting system automatically generates AI images and posts them to Instagram at the specific times you configure in your UI.

### 1. Configuration in UI (Module 3 Settings Tab)

Users can configure:
- **Posting Times**: Add multiple times (e.g., 10:00, 17:00) using the time picker
- **Instagram Accounts**: Select which Instagram accounts to post to
- **Characters**: System requires minimum 3 characters
- **Prompt Templates**: At least 1 active prompt template

Example Configuration:
```javascript
{
  isEnabled: true,
  postingTimes: ["10:00", "17:00"], // 10 AM and 5 PM
  instagramAccounts: ["account1", "account2"],
  minCharacters: 3,
  timezone: "America/New_York"
}
```

### 2. Cloud Function Scheduling

**Firebase Cloud Function** (`scheduledAutoPost`) runs **every hour at minute 0**:
- Schedule: `"0 * * * *"` (cron expression)
- Timezone: `America/New_York` (configurable)

**What Happens Each Hour:**
1. Function wakes up at 00:00, 01:00, 02:00, etc.
2. Gets current time in HH:mm format (e.g., "10:00")
3. Queries Firestore for users who have:
   - `isEnabled: true`
   - Current time in their `postingTimes` array
4. For each matching user, calls the Vercel API endpoint to execute auto-post

### 3. Duplicate Prevention

The system prevents duplicate posts using `wasExecutedThisHour()` check:
- Checks if a post was already created in the current hour
- Compares the scheduled time to prevent duplicates
- If already executed, skips the post

### 4. Execution Flow

```
┌─────────────────────────────────────────────┐
│  Cloud Function (runs every hour)          │
│  - Check current time: "10:00"             │
│  - Query users with postingTimes=["10:00"] │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  For each matching user:                    │
│  1. Check if already executed this hour     │
│  2. Call Vercel API: /api/auto-post        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  AutoPostSchedulerService.executeAutoPost() │
│  1. Validate configuration                  │
│  2. Select random character                 │
│  3. Get random prompt template              │
│  4. Generate prompt variation (Gemini)      │
│  5. Generate image with character (Gemini)  │
│  6. Upload to Firebase Storage              │
│  7. Post to Instagram                       │
│  8. Save log to auto_post_logs collection   │
└─────────────────────────────────────────────┘
```

## Setting Custom Times

### In the UI (Auto-Poster Settings):

1. Go to **Dashboard → Auto-Poster → Settings**
2. Click **"Add Posting Time"**
3. Use the time picker to select time (e.g., 10:00 AM)
4. Click the time picker again to add another time (e.g., 5:00 PM)
5. Select Instagram account(s)
6. Ensure you have at least 3 characters uploaded
7. Ensure you have at least 1 active prompt template
8. Toggle **"Enable Auto-Posting"** to ON
9. Click **"Save Settings"**

### Time Format

- Times are stored in 24-hour format: `HH:mm`
- Examples:
  - 10:00 AM → `"10:00"`
  - 5:00 PM → `"17:00"`
  - 12:00 PM (noon) → `"12:00"`
  - 12:00 AM (midnight) → `"00:00"`

## Testing

### Manual Trigger (Testing Immediately)

```bash
# PowerShell
Invoke-WebRequest -Uri "https://triggerautopost-guoxeox4eq-uc.a.run.app?userId=YOUR_USER_ID" -Method POST

# Browser
https://triggerautopost-guoxeox4eq-uc.a.run.app?userId=YOUR_USER_ID
```

### Test Configuration

Use the test endpoint to validate your setup without posting:
```javascript
const result = await AutoPostSchedulerService.testAutoPost(userId);
// Returns: success, message, and details about selected resources
```

## Monitoring

### View History

1. Go to **Dashboard → Auto-Poster → History**
2. See all executed posts with:
   - Status (Success/Failed)
   - Character used
   - Prompt used
   - Instagram post details
   - Execution timestamp

### Logs in Firebase

Collection: `auto_post_logs`
```javascript
{
  userId: "...",
  scheduledTime: "10:00",
  executedAt: "2025-11-20T10:00:32.123Z",
  status: "success",
  characterName: "Character A",
  basePrompt: "...",
  generatedPrompt: "...",
  generatedImageUrl: "...",
  instagramPostId: "...",
  instagramAccountName: "..."
}
```

## Troubleshooting

### Posts Not Executing

1. **Check if enabled**: Go to Settings, ensure toggle is ON
2. **Verify posting times**: Ensure times are correctly added
3. **Check characters**: Need at least 3 characters uploaded
4. **Check prompts**: Need at least 1 active prompt template
5. **Instagram account**: Ensure at least one account is selected
6. **Check logs**: View History tab for error messages

### Duplicate Posts

The system automatically prevents duplicates by checking if a post was already executed in the current hour with the same scheduled time.

### Timezone Issues

The Cloud Function uses `America/New_York` timezone by default. If you need a different timezone:
1. Update in `functions/src/index.ts`:
   ```typescript
   export const scheduledAutoPost = onSchedule({
     schedule: "0 * * * *",
     timeZone: "YOUR_TIMEZONE", // e.g., "Asia/Kolkata", "Europe/London"
   }, ...)
   ```
2. Redeploy: `firebase deploy --only functions`

## Environment Variables

Ensure these are set in your Vercel project:

- `AUTO_POST_SECRET_TOKEN=autogram-auto-post-secret-2024`

Set in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `AUTO_POST_SECRET_TOKEN` with the value above
3. Redeploy your Vercel app

## Example Scenarios

### Scenario 1: Daily Posts at 10 AM and 5 PM
```
postingTimes: ["10:00", "17:00"]
Result: Posts at 10:00 AM and 5:00 PM every day
```

### Scenario 2: Multiple Posts Throughout the Day
```
postingTimes: ["08:00", "12:00", "16:00", "20:00"]
Result: Posts at 8 AM, 12 PM, 4 PM, and 8 PM every day
```

### Scenario 3: Once a Day at Specific Time
```
postingTimes: ["14:30"]
Result: Posts at 2:30 PM every day
```

## Important Notes

1. **Cloud Function runs every hour** - This is efficient and ensures timely execution
2. **Posts only execute at YOUR configured times** - Not every hour, only when current time matches your postingTimes
3. **Duplicate prevention** - Even if function runs multiple times, won't create duplicate posts in same hour
4. **Timezone matters** - Make sure your timezone in Cloud Function matches your local timezone
5. **Minimum requirements enforced** - System won't post if you don't meet minimum characters/prompts requirements
