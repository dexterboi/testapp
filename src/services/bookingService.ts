import { supabase } from './supabase';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  price: number;
}

export interface PitchAvailability {
  pitchId: string;
  date: string;
  slots: TimeSlot[];
}

const DEFAULT_BUFFER_MINS = 15;

/**
 * Generate time slots for a pitch on a specific date.
 * Slot length = matchDuration; gap between slots = bufferMins.
 * e.g. Football 90min + 15min buffer vs Padel 60min + 15min buffer → different slot grids.
 */
export const generateTimeSlots = (
  date: Date,
  openingHour: number = 8,
  closingHour: number = 23,
  matchDuration: number = 75,
  pricePerHour: number = 0,
  bufferMins: number = DEFAULT_BUFFER_MINS
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const slotDate = new Date(date);
  slotDate.setHours(openingHour, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(closingHour, 0, 0, 0);

  while (slotDate < endOfDay) {
    const slotEnd = new Date(slotDate);
    slotEnd.setMinutes(slotEnd.getMinutes() + matchDuration);

    if (slotEnd <= endOfDay) {
      const durationInHours = matchDuration / 60;
      const slotPrice = pricePerHour * durationInHours;

      slots.push({
        start: new Date(slotDate),
        end: new Date(slotEnd),
        available: true,
        price: Math.round(slotPrice)
      });
    }

    slotDate.setMinutes(slotDate.getMinutes() + matchDuration + bufferMins);
  }

  return slots;
};

/**
 * Check if a time slot conflicts with existing bookings.
 * Uses bufferMins after each booking end (from sport type or default 15).
 */
export const checkSlotConflict = (
  slotStart: Date,
  slotEnd: Date,
  existingBookings: any[],
  bufferMins: number = DEFAULT_BUFFER_MINS
): boolean => {
  return existingBookings.some(booking => {
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);

    const bookingEndWithBuffer = new Date(bookingEnd);
    bookingEndWithBuffer.setMinutes(bookingEndWithBuffer.getMinutes() + bufferMins);

    return (
      (slotStart >= bookingStart && slotStart < bookingEndWithBuffer) ||
      (slotEnd > bookingStart && slotEnd <= bookingEndWithBuffer) ||
      (slotStart <= bookingStart && slotEnd >= bookingEndWithBuffer)
    );
  });
};

/**
 * Resolve match_duration and buffer from pitch. If pitch has sport_type_id and
 * sport_types is loaded, use sport_types.match_duration and sport_types.buffer_minutes;
 * otherwise use pitch.match_duration and 15.
 */
function resolveSlotConfig(pitch: any): { matchDuration: number; bufferMins: number } {
  const st = pitch?.sport_types ?? pitch?.sport_type
  if (st && (pitch.sport_type_id || st.match_duration != null)) {
    return {
      matchDuration: st.match_duration ?? pitch.match_duration ?? 75,
      bufferMins: st.buffer_minutes ?? DEFAULT_BUFFER_MINS
    }
  }
  return {
    matchDuration: pitch?.match_duration ?? 75,
    bufferMins: DEFAULT_BUFFER_MINS
  }
}

/**
 * Get available time slots for a pitch on a specific date.
 * Uses sport_types.match_duration and sport_types.buffer_minutes when pitch.sport_type_id is set;
 * otherwise pitch.match_duration and 15min buffer.
 */
