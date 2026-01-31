# Deployment Guide: Hosting PocketBase for APK

This guide explains how to deploy your PocketBase database online so your Android APK can connect to it from anywhere.

## 🎯 Overview

Your app currently connects to PocketBase at `http://127.0.0.1:8090` (localhost), which only works on your development machine. For an APK to work on any device, you need to host PocketBase on a public server.

---

## 📋 Hosting Options

### Option 1: PocketBase Cloud (Easiest - Recommended for Beginners)

**PocketBase Cloud** is the official managed hosting service.

**Pros:**
- ✅ Zero server management
- ✅ Automatic backups
- ✅ SSL/HTTPS included
- ✅ Easy setup (5 minutes)
- ✅ Free tier available

**Cons:**
- ❌ Paid service (after free tier)
- ❌ Less control over server

**Steps:**
1. Go to https://pocketbase.io/cloud
2. Sign up for an account
3. Create a new project
4. Get your PocketBase URL (e.g., `https://your-project.pocketbase.io`)
5. Upload your migrations and data
6. Update your app's `VITE_PB_URL` environment variable

**Cost:** Free tier available, then paid plans

---

### Option 2: Self-Hosted on VPS (Most Control)

Host PocketBase on your own server (DigitalOcean, AWS, Linode, etc.)

**Pros:**
- ✅ Full control
- ✅ Can be cheaper long-term
- ✅ Custom domain
- ✅ Your data, your server

**Cons:**
- ❌ Requires server management
- ❌ Need to set up SSL/HTTPS
- ❌ Need to handle backups
- ❌ More technical setup

**Recommended VPS Providers:**
- **DigitalOcean**: $6/month (Droplet)
- **Linode**: $5/month
- **Vultr**: $6/month
- **AWS EC2**: Pay-as-you-go
- **Hetzner**: €4/month (Europe)

**Steps:**

#### 2.1. Set Up Server

```bash
# SSH into your server
ssh root@your-server-ip

# Create a user for PocketBase
adduser pocketbase
su - pocketbase

# Create app directory
mkdir -p ~/pitchperfect
cd ~/pitchperfect
```

#### 2.2. Download PocketBase

```bash
# For Linux (64-bit)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
chmod +x pocketbase
```

#### 2.3. Upload Your Data

```bash
# Copy your migrations and data from local machine
# On your local machine:
scp -r pocketbase_0.36.0_darwin_arm64/pb_migrations user@your-server:~/pitchperfect/
scp -r pocketbase_0.36.0_darwin_arm64/pb_data user@your-server:~/pitchperfect/
```

#### 2.4. Set Up Systemd Service (Auto-start)

```bash
# Create service file
sudo nano /etc/systemd/system/pocketbase.service
```

Add this content:

```ini
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/home/pocketbase/pitchperfect
ExecStart=/home/pocketbase/pitchperfect/pocketbase serve
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
sudo systemctl status pocketbase
```

#### 2.5. Set Up Nginx Reverse Proxy (HTTPS)

```bash
# Install Nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/pocketbase
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/pocketbase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

#### 2.6. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Your PocketBase URL:** `https://your-domain.com`

---

### Option 3: Railway (Easy Deployment)

**Railway** is a modern platform that makes deployment easy.

**Pros:**
- ✅ Very easy setup
- ✅ Automatic HTTPS
- ✅ Free tier available
- ✅ One-click deploy

**Steps:**
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project
4. Add PocketBase service
5. Upload your PocketBase binary and data
6. Get your Railway URL

**Cost:** Free tier, then pay-as-you-go

---

### Option 4: Fly.io (Good for Mobile Apps)

**Fly.io** is great for globally distributed apps.

**Pros:**
- ✅ Global edge locations
- ✅ Fast for mobile apps worldwide
- ✅ Easy deployment
- ✅ Free tier

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. Create app: `fly launch`
4. Deploy: `fly deploy`

**Cost:** Free tier, then pay-as-you-go

---

## 🔧 Update Your App Configuration

### Step 1: Create Environment File

Create `.env.production` in your project root:

```env
VITE_PB_URL=https://your-pocketbase-server.com
```

### Step 2: Update Build Script

