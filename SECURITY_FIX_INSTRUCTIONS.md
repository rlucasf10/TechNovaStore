# 🔒 Security Fix Instructions - Remove Passwords from Git History

## Problem
GitGuardian detected hardcoded passwords in commit `0781da7`. We need to remove them from Git history.

## Solution Options

### Option 1: Force Push with Clean History (RECOMMENDED - Fastest)

Since this is a new repository, the easiest solution is to force push the cleaned version:

```powershell
# 1. Make sure current changes are committed
git status

# 2. Force push the develop branch (with security fixes)
git push origin develop --force

# 3. Force push master branch
git push origin master --force

# 4. In GitGuardian dashboard:
#    - Mark the incident as "Resolved" 
#    - Select reason: "Credentials revoked and rotated"
```

### Option 2: Use BFG Repo-Cleaner (Most Thorough)

```powershell
# 1. Download BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create a passwords.txt file with passwords to remove:
echo "password" > passwords.txt
echo "REDACTED_GRAFANA_PASSWORD" >> passwords.txt
echo "REDACTED_JWT_SECRET" >> passwords.txt
echo "REDACTED_SMTP_PASSWORD" >> passwords.txt

# 3. Run BFG to clean the repository
java -jar bfg.jar --replace-text passwords.txt .

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push origin --force --all
git push origin --force --tags
```

### Option 3: Interactive Rebase (Manual)

```powershell
# 1. Start interactive rebase from the first commit
git rebase -i --root

# 2. Mark commits to edit (change 'pick' to 'edit' for commits with passwords)

# 3. For each commit, amend the files:
#    - Edit docker-compose.yml to remove passwords
#    - git add docker-compose.yml
#    - git commit --amend --no-edit
#    - git rebase --continue

# 4. Force push
git push origin --force --all
```

## After Cleaning History

### 1. Verify the passwords are gone:
```powershell
# Search for hardcoded passwords in history
git log -p | grep -i "password: password"
git log -p | grep -i "requirepass password"

# Should return no results
```

### 2. In GitGuardian Dashboard:
- Go to the incident
- Click "Mark as resolved"
- Select: "Credentials revoked and rotated"
- Add note: "Passwords removed from git history via force push and replaced with environment variables"

### 3. Update passwords in production:
Since the old passwords were exposed, change them:
- MongoDB password
- PostgreSQL password  
- Redis password
- JWT secret
- Grafana admin password

### 4. Notify team members:
If working with a team, they need to:
```powershell
# Delete local repository
cd ..
rm -rf TechNovaStore

# Re-clone
git clone git@github.com:rlucasf10/TechNovaStore.git
cd TechNovaStore
```

## Prevention

✅ **Already implemented:**
- `.env` files in `.gitignore`
- `.env.docker.example` template
- Environment variables in `docker-compose.yml`
- `SECURITY_SETUP.md` guide

✅ **Additional recommendations:**
- Enable GitGuardian pre-commit hooks
- Use `git-secrets` to prevent committing secrets
- Regular security audits with `trufflehog` or `gitleaks`

## Quick Command (Recommended)

```powershell
# Just force push the current clean state
git push origin develop --force
git push origin master --force
```

Then mark as resolved in GitGuardian dashboard.
