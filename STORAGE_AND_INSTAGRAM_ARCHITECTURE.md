# Storage and Instagram Multi-Account Architecture

## Overview
This document describes the modular storage structure and multi-account Instagram integration implemented in the Autogram application.

## 🗂️ Firebase Storage Structure

### Module-Based Organization
Images are now organized by module type for better management and scalability:

```
users/
  {userId}/
    module1/              # AI Image Generator (Text-to-Image)
      generated/          # Generated images
        {timestamp}-{random}.png
    module2/              # Character Model Generator (Image-to-Image)
      generated/          # Character-based generated images
        {timestamp}-{random}.png
      characters/         # Character reference images
        {characterId}/
          original.jpg    # Original character image
          thumbnail.jpg   # 120x120 thumbnail
    module3/              # Auto-Poster (Image-to-Image)
      generated/          # Character-based generated images
        {timestamp}-{random}.png
      characters/         # Character reference images
        {characterId}/
          original.jpg    # Original character image
          thumbnail.jpg   # 120x120 thumbnail
```

### Benefits
- **Clear Separation**: Each module has its own directory
- **Scalability**: Easy to add new modules (module4, module5, etc.)
- **Organization**: Easy to locate and manage images
- **Analytics**: Track storage usage per module
- **Billing**: Calculate costs per module if needed

## 📸 Multi-Account Instagram Integration

### Configuration Structure

#### Type Definition (`types.ts`)
```typescript
export interface InstagramAccount {
  id: string;                    // Unique identifier (e.g., "account1", "account2")
  name: string;                  // Display name (e.g., "Main Account")
  username: string;              // Instagram username
  accessToken: string;           // Instagram Graph API access token
  accountId: string;             // Instagram Business Account ID
  profilePictureUrl?: string;    // Optional profile picture
  isActive: boolean;             // Enable/disable account
}

export interface InstagramConfig {
  appId: string;                 // Instagram App ID
  appSecret: string;             // Instagram App Secret
  accounts: InstagramAccount[];  // Array of Instagram accounts
}
```

#### Environment Configuration (`environments.ts`)
```typescript
const UAT_INSTAGRAM: InstagramConfig = {
  appId: "1408513954025673",
  appSecret: "1beb014e5c9b74c73f1bb38ba1a1e325",
  accounts: [
    {
      id: "account1",
      name: "Main Account",
      username: "main_account",
      accessToken: "YOUR_ACCESS_TOKEN_1",
      accountId: "17841478413044591",
      isActive: true
    },
    {
      id: "account2",
      name: "Secondary Account",
      username: "secondary_account",
      accessToken: "YOUR_ACCESS_TOKEN_2",
      accountId: "YOUR_ACCOUNT_ID_2",
      isActive: true
    }
    // Add more accounts as needed
  ]
};
```

### Adding New Instagram Accounts

1. **Get Instagram Business Account Credentials**:
   - Create Instagram Business Account
   - Connect to Facebook Page
   - Generate long-lived access token via Graph API
   - Get Instagram Account ID

2. **Add to Configuration**:
   ```typescript
   {
     id: "account3",              // Unique ID
     name: "Brand Account",       // Display name
     username: "brand_handle",    // Instagram @username
     accessToken: "EAABc...",     // Long-lived access token
     accountId: "178414...",      // Instagram Business ID
     isActive: true               // Enable this account
   }
   ```

3. **Account Management**:
   - Set `isActive: false` to temporarily disable an account
   - Users can select from active accounts in the UI
   - Each post is tracked with the specific account ID

## 🔄 Service Updates

### StorageService
```typescript
// New signature with module support
uploadImage(
  base64Image: string,
  userId: string,
  moduleType: 'module1' | 'module2' | 'module3',  // Module identifier
  subfolder?: string                                // Optional subfolder
): Promise<string>

// Character-specific upload
uploadCharacterImage(
  base64Image: string,
  userId: string,
  characterId: string,
  type: 'original' | 'thumbnail'
): Promise<string>
```

### InstagramService
```typescript
// Get all active accounts
getAccounts(): InstagramAccount[]

// Get specific account
getAccountById(accountId: string): InstagramAccount | null

// Post to specific account
postImage(
  imageUrl: string,
  caption: string,
  accountId: string = 'account1'  // Default to first account
): Promise<string>

// Test specific account connection
testConnection(accountId: string): Promise<InstagramAccount>
```

### ImageService
```typescript
// Save with module tracking
saveImage(data: {
  userId: string;
  prompt: string;
  imageBase64: string;
  model: string;
  moduleType?: ModuleType;  // 'module1' or 'module2'
}): Promise<string>

// Get images by module
getUserImages(
  userId: string,
  limitCount?: number,
  moduleType?: ModuleType  // Optional filter
): Promise<GeneratedImage[]>
```

### InstagramPostService
```typescript
// Save with module and account tracking
savePost(data: {
  userId: string;
  imageId: string;
  prompt: string;
  caption: string;
  hashtags: string;
  imageUrl: string;
  instagramPostId: string;
  instagramAccountId: string;      // Which account was used
  instagramAccountName?: string;   // Account display name
  model: string;
  moduleType?: ModuleType;         // Which module created it
}): Promise<string>

// Get posts by module
getUserPosts(
  userId: string,
  limitCount?: number,
  moduleType?: ModuleType  // Optional filter
): Promise<InstagramPost[]>
```

