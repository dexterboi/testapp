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

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('pitch_id', pitchId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .in('status', ['approved', 'pending']);

    if (bookingsError) throw bookingsError;

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
      .from('bookings')
      .select('*')
      .eq('pitch_id', data.pitch)
      .gte('start_time', checkStart.toISOString())
      .lte('start_time', checkEnd.toISOString())
      .in('status', ['approved', 'pending']);

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
