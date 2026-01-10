# Merge Feature to UAT
# This script merges your current feature branch to uat (main branch)

Write-Host "=== Merge Feature to UAT ===" -ForegroundColor Cyan

# Get current branch
$featureBranch = git branch --show-current

# Check if on a feature branch
if ($featureBranch -eq "uat" -or $featureBranch -eq "production") {
    Write-Host "Error: You're on $featureBranch branch. Switch to a feature branch first." -ForegroundColor Red
    exit 1
}

Write-Host "Current branch: $featureBranch" -ForegroundColor Yellow

# Ensure all changes are committed
$status = git status --porcelain
if ($status) {
    Write-Host "`nUncommitted changes detected:" -ForegroundColor Red
    git status --short
    $response = Read-Host "`nDo you want to commit them now? (y/n)"
    
    if ($response -eq "y") {
        $message = Read-Host "Enter commit message"
        git add .
        git commit -m $message
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error committing changes" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please commit your changes first" -ForegroundColor Yellow
        exit 1
    }
}

# Push feature branch
Write-Host "`nPushing $featureBranch to remote..." -ForegroundColor Cyan
git push origin $featureBranch

# Switch to uat
Write-Host "`nSwitching to uat branch..." -ForegroundColor Cyan
git checkout uat
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error switching to uat" -ForegroundColor Red
    exit 1
}

# Update uat
Write-Host "Updating uat branch..." -ForegroundColor Cyan
git pull origin uat
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pulling uat" -ForegroundColor Red
    exit 1
}

# Merge feature into uat
Write-Host "`nMerging $featureBranch into uat..." -ForegroundColor Cyan
git merge $featureBranch --no-ff -m "Merge $featureBranch into uat"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nMerge conflict detected!" -ForegroundColor Red
    Write-Host "Please resolve conflicts manually:" -ForegroundColor Yellow
    Write-Host "1. Open conflicted files in VS Code" -ForegroundColor Gray
    Write-Host "2. Resolve conflicts" -ForegroundColor Gray
    Write-Host "3. git add ." -ForegroundColor Gray
    Write-Host "4. git commit -m 'Resolve merge conflicts'" -ForegroundColor Gray
    Write-Host "5. Run this script again" -ForegroundColor Gray
    exit 1
}

# Push to uat
Write-Host "`nPushing to uat..." -ForegroundColor Cyan
git push origin uat

Write-Host "`n=== Complete! ===" -ForegroundColor Green
Write-Host "Feature merged to uat successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test in UAT environment" -ForegroundColor Gray
Write-Host "2. If tests pass, run: .\scripts\deploy-to-production.ps1" -ForegroundColor Gray
Write-Host "3. If issues found, switch back to feature branch and fix" -ForegroundColor Gray
Write-Host "`nCurrent branch: uat" -ForegroundColor Cyan
