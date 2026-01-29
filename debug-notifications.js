#!/usr/bin/env node
/**
 * Comprehensive Push Notification Debugging Script
 * 
 * This script performs a complete diagnostic of the push notification system:
 * 1. Checks device tokens in database
 * 2. Tests Edge Function deployment
 * 3. Tests FCM connectivity
 * 4. Provides actionable recommendations
 * 
 * Usage: node debug-notifications.js <user-id>
 */

const SUPABASE_URL = 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

const userId = process.argv[2];

if (!userId) {
    console.error('❌ Error: User ID is required!');
    console.log('\nUsage: node debug-notifications.js <user-id>');
    console.log('Example: node debug-notifications.js "8de1f877-32f8-4960-b550-8b7001a09b95"');
    process.exit(1);
}

const issues = [];
const recommendations = [];

/**
 * Step 1: Check device tokens
 */
async function checkDeviceTokens() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 STEP 1: Checking Device Tokens');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/device_tokens?user_id=eq.${userId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) {
            issues.push('❌ Cannot access device_tokens table');
            recommendations.push('Run CREATE_DEVICE_TOKENS_TABLE.sql in Supabase');
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const tokens = await response.json();

        if (!tokens || tokens.length === 0) {
            issues.push('❌ No device tokens found for user');
            recommendations.push('User needs to open app, login, and grant notification permission');
            console.log('⚠️  No device tokens found!');
            console.log('   This means the app has not registered for push notifications.');
            console.log('   Check:');
            console.log('   - Is the user logged in?');
            console.log('   - Did they grant notification permission?');
            console.log('   - Check browser console for "🔔 [Push]" logs');
            return null;
        }

        console.log(`✅ Found ${tokens.length} device token(s):\n`);
        tokens.forEach((token, idx) => {
            console.log(`   Token ${idx + 1}:`);
            console.log(`   - Platform: ${token.platform}`);
            console.log(`   - Token: ${token.token.substring(0, 40)}...`);
            console.log(`   - Created: ${token.created_at}`);
            console.log(`   - Last used: ${token.last_used_at || 'Never'}`);
            console.log('');
        });

        return tokens;
    } catch (error) {
        issues.push(`❌ Error checking tokens: ${error.message}`);
        console.error('❌ Error:', error.message);
        return null;
    }
}

/**
 * Step 2: Test Edge Function
 */
async function testEdgeFunction(tokens) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 STEP 2: Testing Edge Function');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        console.log('📤 Calling send-push-notification Edge Function...\n');

        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                title: '🔍 Debug Test',
                body: 'Testing push notification system',
                data: {
                    type: 'debug_test',
                    timestamp: new Date().toISOString()
                }
            })
        });

        const responseText = await response.text();

        if (!response.ok) {
            issues.push(`❌ Edge Function error: ${response.status}`);

            if (response.status === 404) {
                recommendations.push('Deploy Edge Function: cd supabase/functions && supabase functions deploy send-push-notification');
            } else if (response.status === 500) {
                recommendations.push('Check Edge Function logs in Supabase Dashboard');
                recommendations.push('Verify FIREBASE_SERVICE_ACCOUNT secret is set');
            }

            console.error(`❌ Error: ${response.status} ${response.statusText}`);
            console.error(`   Response: ${responseText}`);
            return null;
        }

        const data = JSON.parse(responseText);
        console.log('✅ Edge Function Response:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');

        if (data.success && data.sent > 0) {
            console.log(`✅ Successfully sent to ${data.sent} device(s)!`);
            console.log('📱 Check your phone now!');
        } else if (data.sent === 0) {
            issues.push('❌ Edge Function ran but sent 0 notifications');

            if (data.details && data.details.length > 0) {
                console.log('\n📋 FCM Error Details:');
                data.details.forEach((detail, idx) => {
                    if (!detail.success) {
                        console.log(`   Token ${idx}: ${detail.error}`);

                        if (detail.error && detail.error.includes('INVALID_ARGUMENT')) {
                            recommendations.push('FCM token may be invalid - try re-registering the device');
                        } else if (detail.error && detail.error.includes('UNREGISTERED')) {
                            recommendations.push('FCM token is unregistered - device needs to re-register');
                        } else if (detail.error && detail.error.includes('Requested entity was not found')) {
                            recommendations.push('Check Firebase project configuration and service account');
                        }
                    }
                });
            }
        }

        return data;
    } catch (error) {
        issues.push(`❌ Edge Function test failed: ${error.message}`);
        console.error('❌ Error:', error.message);
        return null;
    }
}

/**
 * Step 3: Check database triggers
 */
async function checkDatabaseTriggers() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗄️  STEP 3: Checking Database Triggers');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('ℹ️  Database triggers should be installed for:');
    console.log('   - friend_request_notification_trigger');
    console.log('   - lobby_invite_notification_trigger');
    console.log('   - lobby_access_request_notification_trigger');
    console.log('');
    console.log('⚠️  Cannot verify triggers via REST API');
    console.log('   Please check Supabase Dashboard > Database > Triggers');
    console.log('   Or run: SELECT * FROM pg_trigger WHERE tgname LIKE \'%notification%\';');
    console.log('');

    recommendations.push('Verify database triggers are installed (check Supabase Dashboard)');
}

/**
 * Main diagnostic function
 */
async function main() {
    console.log('\n🔍 PUSH NOTIFICATION DIAGNOSTIC TOOL');
    console.log(`👤 User ID: ${userId}`);

    // Step 1: Check device tokens
    const tokens = await checkDeviceTokens();

    // Step 2: Test Edge Function (only if tokens exist)
    if (tokens && tokens.length > 0) {
        await testEdgeFunction(tokens);
    }

    // Step 3: Check database triggers
    await checkDatabaseTriggers();

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (issues.length === 0) {
        console.log('✅ No issues detected!');
        console.log('   If you still don\'t receive notifications, check:');
        console.log('   - Phone notification settings for the app');
        console.log('   - Battery optimization settings');
        console.log('   - Do Not Disturb mode');
    } else {
        console.log('❌ Issues Found:');
        issues.forEach(issue => console.log(`   ${issue}`));
    }

    if (recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        recommendations.forEach((rec, idx) => console.log(`   ${idx + 1}. ${rec}`));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
