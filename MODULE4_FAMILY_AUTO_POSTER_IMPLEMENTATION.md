# Module 4: Family Auto Poster - Implementation Guide

## Overview
Module 4 enables users to create family profiles with multiple members and automatically post AI-generated images featuring their family/couple context to Instagram on a scheduled basis.

## Key Features

### 1. Family Profile Management
- **Multiple Profiles**: Users can create multiple family profiles (e.g., "My Family", "Parents Only", "Kids Group")
- **Family Members**: Each profile can have:
  - Partners (Person 1, Person 2)
  - Children (Child 1, 2, 3...)
  - Parents (Mother, Father)
  - Grandparents (Grandmother, Grandfather)
  - Optional: Age for each member
- **Instagram Linking**: Each profile links to ONE Instagram account
- **Profile Status**: Active/Inactive toggle

### 2. Dynamic Prompt System
Four prompt categories:
- **Couple Prompts**: Romance, date scenarios (15 default prompts)
- **Family Prompts**: Family activities, celebrations (15 default prompts)
- **Kids Prompts**: Children activities, play scenarios (15 default prompts)
- **Custom Prompts**: User-defined prompts

### 3. Auto-Post Scheduling
- **Multiple Schedules per Profile**: Each family profile can have multiple schedules
- **Frequency Options**:
  - Daily (runs every day at specified time)
  - Weekly (runs on specific day at specified time)
- **Time Selection**: Users choose posting time (HH:mm format)
- **Enable/Disable**: Individual schedule toggle

### 4. Family Context Building
The system automatically builds context strings from family members:
- Example: "Sarah and John with their daughter Emma and grandmother Margaret"
- Final prompt: "{family_context} - {base_prompt}"
- Category-based filtering:
  - Couple: Only Person 1 & Person 2
  - Kids: Only children
  - Family: All members

## Data Architecture

### Firebase Collections

