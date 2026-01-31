import { supabase } from './supabase';
export { supabase };

export const getPitches = async () => {
    try {
        const { data, error } = await supabase
            .from('pitches')
            .select('*, complexes(*), sport_types(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching pitches:', error);
        return [];
    }
};

export const getPitch = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('pitches')
            .select('*, complexes(*), sport_types(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching pitch:', error);
        return null;
    }
};

export const getComplexes = async (sportType?: string) => {
    try {
        console.log('[DATA SERVICE] Fetching complexes from API...', sportType ? `(filtered by sport: ${sportType})` : '');

        let complexes = [];

        // If sport type is specified, filter complexes that have pitches with that sport type
        if (sportType) {
            // First get all complexes
            const { data: allComplexes, error: complexesError } = await supabase
                .from('complexes')
                .select('*');

            if (complexesError) throw complexesError;

            // Then get pitches with the specified sport type
            const { data: pitchesData, error: pitchesError } = await supabase
                .from('pitches')
                .select('complex_id, sport_type')
                .eq('sport_type', sportType);

            if (pitchesError) throw pitchesError;

            const complexIdsWithSport = new Set(pitchesData?.map(p => p.complex_id) || []);
            complexes = (allComplexes || []).filter(c => complexIdsWithSport.has(c.id));
        } else {
            // Fetch all complexes without sport filter
            const { data, error } = await supabase
                .from('complexes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            complexes = data || [];
        }

        console.log('[DATA SERVICE] Successfully fetched complexes:', complexes.length);
        return complexes;
    } catch (error) {
        console.error('[DATA SERVICE] Error fetching complexes:', error);
        return [];
    }
}

export const getComplex = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('complexes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching complex:', error);
        return null;
    }
};

