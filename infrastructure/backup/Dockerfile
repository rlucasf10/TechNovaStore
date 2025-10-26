# Database Backup Service Dockerfile
FROM alpine:3.18

# Install required packages
RUN apk add --no-cache \
    bash \
    curl \
    docker-cli \
    mongodb-tools \
    postgresql-client \
    aws-cli \
    coreutils \
    gzip \
    tar \
    cronie \
    tzdata

# Set timezone
ENV TZ=Europe/Madrid
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create backup user and directories
RUN addgroup -g 1000 backup && \
    adduser -D -s /bin/bash -u 1000 -G backup backup

RUN mkdir -p /backups/mongodb /backups/postgresql /scripts /logs && \
    chown -R backup:backup /backups /scripts /logs

# Copy backup scripts
COPY scripts/ /scripts/
RUN chmod +x /scripts/*.sh && \
    chown -R backup:backup /scripts

# Copy crontab
COPY crontab /etc/crontabs/backup

# Switch to backup user
USER backup

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /scripts/health-check.sh

# Start cron daemon
CMD ["crond", "-f", "-d", "8"]