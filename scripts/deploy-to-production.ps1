# Deploy UAT to Production
# This script merges uat into production and deploys to production

Write-Host "=== Deploy UAT to Production ===" -ForegroundColor Cyan

# Confirmation
Write-Host "`nThis will deploy UAT changes to PRODUCTION!" -ForegroundColor Yellow
$confirm = Read-Host "Have you tested everything in UAT? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Switch to production
Write-Host "`nSwitching to production branch..." -ForegroundColor Cyan
git checkout production
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error switching to production" -ForegroundColor Red
    exit 1
}

# Update production
Write-Host "Updating production branch..." -ForegroundColor Cyan
git pull origin production
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pulling production" -ForegroundColor Red
    exit 1
}

# Merge uat into production
Write-Host "`nMerging uat into production..." -ForegroundColor Cyan
git merge uat --no-ff -m "Merge uat into production for production release"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nMerge conflict detected!" -ForegroundColor Red
    Write-Host "Please resolve conflicts and try again" -ForegroundColor Yellow
    exit 1
}

# Check IS_PRODUCTION flag
Write-Host "`nIMPORTANT: Check IS_PRODUCTION flag..." -ForegroundColor Yellow
Write-Host "Opening environments.ts..." -ForegroundColor Cyan
code "src\lib\firebase\config\environments.ts"

$flagCheck = Read-Host "`nIs IS_PRODUCTION set to true? (yes/no)"

if ($flagCheck -ne "yes") {
    Write-Host "`nPlease set IS_PRODUCTION = true in environments.ts" -ForegroundColor Red
    Write-Host "Then run: git add . && git commit -m 'Set production flag'" -ForegroundColor Yellow
    Write-Host "And run this script again" -ForegroundColor Yellow
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

# Push to production
Write-Host "`nDeploying to production..." -ForegroundColor Cyan
git push origin production --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing to production" -ForegroundColor Red
    git config user.name $originalName
    git config user.email $originalEmail
    exit 1
}

# Restore original Git config
git config user.name $originalName
git config user.email $originalEmail

Write-Host "`n=== Complete! ===" -ForegroundColor Green
Write-Host "Successfully deployed to PRODUCTION! 🚀" -ForegroundColor Green
Write-Host "`nProduction URL: https://www.elitemindsetforge.com" -ForegroundColor Cyan
Write-Host "GitHub Actions will complete the deployment" -ForegroundColor Gray