export const getPitchesByComplex = async (complexId: string) => {
    try {
        const { data, error } = await supabase
            .from('pitches')
            .select('*, complexes(*), sport_types(*)')
            .eq('complex_id', complexId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching pitches for complex:', error);
        return [];
    }
};

export const getUserBookings = async (userId: string, includeCompleted: boolean = true) => {
    try {
        console.log('🔍 [BOOKINGS] ===== FETCH START =====');
        console.log('🔍 [BOOKINGS] User ID:', userId);
        console.log('🔍 [BOOKINGS] Include completed:', includeCompleted);

        // Removed auto-delete call - we want to preserve booking history
        // Note: Removed user_profiles join as there's no FK relationship defined
        let query = supabase
            .from('bookings')
            .select('*, pitches(*, complexes(*))')
            .eq('user_id', userId)
            .order('start_time', { ascending: false });

        if (!includeCompleted) {
            query = query.neq('status', 'cancelled');
        }

        console.log('🔍 [BOOKINGS] Executing query...');
        const { data, error } = await query;

        if (error) {
            console.error('❌ [BOOKINGS] Query error:', error);
            throw error;
        }

        console.log('✅ [BOOKINGS] Query successful!');
        console.log('📊 [BOOKINGS] Total bookings fetched:', data?.length || 0);

        if (data && data.length > 0) {
            console.log('📋 [BOOKINGS] First booking sample:', {
                id: data[0].id,
                status: data[0].status,
                start_time: data[0].start_time,
                end_time: data[0].end_time,
                pitch_id: data[0].pitch_id,
                has_pitch: !!data[0].pitches,
                has_complex: !!(data[0].pitches && data[0].pitches.complexes)
            });
        } else {
            console.warn('⚠️ [BOOKINGS] No bookings found for user:', userId);
        }

        console.log('🔍 [BOOKINGS] ===== FETCH END =====');
        return data || [];
    } catch (error) {
        console.error('❌ [BOOKINGS] Fatal error:', error);
        return [];
    }
};

export const createBooking = async (data: {
    pitch_id: string;
    user_id: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    access_code?: string;
}) => {
    try {
        const { data: record, error } = await supabase
            .from('bookings')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return record;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Get user's location - Multi-layer approach for maximum reliability
export const getUserLocation = async (): Promise<{ lat: number; lng: number }> => {
    const defaultLocation = { lat: 36.8065, lng: 10.1815 }; // Tunis

    // Layer 1: Browser's native geolocation (works on most devices)
    if (navigator.geolocation) {
        try {
            console.log('📍 [Location] Trying browser geolocation...');
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false, // Faster, uses network/wifi
                    timeout: 5000,
                    maximumAge: 600000 // 10 min cache
                });
            });

            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log('✅ [Location] Browser geolocation success:', location);
            return location;
        } catch (error) {
            console.warn('⚠️ [Location] Browser geolocation failed:', error);
        }
    }

    // Layer 2: IP-based geolocation (ipapi.co)
    try {
        console.log('🌐 [Location] Trying ipapi.co...');
        const response = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();

        if (data.latitude && data.longitude) {
            const location = { lat: data.latitude, lng: data.longitude };
            console.log('✅ [Location] ipapi.co success:', location);
            return location;
        }
    } catch (error) {
        console.warn('⚠️ [Location] ipapi.co failed:', error);
    }

    // Layer 3: Alternative IP service (ipwho.is)
    try {
        console.log('🌐 [Location] Trying ipwho.is...');
        const response = await fetch('https://ipwho.is/', {
            signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();

        if (data.latitude && data.longitude) {
            const location = { lat: data.latitude, lng: data.longitude };
            console.log('✅ [Location] ipwho.is success:', location);
            return location;
        }
    } catch (error) {
        console.warn('⚠️ [Location] ipwho.is failed:', error);
    }

    // Layer 4: Tunis default
    console.log('📍 [Location] All methods failed, using Tunis default');
    return defaultLocation;
};

// --- Review Service ---

export const getReviews = async (complexId: string) => {
    try {
        console.log(`[DATA SERVICE] Fetching reviews for complex: ${complexId}`);
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                id,
                rating,
                comment,
                created_at,
                complex_id,
                user_id,
                user_profiles:user_id (
                    name,
                    avatar,
                    phone
                )
            `)
            .eq('complex_id', complexId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[DATA SERVICE] Supabase error fetching reviews:', error);
            throw error;
        }

        console.log(`[DATA SERVICE] Successfully fetched ${data?.length || 0} reviews`);
        return data || [];
    } catch (error) {
        console.error('[DATA SERVICE] Error in getReviews:', error);
        return [];
    }
};

export const submitReview = async (reviewData: { complex_id: string, user_id: string, rating: number, comment: string }) => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([reviewData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error: any) {
        console.error('Error submitting review:', error);
        return { success: false, error: error.message };
    }
};


// --- Social & Friends Service ---

export const searchUsers = async (query: string) => {
    try {
        const q = query.trim();
        if (q.length < 2) return [];

        let supabaseQuery = supabase
            .from('user_profiles')
            .select('id, name, avatar, takwira_id, phone');

        if (q.startsWith('#TAK-')) {
            // Search by exact Takwira ID
            supabaseQuery = supabaseQuery.eq('takwira_id', q.toUpperCase());
        } else if (/^\d{4}$/.test(q)) {
            // Search by numeric part of Takwira ID (e.g., 1234 -> #TAK-1234)
            supabaseQuery = supabaseQuery.eq('takwira_id', `#TAK-${q}`);
        } else if (/^\d+$/.test(q)) {
            // Search by phone number
            supabaseQuery = supabaseQuery.ilike('phone', `%${q}%`);
        } else {
            // Search by name
            supabaseQuery = supabaseQuery.ilike('name', `%${q}%`);
        }

        const { data, error } = await supabaseQuery.limit(20);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
};

export const getFriendships = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                *,
                user:user_id (id, name, avatar, takwira_id, phone),
                friend:friend_id (id, name, avatar, takwira_id, phone)
            `)
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching friendships:', error);
        return [];
    }
};

export const sendFriendRequest = async (userId: string, friendId: string) => {
    try {
        const { data, error } = await supabase
            .from('friendships')
            .insert([{
                user_id: userId,
                friend_id: friendId,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error sending friend request:', error);
        return { success: false, error: error.message };
    }
};

export const updateFriendshipStatus = async (friendshipId: string, status: 'accepted' | 'blocked' | 'pending') => {
    try {
        const { data, error } = await supabase
            .from('friendships')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating friendship:', error);
        return { success: false, error: error.message };
    }
};

export const removeFriendship = async (friendshipId: string) => {
    try {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error removing friendship:', error);
        return { success: false, error: error.message };
    }
};

// --- Messaging Service ---

export const getMessages = async (friendshipId: string) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('friendship_id', friendshipId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

export const sendMessage = async (friendshipId: string, senderId: string, content: string) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                friendship_id: friendshipId,
                sender_id: senderId,
                content
            }])
            .select()
            .single();

        if (error) throw error;

        // Trigger push notification to the recipient
        // We do this asynchronously and don't block the UI
        (async () => {
            try {
                // Get the recipient ID
                const { data: friendship } = await supabase
                    .from('friendships')
                    .select('user_id, friend_id')
                    .eq('id', friendshipId)
                    .single();

                if (friendship) {
                    const recipientId = friendship.user_id === senderId ? friendship.friend_id : friendship.user_id;

                    // Get sender name for the notification
                    const { data: senderProfile } = await supabase
                        .from('user_profiles')
                        .select('name')
                        .eq('id', senderId)
                        .single();

                    const senderName = senderProfile?.name || 'Friend';

                    // Call Edge Function
                    await supabase.functions.invoke('send-push-notification', {
                        body: {
                            userId: recipientId,
                            title: senderName,
                            body: content,
                            data: {
                                type: 'chat_message',
                                friendship_id: friendshipId,
                                sender_id: senderId
                            }
                        }
                    });
                }
            } catch (err) {
                console.error('Error triggering chat notification:', err);
            }
        })();

        return { success: true, data };
    } catch (error: any) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
};
// --- Lobbies Service ---

export const getLobbies = async (currentUserId?: string, userLocation?: { lat: number; lng: number }) => {
    try {
        const { data, error } = await supabase
            .from('lobbies')
            .select(`
                *,
                host:host_id (id, name, avatar, phone),
                complex:complex_id (id, name, address, images, location_lat, location_lng),
                members:lobby_members (user_id, status)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        let lobbies = data || [];
        let friendIds: string[] = [];

        // If currentUserId is provided, filter for privacy
        if (currentUserId) {
            // Get user's accepted friends
            const friendsData = await getFriendships(currentUserId);
            friendIds = friendsData
                .filter(f => f.status === 'accepted')
                .map(f => f.user_id === currentUserId ? f.friend_id : f.user_id);

            // Filter lobbies based on type
            lobbies = lobbies.filter(lobby => {
                const isHost = lobby.host_id === currentUserId;
                const isMember = lobby.members?.some((m: any) => m.user_id === currentUserId);

                // Private lobbies: only show to host, members, or friends of host
                if (lobby.type === 'private') {
                    const isFriendOfHost = friendIds.includes(lobby.host_id);
                    return isHost || isMember || isFriendOfHost;
                }

                // Public lobbies: show to everyone
                return true;
            });
        }

        // Sort public lobbies by distance if user location is available
        if (userLocation) {
            const publicLobbies = lobbies.filter(l => l.type === 'public' && l.complex?.location_lat && l.complex?.location_lng);
            const privateLobbies = lobbies.filter(l => l.type === 'private');

            // Calculate distances for public lobbies
            publicLobbies.forEach((lobby: any) => {
                if (lobby.complex?.location_lat && lobby.complex?.location_lng) {
                    lobby._distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        lobby.complex.location_lat,
                        lobby.complex.location_lng
                    );
                } else {
                    lobby._distance = Infinity; // No location, put at end
                }
            });

            // Sort public lobbies by distance, then by created_at
            publicLobbies.sort((a: any, b: any) => {
                if (a._distance !== b._distance) {
                    return a._distance - b._distance;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            // Combine: public lobbies (sorted by distance) first, then private lobbies (sorted by created_at)
            lobbies = [
                ...publicLobbies,
                ...privateLobbies.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            ];
        }

        return lobbies;
    } catch (error) {
        console.error('Error fetching lobbies:', error);
        return [];
    }
};

export const createLobby = async (lobbyData: {
    name: string,
    host_id: string,
    complex_id: string,
    max_players: number,
    type: 'private' | 'public',
    preferred_date: string,
    preferred_time: string,
    status?: string
}) => {
    try {
        const { data, error } = await supabase
            .from('lobbies')
            .insert([{
                name: lobbyData.name,
                host_id: lobbyData.host_id,
                complex_id: lobbyData.complex_id,
                max_players: lobbyData.max_players,
                type: lobbyData.type,
                preferred_date: lobbyData.preferred_date,
                preferred_time: lobbyData.preferred_time,
                status: lobbyData.status || 'open'
            }])
            .select()
            .single();

        if (error) throw error;

        // Auto-join the host
        await supabase.from('lobby_members').insert([{
            lobby_id: data.id,
            user_id: lobbyData.host_id,
            status: 'joined'
        }]);

        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating lobby:', error);
        return { success: false, error: error.message };
    }
};

export const deleteLobby = async (lobbyId: string, userId: string) => {
    try {
        console.log('[deleteLobby] Starting deletion for lobby:', lobbyId, 'by user:', userId);

        // First verify the user is the host
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('host_id')
            .eq('id', lobbyId)
            .single();

        if (lobbyError) {
            console.error('[deleteLobby] Error fetching lobby:', lobbyError);
            throw lobbyError;
        }

        if (!lobby) {
            console.error('[deleteLobby] Lobby not found:', lobbyId);
            return { success: false, error: 'Lobby not found' };
        }

        console.log('[deleteLobby] Lobby host_id:', lobby.host_id, 'User id:', userId);

        if (lobby.host_id !== userId) {
            console.error('[deleteLobby] Permission denied - user is not host');
            return { success: false, error: 'Only the lobby host can delete the lobby' };
        }

        // Delete related data first (due to foreign key constraints)
        // Delete lobby messages
        console.log('[deleteLobby] Deleting lobby messages...');
        const { error: messagesError } = await supabase
            .from('lobby_messages')
            .delete()
            .eq('lobby_id', lobbyId);

        if (messagesError) {
            console.error('[deleteLobby] Error deleting messages:', messagesError);
            // Continue anyway - messages might not exist
        } else {
            console.log('[deleteLobby] Messages deleted successfully');
        }

        // Delete lobby members
        console.log('[deleteLobby] Deleting lobby members...');
        const { error: membersError } = await supabase
            .from('lobby_members')
            .delete()
            .eq('lobby_id', lobbyId);

        if (membersError) {
            console.error('[deleteLobby] Error deleting members:', membersError);
            // Continue anyway - might be empty
        } else {
            console.log('[deleteLobby] Members deleted successfully');
        }

        // Finally delete the lobby
        console.log('[deleteLobby] Deleting lobby...');
        const { data: deletedData, error: deleteError, count } = await supabase
            .from('lobbies')
            .delete()
            .eq('id', lobbyId)
            .select();

        if (deleteError) {
            console.error('[deleteLobby] Error deleting lobby:', deleteError);
            console.error('[deleteLobby] Error details:', JSON.stringify(deleteError, null, 2));
            throw deleteError;
        }

        console.log('[deleteLobby] Delete response - data:', deletedData, 'count:', count);

        // Check if anything was actually deleted
        if (!deletedData || deletedData.length === 0) {
            console.error('[deleteLobby] WARNING: Delete returned empty array - no rows deleted');
            // This usually means RLS policy blocked the deletion
            return {
                success: false,
                error: 'Delete operation was blocked. You may not have permission to delete this lobby. Please check your database policies.'
            };
        }

        // Verify deletion
        const { data: verifyData, error: verifyError } = await supabase
            .from('lobbies')
            .select('id')
            .eq('id', lobbyId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

        if (verifyData) {
            console.error('[deleteLobby] WARNING: Lobby still exists after deletion!');
            console.error('[deleteLobby] Remaining lobby data:', verifyData);
            return {
                success: false,
                error: 'Lobby deletion failed - lobby still exists. This may be due to Row Level Security policies.'
            };
        }

        console.log('[deleteLobby] Lobby successfully deleted and verified');
        return { success: true };
    } catch (error: any) {
        console.error('[deleteLobby] Error deleting lobby:', error);
        return { success: false, error: error.message || 'Failed to delete lobby' };
    }
};

export const joinLobby = async (lobbyId: string, userId: string, requestMessage?: string) => {
    try {
        // First check if lobby is public or private
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('type, host_id')
            .eq('id', lobbyId)
            .single();

        if (lobbyError) throw lobbyError;

        // For public lobbies, request access (status: 'requested')
        // For private lobbies, they can't join directly (invite-only)
        const status = lobby.type === 'public' ? 'requested' : 'invited';

        const { data, error } = await supabase
            .from('lobby_members')
            .insert([{
                lobby_id: lobbyId,
                user_id: userId,
                status: status,
                request_message: requestMessage || null
            }])
            .select()
            .single();

        if (error) throw error;

        const message = status === 'requested'
            ? 'Access request sent! The host will review your request.'
            : 'Successfully joined the lobby!';

        return { success: true, data, message };
    } catch (error: any) {
        console.error('Error joining lobby:', error);
        return { success: false, error: error.message };
    }
};

export const inviteToLobby = async (lobbyId: string, userId: string, invitedBy: string) => {
    try {
        // Check if user is already a member
        const { data: existing } = await supabase
            .from('lobby_members')
            .select('lobby_id, user_id, status')
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            // If already invited or requested, don't duplicate
            if (existing.status === 'invited' || existing.status === 'requested') {
                return { success: true, data: existing, message: 'User already has a pending invitation' };
            }
            // If already joined, return success
            if (existing.status === 'joined') {
                return { success: true, data: existing, message: 'User is already a member' };
            }
        }

        const { data, error } = await supabase
            .from('lobby_members')
            .insert([{
                lobby_id: lobbyId,
                user_id: userId,
                status: 'invited',
                invited_by: invitedBy
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error inviting to lobby:', error);
        return { success: false, error: error.message };
    }
};

// Kick a member from lobby (host only)
export const kickLobbyMember = async (lobbyId: string, memberUserId: string, hostId: string) => {
    try {
        // Verify the requester is the host
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('host_id')
            .eq('id', lobbyId)
            .single();

        if (lobbyError) throw lobbyError;

        if (lobby.host_id !== hostId) {
            return { success: false, error: 'Only the lobby host can kick members.' };
        }

        if (lobby.host_id === memberUserId) {
            return { success: false, error: 'Cannot kick the lobby host.' };
        }

        // Delete the member record
        const { error } = await supabase
            .from('lobby_members')
            .delete()
            .eq('lobby_id', lobbyId)
            .eq('user_id', memberUserId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error kicking lobby member:', error);
        return { success: false, error: error.message };
    }
};

// Leave a lobby
export const leaveLobby = async (lobbyId: string, userId: string) => {
    try {
        // Check if user is the host - hosts should delete the lobby instead
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('host_id')
            .eq('id', lobbyId)
            .single();

        if (lobbyError) throw lobbyError;

        if (lobby.host_id === userId) {
            return { success: false, error: 'Lobby hosts cannot leave. Please delete the lobby instead.' };
        }

        // Delete the member record
        const { error } = await supabase
            .from('lobby_members')
            .delete()
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error leaving lobby:', error);
        return { success: false, error: error.message };
    }
};

// Approve or decline a lobby invite/request
export const respondToLobbyRequest = async (
    lobbyId: string,
    userId: string,
    response: 'accepted' | 'declined',
    responderId: string
) => {
    try {
        // Get the lobby to check if responder is the host
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('host_id')
            .eq('id', lobbyId)
            .single();

        if (lobbyError) throw lobbyError;

        // Check if responder is the host (for access requests) or the user themselves (for invites)
        const isHost = lobby.host_id === responderId;
        const isUser = userId === responderId;

        if (!isHost && !isUser) {
            return { success: false, error: 'You do not have permission to respond to this request' };
        }

        // First check if the member record exists
        const { data: existingMember, error: checkError } = await supabase
            .from('lobby_members')
            .select('*')
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (!existingMember) {
            return { success: false, error: 'Member record not found' };
        }

        if (response === 'accepted') {
            // Update status to 'joined'
            const { data, error } = await supabase
                .from('lobby_members')
                .update({ status: 'joined' })
                .eq('lobby_id', lobbyId)
                .eq('user_id', userId)
                .select('*');

            if (error) {
                console.error('Error updating lobby member status:', error);
                throw error;
            }

            // Check if update was successful
            if (!data || data.length === 0) {
                return { success: false, error: 'Failed to update member status. The record may not exist or you may not have permission.' };
            }

            return { success: true, data: data[0] };
        } else {
            // For declined, we can either update status or delete the record
            // Let's delete it to clean up declined requests
            const { error: deleteError } = await supabase
                .from('lobby_members')
                .delete()
                .eq('lobby_id', lobbyId)
                .eq('user_id', userId);

            if (deleteError) {
                console.error('Error deleting lobby member:', deleteError);
                // If delete fails, try updating status instead
                const { data, error: updateError } = await supabase
                    .from('lobby_members')
                    .update({ status: 'declined' })
                    .eq('lobby_id', lobbyId)
                    .eq('user_id', userId)
                    .select('*');

                if (updateError) {
                    throw updateError;
                }
                return { success: true, data: data?.[0] || existingMember };
            }

            return { success: true, data: existingMember };
        }
    } catch (error: any) {
        console.error('Error responding to lobby request:', error);
        return { success: false, error: error.message };
    }
};

export const getLobbyMembers = async (lobbyId: string) => {
    try {
        const { data, error } = await supabase
            .from('lobby_members')
            .select(`
                *,
                user:user_id (id, name, avatar, takwira_id, phone)
            `)
            .eq('lobby_id', lobbyId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching lobby members:', error);
        return [];
    }
};

// --- Teams Service ---

export const getTeams = async (currentUserId?: string) => {
    try {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                *,
                admin:admin_id (id, name, avatar, phone),
                members:team_members (user_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        let teams = data || [];

        // If currentUserId is provided, filter for privacy
        if (currentUserId) {
            // Get user's accepted friends
            const friendsData = await getFriendships(currentUserId);
            const friendIds = friendsData
                .filter(f => f.status === 'accepted')
                .map(f => f.user_id === currentUserId ? f.friend_id : f.user_id);

            teams = teams.filter(team => {
                const isAdmin = team.admin_id === currentUserId;
                const isMember = team.members?.some((m: any) => m.user_id === currentUserId);
                const isFriendOfAdmin = friendIds.includes(team.admin_id);

                return isAdmin || isMember || isFriendOfAdmin;
            });
        }

        return teams;
    } catch (error) {
        console.error('Error fetching teams:', error);
        return [];
    }
};

export const createTeam = async (teamData: { name: string, admin_id: string, description?: string, avatar_url?: string }) => {
    try {
        const { data, error } = await supabase
            .from('teams')
            .insert([teamData])
            .select()
            .single();

        if (error) throw error;

        // Auto-join the admin
        await supabase.from('team_members').insert([{
            team_id: data.id,
            user_id: teamData.admin_id,
            role: 'admin'
        }]);

        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating team:', error);
        return { success: false, error: error.message };
    }
};

export const addTeamMember = async (teamId: string, userId: string, role: 'admin' | 'member' = 'member') => {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamId,
                user_id: userId,
                role
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error adding team member:', error);
        return { success: false, error: error.message };
    }
};

export const getTeamMembers = async (teamId: string) => {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                *,
                user:user_id (id, name, avatar, takwira_id, phone)
            `)
            .eq('team_id', teamId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
    }
};
export const getLobbyMessages = async (lobbyId: string) => {
    try {
        const { data, error } = await supabase
            .from('lobby_messages')
            .select(`
                *,
                sender:sender_id (id, name, avatar, phone)
            `)
            .eq('lobby_id', lobbyId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching lobby messages:', error);
        return [];
    }
};

export const sendLobbyMessage = async (lobbyId: string, senderId: string, content: string) => {
    try {
        // Verify user is authorized to send messages (host or approved member)
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('host_id')
            .eq('id', lobbyId)
            .single();

        if (lobbyError) throw lobbyError;

        const isHost = lobby.host_id === senderId;

        if (!isHost) {
            // Check if user is an approved member
            const { data: member, error: memberError } = await supabase
                .from('lobby_members')
                .select('status')
                .eq('lobby_id', lobbyId)
                .eq('user_id', senderId)
                .eq('status', 'joined')
                .maybeSingle();

            if (memberError) throw memberError;

            if (!member) {
                return { success: false, error: 'You must be an approved member to send messages in this lobby.' };
            }
        }

        const { data, error } = await supabase
            .from('lobby_messages')
            .insert([{
                lobby_id: lobbyId,
                sender_id: senderId,
                content
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error sending lobby message:', error);
        return { success: false, error: error.message };
    }
};

export const getTeamMessages = async (teamId: string) => {
    try {
        const { data, error } = await supabase
            .from('team_messages')
            .select(`
                *,
                sender:sender_id (id, name, avatar, phone)
            `)
            .eq('team_id', teamId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching team messages:', error);
        return [];
    }
};

export const sendTeamMessage = async (teamId: string, senderId: string, content: string) => {
    try {
        const { data, error } = await supabase
            .from('team_messages')
            .insert([{
                team_id: teamId,
                sender_id: senderId,
                content
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error sending team message:', error);
        return { success: false, error: error.message };
    }
};
