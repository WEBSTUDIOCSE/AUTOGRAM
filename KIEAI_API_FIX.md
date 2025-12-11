# Kie.ai API Endpoint Fix

## Issue
Kie.ai image generation was failing with `404 Not Found` error when checking task status.

**Error Details:**
```
Request URL: https://api.kie.ai/api/v1/jobs/getTaskDetails/18da8d0761040828525182ed0b07b410
Status Code: 404 Not Found
```

## Root Cause
The KieAIProvider was using incorrect API endpoints:
- ❌ **Wrong**: `/api/v1/jobs/getTaskDetails/{taskId}`
- ✅ **Correct**: `/api/v1/jobs/recordInfo?taskId={taskId}`

## Solution
Updated the Kie.ai provider to use the correct Market API endpoints and response structure.

### Files Modified
`src/lib/services/image-generation/providers/kieai.provider.ts`

### Changes Made

#### 1. Updated Task Status Interface
```typescript
// OLD interface (incorrect)
interface KieAITaskStatusResponse {
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: {
      images?: string[];
    };
  };
}

// NEW interface (correct)
interface KieAITaskStatusResponse {
  data: {
    successFlag: 0 | 1 | 2; // 0: generating, 1: success, 2: failed
    progress?: string;
    response?: {
      result_urls?: string[];
    };
    errorCode?: number | null;
    errorMessage?: string | null;
  };
}
```

#### 2. Fixed Endpoint in checkTaskStatus()
```typescript
// OLD (404 error)
const response = await fetch(`${this.baseUrl}/jobs/getTaskDetails/${taskId}`, ...);

// NEW (correct)
const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, ...);
```

#### 3. Updated Status Mapping
```typescript
// Map successFlag to status strings
// 0: Generating (in progress) → 'processing'
// 1: Success (completed)      → 'completed'
// 2: Failed                    → 'failed'

let status: 'pending' | 'processing' | 'completed' | 'failed';

if (data.data.successFlag === 1) {
  status = 'completed';
} else if (data.data.successFlag === 2) {
  status = 'failed';
} else {
  status = 'processing';
}
```

#### 4. Fixed Image URL Extraction
```typescript
// OLD (incorrect property)
if (data.data.result?.images && data.data.result.images.length > 0) {
  return { imageUrl: data.data.result.images[0] };
}

// NEW (correct property)
if (data.data.response?.result_urls && data.data.response.result_urls.length > 0) {
  return { imageUrl: data.data.response.result_urls[0] };
}
```

#### 5. Fixed pollTaskCompletion() Endpoint
```typescript
// OLD
const response = await fetch(`${this.baseUrl}/jobs/getTaskDetails/${taskId}`, ...);

// NEW
const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, ...);
```

#### 6. Fixed Type Error
```typescript
// OLD (TypeScript error: model could be undefined)
model: model,

// NEW
const selectedModel = model || this.defaultModel;
...
model: selectedModel,
```

## API Documentation Reference

### Market API Structure
According to [Kie.ai Market API Docs](https://docs.kie.ai/market/quickstart):

**Create Task:**
```
POST https://api.kie.ai/api/v1/jobs/createTask
```

**Query Task Status:**
```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
```

### Response Format
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_abc123",
    "successFlag": 1,
    "progress": "1.00",
    "response": {
      "result_urls": [
        "https://example.com/image.png"
      ]
    },
    "completeTime": "2025-12-09 17:30:00",
    "errorCode": null,
    "errorMessage": null
  }
}
```

### Success Flags
- `0` - **Generating**: Task is in progress
- `1` - **Success**: Task completed successfully
- `2` - **Failed**: Task failed with error

## Testing
✅ No TypeScript errors
✅ Correct endpoint: `/jobs/recordInfo?taskId={id}`
✅ Proper response parsing with `successFlag`
✅ Image URLs extracted from `response.result_urls`
✅ Error messages from `errorMessage` field

## Next Steps
1. Test the image generation with Kie.ai provider
2. Verify task polling works correctly
3. Confirm images are downloaded successfully
4. Monitor for any additional API changes

## Related Files
- `src/lib/services/image-generation/providers/kieai.provider.ts` - Fixed provider
- `src/lib/firebase/config/environments.ts` - Kie.ai config
- `src/app/(protected)/dashboard/ai-settings/page.tsx` - Settings UI

---
**Status**: ✅ Fixed
**Date**: December 9, 2025
**Issue**: 404 error on task status endpoint
**Resolution**: Updated to correct Market API endpoints
