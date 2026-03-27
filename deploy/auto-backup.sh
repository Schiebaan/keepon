#!/bin/bash
cd /var/www/runon
git add -A
git diff --cached --quiet && exit 0
git commit -m "auto-backup $(date +%Y-%m-%d_%H:%M)"
git push origin main
