import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Current time
        const now = new Date();
        // 4 hours from now
        const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        // Window: 3h 50m to 4h 10m from now
        const lowerBound = new Date(now.getTime() + (4 * 60 - 10) * 60 * 1000);
        const upperBound = new Date(now.getTime() + (4 * 60 + 10) * 60 * 1000);

        console.log(`Checking for bookings between ${lowerBound.toISOString()} and ${upperBound.toISOString()}`);

        // 1. Find bookings starting in ~4 hours with reminder_sent = false
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*, pitches(name)')
            .gte('start_time', lowerBound.toISOString())
            .lte('start_time', upperBound.toISOString())
            .eq('reminder_sent', false);

        if (bookingsError) throw bookingsError;

        console.log(`Found ${bookings?.length || 0} bookings requiring host reminders.`);

        // 2. Process Host Reminders
        for (const booking of bookings || []) {
            console.log(`Sending reminder to host ${booking.user_id} for booking ${booking.id}`);

            try {
                await supabase.functions.invoke('send-push-notification', {
                    body: {
                        userId: booking.user_id,
                        title: 'Match Reminder!',
                        body: `Ready for your match at ${booking.pitches?.name} in 4 hours? Confirm now!`,
                        data: {
                            type: 'match_reminder',
                            booking_id: booking.id
                        }
                    }
                });

                // Update booking status
                await supabase
                    .from('bookings')
                    .update({ reminder_sent: true })
                    .eq('id', booking.id);

            } catch (err) {
                console.error(`Failed to send reminder to host ${booking.user_id}:`, err);
            }
        }

        // 3. Find participants requiring reminders (booking_participants)
        // We join with bookings to check the start_time
        const { data: participants, error: participantError } = await supabase
            .from('booking_participants')
            .select('*, bookings!inner(id, start_time, pitches(name))')
            .gte('bookings.start_time', lowerBound.toISOString())
            .lte('bookings.start_time', upperBound.toISOString())
            .eq('reminder_sent', false)
            .neq('status', 'declined');

        if (participantError) throw participantError;

        console.log(`Found ${participants?.length || 0} participants requiring reminders.`);

        // 4. Process Participant Reminders
        for (const participant of participants || []) {
            console.log(`Sending reminder to participant ${participant.user_id} for booking ${participant.booking_id}`);

            try {
                await supabase.functions.invoke('send-push-notification', {
                    body: {
                        userId: participant.user_id,
                        title: 'Match Reminder!',
                        body: `Ready for your match at ${participant.bookings?.pitches?.name} in 4 hours? Confirm now!`,
                        data: {
                            type: 'match_reminder',
                            booking_id: participant.booking_id
                        }
                    }
                });

                // Update participant status
                await supabase
                    .from('booking_participants')
                    .update({ reminder_sent: true })
                    .eq('id', participant.id);

            } catch (err) {
                console.error(`Failed to send reminder to participant ${participant.user_id}:`, err);
            }
        }

        return new Response(
            JSON.stringify({ success: true, host_reminders: bookings?.length || 0, participant_reminders: participants?.length || 0 }),
            { headers: { "Content-Type": "application/json" } }
        )
    } catch (error: any) {
        console.error('Error in pre-match-reminder:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
})
