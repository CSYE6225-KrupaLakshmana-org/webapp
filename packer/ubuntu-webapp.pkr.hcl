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

  ami_name        = local.ami_name
  ami_description = "CSYE6225 webapp AMI (Ubuntu 24.04 + Postgres + systemd)"
  ami_users       = [var.demo_account_id] # share privately to DEMO

  associate_public_ip_address = true

  source_ami_filter {
  filters = {
    # match both hvm-ssd and hvm-ssd-gp3 name prefixes
    name                = "ubuntu/images/*/ubuntu-noble-24.04-amd64-server-*"
    root-device-type    = "ebs"
    virtualization-type = "hvm"
  }
  owners      = ["099720109477"] # Canonical
  most_recent = true
}

build {
  name    = "webapp-ubuntu24"
  sources = ["source.amazon-ebs.ubuntu24"]

  # 1)OS updates, remove git, install Node + Postgres
  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get upgrade -y",
      "sudo apt-get remove -y git || true", # AMI must NOT have git
      "sudo apt-get install -y curl unzip jq",
      "sudo apt-get install -y nodejs npm", # Node.js runtime
      "sudo apt-get install -y postgresql postgresql-contrib",
      "sudo systemctl enable postgresql",
      "sudo systemctl start postgresql"
    ]
  }

  # 2)Create non-login service user
  provisioner "shell" {
    inline = [
      "sudo groupadd -f csye6225",
      "id -u csye6225 >/dev/null 2>&1 || sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225",
      "getent passwd csye6225"
    ]
  }

  # 3)Create app DB role + database
  provisioner "shell" {
    inline = [
      "sudo -u postgres psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='csye_app'\" | grep -q 1 || sudo -u postgres psql -c \"CREATE ROLE csye_app LOGIN PASSWORD '${var.db_password}';\"",
      "sudo -u postgres psql -tc \"SELECT 1 FROM pg_database WHERE datname='webapp'\" | grep -q 1 || sudo -u postgres createdb -O csye_app webapp"
    ]
  }

  # 4)Create app dir + env file
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp",
      "echo 'PORT=${var.app_port}' | sudo tee /etc/webapp.env >/dev/null",
      "echo 'DATABASE_URL=postgresql://csye_app:${var.db_password}@localhost:5432/webapp' | sudo tee -a /etc/webapp.env >/dev/null",
      "sudo chown root:root /etc/webapp.env && sudo chmod 600 /etc/webapp.env",
      "sudo chown -R csye6225:csye6225 /opt/webapp"
    ]
  }

  # 5)Copy artifact built by GitHub Actions into the image
  provisioner "file" {
    source      = "dist/artifact.zip" # workflow downloads to packer/dist so this path resolves
    destination = "/tmp/artifact.zip"
  }

  # 6)Unpack artifact, install ONLY prod deps
  provisioner "shell" {
    inline = [
      "sudo unzip -o /tmp/artifact.zip -d /opt/webapp",
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "if [ -f /opt/webapp/package.json ]; then cd /opt/webapp && sudo -u csye6225 npm ci --omit=dev; fi"
    ]
  }

  # 7)systemd service to start app at boot
  provisioner "shell" {
    inline = [
      "sudo bash -lc 'cat >/etc/systemd/system/webapp.service <<EOF\n[Unit]\nDescription=CSYE6225 WebApp\nAfter=network.target postgresql.service\n\n[Service]\nUser=csye6225\nGroup=csye6225\nEnvironmentFile=/etc/webapp.env\nWorkingDirectory=/opt/webapp\nExecStart=/usr/bin/node /opt/webapp/src/index.js\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target\nEOF'",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service"
    ]
  }
}
