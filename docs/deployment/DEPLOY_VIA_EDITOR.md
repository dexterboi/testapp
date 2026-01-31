# 📝 Deploy Function via Editor - Quick Steps

## Step 1: Click "Via Editor"

In the Supabase Dashboard, click **"Deploy a new function"** → **"Via Editor"**

## Step 2: Name Your Function

- **Function name**: `send-push-notification`
- Click **"Create function"**

## Step 3: Copy and Paste Code

1. Open the file: `supabase/functions/send-push-notification/index.ts`
2. **Copy ALL the code** (Cmd+A, Cmd+C)
3. **Paste it** into the Supabase editor (Cmd+V)
4. Replace any existing code

## Step 4: Deploy

1. Click **"Deploy"** button (usually at the top right)
2. Wait for deployment to complete
3. ✅ Done!

## Step 5: Verify

1. You should see the function in your Edge Functions list
2. Click on it to see details
3. You can test it by clicking **"Invoke"** button

---

## Important: Environment Variables

Make sure you've already added the secret:
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: The entire JSON content from your service account file

If you haven't done this yet:
1. Go to **Edge Functions** → **Secrets** tab
2. Add the secret before deploying

---

## Test After Deployment

Once deployed, you can test it:
1. Click on the function
2. Click **"Invoke"**
3. Use this test JSON:
```json
{
  "userId": "your-user-id-here",
  "title": "Test Notification",
  "body": "This is a test!",
  "data": {
    "type": "test"
  }
}
```
