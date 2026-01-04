# Firebase Firestore UAT Data Cleanup Guide

This guide provides step-by-step instructions to clear all UAT (User Acceptance Testing) data from your Firebase Firestore collections.

## ⚠️ IMPORTANT WARNING

**BACKUP YOUR DATA FIRST!** Once you delete data from Firestore, it cannot be recovered unless you have a backup.

## Method 1: Using Firebase Console (Recommended for Small Datasets)

### Steps:

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project: "autogram"

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on "Data" tab

3. **Delete Collections One by One**
   
   For each collection you want to clear:
   
   a. **Click on the collection name** (e.g., `motivational_auto_post_logs`)
   
   b. **Select documents:**
      - Click on the first document
      - Hold Shift and click on the last visible document (selects multiple)
      - Or click on individual documents while holding Ctrl/Cmd
   
   c. **Delete selected documents:**
      - Click the trash icon at the top
      - Confirm deletion
   
   d. **Repeat until all documents are deleted**
      - You may need to refresh the page to see more documents
      - Continue until the collection is empty

### Collections to Clear for Autogram UAT Data:

```
✅ motivational_auto_post_logs       (Module 9 - Motivational Quotes)
✅ motivational_auto_post_configs    (Module 9 - Configs)
✅ character_auto_post_logs          (Module 2 - Character Posts)
✅ character_auto_post_configs       (Module 2 - Configs)
✅ family_auto_post_logs             (Module 3 - Family Posts)
✅ family_auto_post_configs          (Module 3 - Configs)
✅ video_auto_post_logs              (Video auto-post logs)
✅ video_auto_post_configs           (Video auto-post configs)
✅ instagram_accounts                (Instagram account connections)
✅ user_preferences                  (User AI model preferences)
✅ payment_transactions              (Test payment data)
✅ user_subscriptions                (Test subscription data)
```

**Note:** Do NOT delete the `users` collection unless you want to remove all user accounts.

---

## Method 2: Using Firebase CLI (Recommended for Large Datasets)

### Prerequisites:

1. Install Firebase CLI:
   ```powershell
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```powershell
   firebase login
   ```

3. Initialize your project (if not already done):
   ```powershell
   firebase init firestore
   ```

### Steps:

1. **Create a deletion script** (create file: `scripts/clear-firestore-uat.js`):

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to clear
const collectionsToDelete = [
  'motivational_auto_post_logs',
  'motivational_auto_post_configs',
  'character_auto_post_logs',
  'character_auto_post_configs',
  'family_auto_post_logs',
  'family_auto_post_configs',
  'video_auto_post_logs',
  'video_auto_post_configs',
  'instagram_accounts',
  'user_preferences',
  'payment_transactions',
  'user_subscriptions'
];

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log(`Deleted ${batchSize} documents from current batch`);

  // Recurse on the next process tick to avoid blocking
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function clearAllCollections() {
  console.log('🔥 Starting Firestore UAT data cleanup...\n');

  for (const collection of collectionsToDelete) {
    try {
      console.log(`📦 Clearing collection: ${collection}`);
      await deleteCollection(collection);
      console.log(`✅ Successfully cleared: ${collection}\n`);
    } catch (error) {
      console.error(`❌ Error clearing ${collection}:`, error);
    }
  }

  console.log('🎉 Firestore cleanup completed!');
  process.exit(0);
}

clearAllCollections();
```

2. **Run the script**:
   ```powershell
   node scripts/clear-firestore-uat.js
   ```

---

## Method 3: Using Firestore Emulator (For Testing)

If you're using the Firestore emulator for testing:

1. **Stop the emulator**:
   ```powershell
   # Press Ctrl+C in the terminal where emulator is running
   ```

2. **Clear emulator data**:
   ```powershell
   firebase emulators:start --clear-data
   ```

---

## Method 4: Selective Deletion (Delete by User ID or Date)

If you want to delete only specific UAT data (e.g., data from a test user):

### Using Firebase Console:

1. Go to Firestore Database → Data
2. Click on a collection
3. Click "Start collection" to add a filter
4. Filter by `userId` or `timestamp`
5. Delete filtered results

### Using a Script:

```javascript
// Delete documents for a specific test user
const testUserId = 'TEST_USER_ID_HERE';

async function deleteUserData(userId) {
  const collections = [
    'motivational_auto_post_logs',
    'character_auto_post_logs',
    // ... add other collections
  ];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName)
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} documents from ${collectionName}`);
  }
}

deleteUserData(testUserId);
```

---

## Post-Cleanup Verification

After clearing the data:

1. **Check Firestore Console**
   - Verify all targeted collections are empty or deleted
   - Confirm production data (if any) is still intact

2. **Check Application**
   - Test that the app works correctly with empty collections
   - Verify no errors are thrown due to missing data

3. **Re-initialize Required Data**
   - Create new test users if needed
   - Set up new Instagram account connections
   - Configure auto-post settings

---

## Safety Checklist

Before deleting:

- [ ] Confirmed this is a UAT/test environment (NOT production)
- [ ] Made a backup of Firestore data (if needed)
- [ ] Reviewed the list of collections to delete
- [ ] Tested the deletion script on a small dataset first
- [ ] Notified team members about the cleanup
- [ ] Have access to recreate necessary test data

---

## Backup Before Deletion (Optional but Recommended)

### Export Firestore Data:

```powershell
# Install gcloud CLI if not installed
# https://cloud.google.com/sdk/docs/install

# Export all Firestore data
gcloud firestore export gs://YOUR_BUCKET_NAME/firestore-backup-$(date +%Y%m%d)

# Or export specific collections
gcloud firestore export gs://YOUR_BUCKET_NAME/firestore-backup-$(date +%Y%m%d) --collection-ids=motivational_auto_post_logs,character_auto_post_logs
```

---

## Need Help?

If you encounter issues:

1. Check Firebase Console → Firestore Database → Usage for any errors
2. Review Firebase CLI logs for error messages
3. Ensure you have proper permissions (Owner or Editor role)
4. Check if billing is enabled (required for some operations)

---

## Summary

**Quick Steps for Complete UAT Cleanup:**

1. Login to Firebase Console
2. Go to Firestore Database
3. For each collection listed above:
   - Select all documents
   - Click delete
   - Confirm
4. Verify all UAT data is removed
5. Test application functionality

**Estimated Time:** 10-30 minutes depending on data volume

---

**Last Updated:** January 4, 2026
