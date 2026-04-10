#!/bin/bash
# =============================================================================
# RunON — Deployment script (bij elke deploy uitvoeren)
# Gebruik: bash deploy.sh
# =============================================================================
set -e

# --- Configuratie ---
APP_DIR="/var/www/runon"
APP_NAME="runon"

# --- Kleuren voor output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   RunON Deploy — upsol.nl                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# --- Naar app directory ---
cd "$APP_DIR"

# --- Controleer of .env bestaat ---
if [ ! -f ".env" ]; then
    echo -e "${RED}FOUT: .env bestand niet gevonden in $APP_DIR${NC}"
    echo "Maak eerst een .env aan op basis van .env.production.example"
    exit 1
fi

# --- Laatste code ophalen ---
echo -e "${YELLOW}[1/5] Laatste code ophalen van git...${NC}"
git fetch --all
git reset --hard origin/main
echo "Code bijgewerkt naar laatste versie"

# --- Dependencies installeren ---
echo -e "${YELLOW}[2/5] Dependencies installeren...${NC}"
npm ci --production=false
echo "Dependencies geinstalleerd"

# --- Nuxt bouwen ---
echo -e "${YELLOW}[3/5] Nuxt applicatie bouwen...${NC}"
npx nuxt build
echo "Build voltooid"

# --- PM2 herstarten of starten ---
echo -e "${YELLOW}[4/5] Applicatie herstarten...${NC}"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    # App draait al, herstart
    pm2 reload "$APP_NAME" --update-env
    echo "Applicatie herstart (zero-downtime reload)"
else
    # Eerste keer starten
    pm2 start ecosystem.config.cjs
    echo "Applicatie gestart"
fi

# --- PM2 state opslaan (voor auto-start na reboot) ---
echo -e "${YELLOW}[5/5] PM2 state opslaan...${NC}"
pm2 save
echo "PM2 state opgeslagen"

# --- Status tonen ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deploy voltooid!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
pm2 status
echo ""
echo "Logs bekijken:  pm2 logs $APP_NAME"
echo "Status:         pm2 monit"
echo "Website:        https://upsol.nl"
echo ""
