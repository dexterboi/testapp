---
name: PitchPerfect Release
description: Workflow for building versioned releases, deploying to Netlify, and publishing artifacts to GitHub main branch while keeping source code separate.
---

# PitchPerfect Release Workflow

Use this skill whenever the user asks to "release", "deploy", "update version", or "push new apk".

## 1. Pre-Check
Ensure you are on the `source` branch (or working branch) and NOT on `main`.
```bash
git branch --show-current
# Should be 'source'
```

## 2. Version Bump
Update version numbers in THREE locations (e.g., to `2.2.2`).

1.  **package.json**: Update `"version"`.
2.  **version.json**:
    *   Update `"version"`, `"latest_version"`, `"build"`.
    *   Update `"ios"` and `"android"` sections.
    *   Update `"notes"`/`"release_notes"` with user-provided details.
3.  **android/app/build.gradle**:
    *   Increment `versionCode` (integer).
    *   Update `versionName` (string).

## 3. Build Process
Build the web app and the Android APK.

```bash
# 1. Build Web App
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build Android APK
cd android && ./gradlew assembleDebug && cd ..

# 4. Copy APK to root (optional but good for reference)
cp android/app/build/outputs/apk/debug/app-debug.apk ./app-debug.apk
```

## 4. Netlify Deployment (Manual)
Since GitHub `main` does not contain source code, we must deploy manually from the local build.

```bash
npx netlify-cli deploy --prod --dir=dist
```

## 5. Publish Artifacts to GitHub
The `main` branch is RESERVED for release artifacts only (`app-debug.apk`, `version.json`).
**NEVER push source code to `main`.**

### Git Workflow:
1.  **Commit source changes** to `source` branch (including version bumps).
    ```bash
    git add .
    git commit -m "chore: Bump version to X.X.X"
    ```

2.  **Switch to temporary release branch**:
    ```bash
    # Create orphan branch (clean start)
    git checkout --orphan release_temp
    git reset # Unstage all files
    ```

3.  **Add ONLY artifacts**:
    ```bash
    # Ensure .gitignore is correct for release (should only allow artifacts)
    echo "*" > .gitignore
    echo "!app-debug.apk" >> .gitignore
    echo "!version.json" >> .gitignore
    echo "!.gitignore" >> .gitignore
    
    git add .gitignore app-debug.apk version.json
    git commit -m "Release X.X.X"
    ```

4.  **Force Push to GitHub Main**:
    ```bash
    git push -f origin release_temp:main
    ```

5.  **Cleanup**:
    ```bash
    git checkout source
    git branch -D release_temp
    ```

## 6. Final verification
- Check Netlify URL (https://pitchperfect-wassef.netlify.app) works.
- Check GitHub `main` branch has only the 3 files.