For Android APK, you'll need to set the environment variable during build:

```json
// package.json
{
  "scripts": {
    "build:android": "VITE_PB_URL=https://your-server.com vite build",
    "build": "vite build"
  }
}
```

### Step 3: For React Native / Capacitor

If you're using Capacitor or React Native, you may need to:

1. **Capacitor**: Update `capacitor.config.ts`:
```typescript
export default {
  server: {
    url: "https://your-pocketbase-server.com"
  }
};
```

2. **React Native**: Use a config file that can be updated without rebuilding:
```typescript
// config.ts
export const API_URL = __DEV__ 
  ? 'http://127.0.0.1:8090'  // Development
  : 'https://your-pocketbase-server.com';  // Production
```

---

## 🔐 Security Considerations

### 1. Enable HTTPS (Required)

**Never use HTTP in production!** Always use HTTPS:
- ✅ Protects user data
- ✅ Required for modern browsers
- ✅ Required for Android apps (API 28+)

### 2. API Access Rules

Review your PocketBase API rules in the admin panel:
- Ensure public read access for complexes/pitches
- Restrict write access to authenticated users
- Protect admin endpoints

### 3. CORS Configuration

If needed, configure CORS in PocketBase:
```javascript
// In PocketBase settings
{
  "cors": {
    "origins": ["*"],  // Or specific domains
    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
    "headers": ["*"]
  }
}
```

### 4. Rate Limiting

Consider adding rate limiting to prevent abuse:
- Use Nginx rate limiting
- Or implement in PocketBase hooks

---

## 📱 Building APK

### Option A: Using Capacitor (Recommended)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize
npx cap init

# Build web app
npm run build

# Add Android platform
npx cap add android

# Sync
npx cap sync

# Open in Android Studio
npx cap open android
```

### Option B: Using React Native

```bash
# Create React Native app
npx react-native init PitchPerfect

# Copy your code
# Update API URL in config
# Build APK
cd android && ./gradlew assembleRelease
```

---

## 🧪 Testing Before APK Release

1. **Test on Real Device:**
   - Install APK on Android phone
   - Test all features
   - Verify API connection

2. **Test API Endpoints:**
   ```bash
   curl https://your-server.com/api/collections/complexes_coll/records
   ```

3. **Check Logs:**
   - Monitor PocketBase logs
   - Check for errors
   - Monitor server resources

---

## 📊 Migration Checklist

- [ ] Choose hosting option
- [ ] Set up PocketBase server
- [ ] Upload migrations and data
- [ ] Configure HTTPS/SSL
- [ ] Update app's API URL
- [ ] Test API connection
- [ ] Review API access rules
- [ ] Set up backups
- [ ] Build APK with production URL
- [ ] Test APK on real device
- [ ] Monitor server after launch

---

## 🆘 Troubleshooting

### "Connection refused" in APK
- ✅ Check server is running
- ✅ Verify URL is correct (HTTPS)
- ✅ Check firewall rules
- ✅ Test URL in browser

### "CORS error"
- ✅ Configure CORS in PocketBase
- ✅ Check Nginx headers

### "SSL certificate error"
- ✅ Ensure valid SSL certificate
- ✅ Use Let's Encrypt (free)

### Slow performance
- ✅ Use CDN for images
- ✅ Enable PocketBase caching
- ✅ Optimize database queries

---

## 💰 Cost Comparison

| Option | Monthly Cost | Setup Time | Difficulty |
|--------|-------------|------------|------------|
| PocketBase Cloud | $0-20 | 5 min | ⭐ Easy |
| Railway | $0-10 | 10 min | ⭐ Easy |
| Fly.io | $0-15 | 15 min | ⭐⭐ Medium |
| VPS (DigitalOcean) | $6-20 | 1-2 hours | ⭐⭐⭐ Hard |

---

## 📞 Need Help?

- PocketBase Docs: https://pocketbase.io/docs
- PocketBase Discord: https://pocketbase.io/discord
- GitHub Issues: https://github.com/pocketbase/pocketbase/issues

---

**Recommended for You:** Start with **PocketBase Cloud** or **Railway** for easiest setup, then migrate to VPS if you need more control later.
