# Free Hosting Guide for PocketBase

This guide shows you how to host PocketBase **completely free** using Oracle Cloud's Always Free tier.

---

## 🎯 Option 1: Oracle Cloud Always Free (BEST FREE OPTION)

### Why Oracle Cloud?
- ✅ **100% FREE forever** (no credit card required after setup)
- ✅ 2 VMs with 1GB RAM each
- ✅ 10TB bandwidth/month
- ✅ Full root access
- ✅ Perfect for PocketBase

### Step-by-Step Setup

#### Step 1: Create Oracle Cloud Account

1. Go to https://cloud.oracle.com
2. Click "Start for Free"
3. Sign up (you'll need a credit card for verification, but won't be charged)
4. Verify your email

#### Step 2: Create Free VM Instance

1. Log in to Oracle Cloud Console
2. Go to **Compute** → **Instances**
3. Click **Create Instance**

**Configuration:**
- **Name:** `pocketbase-server`
- **Image:** Ubuntu 22.04 (or latest)
- **Shape:** **VM.Standard.A1.Flex** (ARM-based, always free)
  - OCPUs: 1
  - Memory: 1GB
- **Networking:** 
  - Create new VCN (Virtual Cloud Network)
  - Assign public IP: ✅ Yes
- **SSH Keys:** 
  - Generate new key pair or upload your existing public key
  - Download the private key (you'll need it to SSH)

4. Click **Create**

#### Step 3: Configure Firewall (Security List)

1. Go to **Networking** → **Virtual Cloud Networks**
2. Click on your VCN
3. Click **Security Lists** → **Default Security List**
4. Click **Add Ingress Rules**

Add these rules:

**Rule 1: SSH**
- Source: `0.0.0.0/0`
- IP Protocol: TCP
- Source Port Range: All
- Destination Port Range: `22`
- Description: SSH Access

**Rule 2: HTTP**
- Source: `0.0.0.0/0`
- IP Protocol: TCP
- Source Port Range: All
- Destination Port Range: `80`
- Description: HTTP

**Rule 3: HTTPS**
- Source: `0.0.0.0/0`
- IP Protocol: TCP
- Source Port Range: All
- Destination Port Range: `443`
- Description: HTTPS

**Rule 4: PocketBase**
- Source: `0.0.0.0/0`
- IP Protocol: TCP
- Source Port Range: All
- Destination Port Range: `8090`
- Description: PocketBase

5. Click **Add Ingress Rules** for each

#### Step 4: Connect to Your Server

**On Mac/Linux:**
```bash
# Make key executable
chmod 400 ~/Downloads/your-private-key.key

# SSH into server
ssh -i ~/Downloads/your-private-key.key ubuntu@YOUR_PUBLIC_IP
```

**On Windows:**
Use PuTTY or WSL with the same command.

#### Step 5: Install PocketBase

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create app directory
mkdir -p ~/pitchperfect
cd ~/pitchperfect

# Download PocketBase (Linux ARM64)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_arm64.zip

# Or if you need AMD64:
# wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip

# Extract
unzip pocketbase_0.22.0_linux_arm64.zip
chmod +x pocketbase

# Test run
./pocketbase serve
```

Press `Ctrl+C` to stop. We'll set up a service next.

#### Step 6: Upload Your Data

**From your local machine:**

```bash
# Upload migrations
scp -i ~/Downloads/your-private-key.key -r pocketbase_0.36.0_darwin_arm64/pb_migrations ubuntu@YOUR_PUBLIC_IP:~/pitchperfect/

# Upload data (if you have existing data)
scp -i ~/Downloads/your-private-key.key -r pocketbase_0.36.0_darwin_arm64/pb_data ubuntu@YOUR_PUBLIC_IP:~/pitchperfect/
```

#### Step 7: Set Up Systemd Service (Auto-start)

```bash
# Create service file
sudo nano /etc/systemd/system/pocketbase.service
```

Paste this:

```ini
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/pitchperfect
ExecStart=/home/ubuntu/pitchperfect/pocketbase serve
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`)

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

# Check status
sudo systemctl status pocketbase

# View logs
sudo journalctl -u pocketbase -f
```

#### Step 8: Set Up Domain (Optional but Recommended)

**Option A: Use Free Domain**
- Get free domain from: Freenom, No-IP, or DuckDNS
- Point DNS to your Oracle Cloud public IP

**Option B: Use IP Address**
- Your PocketBase URL: `http://YOUR_PUBLIC_IP:8090`
- Works but not ideal for production

#### Step 9: Set Up HTTPS with Let's Encrypt (Free SSL)

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/pocketbase
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pocketbase /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate (if you have domain)
sudo certbot --nginx -d your-domain.com

# Or if using IP only, skip SSL for now (use HTTP)
```

#### Step 10: Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8090/tcp  # PocketBase (direct access)

# Enable firewall
sudo ufw enable
sudo ufw status
```

#### Step 11: Access PocketBase Admin

1. Open browser: `http://YOUR_PUBLIC_IP:8090/_/` (or `https://your-domain.com/_/`)
2. Create admin account
3. Your PocketBase is now live!

#### Step 12: Update Your App

Create `.env.production`:
```env
VITE_PB_URL=http://YOUR_PUBLIC_IP:8090
# Or if you set up domain:
# VITE_PB_URL=https://your-domain.com
```

---

## 🎯 Option 2: Railway Free Tier

### Quick Setup

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub**
4. Create a new repo with PocketBase
5. Add this `Dockerfile`:

```dockerfile
FROM alpine:latest

RUN apk add --no-cache wget unzip

WORKDIR /app

# Download PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip && \
    unzip pocketbase_0.22.0_linux_amd64.zip && \
    chmod +x pocketbase && \
    rm pocketbase_0.22.0_linux_amd64.zip

# Copy your data
COPY pb_migrations ./pb_migrations
COPY pb_data ./pb_data

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
```

6. Deploy
7. Get your Railway URL (free HTTPS included)

**Note:** Railway gives $5 free credit monthly, usually enough for small apps.

---

## 🎯 Option 3: Fly.io Free Tier

### Quick Setup

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Sign up
fly auth signup

# Create app
fly launch

# Deploy
fly deploy
```

**Free Tier:**
- 3 shared VMs
- 3GB persistent storage
- 160GB outbound data transfer

---

## 🎯 Option 4: Render Free Tier

1. Go to https://render.com
2. Sign up with GitHub
3. Create **Web Service**
4. Connect your PocketBase repo
5. Deploy

**Note:** Free tier spins down after inactivity (wakes in ~30 seconds).

---

## 💰 Cost Comparison

| Service | Free Tier | Limitations |
|---------|----------|-------------|
| **Oracle Cloud** | ✅ Forever free | 1GB RAM, 10TB bandwidth |
| **Railway** | ✅ $5/month credit | Credit expires, then pay |
| **Fly.io** | ✅ 3 VMs, 3GB storage | 160GB transfer/month |
| **Render** | ✅ Free web service | Spins down when idle |

---

## 🏆 Recommendation

**For truly free (forever):** Use **Oracle Cloud Always Free**
- No expiration
- Good performance
- Full control
- Perfect for PocketBase

**For easiest setup:** Use **Railway** or **Fly.io**
- Quick deployment
- Free tier covers small apps
- HTTPS included

---

## 🔧 Troubleshooting

### Can't SSH to Oracle Cloud
- Check Security List rules (port 22)
- Verify you're using correct IP
- Check key permissions: `chmod 400 key.pem`

### PocketBase won't start
- Check logs: `sudo journalctl -u pocketbase -f`
- Verify file permissions: `chmod +x pocketbase`
- Check if port 8090 is available: `sudo netstat -tulpn | grep 8090`

### Can't access from browser
- Check firewall: `sudo ufw status`
- Verify Security List in Oracle Cloud
- Test locally: `curl http://localhost:8090`

---

## 📱 Next Steps

1. Choose your free hosting option
2. Follow the setup guide
3. Get your PocketBase URL
4. Update `.env.production` in your app
5. Build APK with production URL
6. Test on real device

---

## 🆘 Need Help?

- Oracle Cloud Docs: https://docs.oracle.com/en-us/iaas/
- PocketBase Docs: https://pocketbase.io/docs
- Railway Docs: https://docs.railway.app

**Your app can now run completely free! 🎉**