export const getAvailableSlots = async (
  pitchId: string,
  date: Date
): Promise<TimeSlot[]> => {
  try {
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select('*, sport_types(*)')
      .eq('id', pitchId)
      .single();

    if (pitchError || !pitch) throw pitchError;

    console.log('🔍 [SLOTS] Pitch status:', pitch.status);
    if (pitch.status !== 'active') return [];

    const { matchDuration, bufferMins } = resolveSlotConfig(pitch)
    const openingHour = pitch.opening_hour ?? 8
    const closingHour = pitch.closing_hour ?? 23
    const pricePerHour = pitch.price_per_hour ?? 0

    const allSlots = generateTimeSlots(
      date,
      openingHour,
      closingHour,
      matchDuration,
      pricePerHour,
      bufferMins
    );
    console.log('🔍 [SLOTS] Generated slots:', allSlots.length);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('🔍 [SLOTS] Checking availability for:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

    const { data: bookings, error: bookingsError } = await supabase
      .rpc('get_pitch_availability', {
        p_pitch_id: pitchId,
        p_start_time: startOfDay.toISOString(),
        p_end_time: endOfDay.toISOString(),
        p_exclude_booking_id: null
      });

    if (bookingsError) {
      console.error('❌ [SLOTS] RPC Error:', bookingsError);
      throw bookingsError;
    }

    console.log('🔍 [SLOTS] Found bookings:', bookings?.length || 0);

    const availableSlots = allSlots.map(slot => ({
      ...slot,
      available: !checkSlotConflict(slot.start, slot.end, bookings || [], bufferMins)
    }));

    return availableSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
};

/**
 * Create a booking request
 */
export const createBookingRequest = async (data: {
  pitch: string;
  user: string;
  start_time: Date;
  end_time: Date;
  total_price: number;
  participantIds?: string[];
}) => {
  try {
    const { data: pitch, error: pitchErr } = await supabase
      .from('pitches')
      .select('*, sport_types(*)')
      .eq('id', data.pitch)
      .single();
    if (pitchErr || !pitch) throw pitchErr;
    const { bufferMins } = resolveSlotConfig(pitch);

    const checkStart = new Date(data.start_time);
    checkStart.setMinutes(checkStart.getMinutes() - bufferMins);

    const checkEnd = new Date(data.end_time);
    checkEnd.setMinutes(checkEnd.getMinutes() + bufferMins);

    const { data: bookings, error: bookingsError } = await supabase
      .rpc('get_pitch_availability', {
        p_pitch_id: data.pitch,
        p_start_time: checkStart.toISOString(),
        p_end_time: checkEnd.toISOString(),
        p_exclude_booking_id: null
      });

    if (bookingsError) throw bookingsError;

    if (checkSlotConflict(data.start_time, data.end_time, bookings || [], bufferMins)) {
      throw new Error(`This time slot is no longer available (${bufferMins}-minute buffer required between matches)`);
    }

    // Create booking with pending status
    console.log('📝 [BOOKING] Creating booking:', {
      pitch_id: data.pitch,
      user_id: data.user,
      start_time: data.start_time.toISOString(),
      end_time: data.end_time.toISOString(),
      total_price: data.total_price
    });

    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        pitch_id: data.pitch,
        user_id: data.user,
        start_time: data.start_time.toISOString(),
        end_time: data.end_time.toISOString(),
        total_price: data.total_price,
        status: 'pending',
        access_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [BOOKING] Error creating booking:', createError);
      throw createError;
    }

    console.log('✅ [BOOKING] Booking created successfully:', {
      id: booking.id,
      pitch_id: booking.pitch_id,
      status: booking.status,
      start_time: booking.start_time
    });

    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Get bookings for a complex owner
 */
export const getComplexBookings = async (complexId: string, status?: string, includeCompleted: boolean = false) => {
  try {
    console.log('🔍 [BOOKINGS] Fetching bookings for complex:', complexId, 'status:', status || 'all');

    // Get current user to verify owner
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log('🔍 [BOOKINGS] Current user:', authUser?.id);

    // Removed auto-delete call - we want to preserve booking history
    // await autoCompletePastBookings();

    // Get all pitches for this complex
    const { data: pitches, error: pitchesError } = await supabase
      .from('pitches')
      .select('id, complex_id')
      .eq('complex_id', complexId);

    if (pitchesError) {
      console.error('❌ [BOOKINGS] Error fetching pitches:', pitchesError);
      throw pitchesError;
    }

    console.log('🔍 [BOOKINGS] Found pitches:', pitches?.length || 0, pitches);

    if (!pitches || pitches.length === 0) {
      console.warn('⚠️ [BOOKINGS] No pitches found for complex:', complexId);
      return [];
    }

    const pitchIds = pitches.map(p => p.id);
    console.log('🔍 [BOOKINGS] Pitch IDs:', pitchIds);

    // First, let's check if there are any bookings at all for these pitches
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('id, pitch_id, status, start_time, user_id')
      .in('pitch_id', pitchIds);

    if (allBookingsError) {
      console.error('❌ [BOOKINGS] Error fetching all bookings:', allBookingsError);
    } else {
      console.log('🔍 [BOOKINGS] All bookings for pitches:', allBookings?.length || 0, allBookings);
    }

    // Use a simpler query first to avoid RLS issues with nested selects
    // Fetch bookings first, then expand relations manually
    let query = supabase
      .from('bookings')
      .select('*')
      .in('pitch_id', pitchIds)
      .order('start_time', { ascending: false });

    if (status) {
      if (status === 'approved') {
        query = query.in('status', [status, '']);
      } else {
        query = query.eq('status', status);
      }
    } else if (!includeCompleted) {
      query = query.neq('status', 'cancelled');
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('❌ [BOOKINGS] Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    console.log('✅ [BOOKINGS] Found bookings with simple query:', bookings?.length || 0);

    if (!bookings || bookings.length === 0) {
      return [];
    }

    // Manually expand relations to avoid RLS issues with nested selects
    const expandedBookings = await Promise.all(bookings.map(async (booking: any) => {
      // Get pitch with complex
      const { data: pitch, error: pitchError } = await supabase
        .from('pitches')
        .select('*, complexes(*)')
        .eq('id', booking.pitch_id)
        .single();

      if (pitchError) {
        console.error('❌ [BOOKINGS] Error fetching pitch:', pitchError);
      }

      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', booking.user_id)
        .single();

      if (userError) {
        console.error('❌ [BOOKINGS] Error fetching user profile:', userError);
      }

      // Format to match expected structure (Supabase returns relations as arrays)
      return {
        ...booking,
        pitches: pitch ? [pitch] : [],
        user_profiles: userProfile ? [userProfile] : []
      };
    }));

    console.log('🔍 [BOOKINGS] Expanded bookings:', expandedBookings?.length || 0);
    if (expandedBookings && expandedBookings.length > 0) {
      console.log('🔍 [BOOKINGS] First expanded booking:', {
        id: expandedBookings[0].id,
        status: expandedBookings[0].status,
        pitch_id: expandedBookings[0].pitch_id,
        pitches: expandedBookings[0].pitches
      });
    }

    // Auto-fix bookings with empty status (legacy bookings)
    const fixedBookings = await Promise.all((expandedBookings || []).map(async (booking: any) => {
      if (!booking.status || booking.status === '') {
        console.log('🔧 [BOOKINGS] Fixing empty status for booking:', booking.id);
        const newStatus = booking.access_code ? 'approved' : 'pending';
        try {
          const { data: updated, error: updateError } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', booking.id)
            .select()
            .single();

          if (updateError) throw updateError;
          console.log('✅ [BOOKINGS] Fixed booking status:', booking.id, '->', newStatus);
          return updated;
        } catch (error) {
          console.error('❌ [BOOKINGS] Error fixing booking status:', error);
          return { ...booking, status: newStatus };
        }
      }
      return booking;
    }));

    if (status === 'approved') {
      console.log('🔍 [BOOKINGS] Approved bookings:', fixedBookings.map((b: any) => ({ id: b.id, status: b.status, start: b.start_time })));
    }
    console.log('🔍 [BOOKINGS] First booking data:', fixedBookings[0]);

    return fixedBookings;
  } catch (error) {
    console.error('Error getting complex bookings:', error);
    return [];
  }
};

/**
 * Approve or reject a booking
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: 'approved' | 'rejected' | 'cancelled'
) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Cancel a booking (user-initiated)
 */
export const cancelBooking = async (bookingId: string) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Request cancellation (user sends request to owner)
 */
export const requestCancellation = async (bookingId: string) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: 'cancel_request' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    console.error('Error requesting cancellation:', error);
    throw error;
  }
};

/**
 * Auto-delete past approved bookings (games that have been played)
 * This keeps the app fresh and avoids long listings
 */
export const autoCompletePastBookings = async () => {
  // DISABLED: We want to keep booking history for users
  // Users should be able to see their past matches in the "Past" tab
  // and their upcoming matches should remain visible until they finish
  console.log('📋 [AUTO-CLEANUP] Booking history preservation enabled - no deletions');
  return 0;
};

/**
 * Update pitch settings
 */
export const updatePitchSettings = async (
  pitchId: string,
  settings: {
    opening_hour?: number;
    closing_hour?: number;
    match_duration?: number;
    pricePerHour?: number;
    status?: 'active' | 'maintenance' | 'closed';
  }
) => {
  try {
    // Convert pricePerHour to price_per_hour
    const updateData: any = { ...settings };
    if (updateData.pricePerHour !== undefined) {
      updateData.price_per_hour = updateData.pricePerHour;
      delete updateData.pricePerHour;
    }

    const { data: pitch, error } = await supabase
      .from('pitches')
      .update(updateData)
      .eq('id', pitchId)
      .select()
      .single();

    if (error) throw error;
    return pitch;
  } catch (error) {
    console.error('Error updating pitch settings:', error);
    throw error;
  }
};

/**
 * Modify a booking
 */
export const modifyBooking = async (
  bookingId: string,
  newSlot: { start: Date; end: Date; price: number },
  currentStatus: string
) => {
  try {
    // Check availability first
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('pitch_id')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    const { data: pitch, error: pitchErr } = await supabase
      .from('pitches')
      .select('*, sport_types(*)')
      .eq('id', booking.pitch_id)
      .single();

    if (pitchErr) throw pitchErr;

    const { bufferMins } = resolveSlotConfig(pitch);

    const checkStart = new Date(newSlot.start);
    checkStart.setMinutes(checkStart.getMinutes() - bufferMins);

    const checkEnd = new Date(newSlot.end);
    checkEnd.setMinutes(checkEnd.getMinutes() + bufferMins);

    const { data: bookings, error: bookingsError } = await supabase
      .rpc('get_pitch_availability', {
        p_pitch_id: booking.pitch_id,
        p_start_time: checkStart.toISOString(),
        p_end_time: checkEnd.toISOString(),
        p_exclude_booking_id: bookingId
      });

    if (bookingsError) throw bookingsError;

    // Filter out the current booking from conflict check if we are just moving it
    // But get_pitch_availability returns times, not IDs. 
    // However, since we are updating the SAME booking, we don't need to worry about self-conflict 
    // IF we were checking against the table. But RPC returns occupied slots.
    // If the new slot overlaps with the OLD slot of the SAME booking, it might look like a conflict.
    // BUT, get_pitch_availability returns ALL bookings.
    // We need to be careful. The RPC returns occupied slots.
    // If we are modifying an existing booking, its current time is in the DB.
    // So the RPC will return the current booking's time as occupied.
    // We need to filter out the current booking's time from the conflict check.
    // Since RPC returns just times, we can't filter by ID.
    // This is a limitation of the secure RPC.

    // Workaround: We can't easily filter by ID with the current RPC.
    // We might need to update the RPC to exclude a specific booking ID.
    // For now, let's assume the user is picking a DIFFERENT slot.
    // If they pick a slot that overlaps with their current slot, it will show as conflict.
    // This is acceptable for now, or we can update the RPC.

    // Let's update the RPC to accept an optional exclude_booking_id.

    if (checkSlotConflict(newSlot.start, newSlot.end, bookings || [], bufferMins)) {
      // Check if the conflict is ONLY with the current booking (if we could).
      // For now, just throw error.
      throw new Error(`This time slot is not available.`);
    }

    if (currentStatus === 'pending') {
      // Direct update
      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newSlot.start.toISOString(),
          end_time: newSlot.end.toISOString(),
          total_price: newSlot.price
        })
        .eq('id', bookingId);
      if (error) throw error;
    } else {
      // Request modification
      const { error } = await supabase
        .from('bookings')
        .update({
          new_start_time: newSlot.start.toISOString(),
          new_end_time: newSlot.end.toISOString(),
          new_total_price: newSlot.price,
          modification_status: 'pending'
        })
        .eq('id', bookingId);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error modifying booking:', error);
    throw error;
  }
};

/**
 * Approve booking modification
 */
export const approveModification = async (bookingId: string) => {
  try {
    // Fetch the new details first
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('new_start_time, new_end_time, new_total_price')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;
    if (!booking.new_start_time) throw new Error('No modification details found');

    const { error } = await supabase
      .from('bookings')
      .update({
        start_time: booking.new_start_time,
        end_time: booking.new_end_time,
        total_price: booking.new_total_price,
        modification_status: 'approved',
        new_start_time: null,
        new_end_time: null,
        new_total_price: null
      })
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error approving modification:', error);
    throw error;
  }
};

/**
 * Reject booking modification
 */
export const rejectModification = async (bookingId: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        modification_status: 'rejected',
        new_start_time: null,
        new_end_time: null,
        new_total_price: null
      })
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting modification:', error);
    throw error;
  }
};

