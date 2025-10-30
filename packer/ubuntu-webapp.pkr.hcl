packer {
  required_version = ">= 1.9.0"
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = ">= 1.2.0"
    }
  }
}

variable "region" { type = string }
variable "demo_account_id" { type = string }
variable "app_port" { type = number }
variable "db_password" { type = string }

locals {
  ami_name = "webapp-ubuntu-24-04-${formatdate("YYYYMMDDhhmmss", timestamp())}"
}

source "amazon-ebs" "ubuntu24" {
  region        = var.region
  instance_type = "t3.micro"
  ssh_username  = "ubuntu"

  ami_name                    = local.ami_name
  ami_description             = "CSYE6225 webapp AMI (Ubuntu 24.04 + Postgres + systemd + CloudWatch Agent)"
  ami_users                   = [var.demo_account_id]
  ami_description             = "CSYE6225 webapp AMI (Ubuntu 24.04 + systemd, NO local DB)"
  ami_users                   = [var.demo_account_id] # share privately to DEMO

  associate_public_ip_address = true

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*/ubuntu-noble-24.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    owners      = ["099720109477"]
    owners      = ["099720109477"] # Canonical official Ubuntu
    most_recent = true
  }
}

build {
  name    = "webapp-ubuntu24"
  sources = ["source.amazon-ebs.ubuntu24"]

  # ---------- Base OS & runtimes ----------
  # --- OS setup ---
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "export NEEDRESTART_MODE=a",
      "sudo apt-get update -y",
      "sudo apt-get -y -o Dpkg::Options::='--force-confnew' upgrade",
      "sudo apt-get remove -y git || true",
      "sudo apt-get install -y curl unzip jq ca-certificates gnupg",
      # Node 20
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",
      # PostgreSQL
      "sudo apt-get install -y postgresql postgresql-contrib",
      "sudo systemctl enable postgresql",
      "sudo systemctl start postgresql"
    ]
  }

  # ---------- App user ----------
  provisioner "shell" {
    inline = [
      "sudo groupadd -f csye6225",
      "id -u csye6225 >/dev/null 2>&1 || sudo useradd -r -g csye6225 -s /usr/sbin/nologin -d /home/csye6225 csye6225",
      "sudo mkdir -p /home/csye6225",
      "sudo chown -R csye6225:csye6225 /home/csye6225"
    ]
  }

  # ---------- DB role & db ----------
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt-get install -y nodejs"
    ]
  }

  # --- create system user ---
  provisioner "shell" {
    inline = [
      "id -u app >/dev/null 2>&1 || sudo useradd --system --create-home --shell /usr/sbin/nologin app",
      "sudo mkdir -p /home/app",
      "sudo chown -R app:app /home/app"
    ]
  }

  # ---------- Env + dirs ----------
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp /var/log/webapp",
      "echo 'PORT=${var.app_port}' | sudo tee /etc/webapp.env >/dev/null",
      "echo 'DATABASE_URL=postgresql://csye_app:${var.db_password}@localhost:5432/webapp' | sudo tee -a /etc/webapp.env >/dev/null",
      "sudo chown root:root /etc/webapp.env && sudo chmod 600 /etc/webapp.env",
      "sudo chown -R csye6225:csye6225 /opt/webapp /var/log/webapp"
    ]
  }

  # ---------- App artifact ----------
  # --- directories for app + config ---
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp",
      "sudo chown -R app:app /opt/webapp",
      "sudo mkdir -p /etc/webapp",
      "sudo chown root:root /etc/webapp",
      "sudo chmod 755 /etc/webapp"
    ]
  }

  # --- copy artifact from runner ---
  provisioner "file" {
    source      = "dist/artifact.zip"
    destination = "/tmp/artifact.zip"
  }
  provisioner "shell" {
    inline = [
      "sudo unzip -o /tmp/artifact.zip -d /opt/webapp",
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "sudo -u csye6225 -H mkdir -p /home/csye6225/.npm",
      "cd /opt/webapp && sudo -u csye6225 -H npm ci --omit=dev || sudo -u csye6225 -H npm install --omit=dev"
    ]
  }

  # ---------- Schema (optional) ----------
  provisioner "file" {
    source      = "../sql/schema.sql"
    destination = "/tmp/schema.sql"
  }
  provisioner "shell" {
    inline = ["sudo -u postgres psql webapp -f /tmp/schema.sql || true"]
  }

  # ---------- CloudWatch Agent install ----------
  provisioner "shell" {
    inline = [
      "curl -o /tmp/amazon-cloudwatch-agent.deb https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb",
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc"
    ]
  }

  # ---------- CloudWatch Agent config (heredoc) ----------
  provisioner "shell" {
    inline = [<<-EOT
sudo bash -lc 'cat >/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<JSON
{
  "agent": { "metrics_collection_interval": 60, "run_as_user": "root" },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          { "file_path": "/var/log/webapp/access.log", "log_group_name": "/csye6225/webapp/access", "log_stream_name": "{instance_id}" },
          { "file_path": "/var/log/webapp/error.log",  "log_group_name": "/csye6225/webapp/error",  "log_stream_name": "{instance_id}" }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "WebApp",
    "metrics_collected": {
      "statsd": {
        "service_address": ":8125",
        "metrics_collection_interval": 60
      }
    }
  }
}
JSON'
EOT
    ]
  }

  provisioner "shell" {
    inline = ["sudo systemctl enable amazon-cloudwatch-agent"]
  }

  # ---------- systemd unit (logs -> /var/log/webapp/*) ----------
  provisioner "shell" {
    inline = [<<-EOT
sudo bash -lc 'cat >/etc/systemd/system/webapp.service <<UNIT
[Unit]
Description=CSYE6225 WebApp
After=network.target postgresql.service

[Service]
User=csye6225
Group=csye6225
EnvironmentFile=/etc/webapp.env
WorkingDirectory=/opt/webapp
ExecStart=/usr/bin/node /opt/webapp/src/index.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/webapp/access.log
StandardError=append:/var/log/webapp/error.log

[Install]
WantedBy=multi-user.target
UNIT'
EOT
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service"
=======

  # --- unpack + install node deps ---
  provisioner "shell" {
    inline = [
      "sudo unzip -o /tmp/artifact.zip -d /opt/webapp",
      "sudo chown -R app:app /opt/webapp",
      "sudo -u app -H mkdir -p /home/app/.npm",
      "cd /opt/webapp && sudo -u app -H npm ci --omit=dev"
    ]
  }

  # --- create systemd unit ---
  provisioner "shell" {
    inline = [
      "sudo bash -lc 'cat >/etc/systemd/system/webapp.service <<EOF\n[Unit]\nDescription=CSYE6225 WebApp\nAfter=network.target\n\n[Service]\nUser=app\nGroup=app\nEnvironmentFile=/etc/webapp/.env\nWorkingDirectory=/opt/webapp\nExecStart=/usr/bin/node /opt/webapp/src/index.js\nRestart=on-failure\nRestartSec=3\nNoNewPrivileges=true\n\n[Install]\nWantedBy=multi-user.target\nEOF'",
      "sudo systemctl daemon-reload"
    ]
  }
}
