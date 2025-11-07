# 🔒 Security Setup Guide

## Environment Variables Configuration

This project uses environment variables to keep sensitive credentials secure. **Never commit files with real passwords to Git!**

### Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.docker.example .env
   ```

2. **Edit `.env` with your secure passwords:**
   ```bash
   # Use a text editor to update all passwords
   nano .env
   # or
   code .env
   ```

3. **Generate secure passwords:**
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

### Required Environment Variables

The `.env` file must contain:

- `MONGO_ROOT_PASSWORD` - MongoDB root password
- `POSTGRES_PASSWORD` - PostgreSQL password
- `REDIS_PASSWORD` - Redis password
- `JWT_SECRET` - JWT secret key (minimum 32 characters)
- `GRAFANA_ADMIN_PASSWORD` - Grafana admin password
- `SMTP_USER` - Email for notifications
- `SMTP_PASS` - Email password/app password

### Security Best Practices

✅ **DO:**
- Use strong, unique passwords for each service
- Keep `.env` file in `.gitignore`
- Use different passwords for development and production
- Rotate passwords regularly
- Use app-specific passwords for email (Gmail, etc.)

❌ **DON'T:**
- Commit `.env` files to Git
- Use default passwords like "password" or "admin"
- Share passwords in plain text
- Reuse passwords across services

### Verification

After setup, verify your configuration:

```bash
# Check that .env is ignored by Git
git status

# The .env file should NOT appear in the list
# Only .env.docker.example should be tracked
```

### Production Deployment

For production, use secure secret management:

- **Docker Swarm:** Use Docker secrets
- **Kubernetes:** Use Kubernetes secrets
- **Cloud:** Use AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager

See `PRODUCTION_DEPLOYMENT.md` for detailed instructions.
