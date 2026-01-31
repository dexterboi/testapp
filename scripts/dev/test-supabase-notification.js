#!/usr/bin/env node
/**
 * Test Supabase Edge Function Push Notification
 * 
 * This tests if Supabase can send notifications via the Edge Function
 * 
 * Usage:
 *   node test-supabase-notification.js <user-id> [title] [body]
 * 
 * Example:
 *   node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95" "Test" "Hello from Supabase!"
 */

const SUPABASE_URL = 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

// Get command line arguments
const userId = process.argv[2];
const title = process.argv[3] || '🔔 Test Notification from Supabase';
const body = process.argv[4] || 'This is a test notification sent via Supabase Edge Function!';

if (!userId) {
  console.error('❌ Error: User ID is required!');
  console.log('\nUsage:');
  console.log('  node test-supabase-notification.js <user-id> [title] [body]');
  console.log('\nExample:');
  console.log('  node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95" "Hello" "World"');
  process.exit(1);
}

/**
 * Test Supabase Edge Function
 */
async function testSupabaseNotification() {
  try {
    console.log('🚀 Testing Supabase Edge Function Push Notification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`👤 User ID: ${userId}`);
    console.log(`📝 Title: ${title}`);
    console.log(`📄 Body: ${body}`);
    console.log(`🔗 Edge Function: ${SUPABASE_URL}/functions/v1/send-push-notification\n`);
    
    console.log('📤 Sending notification via Supabase Edge Function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        title: title,
        body: body,
        data: {
          type: 'test',
          source: 'supabase_edge_function',
          timestamp: new Date().toISOString()
        }
      })
    });

    const responseText = await response.text();
    
    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ Edge Function Error:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${responseText}`);
      
      // Try to parse as JSON for better error display
      try {
        const errorData = JSON.parse(responseText);
        console.error('\n📋 Error Details:');
        console.error(JSON.stringify(errorData, null, 2));
      } catch (e) {
        // Not JSON, just show raw text
      }
      
      return { success: false, error: responseText };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    console.log('\n✅ Edge Function Response:');
    console.log(JSON.stringify(responseData, null, 2));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (responseData.success) {
      console.log('✅ Notification sent successfully via Supabase!');
      console.log(`📊 Sent: ${responseData.sent || 0}, Failed: ${responseData.failed || 0}, Total: ${responseData.total || 0}`);
      
      // Show FCM response details if available
      if (responseData.details && responseData.details.length > 0) {
        console.log('\n📋 FCM Response Details:');
        responseData.details.forEach((detail, idx) => {
          if (detail.success) {
            console.log(`   ✅ Token ${idx}: FCM accepted`);
            if (detail.fcmResponse) {
              console.log(`      Response: ${JSON.stringify(detail.fcmResponse).substring(0, 100)}...`);
            }
          } else {
            console.log(`   ❌ Token ${idx}: FCM rejected`);
            console.log(`      Status: ${detail.status || 'N/A'}`);
            console.log(`      Error: ${detail.error || 'Unknown error'}`);
          }
        });
      }
      
      console.log('\n📱 Check your phone for the notification!');
      
      if (responseData.sent === 0) {
        console.log('\n⚠️  WARNING: No notifications were sent!');
        console.log('   This could mean:');
        console.log('   - No device tokens found for this user');
        console.log('   - Device token is invalid/expired');
        console.log('   - FCM rejected the token');
        console.log('   - Check Supabase device_tokens table');
        
        if (responseData.details && responseData.details.length > 0) {
          console.log('\n   FCM Error Details:');
          responseData.details.forEach((detail, idx) => {
            if (!detail.success) {
              console.log(`   Token ${idx}: ${detail.error}`);
            }
          });
        }
      }
    } else {
      console.log('❌ Notification failed!');
      console.log(`   Error: ${responseData.error || responseData.message || 'Unknown error'}`);
      
      // Show details if available
      if (responseData.details && responseData.details.length > 0) {
        console.log('\n📋 FCM Error Details:');
        responseData.details.forEach((detail, idx) => {
          console.log(`   Token ${idx}: ${detail.error || 'Unknown error'}`);
        });
      }
    }
    
    return { success: responseData.success, data: responseData };
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Check device tokens for user
 */
async function checkDeviceTokens() {
  try {
    console.log('\n🔍 Checking device tokens for user...\n');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/device_tokens?user_id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (!response.ok) {
      console.error('❌ Error checking device tokens:', response.status);
      return;
    }

    const tokens = await response.json();
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️  No device tokens found for this user!');
      console.log('   The user needs to:');
      console.log('   1. Open the app');
      console.log('   2. Log in');
      console.log('   3. Grant notification permission');
      console.log('   4. Check device_tokens table in Supabase');
    } else {
      console.log(`✅ Found ${tokens.length} device token(s):`);
      tokens.forEach((token, idx) => {
        console.log(`   ${idx + 1}. Platform: ${token.platform}`);
        console.log(`      Token: ${token.token.substring(0, 30)}...`);
        console.log(`      Created: ${token.created_at}`);
        console.log(`      Last used: ${token.last_used_at || 'Never'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking device tokens:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  // First check device tokens
  await checkDeviceTokens();
  
  // Then test notification
  const result = await testSupabaseNotification();
  
  if (!result.success) {
    process.exit(1);
  }
}

main();
