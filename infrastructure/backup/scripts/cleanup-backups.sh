#!/bin/bash

# TechNovaStore - Backup Cleanup Script
# This script removes old backups based on retention policies

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/logs/cleanup-$(date +%Y%m%d_%H%M%S).log"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
FULL_BACKUP_RETENTION_DAYS=${FULL_BACKUP_RETENTION_DAYS:-90}

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Calculate disk usage
calculate_disk_usage() {
    local path="$1"
    if [[ -d "$path" ]]; then
        du -sh "$path" 2>/dev/null | cut -f1 || echo "0B"
    else
        echo "0B"
    fi
}

# Clean daily backups
cleanup_daily_backups() {
    log "Cleaning up daily backups older than $RETENTION_DAYS days..."
    
    local cleaned_count=0
    local freed_space=0
    
    # MongoDB daily backups
    if [[ -d "${BACKUP_DIR}/mongodb" ]]; then
        while IFS= read -r -d '' file; do
            local file_size=$(du -b "$file" 2>/dev/null | cut -f1 || echo 0)
            rm -f "$file"
            cleaned_count=$((cleaned_count + 1))
            freed_space=$((freed_space + file_size))
            log "Removed: $(basename "$file")"
        done < <(find "${BACKUP_DIR}/mongodb" -name "daily_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    fi
    
    # PostgreSQL daily backups
    if [[ -d "${BACKUP_DIR}/postgresql" ]]; then
        while IFS= read -r -d '' file; do
            local file_size=$(du -b "$file" 2>/dev/null | cut -f1 || echo 0)
            rm -f "$file"
            cleaned_count=$((cleaned_count + 1))
            freed_space=$((freed_space + file_size))
            log "Removed: $(basename "$file")"
        done < <(find "${BACKUP_DIR}/postgresql" -name "daily_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    fi
    
    # Clean daily manifests
    while IFS= read -r -d '' file; do
        rm -f "$file"
        log "Removed manifest: $(basename "$file")"
    done < <(find "${BACKUP_DIR}" -name "manifest_[0-9]*.json" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    local freed_mb=$((freed_space / 1024 / 1024))
    log "Daily cleanup completed: $cleaned_count files removed, ${freed_mb}MB freed"
}

# Clean full backups
cleanup_full_backups() {
    log "Cleaning up full backups older than $FULL_BACKUP_RETENTION_DAYS days..."
    
    local cleaned_count=0
    local freed_space=0
    
    # MongoDB full backups
    if [[ -d "${BACKUP_DIR}/mongodb" ]]; then
        while IFS= read -r -d '' file; do
            local file_size=$(du -b "$file" 2>/dev/null | cut -f1 || echo 0)
            rm -f "$file"
            cleaned_count=$((cleaned_count + 1))
            freed_space=$((freed_space + file_size))
            log "Removed: $(basename "$file")"
        done < <(find "${BACKUP_DIR}/mongodb" -name "full_*.tar.gz" -type f -mtime +$FULL_BACKUP_RETENTION_DAYS -print0 2>/dev/null)
    fi
    
    # PostgreSQL full backups
    if [[ -d "${BACKUP_DIR}/postgresql" ]]; then
        while IFS= read -r -d '' file; do
            local file_size=$(du -b "$file" 2>/dev/null | cut -f1 || echo 0)
            rm -f "$file"
            cleaned_count=$((cleaned_count + 1))
            freed_space=$((freed_space + file_size))
            log "Removed: $(basename "$file")"
        done < <(find "${BACKUP_DIR}/postgresql" -name "full_*.tar.gz" -type f -mtime +$FULL_BACKUP_RETENTION_DAYS -print0 2>/dev/null)
    fi
    
    # Configuration backups
    if [[ -d "${BACKUP_DIR}/config" ]]; then
        while IFS= read -r -d '' file; do
            local file_size=$(du -b "$file" 2>/dev/null | cut -f1 || echo 0)
            rm -f "$file"
            cleaned_count=$((cleaned_count + 1))
            freed_space=$((freed_space + file_size))
            log "Removed: $(basename "$file")"
        done < <(find "${BACKUP_DIR}/config" -name "config_*.tar.gz" -type f -mtime +$FULL_BACKUP_RETENTION_DAYS -print0 2>/dev/null)
    fi
    
    # Clean full backup manifests
    while IFS= read -r -d '' file; do
        rm -f "$file"
        log "Removed full manifest: $(basename "$file")"
    done < <(find "${BACKUP_DIR}" -name "manifest_full_*.json" -type f -mtime +$FULL_BACKUP_RETENTION_DAYS -print0 2>/dev/null)
    
    local freed_mb=$((freed_space / 1024 / 1024))
    log "Full backup cleanup completed: $cleaned_count files removed, ${freed_mb}MB freed"
}

# Clean old log files
cleanup_logs() {
    log "Cleaning up old log files..."
    
    local log_retention_days=7
    local cleaned_count=0
    
    # Clean backup logs
    while IFS= read -r -d '' file; do
        rm -f "$file"
        cleaned_count=$((cleaned_count + 1))
        log "Removed log: $(basename "$file")"
    done < <(find "/logs" -name "backup-*.log" -type f -mtime +$log_retention_days -print0 2>/dev/null)
    
    # Clean cleanup logs (keep only recent ones)
    while IFS= read -r -d '' file; do
        rm -f "$file"
        cleaned_count=$((cleaned_count + 1))
        log "Removed log: $(basename "$file")"
    done < <(find "/logs" -name "cleanup-*.log" -type f -mtime +$log_retention_days -print0 2>/dev/null)
    
    log "Log cleanup completed: $cleaned_count log files removed"
}

# Check disk space and warn if low
check_disk_space() {
    log "Checking disk space..."
    
    local backup_usage=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    local available_space=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    
    log "Backup directory usage: ${backup_usage}%"
    log "Available space: $available_space"
    
    if [[ $backup_usage -gt 85 ]]; then
        log "WARNING: Backup directory is ${backup_usage}% full"
        
        # Send alert if webhook configured
        if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
            curl -X POST "$BACKUP_WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{\"message\": \"WARNING: TechNovaStore backup directory is ${backup_usage}% full\", \"available_space\": \"$available_space\"}" \
                >/dev/null 2>&1 || log "Failed to send disk space alert"
        fi
    fi
}

# Generate cleanup report
generate_report() {
    log "Generating cleanup report..."
    
    local report_file="${BACKUP_DIR}/cleanup_report_$(date +%Y%m%d).json"
    
    # Count current backups
    local daily_mongo_count=$(find "${BACKUP_DIR}/mongodb" -name "daily_*.tar.gz" -type f 2>/dev/null | wc -l)
    local daily_postgres_count=$(find "${BACKUP_DIR}/postgresql" -name "daily_*.sql.gz" -type f 2>/dev/null | wc -l)
    local full_mongo_count=$(find "${BACKUP_DIR}/mongodb" -name "full_*.tar.gz" -type f 2>/dev/null | wc -l)
    local full_postgres_count=$(find "${BACKUP_DIR}/postgresql" -name "full_*.tar.gz" -type f 2>/dev/null | wc -l)
    
    # Calculate sizes
    local mongo_size=$(calculate_disk_usage "${BACKUP_DIR}/mongodb")
    local postgres_size=$(calculate_disk_usage "${BACKUP_DIR}/postgresql")
    local config_size=$(calculate_disk_usage "${BACKUP_DIR}/config")
    local total_size=$(calculate_disk_usage "$BACKUP_DIR")
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "retention_policy": {
        "daily_backups_days": $RETENTION_DAYS,
        "full_backups_days": $FULL_BACKUP_RETENTION_DAYS
    },
    "current_backups": {
        "daily": {
            "mongodb": $daily_mongo_count,
            "postgresql": $daily_postgres_count
        },
        "full": {
            "mongodb": $full_mongo_count,
            "postgresql": $full_postgres_count
        }
    },
    "storage_usage": {
        "mongodb": "$mongo_size",
        "postgresql": "$postgres_size",
        "configuration": "$config_size",
        "total": "$total_size"
    },
    "disk_usage_percent": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}')",
    "available_space": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')"
}
EOF
    
    log "Cleanup report generated: $report_file"
}

# Main execution
main() {
    log "=== Starting TechNovaStore Backup Cleanup ==="
    log "Daily retention: $RETENTION_DAYS days"
    log "Full backup retention: $FULL_BACKUP_RETENTION_DAYS days"
    
    # Check initial disk usage
    local initial_usage=$(calculate_disk_usage "$BACKUP_DIR")
    log "Initial backup directory size: $initial_usage"
    
    # Perform cleanup operations
    cleanup_daily_backups
    cleanup_full_backups
    cleanup_logs
    
    # Check final disk usage
    local final_usage=$(calculate_disk_usage "$BACKUP_DIR")
    log "Final backup directory size: $final_usage"
    
    # Check disk space and generate alerts if needed
    check_disk_space
    
    # Generate cleanup report
    generate_report
    
    log "=== Backup Cleanup Completed ==="
}

# Execute main function
main "$@"