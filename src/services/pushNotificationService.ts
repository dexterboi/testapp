import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

/**
 * Initialize push notifications
 * Call this when the app starts and user is logged in
 */
export const initializePushNotifications = async (userId: string) => {
    try {
        console.log('🔔 [Push] Starting initialization for user:', userId);

        // Remove existing listeners to avoid duplicates/leaks
        await PushNotifications.removeAllListeners();

        // Request permission to use push notifications
        let permStatus = await PushNotifications.checkPermissions();
        console.log('🔔 [Push] Current permission status:', permStatus);

        if (permStatus.receive === 'prompt') {
            console.log('🔔 [Push] Requesting permissions...');
            permStatus = await PushNotifications.requestPermissions();
            console.log('🔔 [Push] Permission request result:', permStatus);
        }

        if (permStatus.receive !== 'granted') {
            console.warn('🔔 [Push] Permission denied:', permStatus);
            return { success: false, error: 'Permission denied' };
        }

        console.log('🔔 [Push] Permission granted! Setting up listeners...');

        // IMPORTANT: Set up listeners BEFORE calling register()
        // This prevents race condition where token arrives before listener is ready

        // Listen for registration success
        await PushNotifications.addListener('registration', async (token) => {
            console.log('🔔 [Push] ✅ Registration success! Token received:', token.value.substring(0, 20) + '...');

            // Save token to Supabase
            try {
                const saveResult = await saveDeviceToken(userId, token.value);
                console.log('🔔 [Push] Token save result:', saveResult);

                if (saveResult.success) {
                    console.log('🔔 [Push] ✅ Token successfully saved to database!');
                } else {
                    console.error('🔔 [Push] ❌ Failed to save token:', saveResult.error);
                }
            } catch (err) {
                console.error('🔔 [Push] ❌ Error saving token:', err);
            }
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
            console.error('🔔 [Push] ❌ Registration error:', JSON.stringify(error));
        });

        // Listen for push notifications received while app is open
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('🔔 [Push] Notification received while app open:', notification);
        });

        // Listen for push notification actions (when user taps notification)
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('🔔 [Push] Notification tapped:', notification.actionId);
            handleNotificationAction(notification);
        });

        console.log('🔔 [Push] Listeners set up. Now registering with FCM...');

        // Register with FCM/APNs
        await PushNotifications.register();
        console.log('🔔 [Push] Registration call completed. Waiting for token callback...');

        return { success: true };
    } catch (error: any) {
        console.error('🔔 [Push] ❌ Error initializing push notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Save device token to Supabase
 */
const saveDeviceToken = async (userId: string, token: string) => {
    try {
        console.log('🔔 [Push] Saving device token:', { userId, token: token.substring(0, 20) + '...' });

        // Check if token already exists for this user
        const { data: existingForUser, error: checkError } = await supabase
            .from('device_tokens')
            .select('id')
            .eq('user_id', userId)
            .eq('token', token)
            .maybeSingle();

        if (checkError) {
            console.error('🔔 [Push] Error checking existing token:', checkError);
        }

        if (existingForUser) {
            console.log('🔔 [Push] Token exists for this user, updating timestamp...');
            // Update last used timestamp
            const { error: updateError } = await supabase
                .from('device_tokens')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', existingForUser.id);

            if (updateError) {
                console.error('🔔 [Push] Error updating token:', updateError);
                return { success: false, error: updateError.message };
            }
            console.log('🔔 [Push] Token updated successfully');
            return { success: true };
        }

        // Check if this token exists for a DIFFERENT user (same device, different user logged in)
        const { data: existingForOtherUser, error: checkOtherError } = await supabase
            .from('device_tokens')
            .select('id, user_id')
            .eq('token', token)
            .neq('user_id', userId)
            .maybeSingle();

        if (checkOtherError) {
            console.error('🔔 [Push] Error checking token for other users:', checkOtherError);
        }

        if (existingForOtherUser) {
            console.log('🔔 [Push] Token exists for different user, updating to current user...');
            // Update the token to belong to the current user (user switched on same device)
            const { error: updateError } = await supabase
                .from('device_tokens')
                .update({
                    user_id: userId,
                    last_used_at: new Date().toISOString()
                })
                .eq('id', existingForOtherUser.id);

            if (updateError) {
                console.error('🔔 [Push] Error updating token user:', updateError);
                return { success: false, error: updateError.message };
            }
            console.log('🔔 [Push] Token reassigned to current user successfully');
            return { success: true };
        }

        // Token doesn't exist at all, insert new one
        console.log('🔔 [Push] Inserting new token...');
        const { data, error: insertError } = await supabase
            .from('device_tokens')
            .insert({
                user_id: userId,
                token: token,
                platform: 'android',
                last_used_at: new Date().toISOString()
            })
            .select();

        if (insertError) {
            console.error('🔔 [Push] Error inserting token:', insertError);
            return { success: false, error: insertError.message };
        }
        console.log('🔔 [Push] Token inserted successfully:', data);
        return { success: true, data };
    } catch (error: any) {
        console.error('🔔 [Push] Error saving device token:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Handle notification action (when user taps notification)
 */
const handleNotificationAction = (notification: any) => {
    const data = notification.notification.data;

    // Navigate based on notification type
    if (data?.type === 'lobby_invite' || data?.type === 'lobby_access_request') {
        // Navigate to lobby detail or spaces page
        window.location.href = `/#/spaces/lobby/${data.lobby_id}`;
    } else if (data?.type === 'friend_request') {
        // Navigate to crew page
        window.location.href = '/#/crew';
    } else {
        // Navigate to notification center
        window.location.href = '/#/';
    }
};

/**
 * Remove device token (on logout)
 */
export const removeDeviceToken = async (userId: string, token: string) => {
    try {
        await supabase
            .from('device_tokens')
            .delete()
            .eq('user_id', userId)
            .eq('token', token);
    } catch (error) {
        console.error('Error removing device token:', error);
    }
};
