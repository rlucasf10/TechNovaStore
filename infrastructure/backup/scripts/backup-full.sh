#!/bin/bash

# TechNovaStore - Weekly Full Backup Script
# This script performs comprehensive weekly backups with additional data integrity checks

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/logs/backup-full-${TIMESTAMP}.log"

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

# Full MongoDB backup with collections analysis
backup_mongodb_full() {
    log "Starting MongoDB full backup with analysis..."
    
    local backup_path="${BACKUP_DIR}/mongodb/full_${TIMESTAMP}"
    mkdir -p "$backup_path"
    
    # Get database statistics
    log "Collecting MongoDB statistics..."
    mongosh "mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin" \
        --eval "db.stats()" > "${backup_path}/db_stats.json" 2>/dev/null || log "WARNING: Could not collect DB stats"
    
    # List all collections
    mongosh "mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin" \
        --eval "db.listCollections().toArray()" > "${backup_path}/collections.json" 2>/dev/null || log "WARNING: Could not list collections"
    
    # Create full dump with oplog
    if mongodump \
        --uri="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin" \
        --out="$backup_path" \
        --oplog \
        --gzip; then
        
        # Create compressed archive
        tar -czf "${backup_path}.tar.gz" -C "${BACKUP_DIR}/mongodb" "full_${TIMESTAMP}"
        rm -rf "$backup_path"
        
        log "MongoDB full backup completed: ${backup_path}.tar.gz"
        
        # Verify backup integrity
        if tar -tzf "${backup_path}.tar.gz" >/dev/null 2>&1; then
            log "MongoDB backup integrity verified"
        else
            error_exit "MongoDB backup integrity check failed"
        fi
        
        return 0
    else
        error_exit "MongoDB full backup failed"
    fi
}

# Full PostgreSQL backup with schema analysis
backup_postgresql_full() {
    log "Starting PostgreSQL full backup with analysis..."
    
    local backup_dir="${BACKUP_DIR}/postgresql/full_${TIMESTAMP}"
    mkdir -p "$backup_dir"
    
    # Export database schema
    log "Exporting PostgreSQL schema..."
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --schema-only \
        --verbose \
        --no-password \
        --file="${backup_dir}/schema.sql" || log "WARNING: Schema export failed"
    
    # Export data only
    log "Exporting PostgreSQL data..."
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --data-only \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="${backup_dir}/data.dump" || error_exit "Data export failed"
    
    # Get database statistics
    log "Collecting PostgreSQL statistics..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -c "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;" \
        > "${backup_dir}/table_stats.txt" 2>/dev/null || log "WARNING: Could not collect table stats"
    
    # Create full backup
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="${backup_dir}/full.dump" || error_exit "Full backup failed"
    
    # Create compressed archive
    tar -czf "${backup_dir}.tar.gz" -C "${BACKUP_DIR}/postgresql" "full_${TIMESTAMP}"
    rm -rf "$backup_dir"
    
    log "PostgreSQL full backup completed: ${backup_dir}.tar.gz"
    
    return 0
}

# Backup system configuration
backup_configuration() {
    log "Backing up system configuration..."
    
    local config_backup="${BACKUP_DIR}/config/config_${TIMESTAMP}"
    mkdir -p "$config_backup"
    
    # Copy Docker configurations
    if [[ -f "/app/docker-compose.prod.yml" ]]; then
        cp "/app/docker-compose.prod.yml" "$config_backup/" 2>/dev/null || log "WARNING: Could not backup docker-compose.prod.yml"
    fi
    
    # Copy NGINX configuration
    if [[ -f "/app/infrastructure/nginx/nginx.prod.conf" ]]; then
        cp "/app/infrastructure/nginx/nginx.prod.conf" "$config_backup/" 2>/dev/null || log "WARNING: Could not backup nginx.prod.conf"
    fi
    
    # Create environment template
    cat > "${config_backup}/env_template.txt" << 'EOF'
# TechNovaStore Production Environment Variables Template
# Generated during backup process

# Database Configuration
MONGO_ROOT_USERNAME=<username>
MONGO_ROOT_PASSWORD=<password>
POSTGRES_USER=<username>
POSTGRES_PASSWORD=<password>
REDIS_PASSWORD=<password>

# Application Configuration
JWT_SECRET=<secret>
NODE_ENV=production

# Monitoring
GRAFANA_ADMIN_USER=<username>
GRAFANA_ADMIN_PASSWORD=<password>

# Backup Configuration
BACKUP_S3_BUCKET=<bucket>
BACKUP_S3_ACCESS_KEY=<key>
BACKUP_S3_SECRET_KEY=<secret>
EOF
    
    # Create archive
    tar -czf "${config_backup}.tar.gz" -C "${BACKUP_DIR}/config" "config_${TIMESTAMP}"
    rm -rf "$config_backup"
    
    log "Configuration backup completed: ${config_backup}.tar.gz"
}

