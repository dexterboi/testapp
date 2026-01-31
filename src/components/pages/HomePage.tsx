import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Map } from 'lucide-react';
import { supabase, getFileUrl } from '@/services/supabase';
import { getComplexes, getUserLocation, calculateDistance } from '@/services/dataService';
import { FilterModal } from '@/components/common/FilterModal';
import NotificationCenter from '@/components/common/NotificationCenter';
import MapView from '@/components/spaces/MapView';
import { getRealPlaceholderImage } from '@/services/assetService';
import { ensureArray, getAvatarUrl } from '@/utils';

interface HomePageProps {
    user: any;
    pendingCount: number;
}

export const HomePage = ({ user, pendingCount }: HomePageProps) => {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [complexes, setComplexes] = useState<any[]>([]);
    const [allComplexes, setAllComplexes] = useState<any[]>([]); // Store all complexes for filtering
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        maxPrice: 200,
        minRating: 0,
        maxDistance: 100, // Increased default to show more complexes
        surfaces: [] as string[],
        amenities: [] as string[]
    });
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [totalNotifications, setTotalNotifications] = useState(0);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('18:00');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        initializeData();
        if (user?.id) {
            fetchNotificationCount();

            // Push notifications are initialized immediately on login in App.tsx auth handler
            // This ensures permission is requested as soon as user authenticates

            // Set up real-time subscription for notifications
            const channel = supabase
                .channel('notifications')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `friend_id=eq.${user.id}` }, () => {
                    console.log('📬 Friend request notification change detected');
                    fetchNotificationCount();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_members', filter: `user_id=eq.${user.id}` }, () => {
                    console.log('📬 Lobby invite notification change detected');
                    fetchNotificationCount();
                })
                // Listen for lobby access requests (when user is host)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_members', filter: `status=eq.requested` }, async (payload) => {
                    console.log('📬 Lobby access request notification change detected', payload);
                    // Check if this is for a lobby where user is host
                    if (payload.new?.lobby_id) {
                        const { data: lobby } = await supabase
                            .from('lobbies')
                            .select('host_id')
                            .eq('id', payload.new.lobby_id)
                            .single();

                        if (lobby?.host_id === user.id) {
                            console.log('📬 Lobby access request is for your lobby, refreshing count');
                            fetchNotificationCount();
                        }
                    }
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complexes' }, () => {
                    console.log('📬 New complex notification change detected');
                    fetchNotificationCount();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pitches' }, () => {
                    console.log('📬 New pitch notification change detected');
                    fetchNotificationCount();
                })
                .subscribe();

            // Listen for notification actions to refresh count
            const handleNotificationAction = () => {
                fetchNotificationCount();
            };
            window.addEventListener('notificationAction', handleNotificationAction);

            return () => {
                supabase.removeChannel(channel);
                window.removeEventListener('notificationAction', handleNotificationAction);
            };
        }
    }, [user?.id]);

    const fetchNotificationCount = async () => {
        if (!user?.id) return;
        try {
            // Get seen notification IDs from localStorage
            const seenNotificationsKey = `seen_notifications_${user.id}`;
            const seenNotifications: string[] = JSON.parse(localStorage.getItem(seenNotificationsKey) || '[]');

            // Friend requests (actionable) - only count unseen
            const { data: friendRequests } = await supabase
                .from('friendships')
                .select('id')
                .eq('friend_id', user.id)
                .eq('status', 'pending');

            const unseenFriendRequests = (friendRequests || []).filter(fr => !seenNotifications.includes(`friend_${fr.id}`)).length;

            // Lobby invites (actionable) - only count unseen
            let unseenLobbyInvites = 0;
            try {
                const { data: lobbyInvites, error: lobbyError } = await supabase
                    .from('lobby_members')
                    .select('lobby_id, user_id')
                    .eq('user_id', user.id)
                    .eq('status', 'invited');

                if (lobbyError) {
                    console.warn('Error fetching lobby invites for notifications:', lobbyError);
                    // Continue with 0 count if query fails (RLS policy issue)
                } else {
                    unseenLobbyInvites = (lobbyInvites || []).filter(li => {
                        const notificationId = `lobby_${li.lobby_id}_${li.user_id}`;
                        return !seenNotifications.includes(notificationId);
                    }).length;
                }
            } catch (error) {
                console.warn('Error processing lobby invites:', error);
                // Continue with 0 count
            }

            // Lobby access requests (for hosts) - only count unseen
            let unseenLobbyRequests = 0;
            try {
                // First get all lobbies where user is host
                const { data: userLobbies, error: lobbiesError } = await supabase
                    .from('lobbies')
                    .select('id')
                    .eq('host_id', user.id);

                if (lobbiesError) {
                    console.warn('Error fetching user lobbies for notifications:', lobbiesError);
                } else if (userLobbies && userLobbies.length > 0) {
                    const lobbyIds = userLobbies.map(l => l.id);
                    const { data: lobbyRequests, error: requestsError } = await supabase
                        .from('lobby_members')
                        .select('lobby_id, user_id, request_message')
                        .eq('status', 'requested')
                        .in('lobby_id', lobbyIds);

                    if (requestsError) {
                        console.warn('Error fetching lobby requests for notifications:', requestsError);
                    } else {
                        unseenLobbyRequests = (lobbyRequests || []).filter(lr => {
                            const notificationId = `lobby_request_${lr.lobby_id}_${lr.user_id}`;
                            return !seenNotifications.includes(notificationId);
                        }).length;
                    }
                }
            } catch (error) {
                console.warn('Error processing lobby requests:', error);
            }

            // New complexes (created in last 7 days) - only count unseen
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: newComplexes } = await supabase
                .from('complexes')
                .select('id, created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            const unseenComplexes = (newComplexes || []).filter(c => !seenNotifications.includes(`venue_${c.id}`)).length;

            // New pitches (created in last 7 days) - only count unseen
            const { data: newPitches } = await supabase
                .from('pitches')
                .select('id, created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            const unseenPitches = (newPitches || []).filter(p => !seenNotifications.includes(`pitch_${p.id}`)).length;

            // Count only unseen notifications
            const actionableCount = unseenFriendRequests + unseenLobbyInvites + unseenLobbyRequests;
            const newContentCount = Math.min(unseenComplexes + unseenPitches, 5);
            const total = actionableCount + newContentCount;
            setTotalNotifications(total);
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    // Re-sort complexes when user location becomes available
    useEffect(() => {
        if (userLocation && complexes.length > 0) {
            console.log('📍 User location updated, re-sorting', complexes.length, 'complexes by distance');
            sortComplexesByDistance(complexes);
        }
    }, [userLocation, complexes.length]);

    // Real-time search filtering
    useEffect(() => {
        if (allComplexes.length === 0) return;

        const filterComplexes = async () => {
            let filtered = [...allComplexes];

            // Apply sport type filter
            if (selectedSport) {
                const { data: pitchesData } = await supabase
                    .from('pitches')
                    .select('complex_id, sport_type')
                    .eq('sport_type', selectedSport);

                const complexIdsWithSport = new Set(pitchesData?.map((p: any) => p.complex_id) || []);
                filtered = filtered.filter((c: any) => complexIdsWithSport.has(c.id));
            }

            // Apply search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter((c: any) =>
                    c.name?.toLowerCase().includes(q) ||
                    c.address?.toLowerCase().includes(q) ||
                    (c.amenities || []).some((a: string) => a.toLowerCase().includes(q))
                );
            }

            // Apply other filters
            filtered = filtered.filter((c: any) => {
                const price = c.min_price || 0;
                if (price > filters.maxPrice) return false;
                if (filters.minRating > 0 && (c.avg_rating || 0) < filters.minRating) return false;
                return true;
            });

            // Surface filter
            if (filters.surfaces.length > 0) {
                filtered = filtered.filter((c: any) => {
                    const available = (c.available_surfaces || []).map((s: string) => s.toLowerCase());
                    return filters.surfaces.some((s: string) => available.includes(s.toLowerCase()));
                });
            }

            // Amenities filter
            if (filters.amenities.length > 0) {
                filtered = filtered.filter((c: any) => {
                    const complexAmenities = (c.amenities || []).map((a: string) => a.toLowerCase());
                    return filters.amenities.every((a: string) => complexAmenities.includes(a.toLowerCase()));
                });
            }

            // Distance filter - only apply if user explicitly set a distance filter (not the default)
            // Don't apply distance filter by default - show all complexes
            if (userLocation && filters.maxDistance < 100) {
                // Only apply distance filter if user has explicitly set it to less than 100km
                filtered = filtered.filter((c: any) => {
                    if (c.location_lat && c.location_lng) {
                        const dist = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            c.location_lat,
                            c.location_lng
                        );
                        return dist <= filters.maxDistance;
                    }
                    // If complex has no location data, include it (don't filter out)
                    return true;
                });
            }
            // If maxDistance is 100 or more (default), don't filter by distance - show all complexes

            // Sort by distance if user location is available
            if (userLocation) {
                sortComplexesByDistance(filtered);
            } else {
                setComplexes(filtered);
            }
        };

        filterComplexes();
    }, [searchQuery, filters, allComplexes, userLocation, selectedSport]);

    const initializeData = async () => {
        setLoading(true);

        // Try to get user location first (but don't wait too long)
        const locationPromise = loadUserLocation();
        const dataPromise = fetchData();

        // Wait for both to complete
        await Promise.all([locationPromise, dataPromise]);

        setLoading(false);
    };

    const loadUserLocation = async () => {
        try {
            console.log('🔍 Requesting location (Racing Strategy)...');
            const location = await getUserLocation();
            console.log('✅ Location settled:', location);
            setUserLocation(location);
            setLocationError(null);
        } catch (error: any) {
            console.warn('⚠️ Location fallback active:', error?.message || error);
            // getUserLocation now handles its own fallback to Tunis, so this is just a safety catch
        }
    };

    const sortComplexesByDistance = (data: any[]) => {
        if (!userLocation) {
            setComplexes(data);
            return;
        }

        // Calculate distances and sort by distance
        const complexesWithDistance = data.map((complex: any) => {
            if (complex.location_lat && complex.location_lng) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    complex.location_lat,
                    complex.location_lng
                );
                console.log(`📍 Distance to ${complex.name}:`, distance.toFixed(2), 'km');
                return { ...complex, distance };
            }
            return complex;
        });

        // Sort by distance if available
        const sorted = complexesWithDistance.sort((a: any, b: any) => {
            if (a.distance !== undefined && b.distance !== undefined) {
                return a.distance - b.distance;
            }
            // Put items without distance at the end
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return 0;
        });

        console.log('✅ Complexes sorted by distance. Nearest:', sorted[0]?.name, sorted[0]?.distance?.toFixed(2), 'km');
        setComplexes(sorted);
    };

    const fetchData = async () => {
        console.log('🏟️ Fetching complexes...');
        const data = await getComplexes();
        console.log('📊 Complexes received:', data.length, data);

        // Store all complexes for filtering
        setAllComplexes(data);

        // Sort by distance if user location is already available
        if (userLocation) {
            sortComplexesByDistance(data);
        } else {
            setComplexes(data);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = async (filterOverride?: any) => {
        setLoading(true);
        const activeFilters = filterOverride || filters;

        // Use stored complexes if available, otherwise fetch
        let complexesToFilter = allComplexes.length > 0 ? allComplexes : await getComplexes();
        if (allComplexes.length === 0) {
            setAllComplexes(complexesToFilter);
        }
        let allComplexesFiltered = [...complexesToFilter];

        // 1. Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            allComplexesFiltered = allComplexesFiltered.filter((c: any) =>
                c.name?.toLowerCase().includes(q) ||
                c.address?.toLowerCase().includes(q) ||
                (c.amenities || []).some((a: string) => a.toLowerCase().includes(q))
            );
        }

        // 2. Price Filter (Use real min_price from DB)
        allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
            const price = c.min_price || 0;
            return price <= activeFilters.maxPrice;
        });

        // 3. Rating Filter
        if (activeFilters.minRating > 0) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => (c.avg_rating || 0) >= activeFilters.minRating);
        }

        // 4. Surface Filter
        if (activeFilters.surfaces.length > 0) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
                const available = (c.available_surfaces || []).map((s: string) => s.toLowerCase());
                return activeFilters.surfaces.some((s: string) => available.includes(s.toLowerCase()));
            });
        }

        // 5. Amenities Filter
        if (activeFilters.amenities.length > 0) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
                const complexAmenities = (c.amenities || []).map((a: string) => a.toLowerCase());
                return activeFilters.amenities.every((a: string) => complexAmenities.includes(a.toLowerCase()));
            });
        }

        // 6. Distance Filter - only apply if user explicitly set it (not default 100km)
        if (userLocation && activeFilters.maxDistance < 100) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
                if (c.location_lat && c.location_lng) {
                    const dist = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        c.location_lat,
                        c.location_lng
                    );
                    return dist <= activeFilters.maxDistance;
                }
                return true; // Keep if no location data (or could filter out)
            });
        }
        // If maxDistance is 100 or more (default), don't filter by distance - show all complexes

        // Count active filters (only count if user explicitly set them, not defaults)
        let count = 0;
        if (activeFilters.maxPrice < 200) count++;
        if (activeFilters.minRating > 0) count++;
        if (activeFilters.maxDistance < 100 && userLocation) count++; // Only count if distance filter is active
        if (activeFilters.surfaces.length > 0) count++;
        if (activeFilters.amenities.length > 0) count++;

        console.log(`🔍 [FILTER] After filters: ${allComplexesFiltered.length} matches. Filters:`, activeFilters);
        setActiveFiltersCount(count);

        if (userLocation) {
            sortComplexesByDistance(allComplexesFiltered);
        } else {
            setComplexes(allComplexesFiltered);
        }
        setLoading(false);
        setIsFilterOpen(false);
    };

    // Extract sports types for the horizontal scroller
    const sportsTypes = ['Football', 'Padel', 'Tennis', 'Basketball'].filter(s =>
        s === 'Football' || s === 'Padel' // User specifically asked for these for now
    );

    return (
        <div className="pb-[calc(8rem+env(safe-area-inset-bottom))] bg-app-bg min-h-screen font-sans transition-colors duration-300">
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                onApply={applyFilters}
            />

            <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => {
                    setIsNotificationsOpen(false);
                    fetchNotificationCount(); // Refresh count when closing
                }}
                userId={user?.id}
                pendingCount={pendingCount}
            />

            {/* Premium Header */}
            <header className="px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8 bg-app-bg border-b border-app-border">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                            <span className="material-symbols-rounded text-sm text-primary">location_on</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">{userLocation ? 'Tunis, TN' : t('home.locating')}</p>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-app-text leading-none">
                            {t('home.explore')} <br /> <span className="text-primary italic">{t('home.venues')}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsNotificationsOpen(true);
                            }}
                            className="relative w-12 h-12 rounded-2xl bg-app-surface border border-app-border flex items-center justify-center hover:opacity-80 transition-all active:scale-95 group"
                        >
                            <span className="material-symbols-rounded text-app-text-muted group-hover:text-primary transition-colors">notifications</span>
                            {totalNotifications > 0 && (
                                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 rounded-full border-2 border-app-bg flex items-center justify-center px-1.5 animate-pulse">
                                    <span className="text-[10px] font-black text-white">{totalNotifications > 99 ? '99+' : totalNotifications}</span>
                                </div>
                            )}
                        </button>

                        {/* Profile Avatar */}
                        <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                            <div className="w-16 h-16 rounded-[2rem] overflow-hidden border-2 border-app-bg shadow-2xl ring-4 ring-primary/5 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500 bg-app-surface-2">
                                <img
                                    src={getAvatarUrl(user?.avatar, user?.name, user?.id)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-app-surface-2 rounded-full flex items-center justify-center border-2 border-app-bg shadow-lg shadow-black/20">
                                <span className="material-symbols-rounded text-primary text-[14px]">bolt</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar & Filter */}
                <div className="relative group">
                    <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-all duration-300">search</span>
                    <input
                        type="text"
                        placeholder={t('home.search_placeholder')}
                        className="w-full h-14 pl-12 pr-14 rounded-[1.5rem] bg-app-surface border border-app-border text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-app-text transition-all placeholder:text-app-text-muted"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary rounded-[1rem] text-slate-900 shadow-xl shadow-primary/10 active:scale-90 hover:bg-primary/90 transition-all font-black"
                    >
                        <span className="material-symbols-rounded text-lg">tune</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-app-bg">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="animate-in fade-in duration-700">
                {/* View Toggle */}
                {/* View Toggle */}
                <div className="px-6 mt-2 mb-6">
                    <div className="flex bg-app-bg shadow-inner border border-app-border p-1 rounded-2xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/10' : 'text-app-text-muted hover:text-app-text'}`}
                        >
                            <LayoutGrid size={16} /> {t('home.view_list')}
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${viewMode === 'map' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/10' : 'text-app-text-muted hover:text-app-text'}`}
                        >
                            <Map size={16} /> {t('home.view_map')}
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <>
                        {/* Popular Sports Scroller */}
                        <section className="mt-4">
                            <div className="flex justify-between items-end px-6 mb-4">
                                <h2 className="text-lg font-bold text-app-text">{t('home.popular_sports')}</h2>
                                <button className="text-primary text-sm font-semibold hover:opacity-80 transition-opacity">{t('common.view_all')}</button>
                            </div>
                            <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar pb-2">
                                {sportsTypes.map((sport) => (
                                    <div
                                        key={sport}
                                        onClick={() => setSelectedSport(selectedSport === sport ? null : sport)}
                                        className={`flex-none w-44 relative group cursor-pointer active:scale-95 transition-all ${selectedSport === sport ? 'ring-4 ring-primary rounded-[2rem]' : ''}`}
                                    >
                                        <div className="aspect-[3/4] rounded-[2rem] overflow-hidden relative shadow-lg">
                                            <img
                                                alt={sport}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                src={sport === 'Football'
                                                    ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000'
                                                    : 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=1000' // Using an indoor/padel-like image from assetService
                                                }
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-5 left-5">
                                                <span className={`text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase mb-2 inline-block ${sport === 'Football' ? 'bg-primary' : 'bg-blue-400 text-white'}`}>
                                                    {sport === 'Football' ? t('home.popular') : t('home.trending')}
                                                </span>
                                                <h3 className="text-white font-bold text-lg leading-tight">{sport}</h3>
                                            </div>
                                            {selectedSport === sport && (
                                                <div className="absolute top-3 right-3 bg-primary text-slate-900 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="material-symbols-rounded text-lg">check</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Nearby Venues */}
                        <section className="mt-6 px-6 pb-10">
                            <div className="flex justify-between items-center mb-6 px-1">
                                <div>
                                    <h2 className="text-2xl font-black text-app-text tracking-tighter uppercase">{t('home.nearby_venues')} <span className="text-primary italic">{t('home.venues')}</span></h2>
                                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">{t('home.recommended_sub')}</p>
                                </div>
                                <button onClick={() => setViewMode('map')} className="w-12 h-12 rounded-2xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted hover:text-primary transition-all active:scale-90">
                                    <span className="material-symbols-rounded">map</span>
                                </button>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-app-surface rounded-[2.5rem] animate-pulse border border-app-border shadow-sm"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {complexes.map(complex => {
                                        const images = ensureArray(complex.images, complex.image);
                                        const mainImage = images[0]
                                            ? (images[0].startsWith('http') ? images[0] : getFileUrl('complex-images', `${complex.id}/${images[0]}`))
                                            : getRealPlaceholderImage(complex.id, 'complex');

                                        return (
                                            <div
                                                key={complex.id}
                                                onClick={() => navigate(`/complex/${complex.id}`)}
                                                className="bg-app-surface backdrop-blur-md p-5 rounded-[2.5rem] border border-app-border shadow-sm transition-all active:scale-[0.98] cursor-pointer hover:opacity-90 group relative overflow-hidden"
                                            >
                                                <div className="flex gap-5 items-center">
                                                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-app-surface-2 shrink-0 border border-app-border p-0.5">
                                                        <img
                                                            alt={complex.name}
                                                            className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                                                            src={mainImage}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-black text-lg leading-tight text-app-text truncate group-hover:text-primary transition-colors">{complex.name}</h4>
                                                            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                                                                <span className="material-symbols-rounded text-[14px] fill-1">star</span>
                                                                <span className="text-[10px] font-black">{complex.avg_rating || '4.8'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="material-symbols-rounded text-app-text-muted text-sm">location_on</span>
                                                            <span className="text-[11px] font-bold text-app-text-muted truncate">{complex.address?.split(',').slice(0, 1) || 'Tunis'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-1.5">
                                                                {ensureArray(complex.sports || ['Football']).slice(0, 2).map((sport, idx) => (
                                                                    <span key={idx} className="text-[8px] font-black bg-app-surface-2 text-app-text-muted px-2.5 py-1 rounded-lg uppercase tracking-widest border border-app-border">
                                                                        {sport}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {complex.distance !== undefined && (
                                                                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{complex.distance.toFixed(1)} km</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                ) : (
                    <div className="h-[calc(100vh-280px)] mx-8 rounded-3xl overflow-hidden border border-app-border shadow-2xl relative animate-in zoom-in-95 duration-500 bg-app-surface">
                        <MapView
                            onBack={() => setViewMode('list')}
                            showBackButton={false}
                            complexes={complexes}
                            userLocation={userLocation}
                        />
                    </div>
                )}

                {/* Location Error Banner */}
                {locationError && (
                    <div className="mx-8 mt-4 p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-amber-500/20 p-2.5 rounded-2xl text-amber-500">
                            <span className="material-symbols-rounded">location_off</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-tight">{t('home.location_off')}</p>
                            <p className="text-[10px] text-amber-500/80 leading-tight">{t('home.location_off_sub')}</p>
                        </div>
                        <button onClick={loadUserLocation} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-transform">{t('home.retry')}</button>
                    </div>
                )}
            </main>

            {/* Footer Safe Area Spacer */}
            <div className="h-10"></div>
        </div>
    );
};
