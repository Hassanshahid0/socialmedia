#!/usr/bin/env bash
set -euo pipefail

# Configuration
REPO_URL="https://github.com/Hassanshahid0/socialmedia.git"
APP_DIR="/opt/socialmedia"
IP_ADDR="4.211.134.149"
BACKEND_PORT="5000"
FRONTEND_PORT="5173"

echo "==> Updating system packages"
sudo apt-get update -y
sudo apt-get install -y curl ca-certificates gnupg build-essential

echo "==> Installing Node.js 22.x (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v

echo "==> Installing PM2 globally"
sudo npm install -g pm2
pm2 -v

echo "==> Cloning application repository"
sudo mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR" ]; then
  echo "Directory $APP_DIR already exists, pulling latest changes"
  cd "$APP_DIR"
  git pull || true
else
  sudo git clone "$REPO_URL" "$APP_DIR"
  sudo chown -R "$USER":"$USER" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Installing backend dependencies"
cd backend
npm ci

echo "==> Creating backend .env"
cat > .env <<EOF
PORT=${BACKEND_PORT}
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_app
JWT_SECRET=change_me_in_production
CLIENT_URL=http://${IP_ADDR}:${FRONTEND_PORT},https://${IP_ADDR}:${FRONTEND_PORT}
EOF

echo "==> Installing frontend dependencies and building"
cd ../frontend
npm ci
npm run build

echo "==> Starting apps with PM2"
cd ..
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Configuring PM2 to start on boot"
pm2 startup systemd -u "$USER" --hp "$HOME" || true

echo "==> Opening firewall ports (if ufw is present)"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow ${BACKEND_PORT}/tcp || true
  sudo ufw allow ${FRONTEND_PORT}/tcp || true
fi

echo "==> Done. Backend: http://${IP_ADDR}:${BACKEND_PORT}/api, Frontend: http://${IP_ADDR}:${FRONTEND_PORT}/"
