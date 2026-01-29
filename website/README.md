# Larena Website - Owner Portal

Simple HTML5 website ready for InfinityFree hosting.

## Files

- `index.html` - Landing page
- `login.html` - Owner login (email/password + Google OAuth)
- `dashboard.html` - Owner dashboard with management features
- `dashboard.js` - Dashboard functionality
- `.htaccess` - For SPA routing on InfinityFree
- `assets/logo.png` - App logo

## Features

✅ **Landing Page** - Marketing site  
✅ **Owner Login** - Email/password + Google OAuth  
✅ **Dashboard** - Full management interface:
   - Statistics overview
   - Revenue charts (Chart.js)
   - Booking status charts
   - Manage bookings (approve/reject)
   - Manage complexes (add/edit)
   - Manage pitches (add/edit)
   - Tab-based navigation

## Deployment to InfinityFree

1. **Upload all files** from `website/` folder to InfinityFree:
   - Via FTP: Upload to `htdocs/` or `public_html/`
   - Via File Manager: Upload and extract

2. **Make sure `.htaccess` is uploaded** (for routing)

3. **Test:**
   - Landing: `https://yoursite.infinityfreeapp.com/`
   - Login: `https://yoursite.infinityfreeapp.com/login.html`
   - Dashboard: `https://yoursite.infinityfreeapp.com/dashboard.html`

## Authentication

- Uses Supabase (same as mobile app)
- Only owners can access dashboard
- Session stored in browser
- Auto-redirects to login if not authenticated

## No Build Required!

This is pure HTML/CSS/JS - just upload and it works! ✅
