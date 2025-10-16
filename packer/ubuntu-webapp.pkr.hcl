packer {
  required_version = ">= 1.9.0"
  required_plugins {
    amazon = { source = "github.com/hashicorp/amazon", version = ">= 1.2.0" }
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
  ami_description             = "CSYE6225 webapp AMI (Ubuntu 24.04 + Postgres + systemd)"
  ami_users                   = [var.demo_account_id] # share privately to DEMO
  associate_public_ip_address = true

  # ✅ RELAXED NAME FILTER: matches both hvm-ssd and hvm-ssd-gp3 paths
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*/ubuntu-noble-24.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    owners      = ["099720109477"] # Canonical
    most_recent = true
  }
}

build {
  name    = "webapp-ubuntu24"
  sources = ["source.amazon-ebs.ubuntu24"]

  # OS, remove git, install runtime + Postgres (noninteractive)
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "export NEEDRESTART_MODE=a",
      "sudo apt-get update -y",
      "sudo apt-get -y -o Dpkg::Options::='--force-confnew' upgrade",
      "sudo apt-get remove -y git || true",
      "sudo apt-get install -y curl unzip jq ca-certificates gnupg",

      # Install Node.js 20 (your app requires >=20)
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",

      # Install PostgreSQL locally
      "sudo apt-get install -y postgresql postgresql-contrib",
      "sudo systemctl enable postgresql",
      "sudo systemctl start postgresql"
    ]
  }
  # non-login service user + home dir
  provisioner "shell" {
    inline = [
      "sudo groupadd -f csye6225",
      "id -u csye6225 >/dev/null 2>&1 || sudo useradd -r -g csye6225 -s /usr/sbin/nologin -d /home/csye6225 csye6225",
      "sudo mkdir -p /home/csye6225",
      "sudo chown -R csye6225:csye6225 /home/csye6225",
      "getent passwd csye6225"
    ]
  }


  # local DB role + database for the app
  provisioner "shell" {
    inline = [
      "sudo -u postgres psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='csye_app'\" | grep -q 1 || sudo -u postgres psql -c \"CREATE ROLE csye_app LOGIN PASSWORD '${var.db_password}';\"",
      "sudo -u postgres psql -tc \"SELECT 1 FROM pg_database WHERE datname='webapp'\" | grep -q 1 || sudo -u postgres createdb -O csye_app webapp"
    ]
  }

  # env + app dir
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp",
      "echo 'PORT=${var.app_port}' | sudo tee /etc/webapp.env >/dev/null",
      "echo 'DATABASE_URL=postgresql://csye_app:${var.db_password}@localhost:5432/webapp' | sudo tee -a /etc/webapp.env >/dev/null",
      "sudo chown root:root /etc/webapp.env && sudo chmod 600 /etc/webapp.env",
      "sudo chown -R csye6225:csye6225 /opt/webapp"
    ]
  }

  # copy app artifact built on the runner
  provisioner "file" {
    source      = "dist/artifact.zip"
    destination = "/tmp/artifact.zip"
  }

  # unpack artifact + install prod deps (Node)
  provisioner "shell" {
    inline = [
      "sudo unzip -o /tmp/artifact.zip -d /opt/webapp",
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      # set up npm cache in user's home (optional but clean)
      "sudo -u csye6225 -H mkdir -p /home/csye6225/.npm",
      # run npm ci as csye6225 with proper HOME
      "cd /opt/webapp && sudo -u csye6225 -H npm ci --omit=dev"
    ]
  }

  # OPTIONAL: apply your schema so the baked image has tables
  provisioner "file" {
    source      = "../sql/schema.sql"
    destination = "/tmp/schema.sql"
  }
  provisioner "shell" {
    inline = [
      "sudo -u postgres psql webapp -f /tmp/schema.sql || true"
    ]
  }

  # systemd unit (adjust ExecStart to your real command)
  provisioner "shell" {
    inline = [
      "sudo bash -lc 'cat >/etc/systemd/system/webapp.service <<EOF\n[Unit]\nDescription=CSYE6225 WebApp\nAfter=network.target postgresql.service\n\n[Service]\nUser=csye6225\nGroup=csye6225\nEnvironmentFile=/etc/webapp.env\nWorkingDirectory=/opt/webapp\nExecStart=/usr/bin/node /opt/webapp/src/index.js\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target\nEOF'",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service"
    ]
  }
}