#### `family_profiles`
```typescript
{
  id: string
  userId: string
  profileName: string
  members: FamilyMember[]
  instagramAccountId: string
  instagramAccountName: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `family_prompt_templates`
```typescript
{
  id: string
  userId: string
  familyProfileId: string
  category: 'couple' | 'family' | 'kids' | 'custom'
  basePrompt: string
  usageCount: number
  lastUsedAt: Timestamp | null
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `family_auto_post_schedules`
```typescript
{
  id: string
  userId: string
  familyProfileId: string
  promptTemplateId: string
  category: FamilyPromptCategory
  frequency: 'daily' | 'weekly'
  time: string // HH:mm
  dayOfWeek?: number // 0-6 for weekly
  isEnabled: boolean
  timezone: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `family_auto_post_logs`
```typescript
{
  id: string
  userId: string
  familyProfileId: string
  familyProfileName: string
  scheduleId: string
  category: FamilyPromptCategory
  basePrompt: string
  generatedPrompt: string
  familyContext: string
  generatedImageUrl: string
  caption: string
  hashtags: string
  instagramPostId?: string
  instagramAccountId: string
  instagramAccountName: string
  scheduledTime: string
  executedAt: Timestamp
  status: 'success' | 'failed' | 'skipped'
  error?: string
}
```

## Component Structure

```
src/components/module4/
├── FamilyProfileCard.tsx          # Display family profile with members
├── FamilyProfileForm.tsx          # Create/Edit family profile
├── FamilyAutoPostSettings.tsx     # Manage schedules for a profile
├── FamilyPostHistory.tsx          # View post history
└── PromptManager.tsx              # Add/Initialize prompts

src/app/(protected)/family-auto-poster/
└── page.tsx                       # Main page with tabs (Profiles, History)
```

## Service Layer

```
src/lib/services/module4/
├── family-profile.service.ts              # Profile CRUD operations
├── family-prompt.service.ts               # Prompt management
├── family-schedule.service.ts             # Schedule management
├── family-log.service.ts                  # Post history logs
├── family-auto-post-scheduler.service.ts  # Auto-posting execution
└── index.ts                               # Centralized exports
```

## API Endpoints

### POST `/api/family-auto-post`
Triggered by Cloud Functions to execute scheduled family posts.

**Request Body:**
```json
{
  "userId": "user_123",
  "authToken": "secret_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Family auto-post executed successfully",
  "userId": "user_123",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "executionTimeMs": 3500
}
```

## Auto-Posting Workflow

1. **Schedule Check**: System checks all enabled schedules for the user
2. **Time Matching**: Filters schedules that match current time/day
3. **Duplicate Prevention**: Checks if already executed in current hour
4. **Profile Validation**: Verifies profile is active and has members
5. **Instagram Validation**: Confirms Instagram account is available
6. **Prompt Selection**: Gets the prompt template for the schedule
7. **Context Building**: Builds family context from members based on category
8. **Prompt Generation**: Combines family context + base prompt
9. **Image Generation**: Uses AI to generate image from prompt
10. **Image Upload**: Uploads to Firebase Storage
11. **Caption Generation**: Creates caption and hashtags
12. **Instagram Posting**: Posts to Instagram with image and caption
13. **Logging**: Records success/failure in logs

## Usage Flow

### For Users:

1. **Create Family Profile**
   - Navigate to Family Auto Poster
   - Click "Create Profile"
   - Enter profile name (e.g., "Johnson Family")
   - Select Instagram account
   - Add family members with roles and optional ages
   - Save profile

2. **Initialize Prompts**
   - Click "Schedules" on the profile card
   - Use "Initialize Defaults" for quick start (15 prompts)
   - Or add custom prompts manually

3. **Create Schedule**
   - Click "Add Schedule"
   - Select a prompt from the list
   - Choose frequency (Daily/Weekly)
   - Set time
   - If weekly, select day of week
   - Save schedule

4. **Monitor Posts**
   - Switch to "Post History" tab
   - View all auto-posted content
   - Check success/failure status
   - View on Instagram (if successful)

## Integration Points

### With Existing Modules:
- **Instagram Service**: Reuses existing Instagram account management
- **AI Service**: Reuses image generation service
- **Storage Service**: Reuses Firebase Storage upload
- **Authentication**: Uses existing AuthContext

### Cloud Functions Setup:
Similar to Module 3, requires a Cloud Function that:
1. Runs on a schedule (e.g., every hour)
2. Queries all users with enabled family schedules
3. Calls `/api/family-auto-post` for each user
4. Handles errors and retries

## Environment Variables

```env
AUTO_POST_SECRET_TOKEN=your-secret-token-here
```

## Security Considerations

1. **Authorization Token**: API endpoint requires secret token
2. **User Validation**: Only processes schedules for authenticated users
3. **Rate Limiting**: Duplicate execution prevention
4. **Error Handling**: Comprehensive error logging without exposing sensitive data

## Future Enhancements

1. **AI-Enhanced Captions**: Use GPT to generate contextual captions
2. **Image Consistency**: Integration with Module 2 character images
3. **Multiple Instagram Accounts**: Allow profiles to post to multiple accounts
4. **Advanced Scheduling**: Specific dates, holidays, special occasions
5. **Story Posting**: Support for Instagram Stories
6. **Analytics**: Track engagement metrics per family profile
7. **Template Library**: Curated seasonal/holiday prompt templates

## Testing

### Manual Testing:
1. Create a test family profile
2. Add test members
3. Initialize default prompts
4. Create a schedule for immediate time
5. Manually trigger API endpoint
6. Verify image generation and Instagram post
7. Check logs in Post History

### API Testing:
```bash
# Health check
curl http://localhost:3000/api/family-auto-post

# Test execution (with valid token)
curl -X POST http://localhost:3000/api/family-auto-post \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user_id","authToken":"your-secret-token"}'
```

## Troubleshooting

### Common Issues:

1. **No schedules executing**
   - Check if schedules are enabled
   - Verify profile is active
   - Confirm Instagram account is valid
   - Check Cloud Function logs

2. **Instagram posting fails**
   - Verify Instagram access token is valid
   - Check account permissions
   - Ensure image URL is accessible
   - Review Instagram API errors in logs

3. **Image generation fails**
   - Check AI service configuration
   - Verify Gemini API key
   - Review prompt length and content
   - Check storage quota

4. **Duplicate posts**
   - Verify duplicate prevention logic
   - Check timezone settings
   - Review execution logs

## Maintenance

### Regular Tasks:
- Monitor Firebase Storage usage
- Review failed post logs
- Update default prompts seasonally
- Validate Instagram token expiry
- Clean up old logs (optional)

---

**Module 4 is now complete and ready for deployment!**
