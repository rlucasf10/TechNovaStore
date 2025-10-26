#!/bin/bash

# TechNovaStore - Backup Service Health Check Script
# This script monitors the health of the backup service and its dependencies

set -euo pipefail

# Configuration
HEALTH_LOG="/logs/health.log"
BACKUP_DIR="/backups"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$HEALTH_LOG"
}

# Check if backup directory is accessible
check_backup_directory() {
    if [[ -d "$BACKUP_DIR" && -w "$BACKUP_DIR" ]]; then
        return 0
    else
        log "ERROR: Backup directory not accessible or not writable"
        return 1
    fi
}

# Check database connectivity
check_database_connectivity() {
    local mongo_ok=false
    local postgres_ok=false
    
    # Check MongoDB
    if [[ -n "${MONGO_ROOT_USERNAME:-}" && -n "${MONGO_ROOT_PASSWORD:-}" ]]; then
        if mongosh "mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/technovastore?authSource=admin" \
            --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            mongo_ok=true
        fi
    fi
    
    # Check PostgreSQL
    if [[ -n "${POSTGRES_USER:-}" && -n "${POSTGRES_PASSWORD:-}" ]]; then
        if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h postgresql -p 5432 -U "${POSTGRES_USER}" -d technovastore \
            -c "SELECT 1;" >/dev/null 2>&1; then
            postgres_ok=true
        fi
    fi
    
    if [[ "$mongo_ok" == true && "$postgres_ok" == true ]]; then
        return 0
    else
        log "ERROR: Database connectivity issues - MongoDB: $mongo_ok, PostgreSQL: $postgres_ok"
        return 1
    fi
}

# Check recent backup status
check_recent_backups() {
    local max_age_hours=25  # Daily backups should be within 25 hours
    local recent_backup_found=false
    
    # Check for recent MongoDB backups
    if find "${BACKUP_DIR}/mongodb" -name "daily_*.tar.gz" -type f -mtime -1 2>/dev/null | grep -q .; then
        recent_backup_found=true
    fi
    
    # Check for recent PostgreSQL backups
    if find "${BACKUP_DIR}/postgresql" -name "daily_*.sql.gz" -type f -mtime -1 2>/dev/null | grep -q .; then
        recent_backup_found=true
    fi
    
    if [[ "$recent_backup_found" == true ]]; then
        return 0
    else
        log "WARNING: No recent backups found within the last 24 hours"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local usage_percent=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    local available_space=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    
    if [[ $usage_percent -lt 90 ]]; then
        return 0
    else
        log "ERROR: Disk space critical - ${usage_percent}% used, only $available_space available"
        return 1
    fi
}

# Check cron service
check_cron_service() {
    if pgrep crond >/dev/null 2>&1; then
        return 0
    else
        log "ERROR: Cron service not running"
        return 1
    fi
}

# Check backup script permissions
check_script_permissions() {
    local scripts_ok=true
    
    for script in "/scripts/backup-all.sh" "/scripts/backup-full.sh" "/scripts/cleanup-backups.sh"; do
        if [[ ! -x "$script" ]]; then
            log "ERROR: Script $script is not executable"
            scripts_ok=false
        fi
    done
    
    if [[ "$scripts_ok" == true ]]; then
        return 0
    else
        return 1
    fi
}

# Generate health status
generate_health_status() {
    local status_file="/tmp/backup_health_status.json"
    local overall_status="healthy"
    local checks_passed=0
    local total_checks=6
    
    # Run all health checks
    local backup_dir_ok=false
    local db_connectivity_ok=false
    local recent_backups_ok=false
    local disk_space_ok=false
    local cron_ok=false
    local scripts_ok=false
    
    if check_backup_directory; then
        backup_dir_ok=true
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_database_connectivity; then
        db_connectivity_ok=true
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_recent_backups; then
        recent_backups_ok=true
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_disk_space; then
        disk_space_ok=true
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_cron_service; then
        cron_ok=true
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_script_permissions; then
        scripts_ok=true
        checks_passed=$((checks_passed + 1))
    fi
    
    # Determine overall status
    if [[ $checks_passed -eq $total_checks ]]; then
        overall_status="healthy"
    elif [[ $checks_passed -ge 4 ]]; then
        overall_status="degraded"
    else
        overall_status="unhealthy"
    fi
    
    # Generate status JSON
    cat > "$status_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "overall_status": "$overall_status",
    "checks_passed": $checks_passed,
    "total_checks": $total_checks,
    "checks": {
        "backup_directory": $backup_dir_ok,
        "database_connectivity": $db_connectivity_ok,
        "recent_backups": $recent_backups_ok,
        "disk_space": $disk_space_ok,
        "cron_service": $cron_ok,
        "script_permissions": $scripts_ok
    },
    "disk_usage": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}')",
    "available_space": "$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')",
    "backup_count": {
        "daily_mongodb": $(find "${BACKUP_DIR}/mongodb" -name "daily_*.tar.gz" -type f 2>/dev/null | wc -l),
        "daily_postgresql": $(find "${BACKUP_DIR}/postgresql" -name "daily_*.sql.gz" -type f 2>/dev/null | wc -l),
        "full_mongodb": $(find "${BACKUP_DIR}/mongodb" -name "full_*.tar.gz" -type f 2>/dev/null | wc -l),
        "full_postgresql": $(find "${BACKUP_DIR}/postgresql" -name "full_*.tar.gz" -type f 2>/dev/null | wc -l)
    }
}
EOF
    
    log "Health status: $overall_status ($checks_passed/$total_checks checks passed)"
    
    # Return appropriate exit code for Docker health check
    if [[ "$overall_status" == "healthy" ]]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    # Ensure log directory exists
    mkdir -p "$(dirname "$HEALTH_LOG")"
    
    # Generate health status and exit with appropriate code
    generate_health_status
}

# Execute main function
main "$@"