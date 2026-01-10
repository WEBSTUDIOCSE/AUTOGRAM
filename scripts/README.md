# Deployment Scripts

This folder contains helper scripts for managing the Git workflow and deployments.

## Main Workflow Scripts

### `new-feature.ps1`
Creates a new feature branch from uat.

**Usage:**
```powershell
.\scripts\new-feature.ps1
```

**What it does:**
1. Switches to uat branch
2. Pulls latest changes
3. Prompts for branch name
4. Creates and switches to new feature branch

### `merge-to-uat.ps1`
Merges your current feature branch into uat for testing.

**Usage:**
```powershell
# While on your feature branch
.\scripts\merge-to-uat.ps1
```

**What it does:**
1. Checks for uncommitted changes
2. Pushes feature branch to remote
3. Switches to uat
4. Merges feature into uat
5. Pushes to uat for deployment

### `deploy-to-production.ps1`
Deploys uat changes to production (main branch).

**Usage:**
```powershell
.\scripts\deploy-to-production.ps1
```

**What it does:**
1. Confirms you've tested in UAT
2. Merges uat into main
3. Checks IS_PRODUCTION flag
4. Changes to WEBSTUDIOCSE author
5. Pushes to production
6. Restores original author

## Legacy Scripts

### `push-to-main.ps1`
Direct push to main (use `deploy-to-production.ps1` instead).

### `push-to-uat.ps1`
Direct push to uat (use `merge-to-uat.ps1` instead).

## Complete Feature Development Workflow

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
# Visit: https://elitemindsetforge-git-uat-*.vercel.app

# 5. Deploy to production (after testing)
.\scripts\deploy-to-production.ps1

# 6. Clean up feature branch (optional)
git branch -d feature/my-awesome-feature
git push origin --delete feature/my-awesome-feature
```

## Quick Reference

| Task | Command |
|------|---------|
| Start new feature | `.\scripts\new-feature.ps1` |
| Test feature in UAT | `.\scripts\merge-to-uat.ps1` |
| Deploy to production | `.\scripts\deploy-to-production.ps1` |
| Check current branch | `git branch` |
| View all branches | `git branch -a` |

## Branch Structure

```
main (production)
  └── uat (testing)
       └── feature/your-feature (development)
```

See [WORKFLOW.md](../WORKFLOW.md) for detailed Git workflow guide.
