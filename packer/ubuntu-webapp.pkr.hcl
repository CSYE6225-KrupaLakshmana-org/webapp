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
  ami_description             = "CSYE6225 webapp AMI (Ubuntu 24.04 + systemd, NO local DB)"
  ami_users                   = [var.demo_account_id] # share privately to DEMO
  associate_public_ip_address = true

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*/ubuntu-noble-24.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    owners      = ["099720109477"] # Canonical official Ubuntu
    most_recent = true
  }
}

build {
  name    = "webapp-ubuntu24"
  sources = ["source.amazon-ebs.ubuntu24"]

  # --- OS setup ---
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "export NEEDRESTART_MODE=a",
      "sudo apt-get update -y",
      "sudo apt-get -y -o Dpkg::Options::='--force-confnew' upgrade",
      "sudo apt-get remove -y git || true",
      "sudo apt-get install -y curl unzip jq ca-certificates gnupg",
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
