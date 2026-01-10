# Push to UAT Branch (Main)
# This script pushes to the uat branch (main branch - no author change needed)

Write-Host "=== Push to UAT Branch ===" -ForegroundColor Cyan

# Check current branch
$currentBranch = git branch --show-current

if ($currentBranch -eq "uat") {
    Write-Host "Already on uat (main) branch" -ForegroundColor Green
} else {
    Write-Host "Switching to uat (main) branch..." -ForegroundColor Yellow
    git checkout uat
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error switching to uat branch" -ForegroundColor Red
        exit 1
    }
}

# Push to uat
Write-Host "Pushing to uat (main) branch..." -ForegroundColor Cyan
git push origin uat

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing to uat" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Complete! ===" -ForegroundColor Green
Write-Host "Pushed to uat (main) branch successfully" -ForegroundColor Green
