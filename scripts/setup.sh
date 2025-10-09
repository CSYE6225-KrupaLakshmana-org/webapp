#!/bin/bash
set -euo pipefail

echo "🧹 Updating system..."
sudo apt update -y
sudo apt upgrade -y

echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

echo "🧱 Starting & enabling PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

DB_NAME="csye6225_db"
DB_USER="csyeuser"
DB_PASS="${DB_PASS:-password}"  # pass in DB_PASS env var

echo "🗃 Creating database and user (idempotent)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb "${DB_NAME}"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

echo "👥 Creating application group..."
sudo getent group csye6225 >/dev/null || sudo groupadd csye6225

echo "👤 Creating application user..."
if ! id -u csyeapp >/dev/null 2>&1; then
  sudo useradd -r -g csye6225 -s /bin/false csyeapp
fi

echo "📂 Preparing /opt/csye6225..."
sudo mkdir -p /opt/csye6225
sudo chown -R csyeapp:csye6225 /opt/csye6225
sudo chmod -R 750 /opt/csye6225

echo "✅ Setup complete!"


























