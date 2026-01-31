#!/usr/bin/env node
/**
 * Test FCM Push Notification Directly via Firebase API
 * 
 * Usage:
 *   node test-fcm-direct.js <device-token> [title] [body]
 * 
 * Example:
 *   node test-fcm-direct.js "your-device-token-here" "Test Title" "Test Body"
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Get command line arguments
const deviceToken = process.argv[2];
const title = process.argv[3] || '🎉 Test Notification';
const body = process.argv[4] || 'This is a test notification from Larena!';

if (!deviceToken) {
  console.error('❌ Error: Device token is required!');
  console.log('\nUsage:');
  console.log('  node test-fcm-direct.js <device-token> [title] [body]');
  console.log('\nExample:');
  console.log('  node test-fcm-direct.js "cXyZ123..." "Hello" "World"');
  process.exit(1);
}

// Load service account JSON
const serviceAccountPath = path.join(__dirname, 'android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: Service account JSON not found!');
  console.log(`Expected at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const projectId = serviceAccount.project_id;

/**
 * Create JWT for OAuth2
 */
function createJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  // Encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign JWT
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');

  return `${unsignedToken}.${signature}`;
}

/**
 * Get OAuth2 access token
 */
async function getAccessToken(serviceAccount) {
  try {
    console.log('🔑 Getting OAuth2 access token...');
    
    const jwt = createJWT(serviceAccount);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth2 token exchange failed: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Access token obtained');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error.message);
    throw error;
  }
}

/**
 * Send FCM notification
 */
async function sendFCMNotification(accessToken, deviceToken, title, body) {
  try {
    console.log('📤 Sending notification to FCM...');
    console.log(`   Token: ${deviceToken.substring(0, 20)}...`);
    console.log(`   Title: ${title}`);
    console.log(`   Body: ${body}`);
    
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: {
            title: title,
            body: body,
          },
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default'
              }
            }
          }
        }
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ FCM API Error:');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${responseText}`);
      return { success: false, error: responseText };
    }

    const responseData = JSON.parse(responseText);
    console.log('✅ Notification sent successfully!');
    console.log('📊 Response:', JSON.stringify(responseData, null, 2));
    return { success: true, data: responseData };
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Testing FCM Push Notification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    
    // Send notification
    const result = await sendFCMNotification(accessToken, deviceToken, title, body);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (result.success) {
      console.log('✅ Test completed successfully!');
      console.log('📱 Check your device for the notification.');
    } else {
      console.log('❌ Test failed!');
      console.log('💡 Check the error message above for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
