#!/bin/bash
# =============================================================================
# RunON — Server setup script (eenmalig uitvoeren op nieuwe Hetzner server)
# Gebruik: sudo bash setup.sh
# =============================================================================
set -e

# --- Kleuren voor output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   RunON Server Setup — runon.nl          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# --- Controleer of script als root draait ---
if [ "$EUID" -ne 0 ]; then
    echo "Dit script moet als root worden uitgevoerd (sudo bash setup.sh)"
    exit 1
fi

# --- Systeem updaten ---
echo -e "${YELLOW}[1/8] Systeem updaten...${NC}"
apt update && apt upgrade -y

# --- Node.js 22 installeren via NodeSource ---
echo -e "${YELLOW}[2/8] Node.js 22 installeren...${NC}"
if ! command -v node &> /dev/null || [[ "$(node -v)" != v22* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
    echo "Node.js $(node -v) geinstalleerd"
else
    echo "Node.js $(node -v) is al geinstalleerd"
fi

# --- PM2 globaal installeren ---
echo -e "${YELLOW}[3/8] PM2 installeren...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "PM2 geinstalleerd"
else
    echo "PM2 is al geinstalleerd"
fi

# --- Nginx installeren ---
echo -e "${YELLOW}[4/8] Nginx installeren...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    echo "Nginx geinstalleerd en ingeschakeld"
else
    echo "Nginx is al geinstalleerd"
fi

# --- Certbot installeren voor SSL ---
echo -e "${YELLOW}[5/8] Certbot installeren...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "Certbot geinstalleerd"
else
    echo "Certbot is al geinstalleerd"
fi

# --- App directory aanmaken ---
echo -e "${YELLOW}[6/8] App directory aanmaken...${NC}"
APP_DIR="/var/www/runon"
mkdir -p "$APP_DIR"
mkdir -p /var/log/runon

# Maak een deploy user aan als die nog niet bestaat
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    echo "Gebruiker 'deploy' aangemaakt"
fi
chown -R deploy:deploy "$APP_DIR"
chown -R deploy:deploy /var/log/runon

echo "App directory: $APP_DIR"

# --- Nginx configuratie ---
echo -e "${YELLOW}[7/8] Nginx configureren...${NC}"
# Kopieer nginx config (pas aan als je een andere locatie gebruikt)
if [ -f "$APP_DIR/deploy/nginx.conf" ]; then
    ln -sf "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/runon
    ln -sf /etc/nginx/sites-available/runon /etc/nginx/sites-enabled/runon

    # Verwijder default config als die er nog is
    rm -f /etc/nginx/sites-enabled/default

    # Test nginx config
    nginx -t
    systemctl reload nginx
    echo "Nginx geconfigureerd en herladen"
else
    echo "WAARSCHUWING: nginx.conf niet gevonden in $APP_DIR/deploy/"
    echo "Kopieer eerst de code naar $APP_DIR en voer dit script opnieuw uit,"
    echo "of configureer Nginx handmatig."
fi

# --- SSL certificaat ---
echo -e "${YELLOW}[8/8] SSL certificaat aanvragen...${NC}"
echo "Let op: DNS moet al naar deze server wijzen!"
echo ""
read -p "Wil je nu een SSL certificaat aanvragen voor runon.nl? (j/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Jj]$ ]]; then
    certbot certonly --nginx -d runon.nl -d www.runon.nl -d '*.runon.nl' \
        --agree-tos --no-eff-email
    echo "SSL certificaat aangevraagd"

    # Auto-renewal instellen
    systemctl enable certbot.timer
    echo "Certbot auto-renewal ingeschakeld"
else
    echo "SSL overgeslagen — voer later uit:"
    echo "  certbot certonly --nginx -d runon.nl -d www.runon.nl"
fi

# --- .env template aanmaken ---
if [ ! -f "$APP_DIR/.env" ]; then
    cat > "$APP_DIR/.env" << 'ENVEOF'
# RunON Productie Environment
# Vul onderstaande waarden in voor deployment
NODE_ENV=production
DEMO_MODE=false

# Supabase Cloud
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mollie Payments
MOLLIE_API_KEY=live_xxx

# App
NUXT_PUBLIC_BASE_DOMAIN=runon.nl
ENVEOF
    chown deploy:deploy "$APP_DIR/.env"
    echo ".env template aangemaakt in $APP_DIR/.env"
else
    echo ".env bestaat al, niet overschreven"
fi

# --- PM2 startup configureren ---
echo ""
echo -e "${YELLOW}PM2 startup configureren...${NC}"
pm2 startup systemd -u deploy --hp /home/deploy
echo "PM2 startup geconfigureerd voor gebruiker 'deploy'"

# --- Firewall (ufw) ---
echo ""
echo -e "${YELLOW}Firewall configureren...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable
    echo "Firewall geconfigureerd (HTTP, HTTPS, SSH)"
else
    echo "ufw niet gevonden — configureer firewall handmatig"
fi

# --- Klaar ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup voltooid!                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Volgende stappen:"
echo "  1. Clone de repository naar $APP_DIR:"
echo "     sudo -u deploy git clone <repo-url> $APP_DIR"
echo ""
echo "  2. Vul de .env in:"
echo "     nano $APP_DIR/.env"
echo ""
echo "  3. Zorg dat DNS A-records wijzen naar deze server:"
echo "     runon.nl      -> $(curl -s ifconfig.me 2>/dev/null || echo '<server-ip>')"
echo "     *.runon.nl    -> $(curl -s ifconfig.me 2>/dev/null || echo '<server-ip>')"
echo "     www.runon.nl  -> $(curl -s ifconfig.me 2>/dev/null || echo '<server-ip>')"
echo ""
echo "  4. Eerste deployment uitvoeren:"
echo "     sudo -u deploy bash $APP_DIR/deploy/deploy.sh"
echo ""
echo "  5. PM2 opslaan na eerste deploy:"
echo "     sudo -u deploy pm2 save"
echo ""
