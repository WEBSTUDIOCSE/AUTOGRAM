# Push to Production with WEBSTUDIOCSE Author
# This script changes Git author, pushes to production, and restores original settings

Write-Host "=== Push to Production with WEBSTUDIOCSE Author ===" -ForegroundColor Cyan

# Save current Git config
$originalName = git config user.name
$originalEmail = git config user.email
Write-Host "Current author: $originalName <$originalEmail>" -ForegroundColor Yellow

# Change to WEBSTUDIOCSE author
Write-Host "`nChanging author to WEBSTUDIOCSE..." -ForegroundColor Cyan
git config user.name "WEBSTUDIOCSE"
git config user.email "saurabhjadhav.webstudio@gmail.com"

# Amend last commit with new author
Write-Host "Amending last commit with new author..." -ForegroundColor Cyan
git commit --amend --reset-author --no-edit

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error amending commit. Restoring original author..." -ForegroundColor Red
    git config user.name $originalName
    git config user.email $originalEmail
    exit 1
}

# Push to production
Write-Host "Pushing to production branch..." -ForegroundColor Cyan
git push origin production --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing to production. Restoring original author..." -ForegroundColor Red
    git config user.name $originalName
    git config user.email $originalEmail
    exit 1
}

# Restore original Git config
Write-Host "`nRestoring original author..." -ForegroundColor Cyan
git config user.name $originalName
git config user.email $originalEmail

Write-Host "`n=== Complete! ===" -ForegroundColor Green
Write-Host "Pushed to production as WEBSTUDIOCSE" -ForegroundColor Green
Write-Host "Restored author: $originalName <$originalEmail>" -ForegroundColor Green