#!/bin/bash
set -euxo pipefail

# Update system packages
dnf update -y

# Install Nginx
dnf install -y nginx

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# Install PostgreSQL
dnf install -y postgresql-server postgresql-devel

# Initialize PostgreSQL database cluster
/usr/bin/postgresql-setup --initdb || true

# Configure PostgreSQL to accept password auth
sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
sed -i 's/peer/md5/g' /var/lib/pgsql/data/pg_hba.conf

# Start and enable services
systemctl enable nginx
systemctl enable postgresql

systemctl start nginx

# Install build tools for native modules
dnf install -y gcc make

echo "Bootstrap complete" > /var/log/bootstrap.log
