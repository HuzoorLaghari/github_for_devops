#!/bin/bash
set -euo pipefail

echo "=== One-time EC2 full-stack setup ==="

DB_NAME="${DB_NAME:-visitor_app}"
DB_USER="${DB_USER:-app_user}"
DB_PASS="${DB_PASSWORD:-app_password}"
APP_DIR="/opt/visitor-app"

# ---- Database setup ----
echo "Creating PostgreSQL database and user..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# Allow password login
sudo sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/peer/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl restart postgresql

echo "Database setup complete."

# ---- Application directory ----
echo "Setting up application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown ec2-user:ec2-user "$APP_DIR"

mkdir -p "$APP_DIR/backend"
mkdir -p "$APP_DIR/frontend"

# ---- Nginx config ----
echo "Configuring Nginx..."
sudo cp /home/ec2-user/nginx-app.conf /etc/nginx/conf.d/visitor-app.conf
sudo rm -f /etc/nginx/conf.d/default.conf
sudo systemctl restart nginx

# ---- Backend systemd service ----
echo "Installing backend systemd service..."
sudo cp /home/ec2-user/backend.service /etc/systemd/system/visitor-backend.service
sudo systemctl daemon-reload
sudo systemctl enable visitor-backend

echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Push code via CI/CD or copy files manually"
echo "  2. Run: sudo systemctl start visitor-backend"
