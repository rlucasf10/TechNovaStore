#!/bin/bash
# Script to remove hardcoded passwords from git history

git filter-branch --force --index-filter \
  'git ls-files -s | \
   sed "s/\(password\)/REMOVED_PASSWORD/g" | \
   GIT_INDEX_FILE=$GIT_INDEX_FILE.new git update-index --index-info && \
   mv "$GIT_INDEX_FILE.new" "$GIT_INDEX_FILE"' \
  --prune-empty --tag-name-filter cat -- --all
