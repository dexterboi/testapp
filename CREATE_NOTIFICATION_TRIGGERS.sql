-- Database triggers to automatically send push notifications
-- These triggers call Supabase Edge Functions when events occur

-- Note: You'll need to set up Supabase Edge Functions first
-- See: supabase/functions/send-push-notification/

-- Function to call the Edge Function (HTTP request)
CREATE OR REPLACE FUNCTION notify_push_notification(
    p_user_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_supabase_url TEXT;
    v_anon_key TEXT;
BEGIN
    -- Get Supabase URL and anon key from environment
    -- These should be set in Supabase project settings
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_anon_key := current_setting('app.settings.supabase_anon_key', true);
    
    -- Call the Edge Function via HTTP
    PERFORM
        net.http_post(
            url := v_supabase_url || '/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_anon_key
            ),
            body := jsonb_build_object(
                'userId', p_user_id,
                'title', p_title,
                'body', p_body,
                'data', p_data
            )
        );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to send push notification: %', SQLERRM;
END;
$$;

-- Trigger function for friend requests
CREATE OR REPLACE FUNCTION trigger_friend_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_requester_name TEXT;
BEGIN
    -- Get requester name
    SELECT name INTO v_requester_name
    FROM public.user_profiles
    WHERE id = NEW.user_id;
    
    -- Send notification
    PERFORM notify_push_notification(
        p_user_id := NEW.friend_id,
        p_title := 'New Friend Request',
        p_body := COALESCE(v_requester_name, 'Someone') || ' wants to join your crew',
        p_data := jsonb_build_object(
            'type', 'friend_request',
            'friendship_id', NEW.id::TEXT,
            'user_id', NEW.user_id::TEXT
        )
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for friend requests
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON public.friendships;
CREATE TRIGGER friend_request_notification_trigger
    AFTER INSERT ON public.friendships
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION trigger_friend_request_notification();

-- Trigger function for lobby invites
CREATE OR REPLACE FUNCTION trigger_lobby_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_inviter_name TEXT;
    v_lobby_name TEXT;
    v_inviter_id UUID;
BEGIN
    -- Get inviter ID (use invited_by if exists, otherwise get host_id)
    -- Cast to UUID to ensure type consistency
    SELECT COALESCE(NEW.invited_by::UUID, host_id) INTO v_inviter_id
    FROM public.lobbies
    WHERE id = NEW.lobby_id;
    
    -- Get inviter name
    SELECT name INTO v_inviter_name
    FROM public.user_profiles
    WHERE id = v_inviter_id;
    
    -- Get lobby name
    SELECT name INTO v_lobby_name
    FROM public.lobbies
    WHERE id = NEW.lobby_id;
    
    -- Send notification
    PERFORM notify_push_notification(
        p_user_id := NEW.user_id,
        p_title := 'Lobby Invite',
        p_body := COALESCE(v_inviter_name, 'Someone') || ' invited you to ' || COALESCE(v_lobby_name, 'a lobby'),
        p_data := jsonb_build_object(
            'type', 'lobby_invite',
            'lobby_id', NEW.lobby_id::TEXT,
            'user_id', v_inviter_id::TEXT
        )
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for lobby invites
DROP TRIGGER IF EXISTS lobby_invite_notification_trigger ON public.lobby_members;
CREATE TRIGGER lobby_invite_notification_trigger
    AFTER INSERT ON public.lobby_members
    FOR EACH ROW
    WHEN (NEW.status = 'invited')
    EXECUTE FUNCTION trigger_lobby_invite_notification();

-- Trigger function for lobby access requests
CREATE OR REPLACE FUNCTION trigger_lobby_access_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_requester_name TEXT;
    v_lobby_name TEXT;
    v_host_id UUID;
BEGIN
    -- Get lobby host
    SELECT host_id INTO v_host_id
    FROM public.lobbies
    WHERE id = NEW.lobby_id;
    
    -- Get requester name
    SELECT name INTO v_requester_name
    FROM public.user_profiles
    WHERE id = NEW.user_id;
    
    -- Get lobby name
    SELECT name INTO v_lobby_name
    FROM public.lobbies
    WHERE id = NEW.lobby_id;
    
    -- Send notification to host
    PERFORM notify_push_notification(
        p_user_id := v_host_id,
        p_title := 'Lobby Access Request',
        p_body := COALESCE(v_requester_name, 'Someone') || ' wants to join ' || COALESCE(v_lobby_name, 'your lobby'),
        p_data := jsonb_build_object(
            'type', 'lobby_access_request',
            'lobby_id', NEW.lobby_id::TEXT,
            'user_id', NEW.user_id::TEXT
        )
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for lobby access requests
DROP TRIGGER IF EXISTS lobby_access_request_notification_trigger ON public.lobby_members;
CREATE TRIGGER lobby_access_request_notification_trigger
    AFTER INSERT ON public.lobby_members
    FOR EACH ROW
    WHEN (NEW.status = 'requested')
    EXECUTE FUNCTION trigger_lobby_access_request_notification();
