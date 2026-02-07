# Deployment Scripts

This folder contains helper scripts for managing the Git workflow and deployments.

## Platform Support

- **Windows**: Use `.ps1` (PowerShell) scripts
- **Mac/Linux**: Use `.sh` (Bash) scripts

Both versions provide identical functionality.

## Main Workflow Scripts

### Create New Feature Branch

**Windows:**
```powershell
.\scripts\new-feature.ps1
```

**Mac/Linux:**
```bash
./scripts/new-feature.sh
```

**What it does:**
1. Switches to uat branch
2. Pulls latest changes
3. Prompts for branch name
4. Creates and switches to new feature branch

### Merge Feature to UAT

**Windows:**
```powershell
# While on your feature branch
.\scripts\merge-to-uat.ps1
```

**Mac/Linux:**
```bash
# While on your feature branch
./scripts/merge-to-uat.sh
```

**What it does:**
1. Checks for uncommitted changes
2. Pushes feature branch to remote
3. Switches to uat
4. Merges feature into uat
5. Pushes to uat for deployment

### Deploy to Production

**Windows:**
```powershell
.\scripts\deploy-to-production.ps1
```

**Mac/Linux:**
```bash
./scripts/deploy-to-production.sh
```

**What it does:**
1. Confirms you've tested in UAT
2. Merges uat into production
3. Checks IS_PRODUCTION flag
4. Changes to WEBSTUDIOCSE author
5. Pushes to production
6. Restores original author

## Quick Push Scripts

### Push to UAT

**Windows:** `.\scripts\push-to-uat.ps1`  
**Mac/Linux:** `./scripts/push-to-uat.sh`

Direct push to uat branch (use merge-to-uat for feature merges).

### Push to Production

**Windows:** `.\scripts\push-to-production.ps1`  
**Mac/Linux:** `./scripts/push-to-production.sh`

Direct push to production branch (use deploy-to-production for full workflow).

## Complete Feature Development Workflow

**Windows:**
```powershell
# 1. Create new feature branch
.\scripts\new-feature.ps1
# Enter: feature/my-awesome-feature

# 2. Develop your feature
# ... make changes ...
git add .
git commit -m "Add awesome feature"

# 3. Merge to UAT for testing
.\scripts\merge-to-uat.ps1

# 4. Test in UAT environment
# Visit: https://autogram-orpin.vercel.app

# 5. Deploy to production (after testing)
.\scripts\deploy-to-production.ps1

# 6. Clean up feature branch (optional)
git branch -d feature/my-awesome-feature
git push origin --delete feature/my-awesome-feature
```

**Mac/Linux:**
```bash
# 1. Create new feature branch
./scripts/new-feature.sh
# Enter: feature/my-awesome-feature

# 2. Develop your feature
# ... make changes ...
git add .
git commit -m "Add awesome feature"

# 3. Merge to UAT for testing
./scripts/merge-to-uat.sh

# 4. Test in UAT environment
# Visit: https://autogram-orpin.vercel.app

# 5. Deploy to production (after testing)
./scripts/deploy-to-production.sh

# 6. Clean up feature branch (optional)
git branch -d feature/my-awesome-feature
git push origin --delete feature/my-awesome-feature
```

## Quick Reference

| Task | Windows | Mac/Linux |
|------|---------|-----------|
| Start new feature | `.\scripts\new-feature.ps1` | `./scripts/new-feature.sh` |
| Test feature in UAT | `.\scripts\merge-to-uat.ps1` | `./scripts/merge-to-uat.sh` |
| Deploy to production | `.\scripts\deploy-to-production.ps1` | `./scripts/deploy-to-production.sh` |
| Quick push to UAT | `.\scripts\push-to-uat.ps1` | `./scripts/push-to-uat.sh` |
| Quick push to prod | `.\scripts\push-to-production.ps1` | `./scripts/push-to-production.sh` |

## Git Commands

| Task | Command |
|------|---------|
| Check current branch | `git branch` |
| View all branches | `git branch -a` |
| Switch branch | `git checkout <branch-name>` |
| View commit history | `git log --oneline` |

## Branch Structure

```
production (https://www.elitemindsetforge.com)
  └── uat (https://autogram-orpin.vercel.app)
       └── feature/your-feature (development)
```

## Environment Configuration

Both UAT and Production use the same API URL: `https://autogram-orpin.vercel.app`

The environment is controlled by the `IS_PRODUCTION` flag in `src/lib/firebase/config/environments.ts`:
- `IS_PRODUCTION = false` → UAT configuration
- `IS_PRODUCTION = true` → PROD configuration
