# DevOps Full-Stack Demo

A beginner DevOps project with a full-stack web application — **Terraform** provisions EC2, **GitHub Actions** deploys a Node.js/PostgreSQL app on every push.

## Architecture

```
User → Nginx (port 80)
         ├── /app/*   → static frontend (HTML/CSS/JS)
         └── /api/*   → reverse proxy → Node.js (port 3000)
                                           └── PostgreSQL
```

### Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | HTML + CSS + Vanilla JS             |
| Backend     | Node.js + Express                   |
| Database    | PostgreSQL 15                       |
| IaC         | Terraform (EC2, SG, EIP)            |
| CI/CD       | GitHub Actions                      |
| Web Server  | Nginx (reverse proxy + static)      |

### App Features

- **Visitor counter** — records each page load in PostgreSQL
- **Live system health** — backend & database status
- **Guestbook** — submit and read messages (persisted in DB)

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) (>= 1.0)
- AWS account with [programmatic access](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) configured
- Existing EC2 key pair in your target region
- GitHub repository with Actions enabled

## Setup

### 1. Provision Infrastructure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set key_name to your EC2 key pair name
terraform init
terraform apply
```

Note the `public_ip` from the output.

### 2. One-Time Server Setup

```bash
EC2_IP=$(terraform -chdir=terraform output -raw public_ip)

# Copy setup files
scp -i your-key.pem scripts/setup_server.sh config/nginx-app.conf config/backend.service ec2-user@$EC2_IP:~/
ssh -i your-key.pem ec2-user@$EC2_IP "chmod +x ~/setup_server.sh && ./setup_server.sh"
```

### 3. Set Up GitHub Secrets

| Secret        | Value                                            |
|---------------|--------------------------------------------------|
| `EC2_HOST`    | Public IP (from `terraform output public_ip`)    |
| `EC2_SSH_KEY` | Content of your private key (`cat your-key.pem`) |

### 4. Deploy

Push to `main` — the pipeline copies frontend + backend files, installs npm deps, restarts Nginx and the Node.js service, then verifies both endpoints.

Visit `http://<EC2_IP>/` in your browser.

### Manual Deploy

```bash
bash scripts/deploy.sh $(terraform -chdir=terraform output -raw public_ip)
```

## Clean Up

```bash
terraform -chdir=terraform destroy
```

## Project Structure

```
├── app/                          # Frontend (static files)
│   ├── index.html                # Dashboard layout
│   ├── style.css                 # Dark theme styles
│   └── app.js                    # API calls & interactivity
├── backend/                      # Node.js API
│   ├── package.json
│   ├── server.js                 # Express routes
│   └── db.js                     # PostgreSQL connection & queries
├── config/
│   ├── nginx-app.conf            # Nginx site config + reverse proxy
│   └── backend.service           # systemd unit for Node.js
├── scripts/
│   ├── setup_server.sh           # One-time DB + service setup
│   └── deploy.sh                 # Manual deploy script
├── terraform/
│   ├── main.tf                   # EC2, SG, EIP
│   ├── variables.tf
│   ├── outputs.tf
│   ├── user_data.sh              # Bootstrap (install Nginx, Node, PG)
│   └── terraform.tfvars.example
├── .github/workflows/deploy.yml  # CI/CD pipeline
└── README.md
```
