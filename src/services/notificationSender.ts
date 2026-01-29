/**
 * Backend service to send push notifications
 * This can be used in Supabase Edge Functions or a Node.js backend
 * 
 * To use this:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Get your FCM server key from Firebase Console
 * 3. Initialize Firebase Admin in your backend
 */

import { supabase } from './supabase';

// This should be set from environment variable
// Get it from Firebase Console > Project Settings > Cloud Messaging > Server Key
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

/**
 * Send push notification to a user
 */
export const sendPushNotification = async (
    userId: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
) => {
    try {
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

        // Send notification to all devices
        const results = await Promise.allSettled(
            tokens.map(tokenData => sendFCMNotification(tokenData.token, title, body, data))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            success: successful > 0,
            sent: successful,
            failed: failed
        };
    } catch (error: any) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send FCM notification to a single device token
 */
const sendFCMNotification = async (
    token: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
) => {
    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Authorization': `key=${FCM_SERVER_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: token,
                notification: {
                    title: title,
                    body: body,
                    sound: 'default',
                    badge: '1'
                },
                data: data || {},
                priority: 'high'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FCM error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('FCM send error:', error);
        throw error;
    }
};

/**
 * Send notification when friend request is created
 */
export const notifyFriendRequest = async (friendRequestId: string, requesterId: string, recipientId: string) => {
    // Get requester name
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
    // Get inviter name
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
    // Get requester name
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
