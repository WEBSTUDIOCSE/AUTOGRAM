# UAT & Production Branch Setup Guide

## 🎯 Branch Strategy Overview

```
uat (UAT/Preview) → Vercel Auto-Deploy (Preview)
  ↓
main (Production) → Vercel Auto-Deploy (Production)
                 → https://www.autograminsta.online
```

## 📋 Quick Reference

| Environment | Branch | Deployment | URL |
|-------------|--------|------------|-----|
| **UAT** | `uat` | Vercel (Auto) | Preview URL from Vercel |
| **Production** | `main` | Vercel (Auto) | https://www.autograminsta.online |

---

## 🚀 Initial Setup (ONE-TIME)

### Step 1: Create the Branch Structure
UAT Branch

You're currently on `main` branch. Create the UAT branch:

```bash
# 1. Create uat branch from main
git checkout -b uat

# 2. Push uat branch to remote
git push -u origin uat

# 3. Go back to main
git checkout main
```

### Step 2: Configure Vercel Project

In your Vercel dashboard:

#### Production Branch Configuration:
- **Production Branch**: `main`
- **Environment Variables** (Production):
  - `NEXT_PUBLIC_GEMINI_API_KEY_PROD`
  - `NEXT_PUBLIC_KIEAI_API_KEY_PROD`
  - All Firebase config for production

#### Preview Branch Configuration:
- **Preview Branch**: `uat`
- **Environment Variables** (Preview):
  - `NEXT_PUBLIC_UAT`
  - `NEXT_PUBLIC_KIEAI_API_KEY`
  - All Firebase config for UAT

### Step 3: Set Environment Flags

**On `uat` branch:**
```typescript
// src/lib/firebase/config/environments.ts
export const IS_PRODUCTION = false;
```

**On `main` branch:**
```typescript
// src/lib/firebase/config/environments.ts
export const IS_PRODUCTION = true;
```

### Step 4: Connect Custom Domain in Vercel

- Go to your Vercel project → Settings → Domains
- Add: `www.autograminsta.online`
- Configure DNS as instructed by Vercel
---

## 🔄 Daily Workflow

### Working on Features (on `uat` branch)

```bash
# 1. Make sure you're on uat
git checkout uat

# 2. Create a feature branch
git checkout -b feature/my-new-feature

# 3. Make your changes and commit
git add .
git commit -m "feat: add new feature"

# 4. Merge to uat
./scripts/merge-to-uat.sh

# This will:
# - Push your feature branch
# - Switch to uat
# - Merge your feature
# - Push to uat
# - Auto-deploy via GitHub Actions
```

### Deploying UAT to Production

```bash
# 1. Test everything in UAT first
# Visit: https://env-uat-cd3c5.web.app

# 2. When ready, run the deployment script
./scripts/deploy-to-production.sh

# This will:
# - Switch to production branch
# - Merge uat into production
# - Prompt you to verify IS_PRODUCTION = true
# - Push to production
# - Auto-deploy via GitHub Actions
```Vercel auto-deploys the preview
```

### Deploying UAT to Production

```bash
# 1. Test everything in UAT first
# Check the Vercel preview URL

# 2. When ready, run the deployment script
./scripts/deploy-to-production.sh

# This will:
# - Switch to main branch
# - Merge uat into main
# - Prompt you to verify IS_PRODUCTION = true
# - Push to main
# - Vercel auto-deploys to production (autograminsta.online)
---

## ⚙️ Environment Configuration

### UAT Branch (`uat`)
File: `src/lib/firebase/config/environments.ts`
```typescript
export const IS_PRODUCTION = false;  // ← Must be false
```

Firebase Project: `env-uat-cd3c5`
URL: https://env-uat-cd3c5.web.app

### Production Branch (`production`)
File: `src/lib/firebase/config/environments.ts`
```typescript
export const IS_PRODUCTION = true;   // ← Must be true
```

