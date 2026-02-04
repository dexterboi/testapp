# Notification Troubleshooting Guide

Since the app no longer crashes, the issue is likely in the **delivery pipeline**. Please check the following:

## 1. Verify Device Token (Supabase)
When you log in with the new app version:
1. Go to **Supabase Dashboard** > **Table Editor**.
2. Open the `device_tokens` table.
3. Sort by `created_at` (descending).
4. **Check:** Do you see a new row with your `user_id` and `platform: 'android'`?
   - **If YES:** The app is working correctly. The issue is on the sending side (Step 2).
   - **If NO:** The app is not registering with Firebase properly. Check the Android logs.

## 2. Verify Service Account (Supabase Secrets)
The Edge Function needs permission to send notifications to Firebase.
1. Go to **Supabase Dashboard** > **Edge Functions**.
2. Click on your `send-push-notification` function (or check **Project Settings > Secrets**).
3. **Check:** Is there a secret named `FIREBASE_SERVICE_ACCOUNT`?
   - It must contain the JSON content of your `larena-4acd2-....json` file (the Service Account Key).
   - **Action:** If you haven't set this or aren't sure, run this command in your terminal to update it:
     ```bash
     npx supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat '/Users/wasseflabidi/Documents/ai projects/pitchperfect/larena-4acd2-46dc3c7ff520.json')"
     ```

## 3. Verify Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Open your project (**Larena**).
3. Go to **Project Settings** > **Cloud Messaging**.
4. **Check:** Is "Cloud Messaging API (Legacy)" or "Firebase Cloud Messaging API (V1)" enabled?
   - The system usually uses V1.

## 4. Test Sending Manually
You can try to send a test notification using the Supabase Edge Function directly from the terminal to see the error message:

```bash
curl -i --location --request POST 'https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer <YOUR_ANON_KEY_FROM_ENV_FILE>' \
  --header 'Content-Type: application/json' \
  --data '{"userId": "<YOUR_USER_ID>", "title": "Test", "body": "Does this work?"}'
```
*(Replace `<YOUR_ANON_KEY...>` and `<YOUR_USER_ID>` with actual values)*

## Summary
- **No Token in DB?** -> App setup issue (Device permissions?).
- **Token exists but no notification?** -> Edge Function or Firebase Secret issue.
