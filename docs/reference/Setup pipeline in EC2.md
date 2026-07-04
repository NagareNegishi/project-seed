# EC2 One-Time Setup

Run once after launching the EC2 instance. Sets up Docker, Docker Compose, AWS CLI, and the app directory needed for the CI/CD pipeline.

---

## 1. Copy SSH key into WSL and connect

```bash
# Copy key into WSL (skip if already done)
mkdir -p ~/.ssh
cp /mnt/c/Users/YOUR_WINDOWS_USERNAME/PATH_TO_KEY/<project>-key.pem ~/.ssh/<project>-key.pem
chmod 400 ~/.ssh/<project>-key.pem

# Connect to EC2
ssh -i ~/.ssh/<project>-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## 2. Install Docker

All remaining commands run on EC2:

```bash
# Update packages and install Docker
sudo apt update -y && sudo apt install -y docker.io

# Start Docker now and on every reboot
sudo systemctl enable docker
sudo systemctl start docker

# Allow ubuntu user to run docker without sudo
sudo usermod -aG docker ubuntu
```

---

## 3. Install Docker Compose plugin

Docker Compose v2 is a CLI plugin, not a standalone binary. Install it manually:

```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

---

## 4. Install AWS CLI

**Initial plan:** `sudo apt install -y awscli`

**Outcome:** apt package unavailable on this Ubuntu version. Use the official installer instead:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

AWS CLI is needed on EC2 to authenticate with ECR before pulling images on each deploy.

---

## 5. Create app directory

```bash
# Deploy job SCPs compose.prod.yml here
mkdir -p /home/ubuntu/app
```

---

## 6. Re-connect and verify

The docker group change only takes effect on a new session:

```bash
exit
ssh -i ~/.ssh/<project>-key.pem ubuntu@YOUR_ELASTIC_IP

docker --version
docker compose version
aws --version
```
