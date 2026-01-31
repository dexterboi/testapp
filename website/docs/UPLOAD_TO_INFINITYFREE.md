# 📤 Upload Files to InfinityFree

## Files to Upload

Upload **ALL** these files from the `website/` folder:

### Required Files:
```
✅ index.html          (Landing page)
✅ login.html          (Owner login)
✅ dashboard.html      (Owner dashboard)
✅ dashboard.js        (Dashboard functionality)
✅ .htaccess          (For routing - IMPORTANT!)
✅ assets/logo.png     (App logo)
```

## Step-by-Step Upload

### Option 1: File Manager (Easiest)

1. **Login to InfinityFree Control Panel**
   - Go to: https://www.infinityfree.net/
   - Login to your account

2. **Open File Manager**
   - Click on your website
   - Click **"File Manager"**

3. **Navigate to Root Directory**
   - Go to `htdocs/` or `public_html/` folder
   - This is your website root

4. **Upload Files**
   - Click **"Upload"** button
   - Select and upload these files:
     - `index.html`
     - `login.html`
     - `dashboard.html`
     - `dashboard.js`
     - `.htaccess` (make sure this is uploaded!)
   
5. **Upload Assets Folder**
   - Create folder: `assets`
   - Upload `logo.png` into `assets/` folder

### Option 2: FTP (Recommended)

1. **Get FTP Credentials**
   - Control Panel → Your Website → **FTP Accounts**
   - Create FTP account or use default
   - Note: **FTP Host**, **Username**, **Password**

2. **Use FileZilla**
   - Download: https://filezilla-project.org/
   - Connect using FTP credentials
   - Navigate to `htdocs/` or `public_html/`

3. **Upload All Files**
   - Drag and drop all files from `website/` folder
   - Make sure `.htaccess` is included!

## Final File Structure on InfinityFree

Your InfinityFree root should look like this:

```
htdocs/ (or public_html/)
├── index.html          ✅
├── login.html          ✅
├── dashboard.html    ✅
├── dashboard.js        ✅
├── .htaccess          ✅ (IMPORTANT!)
└── assets/
    └── logo.png       ✅
```

## Important Notes

### ⚠️ .htaccess File
- **MUST be uploaded** for routing to work
- Make sure it's not renamed or missing
- Without it, routes like `/dashboard.html` might not work

### ⚠️ Assets Folder
- Create `assets/` folder in root
- Upload `logo.png` inside `assets/`
- Path should be: `assets/logo.png`

### ⚠️ File Permissions
- Files should have `644` permissions (default)
- Folders should have `755` permissions (default)
- Usually set automatically by InfinityFree

## Verify Upload

After uploading, check:

1. **All files are in root:**
   - `index.html` ✅
   - `login.html` ✅
   - `dashboard.html` ✅
   - `dashboard.js` ✅
   - `.htaccess` ✅

2. **Assets folder exists:**
   - `assets/logo.png` ✅

3. **Test URLs:**
   - `https://yoursite.infinityfreeapp.com/` → Should show landing page
   - `https://yoursite.infinityfreeapp.com/login.html` → Should show login
   - `https://yoursite.infinityfreeapp.com/dashboard.html` → Should redirect to login (if not logged in)

## Quick Checklist

- [ ] `index.html` uploaded
- [ ] `login.html` uploaded
- [ ] `dashboard.html` uploaded
- [ ] `dashboard.js` uploaded
- [ ] `.htaccess` uploaded (check this!)
- [ ] `assets/` folder created
- [ ] `assets/logo.png` uploaded
- [ ] Test landing page works
- [ ] Test login page works

## Done! ✅

Once all files are uploaded, your website is live on InfinityFree!

**URL:** `https://yoursite.infinityfreeapp.com/`
