# 🚀 Deploy Website to InfinityFree

## Quick Steps

### 1. Prepare Files
All files are ready in `website/` folder:
- ✅ `index.html` - Landing page
- ✅ `login.html` - Owner login
- ✅ `dashboard.html` - Owner dashboard
- ✅ `dashboard.js` - Dashboard functionality
- ✅ `.htaccess` - For routing
- ✅ `assets/logo.png` - Logo

### 2. Create InfinityFree Account
1. Go to: https://www.infinityfree.net/
2. Sign up (free)
3. Verify email

### 3. Create Website
1. Login to InfinityFree Control Panel
2. Click **"Create Website"**
3. Choose:
   - **Domain**: Free subdomain (e.g., `larena.infinityfreeapp.com`)
   - **Website Type**: Static HTML

### 4. Upload Files

**Option A: File Manager (Easiest)**
1. Go to Control Panel → **File Manager**
2. Navigate to `htdocs/` or `public_html/`
3. Upload ALL files from `website/` folder:
   - `index.html`
   - `login.html`
   - `dashboard.html`
   - `dashboard.js`
   - `.htaccess`
   - `assets/` folder (with logo.png)

**Option B: FTP (Recommended)**
1. Get FTP credentials:
   - Control Panel → Your Website → **FTP Accounts**
   - Create FTP account or use default
   - Note: **FTP Host**, **Username**, **Password**

2. Use FileZilla:
   - Download: https://filezilla-project.org/
   - Connect using FTP credentials
   - Navigate to `htdocs/` or `public_html/`
   - Upload ALL files from `website/` folder

### 5. Verify Upload
Make sure these files are in the root:
- ✅ `index.html`
- ✅ `login.html`
- ✅ `dashboard.html`
- ✅ `dashboard.js`
- ✅ `.htaccess`
- ✅ `assets/logo.png`

### 6. Test Website
1. Visit: `https://yoursite.infinityfreeapp.com/`
2. Test login: `https://yoursite.infinityfreeapp.com/login.html`
3. Test dashboard (after login)

## Important Notes

### ✅ What Works:
- Static HTML/CSS/JS
- Supabase API calls
- Charts (Chart.js from CDN)
- Owner authentication
- All dashboard features

### ⚠️ File Structure:
```
htdocs/
├── index.html
├── login.html
├── dashboard.html
├── dashboard.js
├── .htaccess
└── assets/
    └── logo.png
```

### 🔧 If Routes Don't Work:
Make sure `.htaccess` file is uploaded and Apache mod_rewrite is enabled (usually is on InfinityFree).

## Troubleshooting

**404 Errors:**
- Check `.htaccess` is uploaded
- Verify file paths are correct

**Login Not Working:**
- Check browser console for errors
- Verify Supabase credentials in `login.html` and `dashboard.js`

**Charts Not Showing:**
- Check internet connection (Chart.js loads from CDN)
- Check browser console for errors

## Done! ✅

Your website is now live on InfinityFree! Share the URL with owners.
