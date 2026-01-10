# GitHub Secrets Setup Script
# This script helps you add all required secrets to your GitHub repository

# Instructions:
# 1. Go to https://github.com/settings/tokens
# 2. Create a new token with 'repo' scope
# 3. Run this script with your token

$GITHUB_TOKEN = Read-Host -Prompt "Enter your GitHub Personal Access Token"
$REPO_OWNER = "WEBSTUDIOCSE"
$REPO_NAME = "ELITE-MINDSET-FORGE"

# Function to add GitHub secret
function Add-GitHubSecret {
    param (
        [string]$SecretName,
        [string]$SecretValue
    )
    
    Write-Host "Adding secret: $SecretName" -ForegroundColor Cyan
    
    # Get repository public key
    $keyUrl = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key"
    $headers = @{
        "Authorization" = "Bearer $GITHUB_TOKEN"
        "Accept" = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
    }
    
    try {
        $keyResponse = Invoke-RestMethod -Uri $keyUrl -Headers $headers -Method Get
        $publicKey = $keyResponse.key
        $keyId = $keyResponse.key_id
        
        # Encrypt the secret value (requires sodium/libsodium)
        # For PowerShell, we'll use a simpler approach via gh CLI
        Write-Host "Secret name prepared: $SecretName" -ForegroundColor Green
        Write-Host "Please add this manually via GitHub web UI or install gh CLI" -ForegroundColor Yellow
        Write-Host "Value: $SecretValue" -ForegroundColor DarkGray
        Write-Host ""
        
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Vercel Credentials
Write-Host "`n========== VERCEL CREDENTIALS ==========" -ForegroundColor Yellow
Add-GitHubSecret -SecretName "VERCEL_TOKEN" -SecretValue "fga1jVI9KORV2Yo6ISBCBMA5"
Add-GitHubSecret -SecretName "VERCEL_ORG_ID" -SecretValue "team_mVSKzTFsdeCOmKuD429Vg9El"
Add-GitHubSecret -SecretName "VERCEL_PROJECT_ID" -SecretValue "prj_pMOv293QfoEp41QyvulZrWf5yX95"

# Firebase UAT Configuration
Write-Host "`n========== FIREBASE UAT CONFIG ==========" -ForegroundColor Yellow
Add-GitHubSecret -SecretName "FIREBASE_API_KEY_UAT" -SecretValue "AIzaSyDr2GEwj5O4AMQF6JCAu0nhNhlezsgxHS8"
Add-GitHubSecret -SecretName "FIREBASE_AUTH_DOMAIN_UAT" -SecretValue "env-uat-cd3c5.firebaseapp.com"
Add-GitHubSecret -SecretName "FIREBASE_PROJECT_ID_UAT" -SecretValue "env-uat-cd3c5"
Add-GitHubSecret -SecretName "FIREBASE_STORAGE_BUCKET_UAT" -SecretValue "env-uat-cd3c5.firebasestorage.app"
Add-GitHubSecret -SecretName "FIREBASE_MESSAGING_SENDER_ID_UAT" -SecretValue "614576728087"
Add-GitHubSecret -SecretName "FIREBASE_APP_ID_UAT" -SecretValue "1:614576728087:web:6337d07f43cb3674001452"
Add-GitHubSecret -SecretName "FIREBASE_MEASUREMENT_ID_UAT" -SecretValue "G-RMHPEET5ZY"
Add-GitHubSecret -SecretName "FIREBASE_VAPID_KEY_UAT" -SecretValue "BPdx9XtofjSoMHlUewHoxrV2IcWwz3jsJY7Rl0byzte4EDYOnMfxtJogdOXlCKRAL5tYSsHc-7iuWkxWjnwo1TA"

# Firebase PROD Configuration
Write-Host "`n========== FIREBASE PROD CONFIG ==========" -ForegroundColor Yellow
Add-GitHubSecret -SecretName "FIREBASE_API_KEY_PROD" -SecretValue "AIzaSyDP7goPvbKrk1utbKISF2tJU-SwyuJdm2E"
Add-GitHubSecret -SecretName "FIREBASE_AUTH_DOMAIN_PROD" -SecretValue "breathe-free-c1566.firebaseapp.com"
Add-GitHubSecret -SecretName "FIREBASE_PROJECT_ID_PROD" -SecretValue "breathe-free-c1566"
Add-GitHubSecret -SecretName "FIREBASE_STORAGE_BUCKET_PROD" -SecretValue "breathe-free-c1566.firebasestorage.app"
Add-GitHubSecret -SecretName "FIREBASE_MESSAGING_SENDER_ID_PROD" -SecretValue "169689352647"
Add-GitHubSecret -SecretName "FIREBASE_APP_ID_PROD" -SecretValue "1:169689352647:web:00fafecc859873d4eb31e2"
Add-GitHubSecret -SecretName "FIREBASE_MEASUREMENT_ID_PROD" -SecretValue "G-DTQR8G46W0"
Add-GitHubSecret -SecretName "FIREBASE_VAPID_KEY_PROD" -SecretValue "BMSqnRUaslFNE6JtlzBem_04MMSmaYVAGF3IkC2xFnqJ5MMcshy3GOTbnF4TIJzURpXJ1uYzatIktOavO2ka2NE"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "To add these secrets manually:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
Write-Host "2. Click 'New repository secret'"
Write-Host "3. Copy each name and value from above"
Write-Host "========================================`n" -ForegroundColor Green