# Create comprehensive manifest
create_full_manifest() {
    local manifest_file="${BACKUP_DIR}/manifest_full_${TIMESTAMP}.json"
    
    cat > "$manifest_file" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "date": "$(date -Iseconds)",
    "type": "full_weekly",
    "databases": {
        "mongodb": {
            "file": "mongodb/full_${TIMESTAMP}.tar.gz",
            "size": "$(du -b "${BACKUP_DIR}/mongodb/full_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -f1 || echo 0)",
            "checksum": "$(sha256sum "${BACKUP_DIR}/mongodb/full_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'unknown')",
            "includes_oplog": true
        },
        "postgresql": {
            "file": "postgresql/full_${TIMESTAMP}.tar.gz",
            "size": "$(du -b "${BACKUP_DIR}/postgresql/full_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -f1 || echo 0)",
            "checksum": "$(sha256sum "${BACKUP_DIR}/postgresql/full_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'unknown')",
            "includes_schema": true,
            "includes_statistics": true
        }
    },
    "configuration": {
        "file": "config/config_${TIMESTAMP}.tar.gz",
        "size": "$(du -b "${BACKUP_DIR}/config/config_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -f1 || echo 0)",
        "checksum": "$(sha256sum "${BACKUP_DIR}/config/config_${TIMESTAMP}.tar.gz" 2>/dev/null | cut -d' ' -f1 || echo 'unknown')"
    },
    "retention_days": ${BACKUP_RETENTION_DAYS:-90},
    "backup_type": "comprehensive"
}
EOF
    
    log "Full backup manifest created: $manifest_file"
}

# Main execution
main() {
    log "=== Starting TechNovaStore Weekly Full Backup ==="
    log "Timestamp: $TIMESTAMP"
    
    # Pre-flight checks
    if [[ -z "${MONGO_ROOT_USERNAME:-}" || -z "${MONGO_ROOT_PASSWORD:-}" ]]; then
        error_exit "MongoDB credentials not set"
    fi
    
    if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_PASSWORD:-}" ]]; then
        error_exit "PostgreSQL credentials not set"
    fi
    
    # Perform full backups
    backup_mongodb_full
    backup_postgresql_full
    backup_configuration
    
    # Create comprehensive manifest
    create_full_manifest
    
    # Upload to cloud storage
    if [[ -n "${S3_BUCKET:-}" && -n "${S3_ACCESS_KEY:-}" && -n "${S3_SECRET_KEY:-}" ]]; then
        log "Uploading full backups to S3..."
        
        export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
        
        # Upload all backup files
        aws s3 sync "${BACKUP_DIR}" "s3://${S3_BUCKET}/full_${TIMESTAMP}/" \
            --exclude "*.log" \
            --exclude "manifest_*.json" || log "WARNING: S3 sync failed"
        
        # Upload manifest
        aws s3 cp "${BACKUP_DIR}/manifest_full_${TIMESTAMP}.json" \
            "s3://${S3_BUCKET}/manifests/manifest_full_${TIMESTAMP}.json" || log "WARNING: Manifest upload failed"
    fi
    
    log "=== Weekly Full Backup Completed Successfully ==="
    
    # Calculate total backup size
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    log "Total backup size: $total_size"
    
    # Send notification
    if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"TechNovaStore weekly full backup completed\", \"timestamp\": \"$TIMESTAMP\", \"size\": \"$total_size\"}" \
            >/dev/null 2>&1 || log "WARNING: Failed to send backup notification"
    fi
}

# Execute main function
main "$@"