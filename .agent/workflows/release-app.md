---
description: How to build, deploy, and push a new version (web and mobile)
---

This workflow ensures all platforms (Web and Android) are updated with the same version number and that all assets are correctly synchronized.

### Prerequisites
- Ensure you have updated the version in `package.json` and `version.json`.
- Ensure you are on the `main` branch.

### 1. Build Web Assets
First, build the production web bundle to ensure `dist/` is up to date.
// turbo
```bash
npm run build
```

### 2. Synchronize Capacitor
Copy the newly built web assets to the Android platform and sync plugins.
// turbo
```bash
npx cap copy && npx cap sync
```

### 3. Build Android APK
Run a clean Android build to ensure no stale assets or version info remained.
// turbo
```bash
cd android && ./gradlew clean assembleDebug && cd ..
```

### 4. Stage the APK for Distribution
Copy the generated APK to the root directory for GitHub distribution and OTA updates.
// turbo
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk ./app-debug.apk
```

### 5. Commit and Push to GitHub
Commit all changes (source, version files, and the APK) and push to the main repository.
// turbo
```bash
git add .
git commit -m "feat: release v[VERSION_NUMBER]"
git push origin main
```

### 6. Deploy to Netlify
Finally, deploy the updated web build to production.
// turbo
```bash
npm run deploy
```

### Summary Checklist
- [ ] Version updated in `package.json`
- [ ] Version updated in `version.json`
- [ ] Web Build successful
- [ ] Capacitor Syncing successful
- [ ] Android Build successful
- [ ] APK copied to root
- [ ] Git push successful
- [ ] Netlify deploy successful