/**
 * Get booking statistics for a complex
 */
export const getComplexStatistics = async (complexId: string) => {
  try {
    // Removed auto-delete call - we want to preserve booking history
    // await autoCompletePastBookings();

    // Get active bookings (excluding cancelled) for counts
    const activeBookings = await getComplexBookings(complexId, undefined, false);

    console.log('📊 [STATS] Calculating statistics for complex:', complexId);
    console.log('📊 [STATS] Total active bookings:', activeBookings.length);
    console.log('📊 [STATS] Bookings by status:', {
      pending: activeBookings.filter(b => b.status === 'pending').length,
      approved: activeBookings.filter(b => b.status === 'approved').length,
      cancel_request: activeBookings.filter(b => b.status === 'cancel_request').length,
      rejected: activeBookings.filter(b => b.status === 'rejected').length,
    });

    const stats = {
      total: activeBookings.length, // Only active bookings count
      pending: activeBookings.filter(b => b.status === 'pending').length,
      approved: activeBookings.filter(b => b.status === 'approved').length,
      cancel_request: activeBookings.filter(b => b.status === 'cancel_request').length,
      rejected: activeBookings.filter(b => b.status === 'rejected').length,
      totalRevenue: activeBookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (b.total_price || 0), 0), // Revenue from approved bookings only
      thisMonth: {
        bookings: activeBookings.filter(b => {
          const bookingDate = new Date(b.start_time);
          const now = new Date();
          return bookingDate.getMonth() === now.getMonth() &&
            bookingDate.getFullYear() === now.getFullYear();
        }).length,
        revenue: activeBookings
          .filter(b => {
            const bookingDate = new Date(b.start_time);
            const now = new Date();
            return (bookingDate.getMonth() === now.getMonth() &&
              bookingDate.getFullYear() === now.getFullYear() &&
              b.status === 'approved');
          })
          .reduce((sum, b) => sum + (b.total_price || 0), 0)
      }
    };

    console.log('📊 [STATS] Final stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting statistics:', error);
    return null;
  }
};
