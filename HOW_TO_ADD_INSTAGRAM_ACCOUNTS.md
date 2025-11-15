# How to Add Multiple Instagram Accounts

## Quick Start Guide

### Step 1: Get Instagram Business Account Credentials

1. **Create/Connect Instagram Business Account**:
   - Must be an Instagram Business Account (not Personal)
   - Must be connected to a Facebook Page
   - Cannot use Personal Instagram accounts

2. **Get Access Token**:
   - Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Select your Instagram App
   - Add permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
   - Generate Token
   - Use [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to extend token

3. **Get Instagram Account ID**:
   ```
   GET https://graph.facebook.com/v18.0/me/accounts?access_token={YOUR_TOKEN}
   
   Then use the page_id to get Instagram Account ID:
   GET https://graph.facebook.com/v18.0/{page_id}?fields=instagram_business_account&access_token={YOUR_TOKEN}
   ```

### Step 2: Add to Configuration

Open `src/lib/firebase/config/environments.ts` and add your account to the accounts array:

#### UAT Environment
```typescript
const UAT_INSTAGRAM: InstagramConfig = {
  appId: "1408513954025673",
  appSecret: "1beb014e5c9b74c73f1bb38ba1a1e325",
  accounts: [
    {
      id: "account1",
      name: "Main Account",
      username: "main_account",
      accessToken: "EXISTING_TOKEN",
      accountId: "17841478413044591",
      isActive: true
    },
    // ADD YOUR NEW ACCOUNT HERE
    {
      id: "account2",                                    // Unique ID (account2, account3, etc.)
      name: "My Brand Account",                          // Display name shown in UI
      username: "mybrandaccount",                        // Instagram @username
      accessToken: "EAABc...YOUR_LONG_TOKEN_HERE...",  // Long-lived access token
      accountId: "17841478413044999",                   // Instagram Business Account ID
      isActive: true                                     // Set to false to disable
    }
  ]
};
```

#### Production Environment
For production, use environment variables:

```typescript
const PROD_INSTAGRAM: InstagramConfig = {
  appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID_PROD || "",
  appSecret: process.env.INSTAGRAM_APP_SECRET_PROD || "",
  accounts: [
    {
      id: "account1",
      name: "Production Account 1",
      username: process.env.INSTAGRAM_USERNAME_1_PROD || "",
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_1_PROD || "",
      accountId: process.env.INSTAGRAM_ACCOUNT_ID_1_PROD || "",
      isActive: true
    },
    // Add more accounts
    {
      id: "account2",
      name: "Production Account 2",
      username: process.env.INSTAGRAM_USERNAME_2_PROD || "",
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_2_PROD || "",
      accountId: process.env.INSTAGRAM_ACCOUNT_ID_2_PROD || "",
      isActive: true
    }
  ]
};
```

### Step 3: Add Environment Variables (Production Only)

Create/update `.env.local`:

```bash
# Account 1
INSTAGRAM_USERNAME_1_PROD=mainaccount
INSTAGRAM_ACCESS_TOKEN_1_PROD=EAABc...YOUR_TOKEN_HERE...
INSTAGRAM_ACCOUNT_ID_1_PROD=17841478413044591

# Account 2
INSTAGRAM_USERNAME_2_PROD=secondaccount
INSTAGRAM_ACCESS_TOKEN_2_PROD=EAABc...YOUR_TOKEN_HERE...
INSTAGRAM_ACCOUNT_ID_2_PROD=17841478413044999

# Account 3
INSTAGRAM_USERNAME_3_PROD=thirdaccount
INSTAGRAM_ACCESS_TOKEN_3_PROD=EAABc...YOUR_TOKEN_HERE...
INSTAGRAM_ACCOUNT_ID_3_PROD=17841478413055000
```

### Step 4: Test the Account

1. **Restart Development Server**:
   ```bash
   npm run dev
   ```

2. **Check Account Selector**:
   - Go to Module 1 or Module 2
   - Generate an image
   - Scroll to "Post to Instagram Account" section
   - You should see all your accounts listed

3. **Test Posting**:
   - Select your new account
   - Fill in caption and hashtags
   - Click "Post to Instagram"
   - Check Instagram to verify post

## Account Management

### Temporarily Disable an Account
Set `isActive: false`:
```typescript
{
  id: "account2",
  name: "Secondary Account",
  username: "secondary",
  accessToken: "...",
  accountId: "...",
  isActive: false  // This account won't show in UI
}
```

### Remove an Account
Simply delete the entire account object from the array.

### Reorder Accounts
The first account in the array is selected by default. Reorder accounts to change the default:
```typescript
accounts: [
  { id: "account2", ... },  // This will be default now
  { id: "account1", ... },
  { id: "account3", ... }
]
```

## Account Naming Conventions

### Account IDs
- Use lowercase: `account1`, `account2`, `account3`
- Use descriptive names: `main_account`, `brand_account`, `client_account`
- Keep it simple and unique

### Display Names
- Use friendly names: "Main Account", "Brand Account", "Client Account"
- This is what users see in the UI
- Can include emojis: "🎨 Art Account", "📸 Photo Account"

## Troubleshooting

### Account Not Showing in UI
- ✅ Check `isActive: true`
- ✅ Verify configuration syntax is correct
- ✅ Restart development server
- ✅ Check browser console for errors

### "Account Not Found" Error
- ✅ Verify account ID matches exactly
- ✅ Check for typos in `id` field
- ✅ Ensure account is in accounts array

### "Failed to Post" Error
- ✅ Token might be expired (tokens expire after 60 days)
- ✅ Instagram account must be Business account
- ✅ Must be connected to Facebook Page
- ✅ Check permissions: `instagram_basic`, `instagram_content_publish`

### Token Expired
Instagram access tokens expire after 60 days. To refresh:
1. Go to Facebook Graph API Explorer
2. Generate new token with same permissions
3. Replace old token in configuration
4. Restart server

## Advanced Configuration

### Different Accounts for Different Modules

You can create separate account lists for each module:

```typescript
const MODULE1_ACCOUNTS = [
  { id: "module1_account1", name: "Module 1 Main", ... },
  { id: "module1_account2", name: "Module 1 Secondary", ... }
];

const MODULE2_ACCOUNTS = [
  { id: "module2_account1", name: "Module 2 Main", ... },
  { id: "module2_account2", name: "Module 2 Secondary", ... }
];

const UAT_INSTAGRAM: InstagramConfig = {
  appId: "...",
  appSecret: "...",
  accounts: [...MODULE1_ACCOUNTS, ...MODULE2_ACCOUNTS]
};
```

### Account Groups

Add custom metadata to accounts:

```typescript
{
  id: "account1",
  name: "Brand Account",
  username: "brandaccount",
  accessToken: "...",
  accountId: "...",
  isActive: true,
  // Custom metadata
  metadata: {
    group: "brand",
    region: "US",
    language: "en",
    purpose: "marketing"
  }
}
```

## Security Best Practices

1. **Never commit tokens to Git**:
   ```bash
   # Add to .gitignore
   .env.local
   .env.production.local
   ```

2. **Rotate tokens regularly**:
   - Set calendar reminder for 50 days
   - Refresh tokens before expiration

3. **Use environment variables in production**:
   - Never hardcode tokens in production
   - Always use `process.env.VARIABLE_NAME`

4. **Limit account access**:
   - Only give accounts necessary permissions
   - Revoke unused tokens from Facebook App settings

5. **Monitor account activity**:
   - Track which accounts are being used
   - Review Instagram Insights regularly
   - Watch for unusual activity

## Testing Checklist

Before deploying new accounts:

- [ ] Access token is valid
- [ ] Account ID is correct
- [ ] Account is Business account
- [ ] Connected to Facebook Page
- [ ] Has required permissions
- [ ] Account shows in UI
- [ ] Can post to account successfully
- [ ] Post appears on Instagram
- [ ] Post saved in Firestore with correct account info
- [ ] Account name displayed correctly in UI

## Example: Adding 3 Accounts

```typescript
const UAT_INSTAGRAM: InstagramConfig = {
  appId: "1408513954025673",
  appSecret: "1beb014e5c9b74c73f1bb38ba1a1e325",
  accounts: [
    // Main brand account
    {
      id: "main_brand",
      name: "🎨 Main Brand",
      username: "mainbrand",
      accessToken: "EAABc...TOKEN1...",
      accountId: "178414784130001",
      isActive: true
    },
    // Secondary marketing account
    {
      id: "marketing",
      name: "📢 Marketing",
      username: "brandmarketing",
      accessToken: "EAABc...TOKEN2...",
      accountId: "178414784130002",
      isActive: true
    },
    // Client account
    {
      id: "client_account",
      name: "👤 Client Account",
      username: "clientbrand",
      accessToken: "EAABc...TOKEN3...",
      accountId: "178414784130003",
      isActive: true
    }
  ]
};
```

## Need Help?

Common resources:
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Access Token Documentation](https://developers.facebook.com/docs/facebook-login/access-tokens)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

---

**Note**: Instagram API has rate limits. If posting to multiple accounts rapidly, you may hit rate limits. Consider implementing delays between posts if needed.
