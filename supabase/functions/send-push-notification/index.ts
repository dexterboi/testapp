  // Supabase Edge Function to send push notifications using FCM v1 API
  // Uses service account with OAuth2 authentication

  import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
  import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

  // Get OAuth2 access token from service account
  async function getAccessToken(serviceAccount: any): Promise<string> {
    try {
      // Create JWT for OAuth2
      const now = getNumericDate(new Date());
      const jwt = await create(
        { alg: 'RS256', typ: 'JWT' },
        {
          iss: serviceAccount.client_email,
          scope: 'https://www.googleapis.com/auth/firebase.messaging',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now
        },
        await importPrivateKey(serviceAccount.private_key)
      );

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Import private key for JWT signing
  async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
    // Remove PEM headers and whitespace
    const privateKey = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');

    const keyData = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));

    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );
  }

  serve(async (req) => {
    try {
      const { userId, title, body, data } = await req.json()

      if (!userId || !title || !body) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Get service account from environment variable
      const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
      
      if (!serviceAccountJson) {
        return new Response(
          JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT environment variable not set' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const serviceAccount = JSON.parse(serviceAccountJson);
      const projectId = serviceAccount.project_id;

      // Get Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Get device tokens for user
      const { data: tokens, error } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', userId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (!tokens || tokens.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'No device tokens found' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Get OAuth2 access token
      console.log('🔑 Getting OAuth2 access token...');
      const accessToken = await getAccessToken(serviceAccount);
      console.log('🔑 Access token obtained:', accessToken ? 'Yes' : 'No');

      // Send notifications using FCM v1 API
      console.log(`📤 Sending to ${tokens.length} device(s) for user ${userId}`);
      console.log(`🔑 Using project ID: ${projectId}`);
      console.log(`🔑 Access token obtained: ${accessToken ? 'Yes' : 'No'}`);
      
      const results = await Promise.allSettled(
        tokens.map((tokenData, idx) => {
          console.log(`📱 Token ${idx}: ${tokenData.token.substring(0, 20)}...`);
          return fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                token: tokenData.token,
                notification: {
                  title: title,
                  body: body,
                },
                data: data || {},
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
        })
      );

      // Collect detailed results for response
      const detailedResults: any[] = [];
      let successful = 0;
      let failed = 0;

      // Process results and collect details
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
          console.error(`❌ Failed to send to token ${i}:`, result.reason);
          detailedResults.push({
            tokenIndex: i,
            success: false,
            error: result.reason?.toString() || 'Unknown error'
          });
          failed++;
        } else if (!result.value.ok) {
          const errorText = await result.value.text();
          console.error(`❌ Failed to send to token ${i}:`, errorText);
          console.error(`   Status: ${result.value.status}, StatusText: ${result.value.statusText}`);
          detailedResults.push({
            tokenIndex: i,
            success: false,
            status: result.value.status,
            statusText: result.value.statusText,
            error: errorText
          });
          failed++;
        } else {
          try {
            const responseData = await result.value.json();
            console.log(`✅ Successfully sent to token ${i}:`, JSON.stringify(responseData));
            detailedResults.push({
              tokenIndex: i,
              success: true,
              fcmResponse: responseData
            });
            successful++;
          } catch (e) {
            const responseText = await result.value.text();
            console.log(`✅ Successfully sent to token ${i} (no JSON response):`, responseText);
            detailedResults.push({
              tokenIndex: i,
              success: true,
              fcmResponse: responseText || 'No response body'
            });
            successful++;
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: successful > 0, 
          sent: successful, 
          failed: failed,
          total: tokens.length,
          details: detailedResults,
          message: successful > 0 
            ? `Notification sent to ${successful} device(s)` 
            : failed > 0 
              ? `Failed to send to all ${failed} device(s). Check details.`
              : 'No devices found'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error: any) {
      console.error('Error in send-push-notification:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  })