## 📊 Firestore Document Structure

### generated_images Collection
```typescript
{
  id: string;
  userId: string;
  moduleType: 'module1' | 'module2' | 'module3';  // NEW
  prompt: string;
  imageUrl: string;
  model: string;
  status: 'generated' | 'saved' | 'posted' | 'deleted';
  isFavorite: boolean;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### instagram_posts Collection
```typescript
{
  id: string;
  userId: string;
  moduleType: 'module1' | 'module2' | 'module3';     // NEW
  imageId: string;
  prompt: string;
  caption: string;
  hashtags: string;
  imageUrl: string;
  instagramPostId: string;
  instagramAccountId: string;             // NEW
  instagramAccountName: string;           // NEW
  model: string;
  status: 'posted' | 'failed';
  error?: string;
  postedAt: Timestamp;
  createdAt: Timestamp;
}
```

### characters Collection
```typescript
{
  id: string;
  userId: string;
  name: string;
  imageUrl: string;        // Storage path: module2/characters/{id}/original.jpg
  thumbnailUrl: string;    // Storage path: module2/characters/{id}/thumbnail.jpg
  imageBase64: string;
  uploadedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
}
```

### character_posts Collection
```typescript
{
  id: string;
  userId: string;
  moduleType: 'module2' | 'module3';      // Module 2 or Module 3
  characterId: string;
  characterName: string;
  prompt: string;
  generatedImageBase64: '';               // Empty to avoid 1MB limit
  generatedImageUrl: string;              // Storage URL
  caption: string;
  hashtags: string;
  instagramAccountId: string;             // NEW
  instagramAccountName: string;           // NEW
  postedToInstagram: boolean;
  instagramPostId: string | null;
  model: string;
  timestamp: string;
}
```

## 🎨 UI Components

### InstagramAccountSelector
- Displays all active Instagram accounts
- Shows account name, username, and status
- Radio button selection for choosing account
- Auto-selects first account if none selected
- Shows account count if multiple available
- Visual indicator for selected account
- Green checkmark for active accounts

## 📈 Analytics and Filtering

### Get Statistics by Module
```typescript
// Module 1 posts
const module1Posts = await InstagramPostService.getUserPosts(userId, 50, 'module1');
const module1Count = await InstagramPostService.getSuccessfulPostsCount(userId, 'module1');

// Module 2 posts
const module2Posts = await InstagramPostService.getUserPosts(userId, 50, 'module2');
const module2Count = await InstagramPostService.getSuccessfulPostsCount(userId, 'module2');

// Module 3 posts
const module3Posts = await InstagramPostService.getUserPosts(userId, 50, 'module3');
const module3Count = await InstagramPostService.getSuccessfulPostsCount(userId, 'module3');

// All posts
const allPosts = await InstagramPostService.getUserPosts(userId, 50);
```

### Get Images by Module
```typescript
// Module 1 images
const module1Images = await ImageService.getUserImages(userId, 50, 'module1');

// Module 2 images
const module2Images = await ImageService.getUserImages(userId, 50, 'module2');

// Module 3 images
const module3Images = await ImageService.getUserImages(userId, 50, 'module3');

// All images
const allImages = await ImageService.getUserImages(userId, 50);
```

## 🔐 Security Considerations

1. **Access Tokens**: Store in environment configuration, not in public code
2. **Storage Rules**: Ensure users can only access their own images
3. **Firestore Rules**: Validate userId matches authenticated user
4. **Account Management**: Only show active accounts to users
5. **Rate Limiting**: Instagram has API rate limits per account

## 🚀 Future Enhancements

1. **Account Rotation**: Automatically rotate between accounts for high-volume posting
2. **Scheduling**: Schedule posts to specific accounts at specific times
3. **Analytics Dashboard**: Track performance per account and module
4. **Account Health**: Monitor token expiration and connection status
5. **Module 4+**: Easy to add new modules with same structure
6. **Bulk Operations**: Post same image to multiple accounts
7. **Account Groups**: Group accounts by brand, client, or campaign

## 📝 Migration Notes

### Existing Data
- Old images without `moduleType` will default to 'module1'
- Old posts without `moduleType` will default to 'module1'
- Old posts without account name will show "Instagram Account"

### Backward Compatibility
- All services have optional `moduleType` parameters
- Default values ensure existing code continues working
- New features are additive, not breaking changes

## 🎯 Best Practices

1. **Always specify moduleType** when creating new images/posts
2. **Pass account ID** to Instagram posting functions
3. **Store account display name** with posts for better tracking
4. **Use subfolder parameter** in StorageService for additional organization
5. **Filter by module** when displaying analytics or history
6. **Validate account exists** before posting
7. **Handle inactive accounts** gracefully in UI

## 📞 Support

For questions or issues:
1. Check environment configuration is correct
2. Verify Instagram access tokens are valid
3. Ensure account IDs match Instagram Business Accounts
4. Review Firebase Storage rules
5. Check Firestore indexes are deployed

---

**Last Updated**: November 16, 2025
**Version**: 3.0.0
**Module Support**: Module 1 (AI Generator), Module 2 (Character Generator), Module 3 (Auto-Poster)
