#!/bin/bash

# TechNovaStore - Daily Database Backup Script
# This script performs daily incremental backups of MongoDB and PostgreSQL

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/logs/backup-${TIMESTAMP}.log"

# Database connection details
MONGO_HOST="mongodb"
MONGO_PORT="27017"
MONGO_DB="technovastore"
POSTGRES_HOST="postgresql"
POSTGRES_PORT="5432"
POSTGRES_DB="technovastore"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if required environment variables are set
check_env() {
    local required_vars=("MONGO_ROOT_USERNAME" "MONGO_ROOT_PASSWORD" "POSTGRES_USER" "POSTGRES_PASSWORD")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
}

# Test database connections
test_connections() {
    log "Testing database connections..."
    
    # Test MongoDB connection
    if ! mongosh "mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        error_exit "Cannot connect to MongoDB"
    fi
    
    # Test PostgreSQL connection
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" >/dev/null 2>&1; then
        error_exit "Cannot connect to PostgreSQL"
    fi
    
    log "Database connections successful"
}

# Backup MongoDB
backup_mongodb() {
    log "Starting MongoDB backup..."
    
    local backup_path="${BACKUP_DIR}/mongodb/daily_${TIMESTAMP}"
    mkdir -p "$backup_path"
    
    # Create MongoDB dump
    if mongodump \
        --uri="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin" \
        --out="$backup_path" \
        --gzip; then
        
        # Create compressed archive
        tar -czf "${backup_path}.tar.gz" -C "${BACKUP_DIR}/mongodb" "daily_${TIMESTAMP}"
        rm -rf "$backup_path"
        
        log "MongoDB backup completed: ${backup_path}.tar.gz"
        
        # Calculate backup size
        local size=$(du -h "${backup_path}.tar.gz" | cut -f1)
        log "MongoDB backup size: $size"
        
        return 0
    else
        error_exit "MongoDB backup failed"
    fi
}

# Backup PostgreSQL
backup_postgresql() {
    log "Starting PostgreSQL backup..."
    
    local backup_path="${BACKUP_DIR}/postgresql/daily_${TIMESTAMP}.sql.gz"
    mkdir -p "$(dirname "$backup_path")"
    
    # Create PostgreSQL dump
    if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$backup_path"; then
        
        log "PostgreSQL backup completed: $backup_path"
        
        # Calculate backup size
        local size=$(du -h "$backup_path" | cut -f1)
        log "PostgreSQL backup size: $size"
        
        return 0
    else
        error_exit "PostgreSQL backup failed"
    fi
}

# Upload to S3 (if configured)
upload_to_s3() {
    if [[ -n "${S3_BUCKET:-}" && -n "${S3_ACCESS_KEY:-}" && -n "${S3_SECRET_KEY:-}" ]]; then
        log "Uploading backups to S3..."
        
        export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
        
        # Upload MongoDB backup
        local mongo_backup="${BACKUP_DIR}/mongodb/daily_${TIMESTAMP}.tar.gz"
        if [[ -f "$mongo_backup" ]]; then
            aws s3 cp "$mongo_backup" "s3://${S3_BUCKET}/mongodb/daily_${TIMESTAMP}.tar.gz" || log "WARNING: Failed to upload MongoDB backup to S3"
        fi
        
        # Upload PostgreSQL backup
        local postgres_backup="${BACKUP_DIR}/postgresql/daily_${TIMESTAMP}.sql.gz"
        if [[ -f "$postgres_backup" ]]; then
            aws s3 cp "$postgres_backup" "s3://${S3_BUCKET}/postgresql/daily_${TIMESTAMP}.sql.gz" || log "WARNING: Failed to upload PostgreSQL backup to S3"
        fi
        
        log "S3 upload completed"
    else
        log "S3 configuration not found, skipping upload"
    fi
}

# Create backup manifest
create_manifest() {
    local manifest_file="${BACKUP_DIR}/manifest_${TIMESTAMP}.json"
    
    cat > "$manifest_file" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "date": "$(date -Iseconds)",
    "type": "daily",
    "databases": {
        "mongodb": {
            "file": "mongodb/daily_${TIMESTAMP}.tar.gz",
            "size": "$(du -b "${BACKUP_DIR}/mongodb/daily_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -f1 || echo 0)",
            "checksum": "$(sha256sum "${BACKUP_DIR}/mongodb/daily_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'unknown')"
        },
        "postgresql": {
            "file": "postgresql/daily_${TIMESTAMP}.sql.gz",
            "size": "$(du -b "${BACKUP_DIR}/postgresql/daily_${TIMESTAMP}.sql.gz" 2>/dev/null | cut -f1 || echo 0)",
            "checksum": "$(sha256sum "${BACKUP_DIR}/postgresql/daily_${TIMESTAMP}.sql.gz" 2>/dev/null | cut -d' ' -f1 || echo 'unknown')"
        }
    },
    "retention_days": ${BACKUP_RETENTION_DAYS:-30}
}
EOF
    
    log "Backup manifest created: $manifest_file"
}

# Main execution
main() {
    log "=== Starting TechNovaStore Daily Backup ==="
    log "Timestamp: $TIMESTAMP"
    
    # Pre-flight checks
    check_env
    test_connections
    
    # Perform backups
    backup_mongodb
    backup_postgresql
    
    # Create manifest
    create_manifest
    
    # Upload to cloud storage
    upload_to_s3
    
    log "=== Daily Backup Completed Successfully ==="
    
    # Send notification (if webhook configured)
    if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"TechNovaStore daily backup completed successfully\", \"timestamp\": \"$TIMESTAMP\"}" \
            >/dev/null 2>&1 || log "WARNING: Failed to send backup notification"
    fi
}

# Execute main function
main "$@"