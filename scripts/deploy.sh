#!/bin/bash
set -euo pipefail

HOST="$1"
APP_DIR="/opt/visitor-app"

echo "=== Deploying full-stack app to $HOST ==="

echo "Copying frontend files..."
ssh -o StrictHostKeyChecking=no "ec2-user@$HOST" "mkdir -p $APP_DIR/frontend"
scp -o StrictHostKeyChecking=no -r app/* "ec2-user@$HOST:$APP_DIR/frontend/"

echo "Copying backend files..."
ssh -o StrictHostKeyChecking=no "ec2-user@$HOST" "mkdir -p $APP_DIR/backend"
scp -o StrictHostKeyChecking=no -r backend/* "ec2-user@$HOST:$APP_DIR/backend/"

echo "Copying config files..."
scp -o StrictHostKeyChecking=no config/nginx-app.conf "ec2-user@$HOST:~/"
scp -o StrictHostKeyChecking=no config/backend.service "ec2-user@$HOST:~/"

echo "Installing npm dependencies..."
ssh -o StrictHostKeyChecking=no "ec2-user@$HOST" "cd $APP_DIR/backend && npm install --omit=dev"

echo "Copying frontend to Nginx web root..."
ssh -o StrictHostKeyChecking=no "ec2-user@$HOST" "sudo rm -rf /usr/share/nginx/html/app && sudo cp -r $APP_DIR/frontend /usr/share/nginx/html/app && sudo chown -R nginx:nginx /usr/share/nginx/html/app"

echo "Setting up Nginx config..."
ssh -o StrictHostKeyChecking=no "ec2-user@$HOST" "sudo cp /home/ec2-user/nginx-app.conf /etc/nginx/conf.d/visitor-app.conf && sudo rm -f /etc/nginx/conf.d/default.conf && sudo systemctl restart nginx"

echo "Setting up backend service..."
ssh -o StrictHostKeyChecking=no "ec2-user@$HOST" "sudo cp /home/ec2-user/backend.service /etc/systemd/system/visitor-backend.service && sudo systemctl daemon-reload && sudo systemctl enable visitor-backend && sudo systemctl restart visitor-backend"

echo "Waiting for backend to start..."
sleep 3

echo "Verifying deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$HOST/" 2>/dev/null || echo "000")
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$HOST/api/health" 2>/dev/null || echo "000")
echo "Frontend: $HTTP_CODE | API: $API_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "=== Deployment successful! ==="
else
  echo "WARNING: Frontend returned $HTTP_CODE (expected 200)"
fi
