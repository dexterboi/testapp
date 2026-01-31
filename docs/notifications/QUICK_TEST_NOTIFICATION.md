# ⚡ Quick Test Notification Command

## One-Line Command

```bash
node test-fcm-direct.js "YOUR_DEVICE_TOKEN_HERE"
```

## Step-by-Step

1. **Get your device token:**
   ```bash
   # From Supabase Dashboard:
   # Table Editor → device_tokens → Copy token value
   ```

2. **Run the test:**
   ```bash
   node test-fcm-direct.js "cXyZ123abc456def789..."
   ```

3. **Check your phone** - You should receive the notification!

## Custom Message

```bash
node test-fcm-direct.js "YOUR_TOKEN" "Hello!" "This is a test"
```

## What It Does

- ✅ Connects directly to Firebase FCM API
- ✅ Uses your service account credentials
- ✅ Sends notification to your device
- ✅ Shows detailed response from Firebase

## Troubleshooting

**"Device token is required!"**
- Make sure you pass the token as first argument
- Put token in quotes: `"your-token"`

**"Service account JSON not found!"**
- File should be at: `android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json`

**"Invalid token"**
- Token might be expired
- Uninstall and reinstall app to get new token

**Notification not received**
- Check phone notification settings
- Make sure app has notification permission
- Test token in Firebase Console first
