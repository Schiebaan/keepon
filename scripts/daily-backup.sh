#!/bin/bash
# Daily git backup - pushes all changes to GitHub
cd /var/www/runon

# Skip if no changes
if [ -z "$(git status --porcelain)" ]; then
  echo "$(date): No changes to commit"
  exit 0
fi

# Commit and push
git add -A
git commit -m "auto-backup $(date +%Y-%m-%d_%H:%M)"
git push origin main

echo "$(date): Backup pushed to GitHub"
