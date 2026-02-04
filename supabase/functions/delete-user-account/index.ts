// Supabase Edge Function to delete a user account and all related data
// This function requires admin privileges to delete the auth user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the JWT from the request to identify the user
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client with service role key for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Extract the token from the Authorization header
        const token = authHeader.replace('Bearer ', '')

        // Verify the token by getting the user
        // In Supabase Edge Functions, we can use the auth.getUser() method
        // which automatically validates the JWT
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            console.error('Auth error:', authError)
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token', details: authError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const userId = user.id

        // Check if user is an owner - owners cannot delete their account this way
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single()

        if (userError) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch user data', details: userError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (userData?.role?.toLowerCase() === 'owner') {
            return new Response(
                JSON.stringify({ error: 'Owner accounts cannot be deleted through this endpoint' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Begin cascading deletion
        const errors: string[] = []

        // 1. Delete device tokens
        const { error: tokensError } = await supabaseAdmin
            .from('device_tokens')
            .delete()
            .eq('user_id', userId)
        if (tokensError) {
            console.error('Error deleting device tokens:', tokensError)
            errors.push('device_tokens')
        }

        // 2. Delete push notification subscriptions
        const { error: subsError } = await supabaseAdmin
            .from('push_notification_subscriptions')
            .delete()
            .eq('user_id', userId)
        if (subsError) {
            console.error('Error deleting push subscriptions:', subsError)
            errors.push('push_notification_subscriptions')
        }

        // 3. Delete friendships (where user is requester or receiver)
        const { error: friendshipsError } = await supabaseAdmin
            .from('friendships')
            .delete()
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        if (friendshipsError) {
            console.error('Error deleting friendships:', friendshipsError)
            errors.push('friendships')
        }

        // 4. Delete team memberships
        const { error: membershipsError } = await supabaseAdmin
            .from('team_members')
            .delete()
            .eq('user_id', userId)
        if (membershipsError) {
            console.error('Error deleting team memberships:', membershipsError)
            errors.push('team_members')
        }

        // 5. Delete messages sent by user
        const { error: messagesError } = await supabaseAdmin
            .from('messages')
            .delete()
            .eq('sender_id', userId)
        if (messagesError) {
            console.error('Error deleting messages:', messagesError)
            errors.push('messages')
        }

        // 6. Delete user's bookings
        const { error: bookingsError } = await supabaseAdmin
            .from('bookings')
            .delete()
            .eq('user_id', userId)
        if (bookingsError) {
            console.error('Error deleting bookings:', bookingsError)
            errors.push('bookings')
        }

        // 7. Delete lobby memberships
        const { error: lobbyMembersError } = await supabaseAdmin
            .from('lobby_members')
            .delete()
            .eq('user_id', userId)
        if (lobbyMembersError) {
            console.error('Error deleting lobby memberships:', lobbyMembersError)
            errors.push('lobby_members')
        }

        // 8. Delete user's profile from 'users' table
        const { error: usersError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId)
        if (usersError) {
            console.error('Error deleting user from users table:', usersError)
            errors.push('users')
            return new Response(
                JSON.stringify({ error: 'Failed to delete user profile', details: usersError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 9. Delete user's auth account
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authDeleteError) {
            console.error('Error deleting auth user:', authDeleteError)
            errors.push('auth_user')
            return new Response(
                JSON.stringify({ error: 'Failed to delete auth user', details: authDeleteError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Account deleted successfully',
                warnings: errors.length > 0 ? `Some related data may not have been fully cleaned up: ${errors.join(', ')}` : undefined
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
