# Deploy UAT to Production (Vercel)
# This script merges uat into main and pushes (Vercel auto-deploys)

Write-Host "=== Deploy UAT to Production ===" -ForegroundColor Cyan

# Switch to main
Write-Host "`nSwitching to main branch..." -ForegroundColor Cyan
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error switching to main" -ForegroundColor Red
    exit 1
}

# Update main
Write-Host "Updating main branch..." -ForegroundColor Cyan
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error pulling main" -ForegroundColor Red
    exit 1
}

# Merge uat into main
Write-Host "`nMerging uat into main..." -ForegroundColor Cyan
git merge uat --no-ff -m "Merge uat into main for production release"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Merge conflict detected!" -ForegroundColor Red
    Write-Host "Please resolve conflicts and try again" -ForegroundColor Yellow
    exit 1
}

# Save current Git config
$originalName = git config user.name
$originalEmail = git config user.email

# Change to WEBSTUDIOCSE author
Write-Host "`nChanging author to WEBSTUDIOCSE..." -ForegroundColor Cyan
git config user.name "WEBSTUDIOCSE"
git config user.email "saurabhjadhav.webstudio@gmail.com"

# Amend last commit with new author
git commit --amend --reset-author --no-edit

# Push to main (Vercel auto-deploys)
Write-Host "`nPushing to main..." -ForegroundColor Cyan
git push origin main --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error pushing to main" -ForegroundColor Red
    git config user.name $originalName
    git config user.email $originalEmail
    exit 1
}

# Restore original Git config
git config user.name $originalName
git config user.email $originalEmail

Write-Host "`n=== Complete! ===" -ForegroundColor Green
Write-Host "✅ Successfully pushed to main branch! 🚀" -ForegroundColor Green
Write-Host "`nProduction URL: https://www.autograminsta.online" -ForegroundColor Cyan
Write-Host "Vercel is now deploying... Check Vercel dashboard for status" -ForegroundColor Gray