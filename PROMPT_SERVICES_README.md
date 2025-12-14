# Prompt Services - Module-Wise Organization

## 📁 Structure Overview

Each module has its own prompting services, properly separated and organized.

```
src/lib/services/
├── module1/
│   ├── prompt-refiner.service.ts       ← Manual enhancement
│   └── index.ts
│
├── module2/
│   ├── prompt-refiner.service.ts       ← Character enhancement
│   └── index.ts
│
├── module3/
│   ├── prompt-library.service.ts       ← Template CRUD
│   ├── prompt-refiner.service.ts       ← Manual enhancement
│   ├── prompt-generator.service.ts     ← AI auto-generation
│   └── prompting-index.ts
│
└── module4/
    ├── family-prompt.service.ts        ← Template CRUD
    ├── prompt-refiner.service.ts       ← Manual enhancement
    ├── prompt-generator.service.ts     ← AI auto-generation
    └── prompting-index.ts
```

---

## 📋 Service Types

### **1. Prompt Refiner** (Manual Enhancement)
- **Purpose:** Enhance user-entered prompts for manual posting
- **Used When:** User types a prompt and clicks "Generate"
- **Modules:** All (1, 2, 3, 4)
- **Characteristics:**
  - Simple, fast enhancement
  - Adds photography details
  - Under 250 characters
  - Returns refined version of user input

### **2. Prompt Generator** (AI Auto-Generation)
- **Purpose:** Generate UNIQUE, VARIED prompts automatically
- **Used When:** Firebase triggers for scheduled auto-posting
- **Modules:** 3 (Auto-Poster), 4 (Family Auto-Poster)
- **Characteristics:**
  - AI-powered creativity
  - Checks recent history to avoid repetition
  - Considers time/season context
  - Creates completely new scenes

### **3. Prompt Library/Template Service** (Database CRUD)
- **Purpose:** Manage saved prompt templates in Firebase
- **Used When:** User creates/edits/deletes prompt templates
- **Modules:** 3, 4
- **Characteristics:**
  - Firebase Firestore operations
  - Template storage and retrieval
  - Usage tracking

---

## 🔄 Usage Flow

### **Module 1: AI Generator** (Manual Only)
```
User enters prompt
  ↓
Module1PromptRefiner.refinePrompt()
  ↓
Enhanced prompt → Generate Image
```

### **Module 2: Character Generator** (Manual Only)
```
User enters scene
  ↓
Module2PromptRefiner.refineCharacterPrompt()
  ↓
Enhanced scene → Generate Character Image
```

### **Module 3: Auto-Poster**

**Manual Flow:**
```
User creates prompt template
  ↓
Module3PromptRefiner.refinePrompt() (optional)
  ↓
Save to PromptLibraryService
```

**Auto Flow (Firebase Trigger):**
```
Scheduled time reached
  ↓
Load template from PromptLibraryService
  ↓
Get recent posts (last 10)
  ↓
Module3PromptGenerator.generateUniquePrompt()
  ↓
Generate Image → Post to Instagram
```

### **Module 4: Family Auto-Poster**

**Manual Flow:**
```
User creates family prompt template
  ↓
Module4PromptRefiner.refinePrompt() (optional)
  ↓
Save to FamilyPromptService
```

**Auto Flow (Firebase Trigger):**
```
Scheduled time reached
  ↓
Load template from FamilyPromptService
  ↓
Get recent family posts (last 10)
  ↓
Module4PromptGenerator.generateUniquePrompt()
  ↓
Generate Image → Post to Instagram
```

---

## 🎯 Key Principles

### **1. Separation of Concerns**
- **Refiners** = Enhance existing prompts
- **Generators** = Create new prompts with AI
- **Library Services** = Database operations

### **2. Anti-Repetition Strategy**
- Generators check last 10 posts
- AI creates variations based on time/season
- No hardcoded patterns
- Fresh content every time

### **3. Character Limits**
- All prompts kept under 250 characters
- Smart truncation at word boundaries
- API-compatible formatting

---

## 📝 Migration from Old Services

### **Old Structure (Delete These):**
```
❌ src/lib/services/prompting/prompt-refiner.service.ts
❌ src/lib/services/prompting/family-prompt-refiner.service.ts
❌ src/lib/services/prompting/prompt-variation.service.ts
❌ src/lib/services/prompt-refiner.service.ts
❌ src/lib/services/module3/prompt-variation.service.ts
```

### **New Structure (Use These):**
```
✅ src/lib/services/module1/prompt-refiner.service.ts
✅ src/lib/services/module2/prompt-refiner.service.ts
✅ src/lib/services/module3/prompt-refiner.service.ts
✅ src/lib/services/module3/prompt-generator.service.ts
✅ src/lib/services/module4/prompt-refiner.service.ts
✅ src/lib/services/module4/prompt-generator.service.ts
```

---

## 🔧 Implementation Checklist

- [x] Create module-wise prompt services
- [ ] Update Module 1 to use `Module1PromptRefiner`
- [ ] Update Module 2 to use `Module2PromptRefiner`
- [ ] Update Module 3 manual flow to use `Module3PromptRefiner`
- [ ] Update Module 3 auto-poster to use `Module3PromptGenerator`
- [ ] Update Module 4 manual flow to use `Module4PromptRefiner`
- [ ] Update Module 4 auto-poster to use `Module4PromptGenerator`
- [ ] Delete old prompt refining services
- [ ] Test each module independently

---

## 📚 Examples

### Module 3 Auto-Poster Integration:
```typescript
// In auto-post-scheduler.service.ts
import { Module3PromptGenerator } from './prompt-generator.service';
import { CharacterPostService } from '../character-post.service';

// Get recent posts to avoid repetition
const recentPosts = await CharacterPostService.getRecentPosts(userId, 10);
const recentScenes = recentPosts.map(p => p.prompt);

// Get context
const context = Module3PromptGenerator.getGenerationContext(recentScenes);

// Generate UNIQUE prompt
const uniquePrompt = await Module3PromptGenerator.generateUniquePrompt(
  character,
  basePromptTemplate,
  context
);
```

### Module 4 Auto-Poster Integration:
```typescript
// In family-auto-post-scheduler.service.ts
import { Module4PromptGenerator } from './prompt-generator.service';
import { CharacterPostService } from '../character-post.service';

// Get recent family posts
const recentPosts = await CharacterPostService.getRecentPosts(userId, 10);
const recentScenes = recentPosts
  .filter(p => p.moduleType === 'module4')
  .map(p => p.prompt);

// Get context
const context = Module4PromptGenerator.getGenerationContext(profile, recentScenes);

// Generate UNIQUE family prompt
const uniquePrompt = await Module4PromptGenerator.generateUniquePrompt(
  profile,
  basePromptTemplate,
  context
);
```
