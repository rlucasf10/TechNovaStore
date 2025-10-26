# PowerShell script to clean passwords from git history
# WARNING: This rewrites git history!

Write-Host "⚠️  WARNING: This will rewrite Git history!" -ForegroundColor Yellow
Write-Host "This is necessary to remove hardcoded passwords from commits." -ForegroundColor Yellow
Write-Host ""
Write-Host "Before proceeding:" -ForegroundColor Cyan
Write-Host "1. Make sure you have committed all current changes" -ForegroundColor White
Write-Host "2. Backup your repository if needed" -ForegroundColor White
Write-Host "3. All team members will need to re-clone the repository" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (yes/no)"
if ($confirmation -ne 'yes') {
    Write-Host "Aborted." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Step 1: Creating backup branch..." -ForegroundColor Green
git branch backup-before-cleanup

Write-Host "🔧 Step 2: Rewriting history to remove passwords..." -ForegroundColor Green

# Use git filter-branch to replace passwords in all commits
git filter-branch --force --tree-filter '
    if [ -f "docker-compose.yml" ]; then
        sed -i "s/MONGO_INITDB_ROOT_PASSWORD: password/MONGO_INITDB_ROOT_PASSWORD: \${MONGO_ROOT_PASSWORD}/g" docker-compose.yml
        sed -i "s/POSTGRES_PASSWORD: password/POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}/g" docker-compose.yml
        sed -i "s/requirepass password/requirepass \${REDIS_PASSWORD}/g" docker-compose.yml
        sed -i "s/:password@/:REMOVED_PASSWORD@/g" docker-compose.yml
        sed -i "s/JWT_SECRET: REDACTED_JWT_SECRET/JWT_SECRET: \${JWT_SECRET}/g" docker-compose.yml
        sed -i "s/GRAFANA_ADMIN_PASSWORD: REDACTED_GRAFANA_PASSWORD/GRAFANA_ADMIN_PASSWORD: \${GRAFANA_ADMIN_PASSWORD}/g" docker-compose.yml
        sed -i "s/SMTP_PASS: REDACTED_SMTP_PASSWORD/SMTP_PASS: \${SMTP_PASS}/g" docker-compose.yml
        git add docker-compose.yml 2>/dev/null || true
    fi
    if [ -f "docker-compose.optimized.yml" ]; then
        sed -i "s/:password@/:REMOVED_PASSWORD@/g" docker-compose.optimized.yml
        git add docker-compose.optimized.yml 2>/dev/null || true
    fi
' --tag-name-filter cat -- --all

Write-Host ""
Write-Host "✅ History rewritten successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Step 3: Cleaning up..." -ForegroundColor Green
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Next steps:" -ForegroundColor Cyan
Write-Host "1. Force push to GitHub:" -ForegroundColor White
Write-Host "   git push origin --force --all" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Force push tags:" -ForegroundColor White
Write-Host "   git push origin --force --tags" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. In GitGuardian, mark the incident as 'Resolved' or 'Revoked'" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: All team members must re-clone the repository!" -ForegroundColor Red
Write-Host "   git clone <repository-url>" -ForegroundColor Yellow
