import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Base64 URL encoding (URL-safe base64 without padding)
function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Import private key for JWT signing
async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
    // The private key from JSON will have \n escape sequences
    // We need to convert them to actual newlines, then remove ALL whitespace
    // to get the raw base64 content

    let privateKey = privateKeyPem
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '');

    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Now remove all whitespace (spaces, tabs, newlines)
    privateKey = privateKey.replace(/\s/g, '');

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

// Get OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
    try {
        // Create JWT for OAuth2
        const now = Math.floor(Date.now() / 1000);

        // Build the JWT header and payload
        const header = { alg: 'RS256', typ: 'JWT' };
        const payload = {
            iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        // Encode header and payload using base64url
        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(payload));

        // Create the signature base
        const signatureBase = `${encodedHeader}.${encodedPayload}`;

        // Import the private key and sign
        const privateKey = await importPrivateKey(serviceAccount.private_key);
        const signature = await crypto.subtle.sign(
            { name: 'RSASSA-PKCS1-v1_5' },
            privateKey,
            new TextEncoder().encode(signatureBase)
        );

        // Encode the signature using base64url
        const signatureArray = new Uint8Array(signature);
        const signatureString = String.fromCharCode(...signatureArray);
        const encodedSignature = base64UrlEncode(signatureString);

        // Create the JWT
        const jwt = `${signatureBase}.${encodedSignature}`;

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

serve(async (req) => {
    try {
        // Get service account from environment variable
        const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

        if (!serviceAccountJson) {
            return new Response(
                JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT environment variable not set' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        console.log('Testing Auth for project:', serviceAccount.project_id);

        // Get OAuth2 access token
        console.log('🔑 Getting OAuth2 access token...');
        const accessToken = await getAccessToken(serviceAccount);
        console.log('🔑 Access token obtained:', accessToken ? 'Yes' : 'No');

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Authentication successful',
                projectId: serviceAccount.project_id,
                tokenLength: accessToken.length
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in test-fcm-auth:', error);
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
