# Create New Feature Branch
# This script helps you create a new feature branch from uat (main branch)

Write-Host "=== Create New Feature Branch ===" -ForegroundColor Cyan

# Get current branch
$currentBranch = git branch --show-current

# Switch to uat (main) and update
Write-Host "Switching to uat (main) branch and updating..." -ForegroundColor Yellow
git checkout uat
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error switching to uat branch" -ForegroundColor Red
    exit 1
}

git pull origin uat
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pulling latest changes" -ForegroundColor Red
    exit 1
}

# Get feature name from user
Write-Host "`nFeature branch naming:" -ForegroundColor Cyan
Write-Host "  - Features: feature/description (e.g., feature/add-payment)" -ForegroundColor Gray
Write-Host "  - Bug fixes: fix/description (e.g., fix/login-bug)" -ForegroundColor Gray
Write-Host "  - Hotfixes: hotfix/description (e.g., hotfix/security-patch)" -ForegroundColor Gray

$featureName = Read-Host "`nEnter branch name"

if ([string]::IsNullOrWhiteSpace($featureName)) {
    Write-Host "Error: Branch name cannot be empty" -ForegroundColor Red
    exit 1
}

# Create and switch to new branch
Write-Host "`nCreating branch: $featureName" -ForegroundColor Cyan
git checkout -b $featureName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating branch" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Complete! ===" -ForegroundColor Green
Write-Host "Created and switched to branch: $featureName" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Make your changes" -ForegroundColor Gray
Write-Host "2. git add ." -ForegroundColor Gray
Write-Host "3. git commit -m 'Your message'" -ForegroundColor Gray
Write-Host "4. git push origin $featureName" -ForegroundColor Gray
Write-Host "5. When ready, run: .\scripts\merge-to-uat.ps1" -ForegroundColor Gray