Firebase Project: `autogram-14ddc`
URLs:
- Custom Domain: https://www.autograminsta.online
- Firebase Hosting: https://autogram-14ddc.web.app

---

## 🔐 Firebase Project Setup
Deployment: Vercel Preview (auto-deployed on push)

### Production Branch (`main`)
File: `src/lib/firebase/config/environments.ts`
```typescript
export const IS_PRODUCTION = true;   // ← Must be true
```

Deployment: Vercel Production
- Custom Domain: https://www.autograminsta.online
- Vercel URL: Your project's Vercel domainnfigured

---

## 🚨 Important Reminders

### Before Deploying to Production:
1. ✅ Test thoroughly in UAT
2. ✅ Verify `IS_PRODUCTION = true` in production branch
3. ✅ Check all environment variables are set
4. Firestore → Import rules from `firestore.rules`
3. Storage → Import rules from `storage.rules`
4. Add to Vercel Preview environment variables

### Production Project: autogram-14ddc
1. Firebase Console → autogram-14ddc
2. Firestore → Import rules from `firestore.rules`
3. Storage → Import rules from `storage.rules`
4. Add to Vercel Production environment variables
- Include administrators in restrictions

**Protect `uat` branch:**
- Require status checks to pass

---

## 🔧 Troubleshooting (Vercel preview)
2. ✅ Verify `IS_PRODUCTION = true` in main branch
3. ✅ Check all environment variables are set in Vercel
4. ✅ Verify production Instagram accounts are active
5. ✅ Backup Firestore data (if needed)

### Branch Protection Rules (Recommended):
Go to GitHub → Settings → Branches

**Protect `main` branch:**
- Require pull request reviews
- Require status checks to pass (if you add checks)
- Include administrators in restrictions

**Protect `uat` branch:**
- Require status checks to pass (optional)
# CheVercel deployment failed"
1. Check Vercel dashboard for build logs
2. Verify environment variables are set correctly
3. Check for build errors in the logs
4. Ensure Node.js version is compatible

### "Environment variables not loading"
1. Go to Vercel project → Settings → Environment Variables
2. Ensure variables are set for correct environment (Production/Preview)
3. Redeploy after adding new variables
4. Check variable names match exactly

### "Custom domain not working"
1. Go to Vercel project → Settings → Domains
2. Verify domain is connected: `www.autograminsta.online`
3. Check DNS records are pointing to Vercel
4. Wait for SSL certificate provisioning (can take a few

## 📊 Monitoring

### UAT Deployment Status
- GitHub Actions: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- Live Site: https://env-uat-cd3c5.web.app
- Firebase Console: https://console.firebase.google.com/project/env-uat-cd3c5

### Production Deployment Status
- GitHub Actions: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- Vercel Dashboard: https://vercel.com/dashboard
- Preview Deployments: Check Vercel for preview URLs
- Firebase Console (UAT): https://console.firebase.google.com/project/env-uat-cd3c5

### Production Deployment Status
- Vercel Dashboard: https://vercel.com/dashboard
- Live Site: https://www.autograminsta.online
- Firebase Console (Production)p on feature branches**, never directly on `uat`
2. **Test in UAT** before deploying to production
3. **Use the scripts** - they include safety checks
4. **Never force push** to production branch
5. **Keep commits clean** - use conventional commit messages
6. **Document breaking changes** in commit messages
7. **Review code** before merging to uat

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check Firebase Console for deployment status
4. Verify all secrets are correctly set

---

## 🔄 Quick Command Reference

```bash
# Check current branch
git branch --show-current

# Switch branches
git checkout uat
git checkout production

# Merge feature to uat
./scripts/merge-to-uat.sh

# Deploy to production
./scripts/deploy-to-production.sh
main

# Merge feature to uat
./scripts/merge-to-uat.sh

# Deploy to production
./scripts/deploy-to-production.sh

# Check deployment status
# Go to: https://vercel.com/dashboard

# View environment variables
# Go to: Vercel Project → Settings → Environment Variables