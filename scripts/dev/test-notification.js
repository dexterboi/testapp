// Quick test script to send a push notification
// Run: node test-notification.js

const SUPABASE_URL = 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

const userId = '8de1f877-32f8-4960-b550-8b7001a09b95';

async function testNotification() {
  try {
    console.log('📤 Sending test notification to user:', userId);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        title: '🎉 Test Notification!',
        body: 'Push notifications are working perfectly!',
        data: {
          type: 'test',
          message: 'This is a test notification from Larena'
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!', result);
      console.log(`📊 Sent: ${result.sent}, Failed: ${result.failed}, Total: ${result.total}`);
    } else {
      console.error('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
  }
}

testNotification();
