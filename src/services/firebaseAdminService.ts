/**
 * Firebase Admin SDK Service
 * Uses the service account JSON file for sending push notifications
 * 
 * IMPORTANT: Keep the service account JSON file secure!
 * Never commit it to git or expose it publicly.
 */

import * as admin from 'firebase-admin';
import { supabase } from './supabase';

// Initialize Firebase Admin (only once)
let adminInitialized = false;

const initializeFirebaseAdmin = () => {
    if (adminInitialized) return;

    try {
        // Load service account from environment variable or file
        // For production, use environment variable with the JSON content
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountEnv) {
            console.error('❌ [FirebaseAdmin] Missing FIREBASE_SERVICE_ACCOUNT environment variable');
            return;
        }

        const serviceAccount = JSON.parse(serviceAccountEnv);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            projectId: 'larena-4acd2'
        });

        adminInitialized = true;
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        throw error;
    }
};

/**
 * Send push notification to a user using Firebase Admin SDK
 */
export const sendPushNotification = async (
    userId: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
) => {
    try {
        // Initialize Firebase Admin
        initializeFirebaseAdmin();

        // Get all device tokens for this user
        const { data: tokens, error } = await supabase
            .from('device_tokens')
            .select('token')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching device tokens:', error);
            return { success: false, error: error.message };
        }

        if (!tokens || tokens.length === 0) {
            console.log('No device tokens found for user:', userId);
            return { success: false, error: 'No device tokens found' };
        }

        // Send notification to all devices using Firebase Admin SDK
        const messages = tokens.map(tokenData => ({
            notification: {
                title: title,
                body: body,
            },
            data: data || {},
            token: tokenData.token,
            android: {
                priority: 'high' as const,
            },
        }));

        const response = await admin.messaging().sendEach(messages);

        const successful = response.responses.filter(r => r.success).length;
        const failed = response.responses.filter(r => !r.success).length;

        // Log failures for debugging
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`Failed to send to token ${idx}:`, resp.error);
            }
        });

        return {
            success: successful > 0,
            sent: successful,
            failed: failed,
            total: tokens.length
        };
    } catch (error: any) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification when friend request is created
 */
export const notifyFriendRequest = async (friendRequestId: string, requesterId: string, recipientId: string) => {
    const { data: requester } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', requesterId)
        .single();

    const requesterName = requester?.name || 'Someone';

    return sendPushNotification(
        recipientId,
        'New Friend Request',
        `${requesterName} wants to join your crew`,
        {
            type: 'friend_request',
            friendship_id: friendRequestId,
            user_id: requesterId
        }
    );
};

/**
 * Send notification when lobby invite is created
 */
export const notifyLobbyInvite = async (lobbyId: string, lobbyName: string, inviterId: string, inviteeId: string) => {
    const { data: inviter } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', inviterId)
        .single();

    const inviterName = inviter?.name || 'Someone';

    return sendPushNotification(
        inviteeId,
        'Lobby Invite',
        `${inviterName} invited you to ${lobbyName}`,
        {
            type: 'lobby_invite',
            lobby_id: lobbyId,
            user_id: inviterId
        }
    );
};

/**
 * Send notification when lobby access request is created
 */
export const notifyLobbyAccessRequest = async (
    lobbyId: string,
    lobbyName: string,
    requesterId: string,
    hostId: string
) => {
    const { data: requester } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', requesterId)
        .single();

    const requesterName = requester?.name || 'Someone';

    return sendPushNotification(
        hostId,
        'Lobby Access Request',
        `${requesterName} wants to join ${lobbyName}`,
        {
            type: 'lobby_access_request',
            lobby_id: lobbyId,
            user_id: requesterId
        }
    );
};
